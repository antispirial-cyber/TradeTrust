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
        String status = root.path("status").asText(null); // APPROVED or REJECTED

        if (status == null || (!status.equalsIgnoreCase("APPROVED") && !status.equalsIgnoreCase("REJECTED"))) {
            JsonUtil.writeError(resp, HttpServletResponse.SC_BAD_REQUEST, "Status must be APPROVED or REJECTED");
            return;
        }

        Complaint complaint = complaintDAO.findById(complaintId);
        if (complaint == null) {
            JsonUtil.writeError(resp, HttpServletResponse.SC_NOT_FOUND, "Complaint not found");
            return;
        }

        complaintDAO.updateStatus(complaintId, status.toUpperCase());

        // If approved, penalize reported trader's score
        if ("APPROVED".equalsIgnoreCase(status)) {
            try (Connection conn = DBConnection.getConnection()) {
                ScoreUtil.recalculateAndSave(complaint.getReportedId(), conn);
            }
        }

        // Notify both parties
        Notification n1 = new Notification();
        n1.setRecipientId(complaint.getReporterId());
        n1.setType("DISPUTE_VERDICT");
        n1.setMessage("Admin has resolved Dispute #" + complaintId + ": " + status.toUpperCase());
        n1.setLinkRef("/disputes/" + complaintId);
        notificationDAO.create(n1);

        Notification n2 = new Notification();
        n2.setRecipientId(complaint.getReportedId());
        n2.setType("DISPUTE_VERDICT");
        n2.setMessage("Admin has resolved Dispute #" + complaintId + ": " + status.toUpperCase());
        n2.setLinkRef("/disputes/" + complaintId);
        notificationDAO.create(n2);

        JsonUtil.writeSuccess(resp, "Dispute resolved as " + status.toUpperCase(), null);
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
