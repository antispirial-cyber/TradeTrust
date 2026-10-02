package com.tradetrust.servlet;

import com.fasterxml.jackson.databind.JsonNode;
import com.tradetrust.dao.AdminDAO;
import com.tradetrust.dao.TraderDAO;
import com.tradetrust.model.Admin;
import com.tradetrust.model.Trader;
import com.tradetrust.util.JsonUtil;
import com.tradetrust.util.PasswordUtil;
import com.tradetrust.util.SessionUtil;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;

import java.io.IOException;
import java.math.BigDecimal;
import java.util.HashMap;
import java.util.Map;

@WebServlet("/api/auth/*")
public class AuthServlet extends HttpServlet {
    private final TraderDAO traderDAO = new TraderDAO();
    private final AdminDAO adminDAO = new AdminDAO();

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        String path = req.getPathInfo();
        if ("/me".equalsIgnoreCase(path)) {
            handleMe(req, resp);
        } else {
            JsonUtil.writeError(resp, HttpServletResponse.SC_NOT_FOUND, "Auth endpoint not found: " + path);
        }
    }

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        String path = req.getPathInfo();
        if (path == null) {
            JsonUtil.writeError(resp, HttpServletResponse.SC_BAD_REQUEST, "Missing auth action");
            return;
        }

        switch (path.toLowerCase()) {
            case "/register":
                handleRegister(req, resp);
                break;
            case "/login":
                handleLogin(req, resp);
                break;
            case "/admin-login":
                handleAdminLogin(req, resp);
                break;
            case "/logout":
                handleLogout(req, resp);
                break;
            default:
                JsonUtil.writeError(resp, HttpServletResponse.SC_NOT_FOUND, "Unknown auth action: " + path);
        }
    }

    private void handleRegister(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        try {
            JsonNode root = JsonUtil.getMapper().readTree(req.getInputStream());
            String name = root.path("name").asText(null);
            String phone = root.path("phone").asText(null);
            String businessName = root.path("businessName").asText(null);
            String businessDesc = root.path("businessDesc").asText(null);
            String role = root.path("role").asText("RETAILER").toUpperCase();
            String cluster = root.path("cluster").asText("Zaveri Bazaar");
            String sector = root.path("sector").asText("General");
            String rawPassword = root.path("password").asText(null);

            if (name == null || phone == null || businessName == null || rawPassword == null) {
                JsonUtil.writeError(resp, HttpServletResponse.SC_BAD_REQUEST, "Required fields: name, phone, businessName, password");
                return;
            }

            // Check if phone already registered
            if (traderDAO.findByPhone(phone) != null) {
                JsonUtil.writeError(resp, HttpServletResponse.SC_CONFLICT, "A trader with this phone number already exists");
                return;
            }

            Trader trader = new Trader();
            trader.setName(name);
            trader.setPhone(phone);
            trader.setBusinessName(businessName);
            trader.setBusinessDesc(businessDesc);
            trader.setRole(role);
            trader.setCluster(cluster);
            trader.setSector(sector);
            trader.setPasswordHash(PasswordUtil.hash(rawPassword));
            trader.setTrustScore(new BigDecimal("10.00"));
            trader.setVerifiedBadge(false);

            trader = traderDAO.create(trader);

            // Establish session & generate bearer token
            HttpSession session = req.getSession(true);
            session.setAttribute("trader_id", trader.getTraderId());
            session.setAttribute("role", "TRADER");
            String token = SessionUtil.createToken(trader.getTraderId(), "TRADER");

            Map<String, Object> data = new HashMap<>();
            data.put("token", token);
            data.put("user", sanitizeTrader(trader));

            JsonUtil.writeSuccess(resp, "Registration successful", data);
        } catch (Exception e) {
            e.printStackTrace();
            JsonUtil.writeError(resp, HttpServletResponse.SC_INTERNAL_SERVER_ERROR, "Registration failed: " + e.getMessage());
        }
    }

    private void handleLogin(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        try {
            JsonNode root = JsonUtil.getMapper().readTree(req.getInputStream());
            String phone = root.path("phone").asText(null);
            String rawPassword = root.path("password").asText(null);

            if (phone == null || rawPassword == null) {
                JsonUtil.writeError(resp, HttpServletResponse.SC_BAD_REQUEST, "Phone and password are required");
                return;
            }

            Trader trader = traderDAO.findByPhone(phone);
            if (trader == null || !PasswordUtil.verify(rawPassword, trader.getPasswordHash())) {
                JsonUtil.writeError(resp, HttpServletResponse.SC_UNAUTHORIZED, "Invalid phone number or password");
                return;
            }

            HttpSession session = req.getSession(true);
            session.setAttribute("trader_id", trader.getTraderId());
            session.setAttribute("role", "TRADER");
            String token = SessionUtil.createToken(trader.getTraderId(), "TRADER");

            Map<String, Object> data = new HashMap<>();
            data.put("token", token);
            data.put("user", sanitizeTrader(trader));

            JsonUtil.writeSuccess(resp, "Login successful", data);
        } catch (Exception e) {
            e.printStackTrace();
            JsonUtil.writeError(resp, HttpServletResponse.SC_INTERNAL_SERVER_ERROR, "Login error: " + e.getMessage());
        }
    }

    private void handleAdminLogin(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        try {
            JsonNode root = JsonUtil.getMapper().readTree(req.getInputStream());
            String username = root.path("username").asText(null);
            String password = root.path("password").asText(null);

            if (username == null || password == null) {
                JsonUtil.writeError(resp, HttpServletResponse.SC_BAD_REQUEST, "Username and password required");
                return;
            }

            Admin admin = adminDAO.findByUsername(username);
            if (admin == null || !PasswordUtil.verify(password, admin.getPasswordHash())) {
                JsonUtil.writeError(resp, HttpServletResponse.SC_UNAUTHORIZED, "Invalid admin credentials");
                return;
            }

            HttpSession session = req.getSession(true);
            session.setAttribute("admin_id", admin.getAdminId());
            session.setAttribute("role", "ADMIN");
            String token = SessionUtil.createToken(admin.getAdminId(), "ADMIN");

            Map<String, Object> data = new HashMap<>();
            data.put("token", token);
            data.put("admin", Map.of(
                    "adminId", admin.getAdminId(),
                    "username", admin.getUsername(),
                    "role", "ADMIN"
            ));

            JsonUtil.writeSuccess(resp, "Admin login successful", data);
        } catch (Exception e) {
            e.printStackTrace();
            JsonUtil.writeError(resp, HttpServletResponse.SC_INTERNAL_SERVER_ERROR, "Admin login failed: " + e.getMessage());
        }
    }

    private void handleLogout(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        HttpSession session = req.getSession(false);
        if (session != null) {
            session.invalidate();
        }
        String authHeader = req.getHeader("Authorization");
        if (authHeader != null && authHeader.toLowerCase().startsWith("bearer ")) {
            SessionUtil.removeToken(authHeader.substring(7).trim());
        }
        JsonUtil.writeSuccess(resp, "Logged out successfully", null);
    }

    private void handleMe(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        SessionUtil.SessionData sData = SessionUtil.getSessionData(req);
        if (sData == null) {
            JsonUtil.writeError(resp, HttpServletResponse.SC_UNAUTHORIZED, "Not authenticated");
            return;
        }

        try {
            if ("ADMIN".equalsIgnoreCase(sData.role)) {
                JsonUtil.writeSuccess(resp, "Current admin", Map.of("role", "ADMIN", "id", sData.id));
            } else {
                Trader trader = traderDAO.findById(sData.id);
                if (trader == null) {
                    JsonUtil.writeError(resp, HttpServletResponse.SC_NOT_FOUND, "Trader not found");
                    return;
                }
                JsonUtil.writeSuccess(resp, "Current user", sanitizeTrader(trader));
            }
        } catch (Exception e) {
            e.printStackTrace();
            JsonUtil.writeError(resp, HttpServletResponse.SC_INTERNAL_SERVER_ERROR, "Session check failed: " + e.getMessage());
        }
    }

    private Map<String, Object> sanitizeTrader(Trader t) {
        Map<String, Object> map = new HashMap<>();
        map.put("traderId", t.getTraderId());
        map.put("id", t.getTraderId());
        map.put("name", t.getName());
        map.put("phone", t.getPhone());
        map.put("businessName", t.getBusinessName());
        map.put("businessDesc", t.getBusinessDesc());
        map.put("role", t.getRole());
        map.put("cluster", t.getCluster());
        map.put("sector", t.getSector());
        map.put("photoPath", t.getPhotoPath());
        map.put("trustScore", t.getTrustScore());
        map.put("scoreFrozen", t.isScoreFrozen());
        map.put("isVerifiedBadge", t.isVerifiedBadge());
        map.put("createdAt", t.getCreatedAt());
        return map;
    }
}
