package com.tradetrust.model;

import java.sql.Timestamp;

public class Connection {
    private int connectionId;
    private int requesterId;
    private int receiverId;
    private String status; // PENDING, ACCEPTED, DECLINED
    private Timestamp createdAt;

    // Transient join helper fields
    private Trader otherTrader;

    public Connection() {}

    public int getConnectionId() { return connectionId; }
    public void setConnectionId(int connectionId) { this.connectionId = connectionId; }

    public int getRequesterId() { return requesterId; }
    public void setRequesterId(int requesterId) { this.requesterId = requesterId; }

    public int getReceiverId() { return receiverId; }
    public void setReceiverId(int receiverId) { this.receiverId = receiverId; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public Timestamp getCreatedAt() { return createdAt; }
    public void setCreatedAt(Timestamp createdAt) { this.createdAt = createdAt; }

    public Trader getOtherTrader() { return otherTrader; }
    public void setOtherTrader(Trader otherTrader) { this.otherTrader = otherTrader; }
}
