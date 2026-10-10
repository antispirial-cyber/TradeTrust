package com.tradetrust.dao;

import com.tradetrust.DBConnection;
import com.tradetrust.model.LedgerEntry;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;

public class LedgerDAO {

    public List<LedgerEntry> listByOwner(int ownerId) throws SQLException {
        String sql = "SELECT * FROM ledger_entries WHERE owner_id = ? ORDER BY entry_date DESC, entry_id DESC";
        List<LedgerEntry> list = new ArrayList<>();
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, ownerId);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    list.add(map(rs));
                }
            }
        }
        return list;
    }

    public LedgerEntry findById(int entryId, int ownerId) throws SQLException {
        String sql = "SELECT * FROM ledger_entries WHERE entry_id = ? AND owner_id = ?";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, entryId);
            ps.setInt(2, ownerId);
            try (ResultSet rs = ps.executeQuery()) {
                return rs.next() ? map(rs) : null;
            }
        }
    }

    public int insert(LedgerEntry e) throws SQLException {
        String sql = "INSERT INTO ledger_entries (owner_id, party_name, amount, entry_type, entry_date, description, status) VALUES (?, ?, ?, ?, ?, ?, ?)";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql, java.sql.Statement.RETURN_GENERATED_KEYS)) {
            ps.setInt(1, e.ownerId);
            ps.setString(2, e.partyName);
            ps.setDouble(3, e.amount);
            ps.setString(4, e.entryType);
            ps.setString(5, e.entryDate);
            ps.setString(6, e.description);
            ps.setString(7, e.status);
            ps.executeUpdate();
            try (ResultSet keys = ps.getGeneratedKeys()) {
                return keys.next() ? keys.getInt(1) : 0;
            }
        }
    }

    public boolean update(LedgerEntry e) throws SQLException {
        String sql = "UPDATE ledger_entries SET party_name = ?, amount = ?, entry_type = ?, entry_date = ?, description = ?, status = ? WHERE entry_id = ? AND owner_id = ?";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, e.partyName);
            ps.setDouble(2, e.amount);
            ps.setString(3, e.entryType);
            ps.setString(4, e.entryDate);
            ps.setString(5, e.description);
            ps.setString(6, e.status);
            ps.setInt(7, e.entryId);
            ps.setInt(8, e.ownerId);
            return ps.executeUpdate() > 0;
        }
    }

    public boolean updateStatus(int entryId, int ownerId, String status) throws SQLException {
        String sql = "UPDATE ledger_entries SET status = ? WHERE entry_id = ? AND owner_id = ?";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, status);
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

    private LedgerEntry map(ResultSet rs) throws SQLException {
        LedgerEntry e = new LedgerEntry();
        e.entryId = rs.getInt("entry_id");
        e.ownerId = rs.getInt("owner_id");
        e.partyName = rs.getString("party_name");
        e.amount = rs.getDouble("amount");
        e.entryType = rs.getString("entry_type");
        e.entryDate = rs.getString("entry_date");
        e.description = rs.getString("description");
        e.status = rs.getString("status");
        e.createdAt = rs.getString("created_at");
        return e;
    }
}
