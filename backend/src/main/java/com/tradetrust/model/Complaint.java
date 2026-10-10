package com.tradetrust.model;

/** One complaint, joined with the names of both traders so the admin can see who is involved. */
public class Complaint {
    public int complaintId;
    public int reporterId;
    public String reporterName;
    public String reporterBusiness;
    public String reporterPhone;
    public int reportedId;
    public String reportedName;
    public String reportedBusiness;
    public String reportedCluster;
    public String description;
    public double amountDisputed;
    public String incidentDate;
    public String proofPath;
    public String proofName;
    public String status;
    public double scoreDeduction;
    public String resolvedAt;
    public String createdAt;

    public String getProofFileName() {
        return proofName;
    }

    public String getVerdictDate() {
        if (resolvedAt == null) return null;
        String s = resolvedAt.trim();
        int idx = s.indexOf('T');
        if (idx == -1) idx = s.indexOf(' ');
        return idx != -1 ? s.substring(0, idx) : s;
    }
}
