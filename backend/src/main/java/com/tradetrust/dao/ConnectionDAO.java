package com.tradetrust.dao;

import com.tradetrust.model.Connection;
import com.tradetrust.model.Trader;
import com.tradetrust.util.DBConnection;

import java.sql.*;
import java.util.ArrayList;
import java.util.List;

public class ConnectionDAO {

    public boolean sendRequest(int requesterId, int receiverId) throws SQLException {
        if (requesterId == receiverId) return false;
        String sql = "INSERT INTO connections (requester_id, receiver_id, status) VALUES (?, ?, 'PENDING') " +
                     "ON DUPLICATE KEY UPDATE status = IF(status = 'DECLINED', 'PENDING', status)";
        try (java.sql.Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, requesterId);
            ps.setInt(2, receiverId);
            return ps.executeUpdate() > 0;
        }
    }

    public boolean acceptRequest(int connectionId, int receiverId) throws SQLException {
        String sql = "UPDATE connections SET status = 'ACCEPTED' WHERE connection_id = ? AND receiver_id = ?";
        try (java.sql.Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, connectionId);
            ps.setInt(2, receiverId);
            return ps.executeUpdate() > 0;
        }
    }

    public boolean declineRequest(int connectionId, int receiverId) throws SQLException {
        String sql = "UPDATE connections SET status = 'DECLINED' WHERE connection_id = ? AND receiver_id = ?";
        try (java.sql.Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, connectionId);
            ps.setInt(2, receiverId);
            return ps.executeUpdate() > 0;
        }
    }

    public boolean removeConnection(int traderId1, int traderId2) throws SQLException {
        String sql = "DELETE FROM connections WHERE (requester_id = ? AND receiver_id = ?) OR (requester_id = ? AND receiver_id = ?)";
        try (java.sql.Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, traderId1);
            ps.setInt(2, traderId2);
            ps.setInt(3, traderId2);
            ps.setInt(4, traderId1);
            return ps.executeUpdate() > 0;
        }
    }

    public List<Connection> getConnectionsForTrader(int traderId, String status) throws SQLException {
        String sql;
        if ("PENDING_INCOMING".equalsIgnoreCase(status)) {
            sql = "SELECT c.*, t.* FROM connections c " +
                  "JOIN traders t ON c.requester_id = t.trader_id " +
                  "WHERE c.receiver_id = ? AND c.status = 'PENDING' ORDER BY c.created_at DESC";
        } else if ("PENDING_OUTGOING".equalsIgnoreCase(status)) {
            sql = "SELECT c.*, t.* FROM connections c " +
                  "JOIN traders t ON c.receiver_id = t.trader_id " +
                  "WHERE c.requester_id = ? AND c.status = 'PENDING' ORDER BY c.created_at DESC";
        } else {
            // Default: ACCEPTED (both requester and receiver)
            sql = "SELECT c.*, t.* FROM connections c " +
                  "JOIN traders t ON (IF(c.requester_id = ?, c.receiver_id, c.requester_id) = t.trader_id) " +
                  "WHERE (c.requester_id = ? OR c.receiver_id = ?) AND c.status = 'ACCEPTED' ORDER BY c.created_at DESC";
        }

        List<Connection> list = new ArrayList<>();
        try (java.sql.Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            if ("PENDING_INCOMING".equalsIgnoreCase(status) || "PENDING_OUTGOING".equalsIgnoreCase(status)) {
                ps.setInt(1, traderId);
            } else {
                ps.setInt(1, traderId);
                ps.setInt(2, traderId);
                ps.setInt(3, traderId);
            }
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    Connection c = new Connection();
                    c.setConnectionId(rs.getInt("connection_id"));
                    c.setRequesterId(rs.getInt("requester_id"));
                    c.setReceiverId(rs.getInt("receiver_id"));
                    c.setStatus(rs.getString("status"));
                    c.setCreatedAt(rs.getTimestamp("created_at"));

                    Trader other = new Trader();
                    other.setTraderId(rs.getInt("trader_id"));
                    other.setName(rs.getString("name"));
                    other.setPhone(rs.getString("phone"));
                    other.setBusinessName(rs.getString("business_name"));
                    other.setBusinessDesc(rs.getString("business_desc"));
                    other.setRole(rs.getString("role"));
                    other.setCluster(rs.getString("cluster"));
                    other.setSector(rs.getString("sector"));
                    other.setPhotoPath(rs.getString("photo_path"));
                    other.setTrustScore(rs.getBigDecimal("trust_score"));
                    other.setIsVerifiedBadge(rs.getBoolean("is_verified_badge"));
                    c.setOtherTrader(other);

                    list.add(c);
                }
            }
        }
        return list;
    }
}
