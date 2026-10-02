package com.tradetrust.servlet;

import com.tradetrust.dao.TraderDAO;
import com.tradetrust.model.Trader;
import com.tradetrust.util.DBConnection;
import com.tradetrust.util.JsonUtil;
import com.tradetrust.util.SessionUtil;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;
import java.math.BigDecimal;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.util.HashMap;
import java.util.Map;

@WebServlet("/api/score/*")
public class ScoreServlet extends HttpServlet {
    private final TraderDAO traderDAO = new TraderDAO();

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        String path = req.getPathInfo();
        Integer traderId = null;

        if (path == null || path.equals("/") || path.equalsIgnoreCase("/me")) {
            traderId = SessionUtil.getCurrentTraderId(req);
            if (traderId == null) {
                JsonUtil.writeError(resp, HttpServletResponse.SC_UNAUTHORIZED, "Authentication required to view score");
                return;
            }
        } else {
            try {
                traderId = Integer.parseInt(path.substring(1).replace("/", ""));
            } catch (NumberFormatException e) {
                JsonUtil.writeError(resp, HttpServletResponse.SC_BAD_REQUEST, "Invalid trader ID in path");
                return;
            }
        }

        try {
            Trader trader = traderDAO.findById(traderId);
            if (trader == null) {
                JsonUtil.writeError(resp, HttpServletResponse.SC_NOT_FOUND, "Trader not found");
                return;
            }

            // Calculate factors
            int approvedComplaints = 0;
            int paidLedger = 0;
            int overdueLedger = 0;
            int acceptedConnections = 0;

            try (Connection conn = DBConnection.getConnection()) {
                String cSql = "SELECT COUNT(*) FROM complaints WHERE reported_id = ? AND status = 'APPROVED'";
                try (PreparedStatement ps = conn.prepareStatement(cSql)) {
                    ps.setInt(1, traderId);
                    try (ResultSet rs = ps.executeQuery()) {
                        if (rs.next()) approvedComplaints = rs.getInt(1);
                    }
                }

                String lSql = "SELECT status, COUNT(*) FROM ledger_entries WHERE owner_id = ? GROUP BY status";
                try (PreparedStatement ps = conn.prepareStatement(lSql)) {
                    ps.setInt(1, traderId);
                    try (ResultSet rs = ps.executeQuery()) {
                        while (rs.next()) {
                            String st = rs.getString("status");
                            int cnt = rs.getInt(2);
                            if ("PAID".equalsIgnoreCase(st)) paidLedger = cnt;
                            if ("OVERDUE".equalsIgnoreCase(st)) overdueLedger = cnt;
                        }
                    }
                }

                String connSql = "SELECT COUNT(*) FROM connections WHERE (requester_id = ? OR receiver_id = ?) AND status = 'ACCEPTED'";
                try (PreparedStatement ps = conn.prepareStatement(connSql)) {
                    ps.setInt(1, traderId);
                    ps.setInt(2, traderId);
                    try (ResultSet rs = ps.executeQuery()) {
                        if (rs.next()) acceptedConnections = rs.getInt(1);
                    }
                }
            }

            Map<String, Object> data = new HashMap<>();
            data.put("traderId", trader.getTraderId());
            data.put("traderName", trader.getName());
            data.put("trustScore", trader.getTrustScore());
            data.put("scoreFrozen", trader.isScoreFrozen());
            data.put("scoreBeforeFreeze", trader.getScoreBeforeFreeze());
            data.put("isVerifiedBadge", trader.isVerifiedBadge());

            data.put("baseScore", new BigDecimal("10.00"));
            data.put("approvedComplaintsCount", approvedComplaints);
            data.put("complaintsPenalty", BigDecimal.valueOf(approvedComplaints).multiply(new BigDecimal("1.50")));
            data.put("paidEntriesCount", paidLedger);
            data.put("paidBonus", BigDecimal.valueOf(Math.min(paidLedger, 10)).multiply(new BigDecimal("0.10")));
            data.put("overdueEntriesCount", overdueLedger);
            data.put("overduePenalty", BigDecimal.valueOf(overdueLedger).multiply(new BigDecimal("0.50")));
            data.put("connectionsCount", acceptedConnections);
            data.put("connectionsBonus", BigDecimal.valueOf(Math.min(acceptedConnections, 10)).multiply(new BigDecimal("0.05")));

            JsonUtil.writeSuccess(resp, "Trust score metrics", data);
        } catch (Exception e) {
            e.printStackTrace();
            JsonUtil.writeError(resp, HttpServletResponse.SC_INTERNAL_SERVER_ERROR, "Failed to load score: " + e.getMessage());
        }
    }
}
