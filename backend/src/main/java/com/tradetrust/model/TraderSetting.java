package com.tradetrust.model;

import java.sql.Timestamp;

public class TraderSetting {
    private int settingId;
    private int traderId;
    private String accentColor;
    private Timestamp updatedAt;

    public TraderSetting() {}

    public int getSettingId() { return settingId; }
    public void setSettingId(int settingId) { this.settingId = settingId; }

    public int getTraderId() { return traderId; }
    public void setTraderId(int traderId) { this.traderId = traderId; }

    public String getAccentColor() { return accentColor; }
    public void setAccentColor(String accentColor) { this.accentColor = accentColor; }

    public Timestamp getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Timestamp updatedAt) { this.updatedAt = updatedAt; }
}
