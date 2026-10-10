package com.tradetrust.servlet;

import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.tradetrust.dao.AuthDAO;
import com.tradetrust.model.Session;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.sql.SQLException;
import java.util.HashMap;
import java.util.Map;

/**
 * Base servlet for JSON APIs and session verification.
 */
public abstract class ApiServlet extends HttpServlet {

    private static final ObjectMapper MAPPER = new ObjectMapper()
            .configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);

    protected final AuthDAO authDAO = new AuthDAO();

    protected void get(HttpServletRequest req, HttpServletResponse resp) throws Exception {
        fail(resp, 405, "GET method not allowed on this route");
    }

    protected void post(HttpServletRequest req, HttpServletResponse resp) throws Exception {
        fail(resp, 405, "POST method not allowed on this route");
    }

    protected void put(HttpServletRequest req, HttpServletResponse resp) throws Exception {
        fail(resp, 405, "PUT method not allowed on this route");
    }

    protected void delete(HttpServletRequest req, HttpServletResponse resp) throws Exception {
        fail(resp, 405, "DELETE method not allowed on this route");
    }

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        dispatch(req, resp, "GET");
    }

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        dispatch(req, resp, "POST");
    }

    @Override
    protected void doPut(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        dispatch(req, resp, "PUT");
    }

    @Override
    protected void doDelete(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        dispatch(req, resp, "DELETE");
    }

    private void dispatch(HttpServletRequest req, HttpServletResponse resp, String method) throws IOException {
        try {
            switch (method) {
                case "GET" -> get(req, resp);
                case "POST" -> post(req, resp);
                case "PUT" -> put(req, resp);
                case "DELETE" -> delete(req, resp);
            }
        } catch (BadRequest e) {
            fail(resp, 400, e.getMessage());
        } catch (SQLException e) {
            e.printStackTrace();
            fail(resp, 500, "A database error occurred. Please verify your input or try again.");
        } catch (Exception e) {
            e.printStackTrace();
            fail(resp, 500, "An internal server error occurred.");
        }
    }

    // ---- Responses ----

    protected void ok(HttpServletResponse resp, String message, Object data) throws IOException {
        Map<String, Object> body = new HashMap<>();
        body.put("success", true);
        body.put("message", message);
        body.put("data", data);
        write(resp, 200, body);
    }

    protected void fail(HttpServletResponse resp, int status, String message) throws IOException {
        Map<String, Object> body = new HashMap<>();
        body.put("success", false);
        body.put("message", message);
        write(resp, status, body);
    }

    private void write(HttpServletResponse resp, int status, Object body) throws IOException {
        resp.setStatus(status);
        resp.setContentType("application/json;charset=UTF-8");
        MAPPER.writeValue(resp.getWriter(), body);
    }

    // ---- Request parsing helpers ----

    @SuppressWarnings("unchecked")
    protected Map<String, Object> readBody(HttpServletRequest req) throws IOException {
        if (req.getContentLength() == 0) {
            return new HashMap<>();
        }
        try {
            Map<String, Object> body = MAPPER.readValue(req.getInputStream(), Map.class);
            return body == null ? new HashMap<>() : body;
        } catch (IOException e) {
            throw new BadRequest("Malformed request payload. Valid JSON required.");
        }
    }

    protected static String text(Map<String, Object> body, String key) {
        Object val = body.get(key);
        return val == null ? "" : val.toString().trim();
    }

    protected static double number(Map<String, Object> body, String key) {
        try {
            return Double.parseDouble(text(body, key));
        } catch (NumberFormatException e) {
            throw new BadRequest(key + " must be a valid number");
        }
    }

    protected static int integer(String val) {
        try {
            return Integer.parseInt(val);
        } catch (NumberFormatException e) {
            throw new BadRequest("Invalid numeric identifier");
        }
    }

    protected static String[] parts(HttpServletRequest req) {
        String path = req.getPathInfo();
        if (path == null || path.equals("/")) {
            return new String[0];
        }
        return path.substring(1).split("/");
    }

    // ---- Session Authentication ----

    protected Session requireLogin(HttpServletRequest req, HttpServletResponse resp) throws IOException, SQLException {
        String header = req.getHeader("Authorization");
        if (header != null && header.startsWith("Bearer ")) {
            Session s = authDAO.findSession(header.substring(7));
            if (s != null) {
                return s;
            }
        }
        fail(resp, 401, "Session expired or invalid. Please sign in again.");
        return null;
    }

    protected Session requireTrader(HttpServletRequest req, HttpServletResponse resp) throws IOException, SQLException {
        Session s = requireLogin(req, resp);
        if (s != null && s.isAdmin()) {
            fail(resp, 403, "Access restricted to merchant accounts.");
            return null;
        }
        return s;
    }

    protected Session requireAdmin(HttpServletRequest req, HttpServletResponse resp) throws IOException, SQLException {
        Session s = requireLogin(req, resp);
        if (s != null && !s.isAdmin()) {
            fail(resp, 403, "Administrator clearance required.");
            return null;
        }
        return s;
    }

    // ---- SHA-256 Hashing ----

    public static String hash(String password) {
        try {
            byte[] bytes = MessageDigest.getInstance("SHA-256").digest(password.getBytes(StandardCharsets.UTF_8));
            StringBuilder hex = new StringBuilder();
            for (byte b : bytes) {
                hex.append(String.format("%02x", b));
            }
            return hex.toString();
        } catch (Exception e) {
            throw new IllegalStateException(e);
        }
    }

    public static class BadRequest extends RuntimeException {
        public BadRequest(String message) {
            super(message);
        }
    }
}
