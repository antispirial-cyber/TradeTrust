package com.tradetrust.util;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

public class SessionUtil {
    public static class SessionData {
        public final int id;
        public final String role; // "TRADER" or "ADMIN"
        public final long createdAt;

        public SessionData(int id, String role) {
            this.id = id;
            this.role = role;
            this.createdAt = System.currentTimeMillis();
        }
    }

    private static final Map<String, SessionData> tokenStore = new ConcurrentHashMap<>();

    public static String createToken(int id, String role) {
        String token = UUID.randomUUID().toString();
        tokenStore.put(token, new SessionData(id, role));
        return token;
    }

    public static void removeToken(String token) {
        if (token != null) {
            tokenStore.remove(token);
        }
    }

    public static SessionData getSessionData(HttpServletRequest request) {
        // 1. Try Bearer token in Authorization header
        String authHeader = request.getHeader("Authorization");
        if (authHeader != null && authHeader.toLowerCase().startsWith("bearer ")) {
            String token = authHeader.substring(7).trim();
            SessionData data = tokenStore.get(token);
            if (data != null) {
                return data;
            }
        }

        // 2. Try X-Auth-Token header
        String xAuth = request.getHeader("X-Auth-Token");
        if (xAuth != null && !xAuth.isEmpty()) {
            SessionData data = tokenStore.get(xAuth.trim());
            if (data != null) {
                return data;
            }
        }

        // 3. Try standard HttpSession
        HttpSession session = request.getSession(false);
        if (session != null) {
            Object traderId = session.getAttribute("trader_id");
            if (traderId instanceof Integer) {
                return new SessionData((Integer) traderId, "TRADER");
            }
            Object adminId = session.getAttribute("admin_id");
            if (adminId instanceof Integer) {
                return new SessionData((Integer) adminId, "ADMIN");
            }
        }

        return null;
    }

    public static Integer getCurrentTraderId(HttpServletRequest request) {
        SessionData data = getSessionData(request);
        if (data != null && "TRADER".equals(data.role)) {
            return data.id;
        }
        return null;
    }

    public static Integer getCurrentAdminId(HttpServletRequest request) {
        SessionData data = getSessionData(request);
        if (data != null && "ADMIN".equals(data.role)) {
            return data.id;
        }
        return null;
    }
}
