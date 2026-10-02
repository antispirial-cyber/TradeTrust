package com.tradetrust.model;

import java.math.BigDecimal;
import java.sql.Timestamp;

public class Trader {
    private int traderId;
    private String name;
    private String phone;
    private String businessName;
    private String businessDesc;
    private String role; // WHOLESALER, RETAILER
    private String cluster;
    private String sector;
    private String photoPath;
    private String passwordHash;
    private BigDecimal trustScore;
    private boolean scoreFrozen;
    private BigDecimal scoreBeforeFreeze;
    private boolean isVerifiedBadge;
    private Timestamp createdAt;

    // Transient UI helper fields
    private int mutualConnections;
    private String connectionStatus; // not_connected, pending, connected

    public Trader() {}

    public int getTraderId() { return traderId; }
    public void setTraderId(int traderId) { this.traderId = traderId; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public String getBusinessName() { return businessName; }
    public void setBusinessName(String businessName) { this.businessName = businessName; }

    public String getBusinessDesc() { return businessDesc; }
    public void setBusinessDesc(String businessDesc) { this.businessDesc = businessDesc; }

    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }

    public String getCluster() { return cluster; }
    public void setCluster(String cluster) { this.cluster = cluster; }

    public String getSector() { return sector; }
    public void setSector(String sector) { this.sector = sector; }

    public String getPhotoPath() { return photoPath; }
    public void setPhotoPath(String photoPath) { this.photoPath = photoPath; }

    public String getPasswordHash() { return passwordHash; }
    public void setPasswordHash(String passwordHash) { this.passwordHash = passwordHash; }

    public BigDecimal getTrustScore() { return trustScore; }
    public void setTrustScore(BigDecimal trustScore) { this.trustScore = trustScore; }

    public boolean isScoreFrozen() { return scoreFrozen; }
    public void setScoreFrozen(boolean scoreFrozen) { this.scoreFrozen = scoreFrozen; }

    public BigDecimal getScoreBeforeFreeze() { return scoreBeforeFreeze; }
    public void setScoreBeforeFreeze(BigDecimal scoreBeforeFreeze) { this.scoreBeforeFreeze = scoreBeforeFreeze; }

    public boolean isVerifiedBadge() { return isVerifiedBadge; }
    public void setVerifiedBadge(boolean verifiedBadge) { isVerifiedBadge = verifiedBadge; }
    public void setIsVerifiedBadge(boolean verifiedBadge) { isVerifiedBadge = verifiedBadge; }

    public Timestamp getCreatedAt() { return createdAt; }
    public void setCreatedAt(Timestamp createdAt) { this.createdAt = createdAt; }

    public int getMutualConnections() { return mutualConnections; }
    public void setMutualConnections(int mutualConnections) { this.mutualConnections = mutualConnections; }

    public String getConnectionStatus() { return connectionStatus; }
    public void setConnectionStatus(String connectionStatus) { this.connectionStatus = connectionStatus; }
}
