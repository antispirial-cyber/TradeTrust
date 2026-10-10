package com.tradetrust.servlet;

import com.tradetrust.dao.ConnectionDAO;
import com.tradetrust.dao.TraderDAO;
import com.tradetrust.model.Session;
import com.tradetrust.model.Trader;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Handles /api/connect/*:
 *   POST /api/connect/request (or /api/connect/{traderId})
 *   POST /api/connect/accept
 *   POST /api/connect/decline
 *   POST /api/connect/remove
 *   GET  /api/connect/accepted
 */
public class ConnectionServlet extends ApiServlet {

    private final ConnectionDAO connectionDAO = new ConnectionDAO();
    private final TraderDAO traderDAO = new TraderDAO();

    @Override
    protected void get(HttpServletRequest req, HttpServletResponse resp) throws Exception {
        Session s = requireTrader(req, resp);
        if (s == null) return;

        String path = req.getPathInfo();
        if ("/accepted".equals(path) || path == null || path.isEmpty()) {
            List<Integer> ids = connectionDAO.acceptedIds(s.userId);
            List<Trader> connections = new ArrayList<>();
            for (int id : ids) {
                Trader t = traderDAO.findById(id);
                if (t != null) {
                    t.connectionStatus = ConnectionDAO.CONNECTED;
                    connections.add(t);
                }
            }
            ok(resp, "Active market connections loaded", connections);
            return;
        }

        fail(resp, 404, "Connection endpoint not found");
    }

    @Override
    protected void post(HttpServletRequest req, HttpServletResponse resp) throws Exception {
        Session s = requireTrader(req, resp);
        if (s == null) return;

        String[] p = parts(req);
        String action = p.length > 0 ? p[0] : "";
        Map<String, Object> body = readBody(req);

        // POST /api/connect/accept
        if ("accept".equalsIgnoreCase(action)) {
            int connectionId = (int) number(body, "connectionId");
            boolean ok = connectionDAO.accept(connectionId, s.userId);
            if (!ok) {
                fail(resp, 400, "Unable to accept connection request (request not found or already processed).");
                return;
            }
            ok(resp, "Market connection established successfully.", Map.of("connectionStatus", ConnectionDAO.CONNECTED));
            return;
        }

        // POST /api/connect/decline
        if ("decline".equalsIgnoreCase(action)) {
            int connectionId = (int) number(body, "connectionId");
            boolean ok = connectionDAO.decline(connectionId, s.userId);
            if (!ok) {
                fail(resp, 400, "Unable to decline connection request.");
                return;
            }
            ok(resp, "Connection request declined.", Map.of("connectionStatus", ConnectionDAO.NOT_CONNECTED));
            return;
        }

        // POST /api/connect/remove
        if ("remove".equalsIgnoreCase(action)) {
            int otherId = (int) number(body, "traderId");
            connectionDAO.remove(s.userId, otherId);
            ok(resp, "Connection removed.", Map.of("connectionStatus", ConnectionDAO.NOT_CONNECTED));
            return;
        }

        // POST /api/connect/request OR /api/connect/{traderId}
        int targetId;
        if (!action.isEmpty() && !"request".equalsIgnoreCase(action)) {
            targetId = integer(action);
        } else {
            targetId = (int) number(body, "traderId");
        }

        if (targetId == s.userId) {
            fail(resp, 400, "Cannot send a connection request to your own business");
            return;
        }

        String status = connectionDAO.request(s.userId, targetId);
        Map<String, Object> data = new HashMap<>();
        data.put("connectionStatus", status);
        data.put("targetTraderId", targetId);
        ok(resp, "Connection request recorded.", data);
    }
}
