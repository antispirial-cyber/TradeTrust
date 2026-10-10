package com.tradetrust;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.HashMap;
import java.util.Map;

/**
 * Trust score calculation helper.
 */
public class ScoreUtil {

    public static BigDecimal calculateTieredDeduction(BigDecimal amount) {
        BigDecimal baseDeduction = new BigDecimal("2.00");
        BigDecimal extra = BigDecimal.ZERO;
        if (amount != null) {
            if (amount.compareTo(new BigDecimal("100000")) > 0) {
                extra = new BigDecimal("1.50");
            } else if (amount.compareTo(new BigDecimal("25000")) >= 0) {
                extra = new BigDecimal("1.00");
            } else if (amount.compareTo(new BigDecimal("5000")) >= 0) {
                extra = new BigDecimal("0.50");
            }
        }
        return baseDeduction.add(extra);
    }

    public static Map<String, Object> calculateScoreBreakdown(int traderId, Connection conn) throws SQLException {
        boolean frozen = false;
        BigDecimal currentScore = new BigDecimal("10.00");
        String checkSql = "SELECT score_frozen, trust_score, name FROM traders WHERE trader_id = ?";
        String traderName = "";
        try (PreparedStatement ps = conn.prepareStatement(checkSql)) {
            ps.setInt(1, traderId);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    frozen = rs.getBoolean("score_frozen");
                    currentScore = rs.getBigDecimal("trust_score");
                    traderName = rs.getString("name");
                } else {
                    return null;
                }
            }
        }

        BigDecimal baseScore = new BigDecimal("10.00");

        // 1. Approved complaints deduction
        int approvedComplaints = 0;
        BigDecimal totalComplaintPenalty = BigDecimal.ZERO;
        String compSql = "SELECT amount_disputed FROM complaints WHERE reported_id = ? AND status = 'APPROVED'";
        try (PreparedStatement ps = conn.prepareStatement(compSql)) {
            ps.setInt(1, traderId);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    approvedComplaints++;
                    BigDecimal amt = rs.getBigDecimal("amount_disputed");
                    totalComplaintPenalty = totalComplaintPenalty.add(calculateTieredDeduction(amt));
                }
            }
        }

        // 2. Ledger bonus & penalties
        int paidCount = 0;
        int overdueCount = 0;
        String ledgerSql = "SELECT status, COUNT(*) as cnt FROM ledger_entries WHERE owner_id = ? GROUP BY status";
        try (PreparedStatement ps = conn.prepareStatement(ledgerSql)) {
            ps.setInt(1, traderId);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    String st = rs.getString("status");
                    int cnt = rs.getInt("cnt");
                    if ("PAID".equalsIgnoreCase(st)) paidCount = cnt;
                    else if ("OVERDUE".equalsIgnoreCase(st)) overdueCount = cnt;
                }
            }
        }

        BigDecimal paidBonus = BigDecimal.valueOf(Math.min(paidCount, 10)).multiply(new BigDecimal("0.10"));
        BigDecimal overduePenalty = BigDecimal.valueOf(overdueCount).multiply(new BigDecimal("0.50"));

        // 3. Network connection bonus
        int acceptedConnections = 0;
        String connSql = "SELECT COUNT(*) FROM connections WHERE (requester_id = ? OR receiver_id = ?) AND status = 'ACCEPTED'";
        try (PreparedStatement ps = conn.prepareStatement(connSql)) {
            ps.setInt(1, traderId);
            ps.setInt(2, traderId);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) acceptedConnections = rs.getInt(1);
            }
        }
        BigDecimal connectionsBonus = BigDecimal.valueOf(Math.min(acceptedConnections, 10)).multiply(new BigDecimal("0.05"));

        // Combine factors
        BigDecimal calculated = baseScore
                .subtract(totalComplaintPenalty)
                .add(paidBonus)
                .subtract(overduePenalty)
                .add(connectionsBonus);

        // Clamp between 0.00 and 10.00
        if (calculated.compareTo(new BigDecimal("10.00")) > 0) {
            calculated = new BigDecimal("10.00");
        } else if (calculated.compareTo(BigDecimal.ZERO) < 0) {
            calculated = BigDecimal.ZERO;
        }
        calculated = calculated.setScale(2, RoundingMode.HALF_UP);

        Map<String, Object> map = new HashMap<>();
        map.put("traderId", traderId);
        map.put("traderName", traderName);
        map.put("baseScore", baseScore);
        map.put("approvedComplaintsCount", approvedComplaints);
        map.put("complaintsPenalty", totalComplaintPenalty.setScale(2, RoundingMode.HALF_UP));
        map.put("paidEntriesCount", paidCount);
        map.put("paidBonus", paidBonus.setScale(2, RoundingMode.HALF_UP));
        map.put("overdueEntriesCount", overdueCount);
        map.put("overduePenalty", overduePenalty.setScale(2, RoundingMode.HALF_UP));
        map.put("connectionsCount", acceptedConnections);
        map.put("connectionsBonus", connectionsBonus.setScale(2, RoundingMode.HALF_UP));
        map.put("scoreFrozen", frozen);
        map.put("storedTrustScore", currentScore);
        map.put("calculatedTrustScore", calculated);
        return map;
    }

    public static BigDecimal calculateScore(int traderId, Connection conn) throws SQLException {
        Map<String, Object> map = calculateScoreBreakdown(traderId, conn);
        if (map == null) return new BigDecimal("10.00");
        if ((boolean) map.get("scoreFrozen")) {
            return (BigDecimal) map.get("storedTrustScore");
        }
        return (BigDecimal) map.get("calculatedTrustScore");
    }

    public static void recalculateAndSave(int traderId, Connection conn) throws SQLException {
        BigDecimal newScore = calculateScore(traderId, conn);
        boolean hasApprovedComplaints = false;
        String checkComp = "SELECT 1 FROM complaints WHERE reported_id = ? AND status = 'APPROVED' LIMIT 1";
        try (PreparedStatement ps = conn.prepareStatement(checkComp)) {
            ps.setInt(1, traderId);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) hasApprovedComplaints = true;
            }
        }

        boolean verifiedBadge = !hasApprovedComplaints && newScore.compareTo(new BigDecimal("7.00")) >= 0;

        String updateSql = "UPDATE traders SET trust_score = ?, is_verified_badge = ? WHERE trader_id = ?";
        try (PreparedStatement ps = conn.prepareStatement(updateSql)) {
            ps.setBigDecimal(1, newScore);
            ps.setBoolean(2, verifiedBadge);
            ps.setInt(3, traderId);
            ps.executeUpdate();
        }
    }
}
