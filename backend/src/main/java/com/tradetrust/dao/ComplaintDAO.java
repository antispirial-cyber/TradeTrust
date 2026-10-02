package com.tradetrust.dao;

import com.tradetrust.model.Complaint;
import com.tradetrust.model.ComplaintRound;
import com.tradetrust.util.DBConnection;

import java.sql.*;
import java.util.ArrayList;
import java.util.List;

public class ComplaintDAO {

    public Complaint create(Complaint complaint) throws SQLException {
        String sql = "INSERT INTO complaints (reporter_id, reported_id, description, amount_disputed, incident_date, proof_path, status) " +
                     "VALUES (?, ?, ?, ?, ?, ?, ?)";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {
            ps.setInt(1, complaint.getReporterId());
            ps.setInt(2, complaint.getReportedId());
            ps.setString(3, complaint.getDescription());
            ps.setBigDecimal(4, complaint.getAmountDisputed());
            ps.setDate(5, complaint.getIncidentDate());
            ps.setString(6, complaint.getProofPath());
            ps.setString(7, complaint.getStatus() != null ? complaint.getStatus() : "ROUND_1_PENDING");
            ps.executeUpdate();
            try (ResultSet rs = ps.getGeneratedKeys()) {
                if (rs.next()) {
                    complaint.setComplaintId(rs.getInt(1));
                }
            }

            // Also record the initial complaint as Round 1 for the reporter
            addRound(conn, complaint.getComplaintId(), complaint.getReporterId(), 1, complaint.getDescription(), complaint.getProofPath());
        }
        return complaint;
    }

    public Complaint findById(int complaintId) throws SQLException {
        String sql = "SELECT c.*, " +
                     "r1.name AS reporter_name, r1.business_name AS reporter_bname, " +
                     "r2.name AS reported_name, r2.business_name AS reported_bname " +
                     "FROM complaints c " +
                     "JOIN traders r1 ON c.reporter_id = r1.trader_id " +
                     "JOIN traders r2 ON c.reported_id = r2.trader_id " +
                     "WHERE c.complaint_id = ?";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, complaintId);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    Complaint c = mapRow(rs);
                    c.setRounds(findRoundsByComplaintId(conn, complaintId));
                    return c;
                }
            }
        }
        return null;
    }

    public List<Complaint> findByTrader(int traderId) throws SQLException {
        String sql = "SELECT c.*, " +
                     "r1.name AS reporter_name, r1.business_name AS reporter_bname, " +
                     "r2.name AS reported_name, r2.business_name AS reported_bname " +
                     "FROM complaints c " +
                     "JOIN traders r1 ON c.reporter_id = r1.trader_id " +
                     "JOIN traders r2 ON c.reported_id = r2.trader_id " +
                     "WHERE c.reporter_id = ? OR c.reported_id = ? " +
                     "ORDER BY c.created_at DESC";
        List<Complaint> list = new ArrayList<>();
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, traderId);
            ps.setInt(2, traderId);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    Complaint c = mapRow(rs);
                    c.setRounds(findRoundsByComplaintId(conn, c.getComplaintId()));
                    list.add(c);
                }
            }
        }
        return list;
    }

    public List<Complaint> findAll(String statusFilter) throws SQLException {
        StringBuilder sql = new StringBuilder(
                "SELECT c.*, " +
                "r1.name AS reporter_name, r1.business_name AS reporter_bname, " +
                "r2.name AS reported_name, r2.business_name AS reported_bname " +
                "FROM complaints c " +
                "JOIN traders r1 ON c.reporter_id = r1.trader_id " +
                "JOIN traders r2 ON c.reported_id = r2.trader_id "
        );
        if (statusFilter != null && !statusFilter.trim().isEmpty() && !statusFilter.equalsIgnoreCase("ALL")) {
            sql.append("WHERE c.status = ? ");
        }
        sql.append("ORDER BY c.created_at DESC");

        List<Complaint> list = new ArrayList<>();
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql.toString())) {
            if (statusFilter != null && !statusFilter.trim().isEmpty() && !statusFilter.equalsIgnoreCase("ALL")) {
                ps.setString(1, statusFilter.trim());
            }
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    Complaint c = mapRow(rs);
                    c.setRounds(findRoundsByComplaintId(conn, c.getComplaintId()));
                    list.add(c);
                }
            }
        }
        return list;
    }

    public boolean updateStatus(int complaintId, String status) throws SQLException {
        String sql = "UPDATE complaints SET status = ? WHERE complaint_id = ?";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, status);
            ps.setInt(2, complaintId);
            return ps.executeUpdate() > 0;
        }
    }

    public void addRound(int complaintId, int filedBy, int roundNumber, String description, String proofPath) throws SQLException {
        try (Connection conn = DBConnection.getConnection()) {
            addRound(conn, complaintId, filedBy, roundNumber, description, proofPath);
        }
    }

    private void addRound(Connection conn, int complaintId, int filedBy, int roundNumber, String description, String proofPath) throws SQLException {
        String sql = "INSERT INTO complaint_rounds (complaint_id, filed_by, round_number, description, proof_path) VALUES (?, ?, ?, ?, ?)";
        try (PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, complaintId);
            ps.setInt(2, filedBy);
            ps.setInt(3, roundNumber);
            ps.setString(4, description);
            ps.setString(5, proofPath);
            ps.executeUpdate();
        }
    }

    private List<ComplaintRound> findRoundsByComplaintId(Connection conn, int complaintId) throws SQLException {
        String sql = "SELECT cr.*, t.name AS filed_by_name FROM complaint_rounds cr " +
                     "JOIN traders t ON cr.filed_by = t.trader_id " +
                     "WHERE cr.complaint_id = ? ORDER BY cr.round_number ASC, cr.filed_at ASC";
        List<ComplaintRound> rounds = new ArrayList<>();
        try (PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, complaintId);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    ComplaintRound r = new ComplaintRound();
                    r.setRoundId(rs.getInt("round_id"));
                    r.setComplaintId(rs.getInt("complaint_id"));
                    r.setFiledBy(rs.getInt("filed_by"));
                    r.setRoundNumber(rs.getInt("round_number"));
                    r.setDescription(rs.getString("description"));
                    r.setProofPath(rs.getString("proof_path"));
                    r.setFiledAt(rs.getTimestamp("filed_at"));
                    r.setFiledByName(rs.getString("filed_by_name"));
                    rounds.add(r);
                }
            }
        }
        return rounds;
    }

    private Complaint mapRow(ResultSet rs) throws SQLException {
        Complaint c = new Complaint();
        c.setComplaintId(rs.getInt("complaint_id"));
        c.setReporterId(rs.getInt("reporter_id"));
        c.setReportedId(rs.getInt("reported_id"));
        c.setDescription(rs.getString("description"));
        c.setAmountDisputed(rs.getBigDecimal("amount_disputed"));
        c.setIncidentDate(rs.getDate("incident_date"));
        c.setProofPath(rs.getString("proof_path"));
        c.setStatus(rs.getString("status"));
        c.setCreatedAt(rs.getTimestamp("created_at"));
        c.setUpdatedAt(rs.getTimestamp("updated_at"));
        c.setReporterName(rs.getString("reporter_name"));
        c.setReporterBusinessName(rs.getString("reporter_bname"));
        c.setReportedName(rs.getString("reported_name"));
        c.setReportedBusinessName(rs.getString("reported_bname"));
        return c;
    }
}
