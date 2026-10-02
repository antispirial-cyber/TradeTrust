package com.tradetrust.servlet;

import com.fasterxml.jackson.databind.JsonNode;
import com.tradetrust.dao.NotificationDAO;
import com.tradetrust.model.Notification;
import com.tradetrust.util.JsonUtil;
import com.tradetrust.util.SessionUtil;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@WebServlet(urlPatterns = {"/api/notifications", "/api/notifications/*"})
public class NotificationServlet extends HttpServlet {
    private final NotificationDAO notificationDAO = new NotificationDAO();

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        Integer currentTraderId = SessionUtil.getCurrentTraderId(req);
        if (currentTraderId == null) {
            JsonUtil.writeError(resp, HttpServletResponse.SC_UNAUTHORIZED, "Authentication required");
            return;
        }

        try {
            List<Notification> list = notificationDAO.findByRecipient(currentTraderId);
            int unreadCount = notificationDAO.getUnreadCount(currentTraderId);

            Map<String, Object> data = new HashMap<>();
            data.put("notifications", list);
            data.put("unreadCount", unreadCount);

            JsonUtil.writeSuccess(resp, "Notifications loaded", data);
        } catch (Exception e) {
            e.printStackTrace();
            JsonUtil.writeError(resp, HttpServletResponse.SC_INTERNAL_SERVER_ERROR, "Failed to load notifications: " + e.getMessage());
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
        if (path == null) path = "";
        path = path.toLowerCase().trim();

        try {
            // Check for read all: /read-all, /read, /mark-read
            if (path.isEmpty() || path.equals("/read-all") || path.equals("/read") || path.equals("/mark-read")) {
                notificationDAO.markAllAsRead(currentTraderId);
                JsonUtil.writeSuccess(resp, "All notifications marked as read", null);
                return;
            }

            // Check if path is single notification: e.g. /123 or /123/read
            String[] segments = path.replaceAll("^/+", "").split("/");
            if (segments.length > 0 && segments[0].matches("^\\d+$")) {
                int notifId = Integer.parseInt(segments[0]);
                notificationDAO.markAsRead(notifId, currentTraderId);
                JsonUtil.writeSuccess(resp, "Notification marked as read", null);
                return;
            }

            // Or check body for notificationId
            try {
                JsonNode root = JsonUtil.getMapper().readTree(req.getInputStream());
                if (root != null && root.has("notificationId")) {
                    int notifId = root.get("notificationId").asInt();
                    notificationDAO.markAsRead(notifId, currentTraderId);
                    JsonUtil.writeSuccess(resp, "Notification marked as read", null);
                    return;
                }
            } catch (Exception ignored) {}

            JsonUtil.writeError(resp, HttpServletResponse.SC_NOT_FOUND, "Unrecognized notification action");
        } catch (Exception e) {
            e.printStackTrace();
            JsonUtil.writeError(resp, HttpServletResponse.SC_INTERNAL_SERVER_ERROR, "Notification update failed: " + e.getMessage());
        }
    }
}
