package com.tradetrust.model;

public class Notification {
    public int notificationId;
    public int recipientId;
    public String type;
    public String message;
    public String linkRef;
    public Integer refId;
    public boolean isRead;
    public String createdAt;

    // For connection requests: PENDING, ACCEPTED or DECLINED (so the page knows whether to show buttons).
    public String connectionStatus;
}
