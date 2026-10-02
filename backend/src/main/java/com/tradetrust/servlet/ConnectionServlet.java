package com.tradetrust.servlet;

import com.fasterxml.jackson.databind.JsonNode;
import com.tradetrust.dao.ConnectionDAO;
import com.tradetrust.dao.NotificationDAO;
import com.tradetrust.model.Connection;
import com.tradetrust.model.Notification;
import com.tradetrust.util.JsonUtil;
import com.tradetrust.util.SessionUtil;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;
import java.util.List;

@WebServlet("/api/connect/*")
public class ConnectionServlet extends HttpServlet {
    private final ConnectionDAO connectionDAO = new ConnectionDAO();
    private final NotificationDAO notificationDAO = new NotificationDAO();

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        Integer currentTraderId = SessionUtil.getCurrentTraderId(req);
        if (currentTraderId == null) {
            JsonUtil.writeError(resp, HttpServletResponse.SC_UNAUTHORIZED, "Authentication required");
            return;
        }

        try {
            String path = req.getPathInfo();
            String status = req.getParameter("status");
            if (status == null || status.isBlank()) {
                if ("/requests".equalsIgnoreCase(path)) {
                    status = "PENDING_INCOMING";
                } else if ("/sent".equalsIgnoreCase(path)) {
                    status = "PENDING_OUTGOING";
                } else {
                    status = "ACCEPTED";
                }
            }

            List<Connection> list = connectionDAO.getConnectionsForTrader(currentTraderId, status);
            JsonUtil.writeSuccess(resp, "Connections list", list);
        } catch (Exception e) {
            e.printStackTrace();
            JsonUtil.writeError(resp, HttpServletResponse.SC_INTERNAL_SERVER_ERROR, "Failed to load connections: " + e.getMessage());
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
        if (path == null) {
            JsonUtil.writeError(resp, HttpServletResponse.SC_BAD_REQUEST, "Missing connection action");
            return;
        }

        try {
            JsonNode root = JsonUtil.getMapper().readTree(req.getInputStream());

            switch (path.toLowerCase()) {
                case "/request": {
                    int targetId = root.has("targetTraderId") ? root.get("targetTraderId").asInt() : root.path("receiverId").asInt(0);
                    if (targetId <= 0 || targetId == currentTraderId) {
                        JsonUtil.writeError(resp, HttpServletResponse.SC_BAD_REQUEST, "Invalid target trader ID");
                        return;
                    }
                    boolean ok = connectionDAO.sendRequest(currentTraderId, targetId);
                    if (ok) {
                        Notification notif = new Notification();
                        notif.setRecipientId(targetId);
                        notif.setType("CONNECTION_REQUEST");
                        notif.setMessage("A trader has requested to connect with you on TradeTrust.");
                        notif.setLinkRef("/network");
                        notificationDAO.create(notif);
                        JsonUtil.writeSuccess(resp, "Connection request sent", null);
                    } else {
                        JsonUtil.writeError(resp, HttpServletResponse.SC_BAD_REQUEST, "Failed to send connection request");
                    }
                    break;
                }
                case "/accept": {
                    int connId = root.path("connectionId").asInt(0);
                    if (connId <= 0) {
                        JsonUtil.writeError(resp, HttpServletResponse.SC_BAD_REQUEST, "Invalid connectionId");
                        return;
                    }
                    boolean ok = connectionDAO.acceptRequest(connId, currentTraderId);
                    if (ok) {
                        JsonUtil.writeSuccess(resp, "Connection accepted", null);
                    } else {
                        JsonUtil.writeError(resp, HttpServletResponse.SC_NOT_FOUND, "Request not found or unauthorized");
                    }
                    break;
                }
                case "/decline": {
                    int connId = root.path("connectionId").asInt(0);
                    if (connId <= 0) {
                        JsonUtil.writeError(resp, HttpServletResponse.SC_BAD_REQUEST, "Invalid connectionId");
                        return;
                    }
                    boolean ok = connectionDAO.declineRequest(connId, currentTraderId);
                    if (ok) {
                        JsonUtil.writeSuccess(resp, "Connection declined", null);
                    } else {
                        JsonUtil.writeError(resp, HttpServletResponse.SC_NOT_FOUND, "Request not found or unauthorized");
                    }
                    break;
                }
                case "/remove": {
                    int targetId = root.has("targetTraderId") ? root.get("targetTraderId").asInt() : root.path("receiverId").asInt(0);
                    if (targetId <= 0) {
                        JsonUtil.writeError(resp, HttpServletResponse.SC_BAD_REQUEST, "Invalid target trader ID");
                        return;
                    }
                    connectionDAO.removeConnection(currentTraderId, targetId);
                    JsonUtil.writeSuccess(resp, "Connection removed", null);
                    break;
                }
                default:
                    JsonUtil.writeError(resp, HttpServletResponse.SC_NOT_FOUND, "Action not found: " + path);
            }
        } catch (Exception e) {
            e.printStackTrace();
            JsonUtil.writeError(resp, HttpServletResponse.SC_INTERNAL_SERVER_ERROR, "Connection operation failed: " + e.getMessage());
        }
    }
}
