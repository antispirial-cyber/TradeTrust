package com.tradetrust.dao;

import com.tradetrust.model.LedgerEntry;
import com.tradetrust.util.DBConnection;

import java.math.BigDecimal;
import java.sql.*;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class LedgerDAO {

    public LedgerEntry create(LedgerEntry entry) throws SQLException {
        String sql = "INSERT INTO ledger_entries (owner_id, party_name, amount, entry_type, entry_date, description, status) " +
                     "VALUES (?, ?, ?, ?, ?, ?, ?)";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {
            ps.setInt(1, entry.getOwnerId());
            ps.setString(2, entry.getPartyName());
            ps.setBigDecimal(3, entry.getAmount());
            ps.setString(4, entry.getEntryType());
            ps.setDate(5, entry.getEntryDate());
            ps.setString(6, entry.getDescription());
            ps.setString(7, entry.getStatus() != null ? entry.getStatus() : "PENDING");
            ps.executeUpdate();
            try (ResultSet rs = ps.getGeneratedKeys()) {
                if (rs.next()) {
                    entry.setEntryId(rs.getInt(1));
                }
            }
        }
        return entry;
    }

    public List<LedgerEntry> findByOwnerId(int ownerId) throws SQLException {
        String sql = "SELECT * FROM ledger_entries WHERE owner_id = ? ORDER BY entry_date DESC, created_at DESC";
        List<LedgerEntry> list = new ArrayList<>();
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, ownerId);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    list.add(mapRow(rs));
                }
            }
        }
        return list;
    }

    public LedgerEntry findById(int entryId) throws SQLException {
        String sql = "SELECT * FROM ledger_entries WHERE entry_id = ?";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, entryId);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    return mapRow(rs);
                }
            }
        }
        return null;
    }

    public boolean updateStatus(int entryId, int ownerId, String newStatus) throws SQLException {
        String sql = "UPDATE ledger_entries SET status = ? WHERE entry_id = ? AND owner_id = ?";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, newStatus);
            ps.setInt(2, entryId);
            ps.setInt(3, ownerId);
            return ps.executeUpdate() > 0;
        }
    }

    public boolean delete(int entryId, int ownerId) throws SQLException {
        String sql = "DELETE FROM ledger_entries WHERE entry_id = ? AND owner_id = ?";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, entryId);
            ps.setInt(2, ownerId);
            return ps.executeUpdate() > 0;
        }
    }

    public Map<String, Object> getSummary(int ownerId) throws SQLException {
        String sql = "SELECT entry_type, status, SUM(amount) AS total, COUNT(*) AS cnt " +
                     "FROM ledger_entries WHERE owner_id = ? GROUP BY entry_type, status";
        BigDecimal totalGiven = BigDecimal.ZERO;
        BigDecimal totalReceived = BigDecimal.ZERO;
        BigDecimal pendingGiven = BigDecimal.ZERO;
        BigDecimal pendingReceived = BigDecimal.ZERO;
        int overdueCount = 0;

        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, ownerId);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    String type = rs.getString("entry_type");
                    String st = rs.getString("status");
                    BigDecimal amt = rs.getBigDecimal("total");
                    int cnt = rs.getInt("cnt");

                    if ("CREDIT_GIVEN".equalsIgnoreCase(type)) {
                        totalGiven = totalGiven.add(amt);
                        if ("PENDING".equalsIgnoreCase(st) || "OVERDUE".equalsIgnoreCase(st)) {
                            pendingGiven = pendingGiven.add(amt);
                        }
                    } else if ("CREDIT_RECEIVED".equalsIgnoreCase(type)) {
                        totalReceived = totalReceived.add(amt);
                        if ("PENDING".equalsIgnoreCase(st) || "OVERDUE".equalsIgnoreCase(st)) {
                            pendingReceived = pendingReceived.add(amt);
                        }
                    }

                    if ("OVERDUE".equalsIgnoreCase(st)) {
                        overdueCount += cnt;
                    }
                }
            }
        }

        Map<String, Object> map = new HashMap<>();
        map.put("totalCreditGiven", totalGiven);
        map.put("totalCreditReceived", totalReceived);
        map.put("pendingCreditGiven", pendingGiven);
        map.put("pendingCreditReceived", pendingReceived);
        map.put("netBalance", totalGiven.subtract(totalReceived));
        map.put("overdueCount", overdueCount);
        return map;
    }

    private LedgerEntry mapRow(ResultSet rs) throws SQLException {
        LedgerEntry e = new LedgerEntry();
        e.setEntryId(rs.getInt("entry_id"));
        e.setOwnerId(rs.getInt("owner_id"));
        e.setPartyName(rs.getString("party_name"));
        e.setAmount(rs.getBigDecimal("amount"));
        e.setEntryType(rs.getString("entry_type"));
        e.setEntryDate(rs.getDate("entry_date"));
        e.setDescription(rs.getString("description"));
        e.setStatus(rs.getString("status"));
        e.setCreatedAt(rs.getTimestamp("created_at"));
        return e;
    }
}
