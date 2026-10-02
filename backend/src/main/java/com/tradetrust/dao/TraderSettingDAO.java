package com.tradetrust.dao;

import com.tradetrust.model.TraderSetting;
import com.tradetrust.util.DBConnection;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;

public class TraderSettingDAO {

    public TraderSetting findByTraderId(int traderId) throws SQLException {
        String sql = "SELECT * FROM trader_settings WHERE trader_id = ?";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, traderId);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    TraderSetting s = new TraderSetting();
                    s.setSettingId(rs.getInt("setting_id"));
                    s.setTraderId(rs.getInt("trader_id"));
                    s.setAccentColor(rs.getString("accent_color"));
                    s.setUpdatedAt(rs.getTimestamp("updated_at"));
                    return s;
                }
            }
        }
        return null;
    }

    public boolean saveOrUpdate(int traderId, String accentColor) throws SQLException {
        String sql = "INSERT INTO trader_settings (trader_id, accent_color) VALUES (?, ?) " +
                     "ON DUPLICATE KEY UPDATE accent_color = VALUES(accent_color)";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, traderId);
            ps.setString(2, accentColor != null ? accentColor : "#1E6FFB");
            return ps.executeUpdate() > 0;
        }
    }
}
