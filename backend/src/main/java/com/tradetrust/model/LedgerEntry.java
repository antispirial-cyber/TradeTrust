package com.tradetrust.model;

import java.math.BigDecimal;
import java.sql.Date;
import java.sql.Timestamp;

public class LedgerEntry {
    private int entryId;
    private int ownerId;
    private String partyName;
    private BigDecimal amount;
    private String entryType; // CREDIT_GIVEN, CREDIT_RECEIVED
    private Date entryDate;
    private String description;
    private String status; // PENDING, PAID, OVERDUE
    private Timestamp createdAt;

    public LedgerEntry() {}

    public int getEntryId() { return entryId; }
    public void setEntryId(int entryId) { this.entryId = entryId; }

    public int getOwnerId() { return ownerId; }
    public void setOwnerId(int ownerId) { this.ownerId = ownerId; }

    public String getPartyName() { return partyName; }
    public void setPartyName(String partyName) { this.partyName = partyName; }

    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }

    public String getEntryType() { return entryType; }
    public void setEntryType(String entryType) { this.entryType = entryType; }

    public Date getEntryDate() { return entryDate; }
    public void setEntryDate(Date entryDate) { this.entryDate = entryDate; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public Timestamp getCreatedAt() { return createdAt; }
    public void setCreatedAt(Timestamp createdAt) { this.createdAt = createdAt; }
}
