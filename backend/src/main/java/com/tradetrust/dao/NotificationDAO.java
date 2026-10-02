package com.tradetrust.dao;

import com.tradetrust.model.Notification;
import com.tradetrust.util.DBConnection;

import java.sql.*;
import java.util.ArrayList;
import java.util.List;

public class NotificationDAO {

    public Notification create(Notification notif) throws SQLException {
        String sql = "INSERT INTO notifications (recipient_id, type, message, link_ref, is_read) VALUES (?, ?, ?, ?, ?)";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {
            ps.setInt(1, notif.getRecipientId());
            ps.setString(2, notif.getType());
            ps.setString(3, notif.getMessage());
            ps.setString(4, notif.getLinkRef());
            ps.setBoolean(5, notif.isRead());
            ps.executeUpdate();
            try (ResultSet rs = ps.getGeneratedKeys()) {
                if (rs.next()) {
                    notif.setNotificationId(rs.getInt(1));
                }
            }
        }
        return notif;
    }

    public List<Notification> findByRecipient(int recipientId) throws SQLException {
        String sql = "SELECT * FROM notifications WHERE recipient_id = ? ORDER BY created_at DESC LIMIT 50";
        List<Notification> list = new ArrayList<>();
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, recipientId);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    Notification n = new Notification();
                    n.setNotificationId(rs.getInt("notification_id"));
                    n.setRecipientId(rs.getInt("recipient_id"));
                    n.setType(rs.getString("type"));
                    n.setMessage(rs.getString("message"));
                    n.setLinkRef(rs.getString("link_ref"));
                    n.setRead(rs.getBoolean("is_read"));
                    n.setCreatedAt(rs.getTimestamp("created_at"));
                    list.add(n);
                }
            }
        }
        return list;
    }

    public boolean markAsRead(int notificationId, int recipientId) throws SQLException {
        String sql = "UPDATE notifications SET is_read = TRUE WHERE notification_id = ? AND recipient_id = ?";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, notificationId);
            ps.setInt(2, recipientId);
            return ps.executeUpdate() > 0;
        }
    }

    public boolean markAllAsRead(int recipientId) throws SQLException {
        String sql = "UPDATE notifications SET is_read = TRUE WHERE recipient_id = ?";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, recipientId);
            return ps.executeUpdate() > 0;
        }
    }

    public int getUnreadCount(int recipientId) throws SQLException {
        String sql = "SELECT COUNT(*) FROM notifications WHERE recipient_id = ? AND is_read = FALSE";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, recipientId);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) return rs.getInt(1);
            }
        }
        return 0;
    }
}
