package com.tradetrust.dao;

import com.tradetrust.DBConnection;
import com.tradetrust.model.Trader;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

public class ConnectionDAO {

    /** Status values the frontend understands. */
    public static final String CONNECTED = "connected";
    public static final String PENDING_SENT = "pending_sent";
    public static final String PENDING_RECEIVED = "pending_received";
    public static final String NOT_CONNECTED = "not_connected";

    /**
     * Send a connection request. Everything is stored in MySQL: the request row and
     * the notification for the receiver. Returns the status the requester should now see.
     */
    public String request(int requesterId, int receiverId) throws SQLException {
        try (Connection conn = DBConnection.getConnection()) {
            Object[] existing = findPair(conn, requesterId, receiverId);
            if (existing != null) {
                int existingRequester = (int) existing[1];
                String status = (String) existing[2];
                if (status.equals("ACCEPTED")) {
                    return CONNECTED;
                }
                if (status.equals("PENDING")) {
                    return existingRequester == requesterId ? PENDING_SENT : PENDING_RECEIVED;
                }
                // DECLINED earlier: allow a fresh request from this side.
                try (PreparedStatement ps = conn.prepareStatement(
                        "UPDATE connections SET requester_id = ?, receiver_id = ?, status = 'PENDING', created_at = NOW() WHERE connection_id = ?")) {
                    ps.setInt(1, requesterId);
                    ps.setInt(2, receiverId);
                    ps.setInt(3, (int) existing[0]);
                    ps.executeUpdate();
                }
                notifyReceiver(conn, requesterId, receiverId, (int) existing[0]);
                return PENDING_SENT;
            }

            int connectionId;
            try (PreparedStatement ps = conn.prepareStatement(
                    "INSERT INTO connections (requester_id, receiver_id) VALUES (?, ?)", java.sql.Statement.RETURN_GENERATED_KEYS)) {
                ps.setInt(1, requesterId);
                ps.setInt(2, receiverId);
                ps.executeUpdate();
                try (ResultSet keys = ps.getGeneratedKeys()) {
                    keys.next();
                    connectionId = keys.getInt(1);
                }
            }
            notifyReceiver(conn, requesterId, receiverId, connectionId);
            return PENDING_SENT;
        }
    }

    /** The receiver accepts. Returns false if the request is not theirs or is no longer pending. */
    public boolean accept(int connectionId, int receiverId) throws SQLException {
        return answer(connectionId, receiverId, "ACCEPTED");
    }

    public boolean decline(int connectionId, int receiverId) throws SQLException {
        return answer(connectionId, receiverId, "DECLINED");
    }

    /** Remove an accepted connection, or cancel a request this trader sent. */
    public void remove(int traderId, int otherId) throws SQLException {
        try (Connection conn = DBConnection.getConnection()) {
            Object[] pair = findPair(conn, traderId, otherId);
            if (pair != null) {
                int connectionId = (int) pair[0];
                try (PreparedStatement delNotif = conn.prepareStatement(
                        "DELETE FROM notifications WHERE type = 'connection_request' AND ref_id = ?")) {
                    delNotif.setInt(1, connectionId);
                    delNotif.executeUpdate();
                }
            }
            String sql = "DELETE FROM connections WHERE (requester_id = ? AND receiver_id = ?) "
                    + "OR (requester_id = ? AND receiver_id = ? AND status = 'ACCEPTED')";
            try (PreparedStatement ps = conn.prepareStatement(sql)) {
                ps.setInt(1, traderId);
                ps.setInt(2, otherId);
                ps.setInt(3, otherId);
                ps.setInt(4, traderId);
                ps.executeUpdate();
            }
        }
    }

    public List<Integer> acceptedIds(int traderId) throws SQLException {
        String sql = "SELECT IF(requester_id = ?, receiver_id, requester_id) FROM connections "
                + "WHERE status = 'ACCEPTED' AND (requester_id = ? OR receiver_id = ?)";
        List<Integer> ids = new ArrayList<>();
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, traderId);
            ps.setInt(2, traderId);
            ps.setInt(3, traderId);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    ids.add(rs.getInt(1));
                }
            }
        }
        return ids;
    }

    /** Fill connectionStatus, connectionId and mutualConnections on each trader, as seen by the viewer. */
    public void annotate(List<Trader> traders, int viewerId) throws SQLException {
        Map<Integer, Set<Integer>> accepted = new HashMap<>();
        Map<Integer, Object[]> mine = new HashMap<>();
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement("SELECT connection_id, requester_id, receiver_id, status FROM connections");
             ResultSet rs = ps.executeQuery()) {
            while (rs.next()) {
                int id = rs.getInt(1);
                int a = rs.getInt(2);
                int b = rs.getInt(3);
                String status = rs.getString(4);
                if (status.equals("ACCEPTED")) {
                    accepted.computeIfAbsent(a, k -> new HashSet<>()).add(b);
                    accepted.computeIfAbsent(b, k -> new HashSet<>()).add(a);
                }
                if (a == viewerId) {
                    mine.put(b, new Object[]{id, status, true});
                } else if (b == viewerId) {
                    mine.put(a, new Object[]{id, status, false});
                }
            }
        }

        Set<Integer> myFriends = accepted.getOrDefault(viewerId, new HashSet<>());
        for (Trader t : traders) {
            t.connectionStatus = NOT_CONNECTED;
            Object[] row = mine.get(t.traderId);
            if (row != null) {
                t.connectionId = (Integer) row[0];
                String status = (String) row[1];
                boolean iSent = (Boolean) row[2];
                if (status.equals("ACCEPTED")) {
                    t.connectionStatus = CONNECTED;
                } else if (status.equals("PENDING")) {
                    t.connectionStatus = iSent ? PENDING_SENT : PENDING_RECEIVED;
                }
            }
            Set<Integer> theirs = accepted.getOrDefault(t.traderId, new HashSet<>());
            int mutual = 0;
            for (int friend : theirs) {
                if (myFriends.contains(friend)) {
                    mutual++;
                }
            }
            t.mutualConnections = mutual;
        }
    }

    // ---- helpers ----

    private boolean answer(int connectionId, int receiverId, String newStatus) throws SQLException {
        try (Connection conn = DBConnection.getConnection()) {
            int requesterId;
            try (PreparedStatement ps = conn.prepareStatement(
                    "SELECT requester_id FROM connections WHERE connection_id = ? AND receiver_id = ? AND status = 'PENDING'")) {
                ps.setInt(1, connectionId);
                ps.setInt(2, receiverId);
                try (ResultSet rs = ps.executeQuery()) {
                    if (!rs.next()) {
                        return false;
                    }
                    requesterId = rs.getInt(1);
                }
            }
            try (PreparedStatement ps = conn.prepareStatement("UPDATE connections SET status = ? WHERE connection_id = ?")) {
                ps.setString(1, newStatus);
                ps.setInt(2, connectionId);
                ps.executeUpdate();
            }
            // The request notification has been dealt with.
            try (PreparedStatement ps = conn.prepareStatement(
                    "UPDATE notifications SET is_read = TRUE WHERE type = 'connection_request' AND ref_id = ?")) {
                ps.setInt(1, connectionId);
                ps.executeUpdate();
            }
            String receiverName = nameOf(conn, receiverId);
            if (newStatus.equals("ACCEPTED")) {
                NotificationDAO.add(conn, requesterId, "connection_accepted",
                        receiverName + " accepted your connection request.", "/trader/" + receiverId, null);
            } else {
                NotificationDAO.add(conn, requesterId, "connection_declined",
                        receiverName + " declined your connection request.", "/trader/" + receiverId, null);
            }
            return true;
        }
    }

    private void notifyReceiver(Connection conn, int requesterId, int receiverId, int connectionId) throws SQLException {
        NotificationDAO.add(conn, receiverId, "connection_request",
                nameOf(conn, requesterId) + " sent you a connection request.", "/trader/" + requesterId, connectionId);
    }

    /** Finds the row between two traders in either direction: {connectionId, requesterId, status}. */
    private Object[] findPair(Connection conn, int a, int b) throws SQLException {
        String sql = "SELECT connection_id, requester_id, status FROM connections "
                + "WHERE (requester_id = ? AND receiver_id = ?) OR (requester_id = ? AND receiver_id = ?)";
        try (PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, a);
            ps.setInt(2, b);
            ps.setInt(3, b);
            ps.setInt(4, a);
            try (ResultSet rs = ps.executeQuery()) {
                return rs.next() ? new Object[]{rs.getInt(1), rs.getInt(2), rs.getString(3)} : null;
            }
        }
    }

    private String nameOf(Connection conn, int traderId) throws SQLException {
        try (PreparedStatement ps = conn.prepareStatement("SELECT business_name FROM traders WHERE trader_id = ?")) {
            ps.setInt(1, traderId);
            try (ResultSet rs = ps.executeQuery()) {
                return rs.next() ? rs.getString(1) : "A trader";
            }
        }
    }
}
