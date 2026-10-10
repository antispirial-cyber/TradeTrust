package com.tradetrust.servlet;

import com.tradetrust.dao.NotificationDAO;
import com.tradetrust.model.Notification;
import com.tradetrust.model.Session;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Handles /api/notifications/*:
 *   GET  /api/notifications
 *   POST /api/notifications/read-all
 *   POST /api/notifications/{id}/read
 *   POST /api/notifications/clear
 */
public class NotificationServlet extends ApiServlet {

    private final NotificationDAO notificationDAO = new NotificationDAO();

    @Override
    protected void get(HttpServletRequest req, HttpServletResponse resp) throws Exception {
        Session s = requireTrader(req, resp);
        if (s == null) return;

        List<Notification> list = notificationDAO.listFor(s.userId);
        long unreadCount = list.stream().filter(n -> !n.isRead).count();

        Map<String, Object> data = new HashMap<>();
        data.put("notifications", list);
        data.put("unreadCount", (int) unreadCount);
        ok(resp, "Notifications loaded", data);
    }

    @Override
    protected void post(HttpServletRequest req, HttpServletResponse resp) throws Exception {
        Session s = requireTrader(req, resp);
        if (s == null) return;

        String[] p = parts(req);

        // POST /api/notifications/read-all
        if (p.length == 1 && "read-all".equalsIgnoreCase(p[0])) {
            notificationDAO.markAllRead(s.userId);
            ok(resp, "All notifications marked as read", null);
            return;
        }

        // POST /api/notifications/clear
        if (p.length == 1 && "clear".equalsIgnoreCase(p[0])) {
            notificationDAO.clearAll(s.userId);
            ok(resp, "All notifications cleared", null);
            return;
        }

        // POST /api/notifications/{id}/read
        if (p.length >= 2 && "read".equalsIgnoreCase(p[1])) {
            int notifId = integer(p[0]);
            notificationDAO.markRead(s.userId, notifId);
            ok(resp, "Notification marked as read", null);
            return;
        }

        fail(resp, 404, "Notification endpoint not found");
    }
}
