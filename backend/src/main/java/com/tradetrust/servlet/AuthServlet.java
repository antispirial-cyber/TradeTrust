package com.tradetrust.servlet;

import com.tradetrust.dao.TraderDAO;
import com.tradetrust.model.Session;
import com.tradetrust.model.Trader;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

/**
 * Handles /api/auth/*:
 *   POST /api/auth/login
 *   POST /api/auth/admin-login
 *   POST /api/auth/register
 *   POST /api/auth/logout
 *   GET  /api/auth/me
 */
public class AuthServlet extends ApiServlet {

    private final TraderDAO traderDAO = new TraderDAO();

    @Override
    protected void get(HttpServletRequest req, HttpServletResponse resp) throws Exception {
        String path = req.getPathInfo();
        if ("/me".equals(path)) {
            Session s = requireLogin(req, resp);
            if (s == null) return;

            if (s.isAdmin()) {
                String adminName = authDAO.findAdminName(s.userId);
                Map<String, Object> admin = createAdminPayload(s.userId, adminName);
                ok(resp, "Admin session verified", admin);
            } else {
                Trader t = traderDAO.findById(s.userId);
                if (t == null) {
                    fail(resp, 404, "Trader profile not found");
                    return;
                }
                ok(resp, "Session verified", t);
            }
            return;
        }
        fail(resp, 404, "Endpoint not found");
    }

    @Override
    protected void post(HttpServletRequest req, HttpServletResponse resp) throws Exception {
        String path = req.getPathInfo();
        Map<String, Object> body = readBody(req);

        if ("/login".equals(path)) {
            String loginInput = text(body, "phone");
            if (loginInput.isEmpty()) {
                loginInput = text(body, "username");
            }
            String password = text(body, "password");

            if (loginInput.isEmpty() || password.isEmpty()) {
                fail(resp, 400, "Phone number/business name and password are required");
                return;
            }

            // Check for admin login
            if ("admin".equalsIgnoreCase(loginInput)) {
                handleAdminLogin(loginInput, password, resp);
                return;
            }

            Trader trader = traderDAO.findByLogin(loginInput);
            if (trader == null) {
                fail(resp, 401, "No trader account found with this phone number or business name");
                return;
            }

            String hashedInput = hash(password);
            if (!hashedInput.equalsIgnoreCase(trader.passwordHash)) {
                fail(resp, 401, "Incorrect password. Please verify and try again.");
                return;
            }

            String token = UUID.randomUUID().toString();
            authDAO.createSession(token, trader.traderId, "TRADER");

            Map<String, Object> result = new HashMap<>();
            result.put("token", token);
            result.put("user", trader);
            ok(resp, "Login successful", result);
            return;
        }

        if ("/admin-login".equals(path)) {
            String username = text(body, "username");
            String password = text(body, "password");
            if (username.isEmpty() || password.isEmpty()) {
                fail(resp, 400, "Admin username and password required");
                return;
            }
            handleAdminLogin(username, password, resp);
            return;
        }

        if ("/register".equals(path)) {
            String phone = text(body, "phone");
            String password = text(body, "password");
            String name = text(body, "name");
            String businessName = text(body, "businessName");
            String role = text(body, "role");
            String cluster = text(body, "cluster");
            String sector = text(body, "sector");

            if (phone.isEmpty() || password.isEmpty() || name.isEmpty() || businessName.isEmpty()) {
                fail(resp, 400, "Name, business name, phone number, and password are required");
                return;
            }

            // Sanitize phone to digits if possible
            String cleanPhone = phone.replaceAll("\\D", "");
            if (cleanPhone.length() >= 10) {
                cleanPhone = cleanPhone.substring(cleanPhone.length() - 10);
            } else {
                cleanPhone = phone;
            }

            Trader existing = traderDAO.findByPhone(cleanPhone);
            if (existing != null) {
                fail(resp, 409, "A business is already registered with phone: " + cleanPhone);
                return;
            }

            Trader t = new Trader();
            t.name = name;
            t.phone = cleanPhone;
            t.businessName = businessName;
            t.businessDesc = text(body, "businessDesc");
            t.role = role.isEmpty() ? "RETAILER" : role;
            t.cluster = cluster.isEmpty() ? "Zaveri Bazaar" : cluster;
            t.sector = sector.isEmpty() ? "General Trade" : sector;
            t.passwordHash = hash(password);

            int newId = traderDAO.insert(t);
            t.traderId = newId;
            t.trustScore = 10.00;
            t.accentColor = "#1E6FFB";
            t.themeMode = "light";

            String token = UUID.randomUUID().toString();
            authDAO.createSession(token, newId, "TRADER");

            Map<String, Object> result = new HashMap<>();
            result.put("token", token);
            result.put("user", t);
            ok(resp, "Business registered successfully", result);
            return;
        }

        if ("/logout".equals(path)) {
            String header = req.getHeader("Authorization");
            if (header != null && header.startsWith("Bearer ")) {
                authDAO.deleteSession(header.substring(7));
            }
            ok(resp, "Logged out successfully", null);
            return;
        }

        fail(resp, 404, "Endpoint not found");
    }

    private void handleAdminLogin(String username, String password, HttpServletResponse resp) throws Exception {
        String[] adminRow = authDAO.findAdmin(username);
        if (adminRow == null) {
            fail(resp, 401, "Invalid administrator credentials");
            return;
        }

        int adminId = Integer.parseInt(adminRow[0]);
        String storedHash = adminRow[1];

        if (!hash(password).equalsIgnoreCase(storedHash)) {
            fail(resp, 401, "Incorrect admin password");
            return;
        }

        String token = UUID.randomUUID().toString();
        authDAO.createSession(token, adminId, "ADMIN");

        Map<String, Object> admin = createAdminPayload(adminId, username);
        Map<String, Object> result = new HashMap<>();
        result.put("token", token);
        result.put("user", admin);
        ok(resp, "Admin authentication successful", result);
    }

    private Map<String, Object> createAdminPayload(int adminId, String username) {
        Map<String, Object> admin = new HashMap<>();
        admin.put("traderId", "admin-" + adminId);
        admin.put("id", "admin-" + adminId);
        admin.put("name", "Market Association Admin");
        admin.put("username", username != null ? username : "Admin");
        admin.put("phone", "Admin");
        admin.put("businessName", "TradeTrust Arbitration Desk");
        admin.put("businessDesc", "Authorized Market Association Administrator and Arbitration Panel");
        admin.put("role", "ADMIN");
        admin.put("cluster", "South Mumbai Central Association");
        admin.put("sector", "Market Governance");
        admin.put("trustScore", 10.00);
        admin.put("isVerifiedBadge", true);
        admin.put("scoreFrozen", false);
        return admin;
    }
}
