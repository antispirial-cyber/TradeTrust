package com.tradetrust.servlet;

import com.fasterxml.jackson.databind.JsonNode;
import com.tradetrust.dao.TraderDAO;
import com.tradetrust.dao.TraderSettingDAO;
import com.tradetrust.model.Trader;
import com.tradetrust.model.TraderSetting;
import com.tradetrust.util.JsonUtil;
import com.tradetrust.util.PasswordUtil;
import com.tradetrust.util.SessionUtil;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@WebServlet(urlPatterns = {"/api/traders", "/api/traders/*", "/api/trader/*"})
public class TraderServlet extends HttpServlet {
    private final TraderDAO traderDAO = new TraderDAO();
    private final TraderSettingDAO settingDAO = new TraderSettingDAO();

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        String uri = req.getRequestURI();
        Integer viewerId = SessionUtil.getCurrentTraderId(req);
        int vId = viewerId != null ? viewerId : -1;

        try {
            if (uri.endsWith("/api/trader/settings")) {
                if (viewerId == null) {
                    JsonUtil.writeError(resp, HttpServletResponse.SC_UNAUTHORIZED, "Please sign in to view settings");
                    return;
                }
                TraderSetting s = settingDAO.findByTraderId(viewerId);
                JsonUtil.writeSuccess(resp, "Trader settings", s != null ? s : Map.of("accentColor", "#1E6FFB"));
                return;
            }

            // Extract potential ID: e.g. /api/traders/3 or /api/trader/3
            String path = req.getPathInfo();
            if (path != null && path.length() > 1 && !path.contains("/")) {
                try {
                    int id = Integer.parseInt(path.substring(1));
                    Trader t = traderDAO.findById(id);
                    if (t == null) {
                        JsonUtil.writeError(resp, HttpServletResponse.SC_NOT_FOUND, "Trader not found");
                        return;
                    }
                    JsonUtil.writeSuccess(resp, "Trader found", sanitizeTrader(t));
                    return;
                } catch (NumberFormatException ignored) {}
            }

            // Check if it's GET /api/traders with query params
            String search = req.getParameter("search");
            String cluster = req.getParameter("cluster");
            String sector = req.getParameter("sector");
            String role = req.getParameter("role");
            String sort = req.getParameter("sort");

            List<Trader> list = traderDAO.findAll(search, cluster, sector, role, sort, vId);
            List<Map<String, Object>> sanitized = list.stream().map(this::sanitizeTrader).toList();
            JsonUtil.writeSuccess(resp, "Traders list", sanitized);
        } catch (Exception e) {
            e.printStackTrace();
            JsonUtil.writeError(resp, HttpServletResponse.SC_INTERNAL_SERVER_ERROR, "Failed to load traders: " + e.getMessage());
        }
    }

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        doPut(req, resp);
    }

    @Override
    protected void doPut(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        String uri = req.getRequestURI();
        Integer traderId = SessionUtil.getCurrentTraderId(req);
        if (traderId == null) {
            JsonUtil.writeError(resp, HttpServletResponse.SC_UNAUTHORIZED, "Unauthorized action");
            return;
        }

        try {
            if (uri.endsWith("/api/trader/settings")) {
                JsonNode root = JsonUtil.getMapper().readTree(req.getInputStream());
                String color = root.path("accentColor").asText("#1E6FFB");
                settingDAO.saveOrUpdate(traderId, color);
                JsonUtil.writeSuccess(resp, "Settings updated", Map.of("accentColor", color));
                return;
            }

            if (uri.endsWith("/api/trader/password")) {
                JsonNode root = JsonUtil.getMapper().readTree(req.getInputStream());
                String oldPass = root.path("oldPassword").asText(null);
                String newPass = root.path("newPassword").asText(null);

                if (oldPass == null || newPass == null) {
                    JsonUtil.writeError(resp, HttpServletResponse.SC_BAD_REQUEST, "Both oldPassword and newPassword are required");
                    return;
                }

                Trader t = traderDAO.findById(traderId);
                if (!PasswordUtil.verify(oldPass, t.getPasswordHash())) {
                    JsonUtil.writeError(resp, HttpServletResponse.SC_BAD_REQUEST, "Incorrect current password");
                    return;
                }

                traderDAO.updatePassword(traderId, PasswordUtil.hash(newPass));
                JsonUtil.writeSuccess(resp, "Password updated successfully", null);
                return;
            }

            if (uri.endsWith("/api/trader/profile")) {
                JsonNode root = JsonUtil.getMapper().readTree(req.getInputStream());
                Trader existing = traderDAO.findById(traderId);
                if (existing == null) {
                    JsonUtil.writeError(resp, HttpServletResponse.SC_NOT_FOUND, "Trader not found");
                    return;
                }

                if (root.has("name")) existing.setName(root.get("name").asText());
                if (root.has("businessName")) existing.setBusinessName(root.get("businessName").asText());
                if (root.has("businessDesc")) existing.setBusinessDesc(root.get("businessDesc").asText());
                if (root.has("role")) existing.setRole(root.get("role").asText().toUpperCase());
                if (root.has("cluster")) existing.setCluster(root.get("cluster").asText());
                if (root.has("sector")) existing.setSector(root.get("sector").asText());
                if (root.has("photoPath")) existing.setPhotoPath(root.get("photoPath").asText());

                traderDAO.update(existing);
                JsonUtil.writeSuccess(resp, "Profile updated successfully", sanitizeTrader(existing));
                return;
            }

            JsonUtil.writeError(resp, HttpServletResponse.SC_NOT_FOUND, "Endpoint not found: " + uri);
        } catch (Exception e) {
            e.printStackTrace();
            JsonUtil.writeError(resp, HttpServletResponse.SC_INTERNAL_SERVER_ERROR, "Update failed: " + e.getMessage());
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
        map.put("scoreBeforeFreeze", t.getScoreBeforeFreeze());
        map.put("isVerifiedBadge", t.isVerifiedBadge());
        map.put("createdAt", t.getCreatedAt());
        map.put("mutualConnections", t.getMutualConnections());
        map.put("connectionStatus", t.getConnectionStatus());
        return map;
    }
}
