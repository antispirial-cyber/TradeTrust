package com.tradetrust.dao;

import com.tradetrust.DBConnection;
import com.tradetrust.model.Complaint;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.ArrayList;
import java.util.List;

/**
 * All complaint rules live here.
 *
 * Status flow:  ESCALATED_TO_ADMIN -> APPROVED or REJECTED (admin decides)
 *               ESCALATED_TO_ADMIN / APPROVED / REJECTED -> RETAKE_REQUESTED (filer asks)
 *               RETAKE_REQUESTED -> RETAKE_APPROVED (complaint withdrawn, score deduction reversed)
 *                                or back to the earlier status (admin refuses)
 */
public class ComplaintDAO {

    /** Trust score points removed from a trader when a complaint is approved. */
    public static final double PENALTY = 1.50;

    private static final String DISPUTES_LINK = "/dashboard?tab=disputes";

    private static final String SELECT_JOINED =
            "SELECT c.*, r.name AS reporter_name, r.business_name AS reporter_business, r.phone AS reporter_phone, "
            + "d.name AS reported_name, d.business_name AS reported_business, d.cluster AS reported_cluster "
            + "FROM complaints c "
            + "JOIN traders r ON r.trader_id = c.reporter_id "
            + "JOIN traders d ON d.trader_id = c.reported_id ";

    /** Save a new complaint, freeze the reported trader's score and notify both sides. */
    public int file(Complaint c) throws SQLException {
        try (Connection conn = DBConnection.getConnection()) {
            conn.setAutoCommit(false);
            try {
                int id;
                String sql = "INSERT INTO complaints (reporter_id, reported_id, description, amount_disputed, incident_date, proof_path, proof_name) VALUES (?, ?, ?, ?, ?, ?, ?)";
                try (PreparedStatement ps = conn.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {
                    ps.setInt(1, c.reporterId);
                    ps.setInt(2, c.reportedId);
                    ps.setString(3, c.description);
                    ps.setDouble(4, c.amountDisputed);
                    ps.setString(5, c.incidentDate);
                    ps.setString(6, c.proofPath);
                    ps.setString(7, c.proofName);
                    ps.executeUpdate();
                    try (ResultSet keys = ps.getGeneratedKeys()) {
                        keys.next();
                        id = keys.getInt(1);
                    }
                }
                run(conn, "UPDATE traders SET score_before_freeze = trust_score, score_frozen = TRUE WHERE trader_id = ? AND score_frozen = FALSE", c.reportedId);

                String reporterBiz = businessName(conn, c.reporterId);
                String reportedBiz = businessName(conn, c.reportedId);
                NotificationDAO.add(conn, c.reportedId, "complaint_filed",
                        "A complaint was filed against your business by " + reporterBiz + ". Your trust score is frozen until the admin decides.",
                        DISPUTES_LINK, id);
                NotificationDAO.add(conn, c.reporterId, "complaint_filed",
                        "Your complaint against " + reportedBiz + " was sent to the admin for review.", DISPUTES_LINK, id);
                conn.commit();
                return id;
            } catch (SQLException e) {
                conn.rollback();
                throw e;
            }
        }
    }

    public Complaint findById(int complaintId) throws SQLException {
        List<Complaint> list = query(SELECT_JOINED + "WHERE c.complaint_id = ?", complaintId);
        return list.isEmpty() ? null : list.get(0);
    }

    /** Complaints a trader filed or that were filed against them. */
    public List<Complaint> listInvolving(int traderId) throws SQLException {
        return query(SELECT_JOINED + "WHERE c.reporter_id = ? OR c.reported_id = ? ORDER BY c.created_at DESC, c.complaint_id DESC", traderId, traderId);
    }

    public List<Complaint> listAll() throws SQLException {
        return query(SELECT_JOINED + "ORDER BY c.created_at DESC, c.complaint_id DESC");
    }

    /** Approved complaints against a trader (the public "past records"). */
    public List<Complaint> approvedAgainst(int traderId) throws SQLException {
        return query(SELECT_JOINED + "WHERE c.reported_id = ? AND c.status = 'APPROVED' ORDER BY c.resolved_at DESC", traderId);
    }

    public boolean hasActiveComplaint(int reporterId, int reportedId) throws SQLException {
        String sql = "SELECT COUNT(*) FROM complaints WHERE reporter_id = ? AND reported_id = ? AND status IN ('ESCALATED_TO_ADMIN', 'RETAKE_REQUESTED')";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, reporterId);
            ps.setInt(2, reportedId);
            try (ResultSet rs = ps.executeQuery()) {
                return rs.next() && rs.getInt(1) > 0;
            }
        }
    }

    /** The filer asks the admin to withdraw the complaint. Nothing else changes until the admin approves. */
    public boolean requestRetake(int complaintId, int reporterId) throws SQLException {
        try (Connection conn = DBConnection.getConnection()) {
            Complaint c = findOwned(conn, complaintId, reporterId);
            if (c == null || !(c.status.equals("ESCALATED_TO_ADMIN") || c.status.equals("APPROVED") || c.status.equals("REJECTED"))) {
                return false;
            }
            int updated;
            try (PreparedStatement ps = conn.prepareStatement(
                    "UPDATE complaints SET status_before_retake = status, status = 'RETAKE_REQUESTED' WHERE complaint_id = ? AND status IN ('ESCALATED_TO_ADMIN', 'APPROVED', 'REJECTED')")) {
                ps.setInt(1, complaintId);
                updated = ps.executeUpdate();
            }
            if (updated == 0) {
                return false;
            }
            NotificationDAO.add(conn, reporterId, "retake_requested",
                    "Your retake request for the complaint against " + c.reportedBusiness + " was sent to the admin.", DISPUTES_LINK, complaintId);
            return true;
        }
    }

    /**
     * Admin decision. decision is one of APPROVED, REJECTED, RETAKE_APPROVED, RETAKE_REJECTED.
     * Returns an error message, or null when it worked.
     */
    public String resolve(int complaintId, String decision) throws SQLException {
        try (Connection conn = DBConnection.getConnection()) {
            conn.setAutoCommit(false);
            try {
                Complaint c = findOwned(conn, complaintId, 0);
                if (c == null) {
                    return "Complaint not found";
                }
                boolean isVerdict = decision.equals("APPROVED") || decision.equals("REJECTED");
                boolean isRetake = decision.equals("RETAKE_APPROVED") || decision.equals("RETAKE_REJECTED");
                if (isVerdict && !c.status.equals("ESCALATED_TO_ADMIN")) {
                    return "This complaint has already been decided";
                }
                if (isRetake && !c.status.equals("RETAKE_REQUESTED")) {
                    return "There is no retake request to answer";
                }
                if (!isVerdict && !isRetake) {
                    return "Unknown decision";
                }

                String reporterMsg;
                String reportedMsg = null;
                if (decision.equals("APPROVED")) {
                    double before = score(conn, c.reportedId);
                    double deduction = Math.min(PENALTY, before);
                    int updated;
                    try (PreparedStatement ps = conn.prepareStatement(
                            "UPDATE complaints SET status = 'APPROVED', score_deduction = ?, resolved_at = NOW() WHERE complaint_id = ? AND status = 'ESCALATED_TO_ADMIN'")) {
                        ps.setDouble(1, deduction);
                        ps.setInt(2, complaintId);
                        updated = ps.executeUpdate();
                    }
                    if (updated == 0) {
                        conn.rollback();
                        return "This complaint has already been decided or updated";
                    }
                    run(conn, "UPDATE traders SET trust_score = trust_score - ? WHERE trader_id = ?", deduction, c.reportedId);
                    reporterMsg = "The admin upheld your complaint against " + c.reportedBusiness + ".";
                    reportedMsg = "The admin upheld a complaint against your business. Your trust score was reduced by " + String.format(java.util.Locale.US, "%.2f", deduction) + ".";
                } else if (decision.equals("REJECTED")) {
                    int updated;
                    try (PreparedStatement ps = conn.prepareStatement(
                            "UPDATE complaints SET status = 'REJECTED', resolved_at = NOW() WHERE complaint_id = ? AND status = 'ESCALATED_TO_ADMIN'")) {
                        ps.setInt(1, complaintId);
                        updated = ps.executeUpdate();
                    }
                    if (updated == 0) {
                        conn.rollback();
                        return "This complaint has already been decided or updated";
                    }
                    reporterMsg = "The admin rejected your complaint against " + c.reportedBusiness + ".";
                    reportedMsg = "The admin rejected a complaint filed against your business.";
                } else if (decision.equals("RETAKE_APPROVED")) {
                    double refund = deductionOf(conn, complaintId);
                    int updated;
                    try (PreparedStatement ps = conn.prepareStatement(
                            "UPDATE complaints SET status = 'RETAKE_APPROVED', score_deduction = 0, resolved_at = NOW() WHERE complaint_id = ? AND status = 'RETAKE_REQUESTED'")) {
                        ps.setInt(1, complaintId);
                        updated = ps.executeUpdate();
                    }
                    if (updated == 0) {
                        conn.rollback();
                        return "There is no pending retake request for this complaint";
                    }
                    run(conn, "UPDATE traders SET trust_score = LEAST(10, trust_score + ?) WHERE trader_id = ?", refund, c.reportedId);
                    reporterMsg = "The admin approved your retake. The complaint against " + c.reportedBusiness + " is withdrawn.";
                    reportedMsg = "A complaint against your business was withdrawn by the admin."
                            + (refund > 0 ? " Your trust score was restored by " + String.format(java.util.Locale.US, "%.2f", refund) + "." : "");
                } else {
                    int updated;
                    try (PreparedStatement ps = conn.prepareStatement(
                            "UPDATE complaints SET status = status_before_retake, status_before_retake = NULL WHERE complaint_id = ? AND status = 'RETAKE_REQUESTED'")) {
                        ps.setInt(1, complaintId);
                        updated = ps.executeUpdate();
                    }
                    if (updated == 0) {
                        conn.rollback();
                        return "There is no pending retake request for this complaint";
                    }
                    reporterMsg = "The admin declined your retake request for the complaint against " + c.reportedBusiness + ".";
                }

                unfreezeIfNoOpenComplaints(conn, c.reportedId);

                NotificationDAO.add(conn, c.reporterId, "admin_verdict", reporterMsg, DISPUTES_LINK, complaintId);
                if (reportedMsg != null) {
                    NotificationDAO.add(conn, c.reportedId, "admin_verdict", reportedMsg, DISPUTES_LINK, complaintId);
                }
                conn.commit();
                return null;
            } catch (SQLException e) {
                conn.rollback();
                throw e;
            }
        }
    }

    /** Complaints waiting for the admin: new ones and retake requests. */
    public int countPending() throws SQLException {
        return scalarInt("SELECT COUNT(*) FROM complaints WHERE status IN ('ESCALATED_TO_ADMIN', 'RETAKE_REQUESTED')");
    }

    public double totalDisputedAmount() throws SQLException {
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(
                     "SELECT COALESCE(SUM(amount_disputed), 0) FROM complaints WHERE status IN ('ESCALATED_TO_ADMIN', 'RETAKE_REQUESTED')");
             ResultSet rs = ps.executeQuery()) {
            rs.next();
            return rs.getDouble(1);
        }
    }

    // ---- helpers ----

    private void unfreezeIfNoOpenComplaints(Connection conn, int traderId) throws SQLException {
        int open;
        try (PreparedStatement ps = conn.prepareStatement(
                "SELECT COUNT(*) FROM complaints WHERE reported_id = ? AND status IN ('ESCALATED_TO_ADMIN', 'RETAKE_REQUESTED')")) {
            ps.setInt(1, traderId);
            try (ResultSet rs = ps.executeQuery()) {
                rs.next();
                open = rs.getInt(1);
            }
        }
        if (open == 0) {
            run(conn, "UPDATE traders SET score_frozen = FALSE, score_before_freeze = NULL WHERE trader_id = ?", traderId);
        }
    }

    /** Loads a complaint; when reporterId is not 0 it must belong to that filer. */
    private Complaint findOwned(Connection conn, int complaintId, int reporterId) throws SQLException {
        String sql = SELECT_JOINED + "WHERE c.complaint_id = ?" + (reporterId != 0 ? " AND c.reporter_id = ?" : "");
        try (PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, complaintId);
            if (reporterId != 0) {
                ps.setInt(2, reporterId);
            }
            try (ResultSet rs = ps.executeQuery()) {
                return rs.next() ? map(rs) : null;
            }
        }
    }

    private double score(Connection conn, int traderId) throws SQLException {
        try (PreparedStatement ps = conn.prepareStatement("SELECT trust_score FROM traders WHERE trader_id = ?")) {
            ps.setInt(1, traderId);
            try (ResultSet rs = ps.executeQuery()) {
                return rs.next() ? rs.getDouble(1) : 0;
            }
        }
    }

    private double deductionOf(Connection conn, int complaintId) throws SQLException {
        try (PreparedStatement ps = conn.prepareStatement("SELECT score_deduction FROM complaints WHERE complaint_id = ?")) {
            ps.setInt(1, complaintId);
            try (ResultSet rs = ps.executeQuery()) {
                return rs.next() ? rs.getDouble(1) : 0;
            }
        }
    }

    private String businessName(Connection conn, int traderId) throws SQLException {
        try (PreparedStatement ps = conn.prepareStatement("SELECT business_name FROM traders WHERE trader_id = ?")) {
            ps.setInt(1, traderId);
            try (ResultSet rs = ps.executeQuery()) {
                return rs.next() ? rs.getString(1) : "a trader";
            }
        }
    }

    private void run(Connection conn, String sql, Object... params) throws SQLException {
        try (PreparedStatement ps = conn.prepareStatement(sql)) {
            for (int i = 0; i < params.length; i++) {
                ps.setObject(i + 1, params[i]);
            }
            ps.executeUpdate();
        }
    }

    private int scalarInt(String sql) throws SQLException {
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql);
             ResultSet rs = ps.executeQuery()) {
            rs.next();
            return rs.getInt(1);
        }
    }

    private List<Complaint> query(String sql, Object... params) throws SQLException {
        List<Complaint> list = new ArrayList<>();
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            for (int i = 0; i < params.length; i++) {
                ps.setObject(i + 1, params[i]);
            }
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    list.add(map(rs));
                }
            }
        }
        return list;
    }

    private Complaint map(ResultSet rs) throws SQLException {
        Complaint c = new Complaint();
        c.complaintId = rs.getInt("complaint_id");
        c.reporterId = rs.getInt("reporter_id");
        c.reporterName = rs.getString("reporter_name");
        c.reporterBusiness = rs.getString("reporter_business");
        c.reporterPhone = rs.getString("reporter_phone");
        c.reportedId = rs.getInt("reported_id");
        c.reportedName = rs.getString("reported_name");
        c.reportedBusiness = rs.getString("reported_business");
        c.reportedCluster = rs.getString("reported_cluster");
        c.description = rs.getString("description");
        c.amountDisputed = rs.getDouble("amount_disputed");
        c.incidentDate = rs.getString("incident_date");
        c.proofPath = rs.getString("proof_path");
        c.proofName = rs.getString("proof_name");
        c.status = rs.getString("status");
        c.scoreDeduction = rs.getDouble("score_deduction");
        c.resolvedAt = rs.getString("resolved_at");
        c.createdAt = rs.getString("created_at");
        return c;
    }
}
