package com.tradetrust.util;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;

public class ScoreUtil {

    public static BigDecimal calculateScore(int traderId, Connection conn) throws SQLException {
        // First check if trader score is frozen
        String checkFreezeSql = "SELECT score_frozen, trust_score FROM traders WHERE trader_id = ?";
        try (PreparedStatement ps = conn.prepareStatement(checkFreezeSql)) {
            ps.setInt(1, traderId);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    boolean frozen = rs.getBoolean("score_frozen");
                    if (frozen) {
                        return rs.getBigDecimal("trust_score");
                    }
                }
            }
        }

        // Start with baseline 10.00
        BigDecimal score = new BigDecimal("10.00");

        // 1. Deduct for approved complaints against this trader
        String complaintSql = "SELECT COUNT(*) as cnt, COALESCE(SUM(amount_disputed), 0) as total_disputed " +
                              "FROM complaints WHERE reported_id = ? AND status = 'APPROVED'";
        try (PreparedStatement ps = conn.prepareStatement(complaintSql)) {
            ps.setInt(1, traderId);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    int count = rs.getInt("cnt");
                    if (count > 0) {
                        // Deduct 1.50 per approved complaint
                        BigDecimal deduction = BigDecimal.valueOf(count).multiply(new BigDecimal("1.50"));
                        score = score.subtract(deduction);
                    }
                }
            }
        }

        // 2. Adjust for ledger entries
        // Paid entries add +0.10 each (capped effect +1.00)
        // Overdue entries deduct -0.50 each
        String ledgerSql = "SELECT status, COUNT(*) as cnt FROM ledger_entries WHERE owner_id = ? GROUP BY status";
        try (PreparedStatement ps = conn.prepareStatement(ledgerSql)) {
            ps.setInt(1, traderId);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    String status = rs.getString("status");
                    int cnt = rs.getInt("cnt");
                    if ("PAID".equalsIgnoreCase(status)) {
                        BigDecimal bonus = BigDecimal.valueOf(Math.min(cnt, 10)).multiply(new BigDecimal("0.10"));
                        score = score.add(bonus);
                    } else if ("OVERDUE".equalsIgnoreCase(status)) {
                        BigDecimal penalty = BigDecimal.valueOf(cnt).multiply(new BigDecimal("0.50"));
                        score = score.subtract(penalty);
                    }
                }
            }
        }

        // 3. Accepted connections boost confidence slightly (+0.05 per connection, up to +0.50)
        String connSql = "SELECT COUNT(*) as cnt FROM connections " +
                         "WHERE (requester_id = ? OR receiver_id = ?) AND status = 'ACCEPTED'";
        try (PreparedStatement ps = conn.prepareStatement(connSql)) {
            ps.setInt(1, traderId);
            ps.setInt(2, traderId);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    int connCount = rs.getInt("cnt");
                    BigDecimal connBonus = BigDecimal.valueOf(Math.min(connCount, 10)).multiply(new BigDecimal("0.05"));
                    score = score.add(connBonus);
                }
            }
        }

        // Clamp between 0.00 and 10.00
        if (score.compareTo(new BigDecimal("10.00")) > 0) {
            score = new BigDecimal("10.00");
        } else if (score.compareTo(BigDecimal.ZERO) < 0) {
            score = BigDecimal.ZERO;
        }

        return score.setScale(2, RoundingMode.HALF_UP);
    }

    public static void recalculateAndSave(int traderId, Connection conn) throws SQLException {
        BigDecimal newScore = calculateScore(traderId, conn);
        String updateSql = "UPDATE traders SET trust_score = ? WHERE trader_id = ? AND score_frozen = FALSE";
        try (PreparedStatement ps = conn.prepareStatement(updateSql)) {
            ps.setBigDecimal(1, newScore);
            ps.setInt(2, traderId);
            ps.executeUpdate();
        }
    }
}
