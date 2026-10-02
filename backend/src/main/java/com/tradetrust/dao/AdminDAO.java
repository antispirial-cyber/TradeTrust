package com.tradetrust.dao;

import com.tradetrust.model.Admin;
import com.tradetrust.util.DBConnection;

import java.math.BigDecimal;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.HashMap;
import java.util.Map;

public class AdminDAO {

    public Admin findByUsername(String username) throws SQLException {
        String sql = "SELECT * FROM admins WHERE username = ?";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, username);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    Admin a = new Admin();
                    a.setAdminId(rs.getInt("admin_id"));
                    a.setUsername(rs.getString("username"));
                    a.setPasswordHash(rs.getString("password_hash"));
                    try {
                        a.setCreatedAt(rs.getTimestamp("created_at"));
                    } catch (Exception ignored) {}
                    return a;
                }
            }
        }
        return null;
    }

    public Map<String, Object> getSystemMetrics() throws SQLException {
        Map<String, Object> metrics = new HashMap<>();
        try (Connection conn = DBConnection.getConnection()) {
            // Traders count and avg score
            String traderSql = "SELECT COUNT(*) as total_traders, AVG(trust_score) as avg_score FROM traders";
            try (PreparedStatement ps = conn.prepareStatement(traderSql);
                 ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    metrics.put("totalTraders", rs.getInt("total_traders"));
                    BigDecimal avg = rs.getBigDecimal("avg_score");
                    metrics.put("averageTrustScore", avg != null ? avg.setScale(2, java.math.RoundingMode.HALF_UP) : BigDecimal.ZERO);
                }
            }

            // Complaints
            String complaintSql = "SELECT " +
                                  "COUNT(*) as total_complaints, " +
                                  "SUM(CASE WHEN status LIKE '%PENDING%' OR status = 'ESCALATED_TO_ADMIN' THEN 1 ELSE 0 END) as pending_complaints, " +
                                  "SUM(CASE WHEN status = 'APPROVED' THEN 1 ELSE 0 END) as approved_complaints " +
                                  "FROM complaints";
            try (PreparedStatement ps = conn.prepareStatement(complaintSql);
                 ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    metrics.put("totalComplaints", rs.getInt("total_complaints"));
                    metrics.put("pendingComplaints", rs.getInt("pending_complaints"));
                    metrics.put("approvedComplaints", rs.getInt("approved_complaints"));
                }
            }

            // Ledger
            String ledgerSql = "SELECT COUNT(*) as total_entries, SUM(amount) as total_volume FROM ledger_entries";
            try (PreparedStatement ps = conn.prepareStatement(ledgerSql);
                 ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    metrics.put("totalLedgerEntries", rs.getInt("total_entries"));
                    metrics.put("totalLedgerVolume", rs.getBigDecimal("total_volume"));
                }
            }
        }
        return metrics;
    }
}
