package com.tradetrust.dao;

import com.tradetrust.model.Trader;
import com.tradetrust.util.DBConnection;

import java.math.BigDecimal;
import java.sql.*;
import java.util.ArrayList;
import java.util.List;

public class TraderDAO {

    public Trader findById(int traderId) throws SQLException {
        String sql = "SELECT * FROM traders WHERE trader_id = ?";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, traderId);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    return mapRow(rs);
                }
            }
        }
        return null;
    }

    public Trader findByPhone(String phone) throws SQLException {
        return findByPhoneOrIdentifier(phone);
    }

    public Trader findByPhoneOrIdentifier(String input) throws SQLException {
        if (input == null || input.isBlank()) return null;
        String sql = "SELECT * FROM traders WHERE phone = ? OR business_name = ? OR name = ?";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            String val = input.trim();
            ps.setString(1, val);
            ps.setString(2, val);
            ps.setString(3, val);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    return mapRow(rs);
                }
            }
        }
        return null;
    }

    public List<Trader> findAll(String search, String cluster, String sector, String role, String sort, int viewerId) throws SQLException {
        StringBuilder sql = new StringBuilder("SELECT * FROM traders WHERE 1=1 ");
        List<Object> params = new ArrayList<>();

        if (search != null && !search.trim().isEmpty()) {
            sql.append("AND (name LIKE ? OR business_name LIKE ? OR business_desc LIKE ?) ");
            String term = "%" + search.trim() + "%";
            params.add(term);
            params.add(term);
            params.add(term);
        }
        if (cluster != null && !cluster.trim().isEmpty() && !cluster.equalsIgnoreCase("all")) {
            sql.append("AND cluster = ? ");
            params.add(cluster.trim());
        }
        if (sector != null && !sector.trim().isEmpty() && !sector.equalsIgnoreCase("all")) {
            sql.append("AND sector = ? ");
            params.add(sector.trim());
        }
        if (role != null && !role.trim().isEmpty() && !role.equalsIgnoreCase("all")) {
            sql.append("AND role = ? ");
            params.add(role.trim().toUpperCase());
        }

        if ("score_asc".equalsIgnoreCase(sort)) {
            sql.append("ORDER BY trust_score ASC ");
        } else if ("newest".equalsIgnoreCase(sort)) {
            sql.append("ORDER BY created_at DESC ");
        } else {
            // Default: highest score first
            sql.append("ORDER BY trust_score DESC, created_at DESC ");
        }

        List<Trader> list = new ArrayList<>();
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql.toString())) {
            for (int i = 0; i < params.size(); i++) {
                ps.setObject(i + 1, params.get(i));
            }
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    Trader t = mapRow(rs);
                    if (viewerId > 0 && viewerId != t.getTraderId()) {
                        t.setMutualConnections(getMutualCount(conn, viewerId, t.getTraderId()));
                        t.setConnectionStatus(getConnStatus(conn, viewerId, t.getTraderId()));
                    }
                    list.add(t);
                }
            }
        }
        return list;
    }

    public Trader create(Trader trader) throws SQLException {
        String sql = "INSERT INTO traders (name, phone, business_name, business_desc, role, cluster, sector, photo_path, password_hash, trust_score, is_verified_badge) " +
                     "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {
            ps.setString(1, trader.getName());
            ps.setString(2, trader.getPhone());
            ps.setString(3, trader.getBusinessName());
            ps.setString(4, trader.getBusinessDesc());
            ps.setString(5, trader.getRole());
            ps.setString(6, trader.getCluster());
            ps.setString(7, trader.getSector());
            ps.setString(8, trader.getPhotoPath());
            ps.setString(9, trader.getPasswordHash());
            ps.setBigDecimal(10, trader.getTrustScore() != null ? trader.getTrustScore() : new java.math.BigDecimal("10.00"));
            ps.setBoolean(11, trader.isVerifiedBadge());
            ps.executeUpdate();
            try (ResultSet generatedKeys = ps.getGeneratedKeys()) {
                if (generatedKeys.next()) {
                    trader.setTraderId(generatedKeys.getInt(1));
                }
            }
        }
        return trader;
    }

    public boolean update(Trader trader) throws SQLException {
        String sql = "UPDATE traders SET name = ?, business_name = ?, business_desc = ?, role = ?, cluster = ?, sector = ?, photo_path = ? " +
                     "WHERE trader_id = ?";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, trader.getName());
            ps.setString(2, trader.getBusinessName());
            ps.setString(3, trader.getBusinessDesc());
            ps.setString(4, trader.getRole());
            ps.setString(5, trader.getCluster());
            ps.setString(6, trader.getSector());
            ps.setString(7, trader.getPhotoPath());
            ps.setInt(8, trader.getTraderId());
            return ps.executeUpdate() > 0;
        }
    }

    public boolean updatePassword(int traderId, String newPasswordHash) throws SQLException {
        String sql = "UPDATE traders SET password_hash = ? WHERE trader_id = ?";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, newPasswordHash);
            ps.setInt(2, traderId);
            return ps.executeUpdate() > 0;
        }
    }

    public boolean freezeScore(int traderId, boolean freeze) throws SQLException {
        String sql;
        if (freeze) {
            sql = "UPDATE traders SET score_frozen = TRUE, score_before_freeze = trust_score WHERE trader_id = ?";
        } else {
            sql = "UPDATE traders SET score_frozen = FALSE, score_before_freeze = NULL WHERE trader_id = ?";
        }
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, traderId);
            return ps.executeUpdate() > 0;
        }
    }

    public boolean updateScore(int traderId, BigDecimal newScore) throws SQLException {
        String sql = "UPDATE traders SET trust_score = ?, score_frozen = FALSE, score_before_freeze = NULL WHERE trader_id = ?";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setBigDecimal(1, newScore);
            ps.setInt(2, traderId);
            return ps.executeUpdate() > 0;
        }
    }

    public int getMutualCount(Connection conn, int trader1, int trader2) {
        String sql = "SELECT COUNT(DISTINCT c1_other) FROM (" +
                     "  SELECT CASE WHEN requester_id = ? THEN receiver_id ELSE requester_id END AS c1_other " +
                     "  FROM connections WHERE (requester_id = ? OR receiver_id = ?) AND status = 'ACCEPTED'" +
                     ") AS t1 JOIN (" +
                     "  SELECT CASE WHEN requester_id = ? THEN receiver_id ELSE requester_id END AS c2_other " +
                     "  FROM connections WHERE (requester_id = ? OR receiver_id = ?) AND status = 'ACCEPTED'" +
                     ") AS t2 ON t1.c1_other = t2.c2_other";
        try (PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, trader1);
            ps.setInt(2, trader1);
            ps.setInt(3, trader1);
            ps.setInt(4, trader2);
            ps.setInt(5, trader2);
            ps.setInt(6, trader2);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) return rs.getInt(1);
            }
        } catch (Exception ignored) {}
        return 0;
    }

    public String getConnStatus(Connection conn, int viewerId, int targetId) {
        String sql = "SELECT status, requester_id FROM connections WHERE (requester_id = ? AND receiver_id = ?) OR (requester_id = ? AND receiver_id = ?)";
        try (PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, viewerId);
            ps.setInt(2, targetId);
            ps.setInt(3, targetId);
            ps.setInt(4, viewerId);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    String st = rs.getString("status");
                    if ("ACCEPTED".equalsIgnoreCase(st)) return "connected";
                    int req = rs.getInt("requester_id");
                    return req == viewerId ? "pending_sent" : "pending_received";
                }
            }
        } catch (Exception ignored) {}
        return "not_connected";
    }

    private Trader mapRow(ResultSet rs) throws SQLException {
        Trader t = new Trader();
        t.setTraderId(rs.getInt("trader_id"));
        t.setName(rs.getString("name"));
        t.setPhone(rs.getString("phone"));
        t.setBusinessName(rs.getString("business_name"));
        t.setBusinessDesc(rs.getString("business_desc"));
        t.setRole(rs.getString("role"));
        t.setCluster(rs.getString("cluster"));
        t.setSector(rs.getString("sector"));
        t.setPhotoPath(rs.getString("photo_path"));
        t.setPasswordHash(rs.getString("password_hash"));
        t.setTrustScore(rs.getBigDecimal("trust_score"));
        t.setScoreFrozen(rs.getBoolean("score_frozen"));
        t.setScoreBeforeFreeze(rs.getBigDecimal("score_before_freeze"));
        t.setIsVerifiedBadge(rs.getBoolean("is_verified_badge"));
        t.setCreatedAt(rs.getTimestamp("created_at"));
        return t;
    }
}
