package com.tradetrust.dao;

import com.tradetrust.DBConnection;
import com.tradetrust.model.Session;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;

/** Admin accounts and login sessions. */
public class AuthDAO {

    /** Returns {adminId, passwordHash} for the username, or null if there is no such admin. */
    public String[] findAdmin(String username) throws SQLException {
        String sql = "SELECT admin_id, password_hash FROM admins WHERE LOWER(username) = LOWER(?)";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, username);
            try (ResultSet rs = ps.executeQuery()) {
                return rs.next() ? new String[]{rs.getString(1), rs.getString(2)} : null;
            }
        }
    }

    public String findAdminName(int adminId) throws SQLException {
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement("SELECT username FROM admins WHERE admin_id = ?")) {
            ps.setInt(1, adminId);
            try (ResultSet rs = ps.executeQuery()) {
                return rs.next() ? rs.getString(1) : null;
            }
        }
    }

    public void createSession(String token, int userId, String role) throws SQLException {
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement("INSERT INTO sessions (token, user_id, role) VALUES (?, ?, ?)")) {
            ps.setString(1, token);
            ps.setInt(2, userId);
            ps.setString(3, role);
            ps.executeUpdate();
        }
    }

    public Session findSession(String token) throws SQLException {
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement("SELECT user_id, role FROM sessions WHERE token = ? AND created_at >= NOW() - INTERVAL 7 DAY")) {
            ps.setString(1, token);
            try (ResultSet rs = ps.executeQuery()) {
                if (!rs.next()) {
                    return null;
                }
                Session s = new Session();
                s.token = token;
                s.userId = rs.getInt("user_id");
                s.role = rs.getString("role");
                return s;
            }
        }
    }

    public void deleteSession(String token) throws SQLException {
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement("DELETE FROM sessions WHERE token = ?")) {
            ps.setString(1, token);
            ps.executeUpdate();
        }
    }

    public void deleteSessionsForUser(int userId, String role) throws SQLException {
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement("DELETE FROM sessions WHERE user_id = ? AND role = ?")) {
            ps.setInt(1, userId);
            ps.setString(2, role);
            ps.executeUpdate();
        }
    }
}
