package com.tradetrust.dao;

import com.tradetrust.DBConnection;
import com.tradetrust.model.Notification;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;

public class NotificationDAO {

    /** Insert one notification using a connection the caller already holds (so it joins their transaction). */
    public static void add(Connection conn, int recipientId, String type, String message, String linkRef, Integer refId) throws SQLException {
        String sql = "INSERT INTO notifications (recipient_id, type, message, link_ref, ref_id) VALUES (?, ?, ?, ?, ?)";
        try (PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, recipientId);
            ps.setString(2, type);
            ps.setString(3, message);
            ps.setString(4, linkRef);
            if (refId == null) {
                ps.setNull(5, java.sql.Types.INTEGER);
            } else {
                ps.setInt(5, refId);
            }
            ps.executeUpdate();
        }
    }

    public void create(int recipientId, String type, String message, String linkRef, Integer refId) throws SQLException {
        try (Connection conn = DBConnection.getConnection()) {
            add(conn, recipientId, type, message, linkRef, refId);
        }
    }

    public List<Notification> listFor(int traderId) throws SQLException {
        String sql = "SELECT n.*, c.status AS connection_status FROM notifications n "
                + "LEFT JOIN connections c ON n.type = 'connection_request' AND c.connection_id = n.ref_id "
                + "WHERE n.recipient_id = ? ORDER BY n.created_at DESC, n.notification_id DESC";
        List<Notification> list = new ArrayList<>();
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, traderId);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    Notification n = new Notification();
                    n.notificationId = rs.getInt("notification_id");
                    n.recipientId = rs.getInt("recipient_id");
                    n.type = rs.getString("type");
                    n.message = rs.getString("message");
                    n.linkRef = rs.getString("link_ref");
                    int ref = rs.getInt("ref_id");
                    n.refId = rs.wasNull() ? null : ref;
                    n.isRead = rs.getBoolean("is_read");
                    n.createdAt = rs.getString("created_at");
                    n.connectionStatus = rs.getString("connection_status");
                    list.add(n);
                }
            }
        }
        return list;
    }

    public void markRead(int traderId, int notificationId) throws SQLException {
        run("UPDATE notifications SET is_read = TRUE WHERE recipient_id = ? AND notification_id = ?", traderId, notificationId);
    }

    public void markAllRead(int traderId) throws SQLException {
        run("UPDATE notifications SET is_read = TRUE WHERE recipient_id = ?", traderId, null);
    }

    public void clearAll(int traderId) throws SQLException {
        run("DELETE FROM notifications WHERE recipient_id = ?", traderId, null);
    }

    /** Admin circular: one notification for every trader (or only the traders of one cluster). Returns how many were sent. */
    public int broadcast(String cluster, String message) throws SQLException {
        String sql = "INSERT INTO notifications (recipient_id, type, message, link_ref) "
                + "SELECT trader_id, 'admin_circular', ?, '/notifications' FROM traders";
        boolean oneCluster = cluster != null && !cluster.isBlank() && !cluster.equals("All Clusters");
        if (oneCluster) {
            sql += " WHERE cluster = ?";
        }
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, message);
            if (oneCluster) {
                ps.setString(2, cluster);
            }
            return ps.executeUpdate();
        }
    }

    private void run(String sql, int traderId, Integer notificationId) throws SQLException {
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, traderId);
            if (notificationId != null) {
                ps.setInt(2, notificationId);
            }
            ps.executeUpdate();
        }
    }
}
