package com.tradetrust.servlet;

import com.fasterxml.jackson.databind.JsonNode;
import com.tradetrust.dao.AdminDAO;
import com.tradetrust.dao.ComplaintDAO;
import com.tradetrust.dao.NotificationDAO;
import com.tradetrust.dao.TraderDAO;
import com.tradetrust.model.Complaint;
import com.tradetrust.model.Notification;
import com.tradetrust.util.DBConnection;
import com.tradetrust.util.JsonUtil;
import com.tradetrust.util.ScoreUtil;
import com.tradetrust.util.SessionUtil;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;
import java.sql.Connection;
import java.util.List;
import java.util.Map;

@WebServlet("/api/admin/*")
public class AdminServlet extends HttpServlet {
    private final AdminDAO adminDAO = new AdminDAO();
    private final ComplaintDAO complaintDAO = new ComplaintDAO();
    private final TraderDAO traderDAO = new TraderDAO();
    private final NotificationDAO notificationDAO = new NotificationDAO();

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        Integer adminId = SessionUtil.getCurrentAdminId(req);
        if (adminId == null) {
            JsonUtil.writeError(resp, HttpServletResponse.SC_UNAUTHORIZED, "Admin authentication required");
            return;
        }

        String path = req.getPathInfo();
        if (path == null) path = "";

        try {
            if ("/metrics".equalsIgnoreCase(path)) {
                Map<String, Object> metrics = adminDAO.getSystemMetrics();
                JsonUtil.writeSuccess(resp, "System metrics", metrics);
                return;
            }

            if ("/complaints".equalsIgnoreCase(path)) {
                String status = req.getParameter("status");
                List<Complaint> list = complaintDAO.findAll(status);
                JsonUtil.writeSuccess(resp, "Admin complaints list", list);
                return;
            }

            JsonUtil.writeError(resp, HttpServletResponse.SC_NOT_FOUND, "Admin endpoint not found: " + path);
        } catch (Exception e) {
            e.printStackTrace();
            JsonUtil.writeError(resp, HttpServletResponse.SC_INTERNAL_SERVER_ERROR, "Admin request failed: " + e.getMessage());
        }
    }

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        Integer adminId = SessionUtil.getCurrentAdminId(req);
        if (adminId == null) {
            JsonUtil.writeError(resp, HttpServletResponse.SC_UNAUTHORIZED, "Admin authentication required");
            return;
        }

        String path = req.getPathInfo();
        if (path == null) path = "";

        try {
            if (path.startsWith("/complaint/") && path.endsWith("/resolve")) {
                handleResolveComplaint(req, resp, path);
                return;
            }

            if (path.startsWith("/trader/") && path.endsWith("/freeze")) {
                handleFreezeTrader(req, resp, path);
                return;
            }

            if (path.startsWith("/trader/") && path.endsWith("/score")) {
                handleSetTraderScore(req, resp, path);
                return;
            }

            JsonUtil.writeError(resp, HttpServletResponse.SC_NOT_FOUND, "Admin action not found: " + path);
        } catch (Exception e) {
            e.printStackTrace();
            JsonUtil.writeError(resp, HttpServletResponse.SC_INTERNAL_SERVER_ERROR, "Admin action failed: " + e.getMessage());
        }
    }

    private void handleResolveComplaint(HttpServletRequest req, HttpServletResponse resp, String path) throws Exception {
        // Path: /complaint/{id}/resolve
        String[] parts = path.split("/");
        int complaintId = Integer.parseInt(parts[2]);

        JsonNode root = JsonUtil.getMapper().readTree(req.getInputStream());
        String status = root.path("status").asText(null);

        if (status == null || (!status.equalsIgnoreCase("APPROVED") &&
                               !status.equalsIgnoreCase("REJECTED") &&
                               !status.equalsIgnoreCase("RETAKE_APPROVED") &&
                               !status.equalsIgnoreCase("RETAKE_REJECTED"))) {
            JsonUtil.writeError(resp, HttpServletResponse.SC_BAD_REQUEST, "Status must be APPROVED, REJECTED, RETAKE_APPROVED, or RETAKE_REJECTED");
            return;
        }

        Complaint complaint = complaintDAO.findById(complaintId);
        if (complaint == null) {
            JsonUtil.writeError(resp, HttpServletResponse.SC_NOT_FOUND, "Complaint not found");
            return;
        }

        String finalStatus = status.toUpperCase();
        if ("RETAKE_REJECTED".equalsIgnoreCase(finalStatus)) {
            // Revert back to escalated state
            finalStatus = "ESCALATED_TO_ADMIN";
        }

        complaintDAO.updateStatus(complaintId, finalStatus);

        // Score handling
        if ("APPROVED".equalsIgnoreCase(finalStatus)) {
            try (Connection conn = DBConnection.getConnection()) {
                ScoreUtil.recalculateAndSave(complaint.getReportedId(), conn);
            }
        } else if ("RETAKE_APPROVED".equalsIgnoreCase(finalStatus)) {
            // Restore score if previously deducted, and unfreeze
            try (Connection conn = DBConnection.getConnection()) {
                ScoreUtil.recalculateAndSave(complaint.getReportedId(), conn);
            }
            traderDAO.freezeScore(complaint.getReportedId(), false);
        } else if ("REJECTED".equalsIgnoreCase(finalStatus)) {
            traderDAO.freezeScore(complaint.getReportedId(), false);
        }

        // Notify both parties
        String filerMsg = "RETAKE_APPROVED".equalsIgnoreCase(finalStatus)
                ? "Admin has approved your retake/withdrawal of Dispute #" + complaintId + ". The claim is withdrawn."
                : "Admin has resolved Dispute #" + complaintId + ": " + finalStatus;
        String reportedMsg = "RETAKE_APPROVED".equalsIgnoreCase(finalStatus)
                ? "Admin has approved the retake of Dispute #" + complaintId + ". Score penalty restored and account active."
                : "Admin has resolved Dispute #" + complaintId + ": " + finalStatus;

        Notification n1 = new Notification();
        n1.setRecipientId(complaint.getReporterId());
        n1.setType("DISPUTE_VERDICT");
        n1.setMessage(filerMsg);
        n1.setLinkRef("/disputes/" + complaintId);
        notificationDAO.create(n1);

        Notification n2 = new Notification();
        n2.setRecipientId(complaint.getReportedId());
        n2.setType("DISPUTE_VERDICT");
        n2.setMessage(reportedMsg);
        n2.setLinkRef("/disputes/" + complaintId);
        notificationDAO.create(n2);

        JsonUtil.writeSuccess(resp, "Dispute status updated: " + finalStatus, null);
    }

    private void handleSetTraderScore(HttpServletRequest req, HttpServletResponse resp, String path) throws Exception {
        // Path: /trader/{id}/score
        String[] parts = path.split("/");
        int traderId = Integer.parseInt(parts[2]);

        JsonNode root = JsonUtil.getMapper().readTree(req.getInputStream());
        double score = root.path("score").asDouble(-1.0);
        if (score < 0.0 || score > 10.0) {
            JsonUtil.writeError(resp, HttpServletResponse.SC_BAD_REQUEST, "Score must be between 0.00 and 10.00");
            return;
        }

        java.math.BigDecimal scoreVal = java.math.BigDecimal.valueOf(score).setScale(2, java.math.RoundingMode.HALF_UP);
        traderDAO.updateScore(traderId, scoreVal);

        Notification n = new Notification();
        n.setRecipientId(traderId);
        n.setType("SCORE_ADJUSTED");
        n.setMessage("Your trust score has been manually adjusted to " + scoreVal + " by Market Association Admin.");
        n.setLinkRef("/dashboard");
        notificationDAO.create(n);

        JsonUtil.writeSuccess(resp, "Trader score adjusted to " + scoreVal, scoreVal);
    }

    private void handleFreezeTrader(HttpServletRequest req, HttpServletResponse resp, String path) throws Exception {
        // Path: /trader/{id}/freeze
        String[] parts = path.split("/");
        int traderId = Integer.parseInt(parts[2]);

        JsonNode root = JsonUtil.getMapper().readTree(req.getInputStream());
        boolean freeze = root.path("freeze").asBoolean(true);

        traderDAO.freezeScore(traderId, freeze);

        Notification n = new Notification();
        n.setRecipientId(traderId);
        n.setType("ACCOUNT_STATUS");
        n.setMessage(freeze ? "Your trust score has been frozen by administration due to investigation." :
                             "Your trust score has been unfrozen by administration.");
        n.setLinkRef("/profile");
        notificationDAO.create(n);

        JsonUtil.writeSuccess(resp, "Trader score freeze status updated to: " + freeze, null);
    }
}
