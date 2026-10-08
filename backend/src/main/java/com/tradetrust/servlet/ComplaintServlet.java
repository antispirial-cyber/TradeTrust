package com.tradetrust.servlet;

import com.fasterxml.jackson.databind.JsonNode;
import com.tradetrust.dao.ComplaintDAO;
import com.tradetrust.dao.NotificationDAO;
import com.tradetrust.model.Complaint;
import com.tradetrust.model.Notification;
import com.tradetrust.util.JsonUtil;
import com.tradetrust.util.SessionUtil;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;
import java.math.BigDecimal;
import java.sql.Date;
import java.util.List;

@WebServlet(urlPatterns = {"/api/complaint", "/api/complaints", "/api/complaint/*", "/api/complaints/*"})
public class ComplaintServlet extends HttpServlet {
    private final ComplaintDAO complaintDAO = new ComplaintDAO();
    private final NotificationDAO notificationDAO = new NotificationDAO();

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        Integer currentTraderId = SessionUtil.getCurrentTraderId(req);
        if (currentTraderId == null) {
            JsonUtil.writeError(resp, HttpServletResponse.SC_UNAUTHORIZED, "Authentication required");
            return;
        }

        try {
            String path = req.getPathInfo();
            if (path != null && path.length() > 1) {
                // e.g. /123
                String[] parts = path.split("/");
                if (parts.length >= 2) {
                    int complaintId = Integer.parseInt(parts[1]);
                    Complaint c = complaintDAO.findById(complaintId);
                    if (c == null) {
                        JsonUtil.writeError(resp, HttpServletResponse.SC_NOT_FOUND, "Complaint not found");
                        return;
                    }
                    // Trader must be either reporter, reported, or admin
                    Integer adminId = SessionUtil.getCurrentAdminId(req);
                    if (adminId == null && c.getReporterId() != currentTraderId && c.getReportedId() != currentTraderId) {
                        JsonUtil.writeError(resp, HttpServletResponse.SC_FORBIDDEN, "Access denied to this dispute");
                        return;
                    }
                    JsonUtil.writeSuccess(resp, "Complaint details", c);
                    return;
                }
            }

            // Otherwise list complaints for this trader
            List<Complaint> list = complaintDAO.findByTrader(currentTraderId);
            JsonUtil.writeSuccess(resp, "Trader complaints", list);
        } catch (Exception e) {
            e.printStackTrace();
            JsonUtil.writeError(resp, HttpServletResponse.SC_INTERNAL_SERVER_ERROR, "Failed to load complaints: " + e.getMessage());
        }
    }

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        Integer currentTraderId = SessionUtil.getCurrentTraderId(req);
        if (currentTraderId == null) {
            JsonUtil.writeError(resp, HttpServletResponse.SC_UNAUTHORIZED, "Authentication required");
            return;
        }

        String path = req.getPathInfo();
        try {
            if (path != null && path.contains("/respond")) {
                handleRespond(req, resp, currentTraderId, path);
                return;
            }

            if (path != null && path.contains("/escalate")) {
                handleEscalate(req, resp, currentTraderId, path);
                return;
            }

            if (path != null && path.contains("/retake")) {
                handleRetake(req, resp, currentTraderId, path);
                return;
            }

            // File a new complaint
            handleCreate(req, resp, currentTraderId);
        } catch (Exception e) {
            e.printStackTrace();
            JsonUtil.writeError(resp, HttpServletResponse.SC_INTERNAL_SERVER_ERROR, "Dispute operation failed: " + e.getMessage());
        }
    }

    private void handleCreate(HttpServletRequest req, HttpServletResponse resp, int currentTraderId) throws Exception {
        JsonNode root = JsonUtil.getMapper().readTree(req.getInputStream());
        int reportedId = root.path("reportedId").asInt(0);
        String description = root.path("description").asText(null);
        double amount = root.path("amountDisputed").asDouble(0.0);
        String dateStr = root.path("incidentDate").asText(null);
        String proofPath = root.path("proofPath").asText(null);

        if (reportedId <= 0 || description == null || dateStr == null) {
            JsonUtil.writeError(resp, HttpServletResponse.SC_BAD_REQUEST, "Required: reportedId, description, incidentDate");
            return;
        }

        if (reportedId == currentTraderId) {
            JsonUtil.writeError(resp, HttpServletResponse.SC_BAD_REQUEST, "Cannot file dispute against yourself");
            return;
        }

        Complaint complaint = new Complaint();
        complaint.setReporterId(currentTraderId);
        complaint.setReportedId(reportedId);
        complaint.setDescription(description);
        complaint.setAmountDisputed(BigDecimal.valueOf(amount));
        complaint.setIncidentDate(Date.valueOf(dateStr));
        complaint.setProofPath(proofPath);
        complaint.setStatus("ROUND_1_PENDING");

        complaint = complaintDAO.create(complaint);

        // Notify reported trader
        Notification notif = new Notification();
        notif.setRecipientId(reportedId);
        notif.setType("DISPUTE_FILED");
        notif.setMessage("A dispute has been filed against your profile regarding an incident on " + dateStr + ".");
        notif.setLinkRef("/disputes/" + complaint.getComplaintId());
        notificationDAO.create(notif);

        JsonUtil.writeSuccess(resp, "Dispute filed successfully (Round 1 Pending)", complaint);
    }

    private void handleRespond(HttpServletRequest req, HttpServletResponse resp, int currentTraderId, String path) throws Exception {
        // Path format: /{complaintId}/respond
        String[] parts = path.split("/");
        int complaintId = Integer.parseInt(parts[1]);
        Complaint complaint = complaintDAO.findById(complaintId);
        if (complaint == null) {
            JsonUtil.writeError(resp, HttpServletResponse.SC_NOT_FOUND, "Complaint not found");
            return;
        }

        if (complaint.getReporterId() != currentTraderId && complaint.getReportedId() != currentTraderId) {
            JsonUtil.writeError(resp, HttpServletResponse.SC_FORBIDDEN, "Not authorized to respond to this dispute");
            return;
        }

        JsonNode root = JsonUtil.getMapper().readTree(req.getInputStream());
        String description = root.path("description").asText(null);
        String proofPath = root.path("proofPath").asText(null);

        if (description == null || description.isBlank()) {
            JsonUtil.writeError(resp, HttpServletResponse.SC_BAD_REQUEST, "Response description is required");
            return;
        }

        String curStatus = complaint.getStatus();
        String nextStatus = curStatus;
        int roundNumber = 1;

        if ("ROUND_1_PENDING".equalsIgnoreCase(curStatus)) {
            if (complaint.getReportedId() != currentTraderId) {
                JsonUtil.writeError(resp, HttpServletResponse.SC_BAD_REQUEST, "Only reported party can file Round 1 counter-response");
                return;
            }
            nextStatus = "ROUND_1_COUNTER_FILED";
            roundNumber = 1;
        } else if ("ROUND_1_COUNTER_FILED".equalsIgnoreCase(curStatus)) {
            if (complaint.getReporterId() != currentTraderId) {
                JsonUtil.writeError(resp, HttpServletResponse.SC_BAD_REQUEST, "Only reporter can initiate Round 2 rebuttal");
                return;
            }
            nextStatus = "ROUND_2_PENDING";
            roundNumber = 2;
        } else if ("ROUND_2_PENDING".equalsIgnoreCase(curStatus)) {
            if (complaint.getReportedId() != currentTraderId) {
                JsonUtil.writeError(resp, HttpServletResponse.SC_BAD_REQUEST, "Only reported party can file Round 2 counter-response");
                return;
            }
            nextStatus = "ROUND_2_COUNTER_FILED";
            roundNumber = 2;
        } else {
            JsonUtil.writeError(resp, HttpServletResponse.SC_BAD_REQUEST, "Cannot respond in current dispute state: " + curStatus);
            return;
        }

        complaintDAO.addRound(complaintId, currentTraderId, roundNumber, description, proofPath);
        complaintDAO.updateStatus(complaintId, nextStatus);

        // Notify opposite party
        int otherId = (complaint.getReporterId() == currentTraderId) ? complaint.getReportedId() : complaint.getReporterId();
        Notification notif = new Notification();
        notif.setRecipientId(otherId);
        notif.setType("DISPUTE_RESPONSE");
        notif.setMessage("A new response has been submitted on Dispute #" + complaintId + ".");
        notif.setLinkRef("/disputes/" + complaintId);
        notificationDAO.create(notif);

        Complaint updated = complaintDAO.findById(complaintId);
        JsonUtil.writeSuccess(resp, "Response submitted successfully", updated);
    }

    private void handleEscalate(HttpServletRequest req, HttpServletResponse resp, int currentTraderId, String path) throws Exception {
        String[] parts = path.split("/");
        int complaintId = Integer.parseInt(parts[1]);
        Complaint complaint = complaintDAO.findById(complaintId);
        if (complaint == null) {
            JsonUtil.writeError(resp, HttpServletResponse.SC_NOT_FOUND, "Complaint not found");
            return;
        }

        if (complaint.getReporterId() != currentTraderId && complaint.getReportedId() != currentTraderId) {
            JsonUtil.writeError(resp, HttpServletResponse.SC_FORBIDDEN, "Not authorized to escalate this dispute");
            return;
        }

        complaintDAO.updateStatus(complaintId, "ESCALATED_TO_ADMIN");

        Notification notif = new Notification();
        notif.setRecipientId(complaint.getReporterId() == currentTraderId ? complaint.getReportedId() : complaint.getReporterId());
        notif.setType("DISPUTE_ESCALATED");
        notif.setMessage("Dispute #" + complaintId + " has been escalated to TradeTrust Bazaar Administration for arbitration.");
        notif.setLinkRef("/disputes/" + complaintId);
        notificationDAO.create(notif);

        Complaint updated = complaintDAO.findById(complaintId);
        JsonUtil.writeSuccess(resp, "Dispute escalated to administration", updated);
    }

    private void handleRetake(HttpServletRequest req, HttpServletResponse resp, int currentTraderId, String path) throws Exception {
        // Path format: /{complaintId}/retake
        String[] parts = path.split("/");
        int complaintId = Integer.parseInt(parts[1]);
        Complaint complaint = complaintDAO.findById(complaintId);
        if (complaint == null) {
            JsonUtil.writeError(resp, HttpServletResponse.SC_NOT_FOUND, "Complaint not found");
            return;
        }

        if (complaint.getReporterId() != currentTraderId) {
            JsonUtil.writeError(resp, HttpServletResponse.SC_FORBIDDEN, "Only the user who filed this complaint can request to retake it");
            return;
        }

        if ("RETAKE_APPROVED".equalsIgnoreCase(complaint.getStatus())) {
            JsonUtil.writeError(resp, HttpServletResponse.SC_BAD_REQUEST, "Complaint has already been retaken and approved");
            return;
        }

        complaintDAO.updateStatus(complaintId, "RETAKE_REQUESTED");

        Notification notif = new Notification();
        notif.setRecipientId(complaint.getReportedId());
        notif.setType("DISPUTE_RETAKE");
        notif.setMessage("Filing party (User ID: " + currentTraderId + ") has submitted a Retake Complaint request on Dispute #" + complaintId + ", pending Admin approval.");
        notif.setLinkRef("/disputes/" + complaintId);
        notificationDAO.create(notif);

        Complaint updated = complaintDAO.findById(complaintId);
        JsonUtil.writeSuccess(resp, "Complaint retake requested. Flagged to Market Association Admin for approval.", updated);
    }
}
