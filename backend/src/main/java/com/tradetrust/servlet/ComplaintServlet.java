package com.tradetrust.servlet;

import com.tradetrust.dao.ComplaintDAO;
import com.tradetrust.model.Complaint;
import com.tradetrust.model.Session;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.util.List;
import java.util.Map;

/**
 * Handles /api/complaints and /api/complaint/*:
 *   GET  /api/complaints (disputes for current user or all for admin)
 *   POST /api/complaints (file new dispute)
 *   POST /api/complaints/{id}/retake (request retake/withdrawal by filer)
 *   GET  /api/complaints/records/{traderId} (public resolved past records)
 */
public class ComplaintServlet extends ApiServlet {

    private final ComplaintDAO complaintDAO = new ComplaintDAO();
    private final com.tradetrust.dao.TraderDAO traderDAO = new com.tradetrust.dao.TraderDAO();

    @Override
    protected void get(HttpServletRequest req, HttpServletResponse resp) throws Exception {
        String[] p = parts(req);

        // GET /api/complaints/records/{traderId}
        if (p.length >= 2 && "records".equalsIgnoreCase(p[0])) {
            int traderId = integer(p[1]);
            List<Complaint> records = complaintDAO.approvedAgainst(traderId);
            ok(resp, "Past dispute records loaded", records);
            return;
        }

        // GET /api/complaints
        Session s = requireLogin(req, resp);
        if (s == null) return;

        List<Complaint> list;
        if (s.isAdmin()) {
            list = complaintDAO.listAll();
        } else {
            list = complaintDAO.listInvolving(s.userId);
        }
        ok(resp, "Complaints loaded", list);
    }

    @Override
    protected void post(HttpServletRequest req, HttpServletResponse resp) throws Exception {
        String[] p = parts(req);

        // POST /api/complaints/{id}/retake
        if (p.length >= 2 && "retake".equalsIgnoreCase(p[1])) {
            int complaintId = integer(p[0]);
            Session s = requireTrader(req, resp);
            if (s == null) return;

            boolean requested = complaintDAO.requestRetake(complaintId, s.userId);
            if (!requested) {
                fail(resp, 400, "Retake cannot be requested. Only the original complainant can request a retake on active/decided complaints.");
                return;
            }
            ok(resp, "Retake request submitted to the Market Association Admin for review.", null);
            return;
        }

        // POST /api/complaints (File new complaint)
        Session s = requireTrader(req, resp);
        if (s == null) return;

        Map<String, Object> body = readBody(req);
        int reportedId = (int) number(body, "reportedId");
        String description = text(body, "description");
        String incidentDate = text(body, "incidentDate");

        if (reportedId == s.userId) {
            fail(resp, 400, "A business cannot file a formal complaint against itself");
            return;
        }

        com.tradetrust.model.Trader reported = traderDAO.findById(reportedId);
        if (reported == null) {
            fail(resp, 404, "Reported merchant not found in registry");
            return;
        }

        if (complaintDAO.hasActiveComplaint(s.userId, reportedId)) {
            fail(resp, 400, "An active dispute between your business and this merchant is already pending arbitration by the Association.");
            return;
        }

        double amount = body.containsKey("amountDisputed") ? number(body, "amountDisputed") : 0.0;
        if (amount < 0) {
            fail(resp, 400, "Disputed amount cannot be negative");
            return;
        }

        if (description.isEmpty()) {
            fail(resp, 400, "Detailed incident description is required");
            return;
        }
        if (incidentDate.isEmpty()) {
            incidentDate = java.time.LocalDate.now().toString();
        }

        Complaint c = new Complaint();
        c.reporterId = s.userId;
        c.reportedId = reportedId;
        c.description = description;
        c.amountDisputed = amount;
        c.incidentDate = incidentDate;
        c.proofPath = text(body, "proofPath");
        c.proofName = text(body, "proofName");
        if (c.proofName.isEmpty()) {
            c.proofName = text(body, "proofFileName");
        }

        int newId = complaintDAO.file(c);
        Complaint saved = complaintDAO.findById(newId);
        ok(resp, "Dispute filed successfully and escalated to the Association Administrator.", saved);
    }
}
