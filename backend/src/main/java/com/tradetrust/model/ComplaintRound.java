package com.tradetrust.model;

import java.sql.Timestamp;

public class ComplaintRound {
    private int roundId;
    private int complaintId;
    private int filedBy;
    private int roundNumber;
    private String description;
    private String proofPath;
    private Timestamp filedAt;

    // Transient join helper fields
    private String filedByName;

    public ComplaintRound() {}

    public int getRoundId() { return roundId; }
    public void setRoundId(int roundId) { this.roundId = roundId; }

    public int getComplaintId() { return complaintId; }
    public void setComplaintId(int complaintId) { this.complaintId = complaintId; }

    public int getFiledBy() { return filedBy; }
    public void setFiledBy(int filedBy) { this.filedBy = filedBy; }

    public int getRoundNumber() { return roundNumber; }
    public void setRoundNumber(int roundNumber) { this.roundNumber = roundNumber; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getProofPath() { return proofPath; }
    public void setProofPath(String proofPath) { this.proofPath = proofPath; }

    public Timestamp getFiledAt() { return filedAt; }
    public void setFiledAt(Timestamp filedAt) { this.filedAt = filedAt; }

    public String getFiledByName() { return filedByName; }
    public void setFiledByName(String filedByName) { this.filedByName = filedByName; }
}
