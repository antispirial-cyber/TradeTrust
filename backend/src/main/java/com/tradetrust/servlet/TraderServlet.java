package com.tradetrust.servlet;

import com.tradetrust.dao.ConnectionDAO;
import com.tradetrust.dao.TraderDAO;
import com.tradetrust.model.Session;
import com.tradetrust.model.Trader;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.util.Collections;
import java.util.List;
import java.util.Map;

/**
 * Handles /api/traders and /api/trader/*:
 *   GET  /api/traders?cluster=...&sector=...&role=...&search=...
 *   GET  /api/traders/{id}
 *   POST/PUT /api/trader/profile  (or /api/traders/profile)
 *   POST/PUT /api/trader/settings (or /api/traders/settings)
 *   POST/PUT /api/trader/password (or /api/traders/password)
 */
public class TraderServlet extends ApiServlet {

    private final TraderDAO traderDAO = new TraderDAO();
    private final ConnectionDAO connectionDAO = new ConnectionDAO();

    @Override
    protected void get(HttpServletRequest req, HttpServletResponse resp) throws Exception {
        String[] p = parts(req);

        // Check optional session for annotating connection status
        Integer viewerId = null;
        String header = req.getHeader("Authorization");
        if (header != null && header.startsWith("Bearer ")) {
            Session s = authDAO.findSession(header.substring(7));
            if (s != null && !s.isAdmin()) {
                viewerId = s.userId;
            }
        }

        // GET /api/traders/settings (or /api/trader/settings)
        if (p.length >= 1 && "settings".equalsIgnoreCase(p[0])) {
            java.util.Map<String, String> settings = new java.util.HashMap<>();
            if (viewerId != null) {
                Trader t = traderDAO.findById(viewerId);
                if (t != null) {
                    settings.put("accentColor", t.accentColor != null ? t.accentColor : "#1E6FFB");
                    settings.put("themeMode", t.themeMode != null ? t.themeMode : "light");
                    ok(resp, "Theme and display preferences loaded", settings);
                    return;
                }
            }
            settings.put("accentColor", "#1E6FFB");
            settings.put("themeMode", "light");
            ok(resp, "Default preferences loaded", settings);
            return;
        }

        // GET /api/traders/{id}
        if (p.length == 1 && !p[0].isEmpty() && !p[0].equals("profile") && !p[0].equals("settings")) {
            int traderId = integer(p[0]);
            Trader t = traderDAO.findById(traderId);
            if (t == null) {
                fail(resp, 404, "Trader not found");
                return;
            }
            if (viewerId != null) {
                connectionDAO.annotate(Collections.singletonList(t), viewerId);
            }
            ok(resp, "Trader profile loaded", t);
            return;
        }

        // GET /api/traders
        String cluster = req.getParameter("cluster");
        String sector = req.getParameter("sector");
        String role = req.getParameter("role");
        String search = req.getParameter("search");

        List<Trader> list = traderDAO.search(cluster, sector, role, search);
        if (viewerId != null) {
            connectionDAO.annotate(list, viewerId);
        }
        ok(resp, "Traders retrieved", list);
    }

    @Override
    protected void post(HttpServletRequest req, HttpServletResponse resp) throws Exception {
        handleUpdate(req, resp);
    }

    @Override
    protected void put(HttpServletRequest req, HttpServletResponse resp) throws Exception {
        handleUpdate(req, resp);
    }

    private void handleUpdate(HttpServletRequest req, HttpServletResponse resp) throws Exception {
        String[] p = parts(req);
        String action = p.length > 0 ? p[0] : "";

        Session session = requireTrader(req, resp);
        if (session == null) return;

        Map<String, Object> body = readBody(req);
        Trader current = traderDAO.findById(session.userId);
        if (current == null) {
            fail(resp, 404, "Merchant profile not found");
            return;
        }

        if ("profile".equalsIgnoreCase(action) || action.isEmpty()) {
            if (body.containsKey("name")) current.name = text(body, "name");
            if (body.containsKey("phone")) current.phone = text(body, "phone");
            if (body.containsKey("businessName")) current.businessName = text(body, "businessName");
            if (body.containsKey("businessDesc")) current.businessDesc = text(body, "businessDesc");
            if (body.containsKey("role")) current.role = text(body, "role");
            if (body.containsKey("cluster")) current.cluster = text(body, "cluster");
            if (body.containsKey("sector")) current.sector = text(body, "sector");
            if (body.containsKey("photoPath")) current.photoPath = text(body, "photoPath");
            if (body.containsKey("photoUrl")) current.photoPath = text(body, "photoUrl");
            if (current.photoPath != null && current.photoPath.isBlank()) {
                current.photoPath = null;
            }
            if (current.photoPath != null && current.photoPath.length() > 255) {
                fail(resp, 400, "Photo URL path exceeds max length. Please upload image file.");
                return;
            }

            traderDAO.updateProfile(current);
            ok(resp, "Profile updated successfully", current);
            return;
        }

        if ("settings".equalsIgnoreCase(action)) {
            String accent = body.containsKey("accentColor") ? text(body, "accentColor") : current.accentColor;
            String theme = body.containsKey("themeMode") ? text(body, "themeMode") : current.themeMode;
            traderDAO.updateSettings(session.userId, accent, theme);
            current.accentColor = accent;
            current.themeMode = theme;
            ok(resp, "Theme and display preferences saved", current);
            return;
        }

        if ("password".equalsIgnoreCase(action)) {
            String newPass = text(body, "newPassword");
            if (newPass.isEmpty()) {
                newPass = text(body, "password");
            }
            if (newPass.isEmpty()) {
                fail(resp, 400, "New password is required");
                return;
            }
            if (newPass.length() < 4) {
                fail(resp, 400, "Password must be at least 4 characters");
                return;
            }
            String oldPass = text(body, "currentPassword");
            if (!oldPass.isEmpty() && !hash(oldPass).equalsIgnoreCase(current.passwordHash)) {
                fail(resp, 400, "Current password does not match");
                return;
            }
            traderDAO.updatePassword(session.userId, hash(newPass));
            authDAO.deleteSessionsForUser(session.userId, "TRADER");
            ok(resp, "Password updated successfully", null);
            return;
        }

        fail(resp, 404, "Unrecognized action on merchant profile");
    }
}
