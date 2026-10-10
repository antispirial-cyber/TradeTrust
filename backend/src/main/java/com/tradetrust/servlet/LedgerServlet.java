package com.tradetrust.servlet;

import com.tradetrust.dao.LedgerDAO;
import com.tradetrust.model.LedgerEntry;
import com.tradetrust.model.Session;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.util.List;
import java.util.Map;

/**
 * Handles /api/ledger/*:
 *   GET    /api/ledger
 *   POST   /api/ledger
 *   POST   /api/ledger/{id}/status
 *   PUT    /api/ledger/{id}
 *   DELETE /api/ledger/{id}
 */
public class LedgerServlet extends ApiServlet {

    private final LedgerDAO ledgerDAO = new LedgerDAO();

    @Override
    protected void get(HttpServletRequest req, HttpServletResponse resp) throws Exception {
        Session s = requireTrader(req, resp);
        if (s == null) return;

        List<LedgerEntry> entries = ledgerDAO.listByOwner(s.userId);
        ok(resp, "Ledger entries retrieved", entries);
    }

    @Override
    protected void post(HttpServletRequest req, HttpServletResponse resp) throws Exception {
        Session s = requireTrader(req, resp);
        if (s == null) return;

        String[] p = parts(req);

        // POST /api/ledger/{id}/status
        if (p.length >= 2 && "status".equalsIgnoreCase(p[1])) {
            int entryId = integer(p[0]);
            Map<String, Object> body = readBody(req);
            String status = text(body, "status");
            if (status.isEmpty()) {
                fail(resp, 400, "Status is required (PENDING, PAID, OVERDUE)");
                return;
            }
            boolean updated = ledgerDAO.updateStatus(entryId, s.userId, status.toUpperCase());
            if (!updated) {
                fail(resp, 404, "Ledger entry not found");
                return;
            }
            LedgerEntry current = ledgerDAO.findById(entryId, s.userId);
            ok(resp, "Ledger status updated", current);
            return;
        }

        // POST /api/ledger (new entry)
        Map<String, Object> body = readBody(req);
        String partyName = text(body, "partyName");
        double amount = number(body, "amount");
        String entryType = text(body, "entryType");
        String entryDate = text(body, "entryDate");
        String description = text(body, "description");
        String status = text(body, "status");

        if (partyName.isEmpty()) {
            fail(resp, 400, "Counterparty name is required");
            return;
        }
        if (amount <= 0) {
            fail(resp, 400, "Amount must be greater than zero");
            return;
        }
        if (entryDate.isEmpty()) {
            entryDate = java.time.LocalDate.now().toString();
        }
        if (entryType.isEmpty()) {
            entryType = "CREDIT_GIVEN";
        } else {
            entryType = entryType.toUpperCase();
        }
        if (!"CREDIT_GIVEN".equals(entryType) && !"CREDIT_RECEIVED".equals(entryType)) {
            fail(resp, 400, "Invalid credit entry type. Must be CREDIT_GIVEN or CREDIT_RECEIVED");
            return;
        }
        if (status.isEmpty()) {
            status = "PENDING";
        } else {
            status = status.toUpperCase();
        }
        if (!"PENDING".equals(status) && !"PAID".equals(status) && !"OVERDUE".equals(status)) {
            fail(resp, 400, "Invalid settlement status. Must be PENDING, PAID, or OVERDUE");
            return;
        }

        LedgerEntry entry = new LedgerEntry();
        entry.ownerId = s.userId;
        entry.partyName = partyName;
        entry.amount = amount;
        entry.entryType = entryType;
        entry.entryDate = entryDate;
        entry.description = description;
        entry.status = status;

        int newId = ledgerDAO.insert(entry);
        entry.entryId = newId;
        ok(resp, "Ledger entry created successfully", entry);
    }

    @Override
    protected void put(HttpServletRequest req, HttpServletResponse resp) throws Exception {
        Session s = requireTrader(req, resp);
        if (s == null) return;

        String[] p = parts(req);
        if (p.length >= 1) {
            int entryId = integer(p[0]);
            LedgerEntry current = ledgerDAO.findById(entryId, s.userId);
            if (current == null) {
                fail(resp, 404, "Ledger entry not found or unauthorized");
                return;
            }

            Map<String, Object> body = readBody(req);
            if (body.containsKey("partyName")) {
                String party = text(body, "partyName");
                if (party.isEmpty()) {
                    fail(resp, 400, "Counterparty name cannot be empty");
                    return;
                }
                current.partyName = party;
            }
            if (body.containsKey("amount")) {
                double amt = number(body, "amount");
                if (amt <= 0) {
                    fail(resp, 400, "Amount must be greater than zero");
                    return;
                }
                current.amount = amt;
            }
            if (body.containsKey("entryType")) {
                String type = text(body, "entryType").toUpperCase();
                if (!type.equals("CREDIT_GIVEN") && !type.equals("CREDIT_RECEIVED")) {
                    fail(resp, 400, "Invalid credit entry type");
                    return;
                }
                current.entryType = type;
            }
            if (body.containsKey("entryDate")) {
                current.entryDate = text(body, "entryDate");
            }
            if (body.containsKey("description")) {
                current.description = text(body, "description");
            }
            if (body.containsKey("status")) {
                String st = text(body, "status").toUpperCase();
                if (!st.equals("PENDING") && !st.equals("PAID") && !st.equals("OVERDUE")) {
                    fail(resp, 400, "Invalid status. Must be PENDING, PAID, or OVERDUE");
                    return;
                }
                current.status = st;
            }

            ledgerDAO.update(current);
            ok(resp, "Ledger entry updated successfully", current);
            return;
        }
        fail(resp, 400, "Missing ledger entry identifier");
    }

    @Override
    protected void delete(HttpServletRequest req, HttpServletResponse resp) throws Exception {
        Session s = requireTrader(req, resp);
        if (s == null) return;

        String[] p = parts(req);
        if (p.length >= 1) {
            int entryId = integer(p[0]);
            boolean deleted = ledgerDAO.delete(entryId, s.userId);
            if (!deleted) {
                fail(resp, 404, "Ledger entry not found or unauthorized");
                return;
            }
            ok(resp, "Ledger entry removed", Map.of("entryId", entryId));
            return;
        }
        fail(resp, 400, "Missing ledger entry identifier");
    }
}
