package com.tradetrust.model;

import java.math.BigDecimal;
import java.sql.Date;
import java.sql.Timestamp;
import java.util.List;

public class Complaint {
    private int complaintId;
    private int reporterId;
    private int reportedId;
    private String description;
    private BigDecimal amountDisputed;
    private Date incidentDate;
    private String proofPath;
    private String status; // ROUND_1_PENDING, ROUND_1_COUNTER_FILED, ROUND_2_PENDING, ROUND_2_COUNTER_FILED, ESCALATED_TO_ADMIN, APPROVED, REJECTED
    private Timestamp createdAt;
    private Timestamp updatedAt;

    // Transient join helper fields
    private String reporterName;
    private String reporterBusinessName;
    private String reportedName;
    private String reportedBusinessName;
    private List<ComplaintRound> rounds;

    public Complaint() {}

    public int getComplaintId() { return complaintId; }
    public void setComplaintId(int complaintId) { this.complaintId = complaintId; }

    public int getReporterId() { return reporterId; }
    public void setReporterId(int reporterId) { this.reporterId = reporterId; }

    public int getReportedId() { return reportedId; }
    public void setReportedId(int reportedId) { this.reportedId = reportedId; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public BigDecimal getAmountDisputed() { return amountDisputed; }
    public void setAmountDisputed(BigDecimal amountDisputed) { this.amountDisputed = amountDisputed; }

    public Date getIncidentDate() { return incidentDate; }
    public void setIncidentDate(Date incidentDate) { this.incidentDate = incidentDate; }

    public String getProofPath() { return proofPath; }
    public void setProofPath(String proofPath) { this.proofPath = proofPath; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public Timestamp getCreatedAt() { return createdAt; }
    public void setCreatedAt(Timestamp createdAt) { this.createdAt = createdAt; }

    public Timestamp getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Timestamp updatedAt) { this.updatedAt = updatedAt; }

    public String getReporterName() { return reporterName; }
    public void setReporterName(String reporterName) { this.reporterName = reporterName; }

    public String getReporterBusinessName() { return reporterBusinessName; }
    public void setReporterBusinessName(String reporterBusinessName) { this.reporterBusinessName = reporterBusinessName; }

    public String getReportedName() { return reportedName; }
    public void setReportedName(String reportedName) { this.reportedName = reportedName; }

    public String getReportedBusinessName() { return reportedBusinessName; }
    public void setReportedBusinessName(String reportedBusinessName) { this.reportedBusinessName = reportedBusinessName; }

    public List<ComplaintRound> getRounds() { return rounds; }
    public void setRounds(List<ComplaintRound> rounds) { this.rounds = rounds; }
}
