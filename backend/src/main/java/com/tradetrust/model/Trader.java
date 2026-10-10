package com.tradetrust.model;

import com.fasterxml.jackson.annotation.JsonIgnore;

/** One row of the traders table. Field names are the same in Java, JSON and React. */
public class Trader {
    public int traderId;
    public String name;
    public String phone;
    public String businessName;
    public String businessDesc;
    public String role;
    public String cluster;
    public String sector;
    public String photoPath;
    public String getPhotoUrl() {
        return photoPath;
    }
    @JsonIgnore
    public String passwordHash;
    public double trustScore;
    public boolean scoreFrozen;
    public Double scoreBeforeFreeze;
    public boolean isVerifiedBadge;
    public String accentColor;
    public String themeMode;
    public String createdAt;

    // Filled only when a trader is shown to another logged-in trader.
    public String connectionStatus;
    public Integer connectionId;
    public int mutualConnections;
}
