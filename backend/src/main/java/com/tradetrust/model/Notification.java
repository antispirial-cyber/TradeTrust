package com.tradetrust.model;

import java.sql.Timestamp;

public class Notification {
    private int notificationId;
    private int recipientId;
    private String type;
    private String message;
    private String linkRef;
    private boolean isRead;
    private Timestamp createdAt;

    public Notification() {}

    public int getNotificationId() { return notificationId; }
    public void setNotificationId(int notificationId) { this.notificationId = notificationId; }

    public int getRecipientId() { return recipientId; }
    public void setRecipientId(int recipientId) { this.recipientId = recipientId; }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }

    public String getLinkRef() { return linkRef; }
    public void setLinkRef(String linkRef) { this.linkRef = linkRef; }

    public boolean isRead() { return isRead; }
    public void setRead(boolean read) { isRead = read; }

    public Timestamp getCreatedAt() { return createdAt; }
    public void setCreatedAt(Timestamp createdAt) { this.createdAt = createdAt; }
}
