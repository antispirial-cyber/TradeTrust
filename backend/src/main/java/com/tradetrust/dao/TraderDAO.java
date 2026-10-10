package com.tradetrust.dao;

import com.tradetrust.DBConnection;
import com.tradetrust.model.Trader;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.ArrayList;
import java.util.List;

public class TraderDAO {

    public Trader findById(int traderId) throws SQLException {
        return findOne("SELECT * FROM traders WHERE trader_id = ?", String.valueOf(traderId));
    }

    public Trader findByPhone(String phone) throws SQLException {
        return findOne("SELECT * FROM traders WHERE phone = ?", phone);
    }

    /** Login name can be the phone number, the business name or the owner name. */
    public Trader findByLogin(String text) throws SQLException {
        return findOne("SELECT * FROM traders WHERE phone = ? OR LOWER(business_name) = LOWER(?) OR LOWER(name) = LOWER(?) LIMIT 1", text, text, text);
    }

    public List<Trader> search(String cluster, String sector, String role, String text) throws SQLException {
        StringBuilder sql = new StringBuilder("SELECT * FROM traders WHERE 1 = 1");
        List<String> params = new ArrayList<>();
        if (notEmpty(cluster)) {
            sql.append(" AND cluster = ?");
            params.add(cluster);
        }
        if (notEmpty(sector)) {
            sql.append(" AND sector = ?");
            params.add(sector);
        }
        if (notEmpty(role)) {
            sql.append(" AND role = ?");
            params.add(role);
        }
        if (notEmpty(text)) {
            sql.append(" AND (business_name LIKE ? OR name LIKE ? OR sector LIKE ? OR cluster LIKE ?)");
            for (int i = 0; i < 4; i++) {
                params.add("%" + text + "%");
            }
        }
        sql.append(" ORDER BY trust_score DESC, business_name");

        List<Trader> list = new ArrayList<>();
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql.toString())) {
            for (int i = 0; i < params.size(); i++) {
                ps.setString(i + 1, params.get(i));
            }
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    list.add(map(rs));
                }
            }
        }
        return list;
    }

    public int insert(Trader t) throws SQLException {
        String sql = "INSERT INTO traders (name, phone, business_name, business_desc, role, cluster, sector, password_hash) VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {
            ps.setString(1, t.name);
            ps.setString(2, t.phone);
            ps.setString(3, t.businessName);
            ps.setString(4, t.businessDesc);
            ps.setString(5, t.role);
            ps.setString(6, t.cluster);
            ps.setString(7, t.sector);
            ps.setString(8, t.passwordHash);
            ps.executeUpdate();
            try (ResultSet keys = ps.getGeneratedKeys()) {
                return keys.next() ? keys.getInt(1) : 0;
            }
        }
    }

    public void updateProfile(Trader t) throws SQLException {
        String sql = "UPDATE traders SET name = ?, phone = ?, business_name = ?, business_desc = ?, role = ?, cluster = ?, sector = ?, photo_path = ? WHERE trader_id = ?";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, t.name);
            ps.setString(2, t.phone);
            ps.setString(3, t.businessName);
            ps.setString(4, t.businessDesc);
            ps.setString(5, t.role);
            ps.setString(6, t.cluster);
            ps.setString(7, t.sector);
            ps.setString(8, t.photoPath);
            ps.setInt(9, t.traderId);
            ps.executeUpdate();
        }
    }

    public void updateSettings(int traderId, String accentColor, String themeMode) throws SQLException {
        String sql = "UPDATE traders SET accent_color = ?, theme_mode = ? WHERE trader_id = ?";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, accentColor);
            ps.setString(2, themeMode);
            ps.setInt(3, traderId);
            ps.executeUpdate();
        }
    }

    public void updatePassword(int traderId, String passwordHash) throws SQLException {
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement("UPDATE traders SET password_hash = ? WHERE trader_id = ?")) {
            ps.setString(1, passwordHash);
            ps.setInt(2, traderId);
            ps.executeUpdate();
        }
    }

    // ---- Admin actions ----

    public void setScore(int traderId, double score) throws SQLException {
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement("UPDATE traders SET trust_score = ? WHERE trader_id = ?")) {
            ps.setDouble(1, score);
            ps.setInt(2, traderId);
            ps.executeUpdate();
        }
    }

    public void setFrozen(int traderId, boolean frozen) throws SQLException {
        String sql = frozen
                ? "UPDATE traders SET score_frozen = TRUE, score_before_freeze = trust_score WHERE trader_id = ?"
                : "UPDATE traders SET score_frozen = FALSE, score_before_freeze = NULL WHERE trader_id = ?";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, traderId);
            ps.executeUpdate();
        }
    }

    public void setVerified(int traderId, boolean verified) throws SQLException {
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement("UPDATE traders SET is_verified_badge = ? WHERE trader_id = ?")) {
            ps.setBoolean(1, verified);
            ps.setInt(2, traderId);
            ps.executeUpdate();
        }
    }

    /** Numbers for the admin dashboard cards: {total, frozen, average score}. */
    public double[] stats() throws SQLException {
        String sql = "SELECT COUNT(*), COALESCE(SUM(score_frozen), 0), COALESCE(AVG(trust_score), 0) FROM traders";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql);
             ResultSet rs = ps.executeQuery()) {
            rs.next();
            return new double[]{rs.getInt(1), rs.getInt(2), rs.getDouble(3)};
        }
    }

    // ---- helpers ----

    private Trader findOne(String sql, String... params) throws SQLException {
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            for (int i = 0; i < params.length; i++) {
                ps.setString(i + 1, params[i]);
            }
            try (ResultSet rs = ps.executeQuery()) {
                return rs.next() ? map(rs) : null;
            }
        }
    }

    private boolean notEmpty(String s) {
        return s != null && !s.isBlank() && !s.startsWith("All ");
    }

    private Trader map(ResultSet rs) throws SQLException {
        Trader t = new Trader();
        t.traderId = rs.getInt("trader_id");
        t.name = rs.getString("name");
        t.phone = rs.getString("phone");
        t.businessName = rs.getString("business_name");
        t.businessDesc = rs.getString("business_desc");
        t.role = rs.getString("role");
        t.cluster = rs.getString("cluster");
        t.sector = rs.getString("sector");
        t.photoPath = rs.getString("photo_path");
        t.passwordHash = rs.getString("password_hash");
        t.trustScore = rs.getDouble("trust_score");
        t.scoreFrozen = rs.getBoolean("score_frozen");
        double before = rs.getDouble("score_before_freeze");
        t.scoreBeforeFreeze = rs.wasNull() ? null : before;
        t.isVerifiedBadge = rs.getBoolean("is_verified_badge");
        t.accentColor = rs.getString("accent_color");
        t.themeMode = rs.getString("theme_mode");
        t.createdAt = rs.getString("created_at");
        return t;
    }
}
