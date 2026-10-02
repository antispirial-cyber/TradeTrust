package com.tradetrust.servlet;

import com.fasterxml.jackson.databind.JsonNode;
import com.tradetrust.dao.LedgerDAO;
import com.tradetrust.model.LedgerEntry;
import com.tradetrust.util.DBConnection;
import com.tradetrust.util.JsonUtil;
import com.tradetrust.util.ScoreUtil;
import com.tradetrust.util.SessionUtil;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;
import java.math.BigDecimal;
import java.sql.Connection;
import java.sql.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@WebServlet(urlPatterns = {"/api/ledger", "/api/ledger/*"})
public class LedgerServlet extends HttpServlet {
    private final LedgerDAO ledgerDAO = new LedgerDAO();

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        Integer ownerId = SessionUtil.getCurrentTraderId(req);
        if (ownerId == null) {
            JsonUtil.writeError(resp, HttpServletResponse.SC_UNAUTHORIZED, "Authentication required to access private ledger");
            return;
        }

        try {
            List<LedgerEntry> entries = ledgerDAO.findByOwnerId(ownerId);
            Map<String, Object> summary = ledgerDAO.getSummary(ownerId);

            Map<String, Object> data = new HashMap<>();
            data.put("entries", entries);
            data.put("summary", summary);

            JsonUtil.writeSuccess(resp, "Private ledger records", data);
        } catch (Exception e) {
            e.printStackTrace();
            JsonUtil.writeError(resp, HttpServletResponse.SC_INTERNAL_SERVER_ERROR, "Failed to load ledger: " + e.getMessage());
        }
    }

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        Integer ownerId = SessionUtil.getCurrentTraderId(req);
        if (ownerId == null) {
            JsonUtil.writeError(resp, HttpServletResponse.SC_UNAUTHORIZED, "Authentication required");
            return;
        }

        String path = req.getPathInfo();
        try {
            if (path != null && path.contains("/status")) {
                handleUpdateStatus(req, resp, ownerId, path);
                return;
            }

            // Create new ledger entry
            JsonNode root = JsonUtil.getMapper().readTree(req.getInputStream());
            String partyName = root.path("partyName").asText(null);
            double amount = root.path("amount").asDouble(0.0);
            String entryType = root.path("entryType").asText("CREDIT_GIVEN").toUpperCase();
            String entryDate = root.path("entryDate").asText(null);
            String description = root.path("description").asText(null);
            String status = root.path("status").asText("PENDING").toUpperCase();

            if (partyName == null || amount <= 0 || entryDate == null) {
                JsonUtil.writeError(resp, HttpServletResponse.SC_BAD_REQUEST, "Required fields: partyName, amount (>0), entryDate");
                return;
            }

            LedgerEntry entry = new LedgerEntry();
            entry.setOwnerId(ownerId);
            entry.setPartyName(partyName);
            entry.setAmount(BigDecimal.valueOf(amount));
            entry.setEntryType(entryType);
            entry.setEntryDate(Date.valueOf(entryDate));
            entry.setDescription(description);
            entry.setStatus(status);

            entry = ledgerDAO.create(entry);

            // Trigger score recalculation
            try (Connection conn = DBConnection.getConnection()) {
                ScoreUtil.recalculateAndSave(ownerId, conn);
            }

            JsonUtil.writeSuccess(resp, "Ledger entry recorded", entry);
        } catch (Exception e) {
            e.printStackTrace();
            JsonUtil.writeError(resp, HttpServletResponse.SC_INTERNAL_SERVER_ERROR, "Failed to save ledger entry: " + e.getMessage());
        }
    }

    @Override
    protected void doPut(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        Integer ownerId = SessionUtil.getCurrentTraderId(req);
        if (ownerId == null) {
            JsonUtil.writeError(resp, HttpServletResponse.SC_UNAUTHORIZED, "Authentication required");
            return;
        }
        String path = req.getPathInfo();
        try {
            if (path != null && path.contains("/status")) {
                handleUpdateStatus(req, resp, ownerId, path);
            } else {
                JsonUtil.writeError(resp, HttpServletResponse.SC_NOT_FOUND, "Action not found");
            }
        } catch (Exception e) {
            e.printStackTrace();
            JsonUtil.writeError(resp, HttpServletResponse.SC_INTERNAL_SERVER_ERROR, "Update status error: " + e.getMessage());
        }
    }

    @Override
    protected void doDelete(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        Integer ownerId = SessionUtil.getCurrentTraderId(req);
        if (ownerId == null) {
            JsonUtil.writeError(resp, HttpServletResponse.SC_UNAUTHORIZED, "Authentication required");
            return;
        }

        String path = req.getPathInfo();
        if (path == null || path.length() <= 1) {
            JsonUtil.writeError(resp, HttpServletResponse.SC_BAD_REQUEST, "Entry ID required");
            return;
        }

        try {
            int entryId = Integer.parseInt(path.substring(1).replace("/", ""));
            boolean deleted = ledgerDAO.delete(entryId, ownerId);
            if (deleted) {
                try (Connection conn = DBConnection.getConnection()) {
                    ScoreUtil.recalculateAndSave(ownerId, conn);
                }
                JsonUtil.writeSuccess(resp, "Ledger entry removed", null);
            } else {
                JsonUtil.writeError(resp, HttpServletResponse.SC_NOT_FOUND, "Entry not found or unauthorized");
            }
        } catch (Exception e) {
            e.printStackTrace();
            JsonUtil.writeError(resp, HttpServletResponse.SC_INTERNAL_SERVER_ERROR, "Delete failed: " + e.getMessage());
        }
    }

    private void handleUpdateStatus(HttpServletRequest req, HttpServletResponse resp, int ownerId, String path) throws Exception {
        // e.g. /123/status
        String[] parts = path.split("/");
        int entryId = Integer.parseInt(parts[1]);
        JsonNode root = JsonUtil.getMapper().readTree(req.getInputStream());
        String status = root.path("status").asText(null);

        if (status == null || (!status.equalsIgnoreCase("PENDING") && !status.equalsIgnoreCase("PAID") && !status.equalsIgnoreCase("OVERDUE"))) {
            JsonUtil.writeError(resp, HttpServletResponse.SC_BAD_REQUEST, "Valid status required: PENDING, PAID, OVERDUE");
            return;
        }

        boolean updated = ledgerDAO.updateStatus(entryId, ownerId, status.toUpperCase());
        if (updated) {
            try (Connection conn = DBConnection.getConnection()) {
                ScoreUtil.recalculateAndSave(ownerId, conn);
            }
            JsonUtil.writeSuccess(resp, "Ledger entry updated to " + status.toUpperCase(), null);
        } else {
            JsonUtil.writeError(resp, HttpServletResponse.SC_NOT_FOUND, "Entry not found or unauthorized");
        }
    }
}
