package com.tradetrust.servlet;

import com.tradetrust.dao.ComplaintDAO;
import com.tradetrust.dao.NotificationDAO;
import com.tradetrust.dao.TraderDAO;
import com.tradetrust.model.Complaint;
import com.tradetrust.model.Session;
import com.tradetrust.model.Trader;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Handles all association administration actions under /api/admin/*:
 *   GET  /api/admin/metrics
 *   GET  /api/admin/complaints
 *   POST /api/admin/complaints/{id}/resolve
 *   POST /api/admin/traders/{id}/score
 *   POST /api/admin/traders/{id}/freeze
 *   POST /api/admin/traders/{id}/verify
 *   POST /api/admin/broadcast
 */
public class AdminServlet extends ApiServlet {

    private final TraderDAO traderDAO = new TraderDAO();
    private final ComplaintDAO complaintDAO = new ComplaintDAO();
    private final NotificationDAO notificationDAO = new NotificationDAO();

    @Override
    protected void get(HttpServletRequest req, HttpServletResponse resp) throws Exception {
        Session s = requireAdmin(req, resp);
        if (s == null) return;

        String path = req.getPathInfo();
        if ("/metrics".equals(path)) {
            double[] stats = traderDAO.stats();
            int pending = complaintDAO.countPending();
            double disputed = complaintDAO.totalDisputedAmount();

            Map<String, Object> metrics = new HashMap<>();
            metrics.put("totalTraders", (int) stats[0]);
            metrics.put("frozenTraders", (int) stats[1]);
            metrics.put("averageTrustScore", Math.round(stats[2] * 100.0) / 100.0);
            metrics.put("pendingComplaints", pending);
            metrics.put("totalDisputedAmount", disputed);

            ok(resp, "System metrics calculated", metrics);
            return;
        }

        if ("/complaints".equals(path)) {
            List<Complaint> list = complaintDAO.listAll();
            ok(resp, "All association complaints loaded", list);
            return;
        }

        fail(resp, 404, "Admin endpoint not found");
    }

    @Override
    protected void post(HttpServletRequest req, HttpServletResponse resp) throws Exception {
        Session s = requireAdmin(req, resp);
        if (s == null) return;

        String[] p = parts(req);
        Map<String, Object> body = readBody(req);

        // POST /api/admin/broadcast
        if (p.length == 1 && "broadcast".equalsIgnoreCase(p[0])) {
            String title = text(body, "title");
            String message = text(body, "message");
            String cluster = text(body, "cluster");

            if (message.isEmpty()) {
                fail(resp, 400, "Notice text is required");
                return;
            }
            String fullMessage = title.isEmpty() ? message : "[" + title + "] " + message;
            int count = notificationDAO.broadcast(cluster, fullMessage);
            Map<String, Object> res = new HashMap<>();
            res.put("recipientsCount", count);
            ok(resp, "Association circular broadcasted to " + count + " merchants.", res);
            return;
        }

        // POST /api/admin/complaints/{id}/resolve
        if (p.length >= 3 && "complaints".equalsIgnoreCase(p[0]) && "resolve".equalsIgnoreCase(p[2])) {
            int complaintId = integer(p[1]);
            String decision = text(body, "resolution");
            if (decision.isEmpty()) {
                decision = text(body, "decision");
            }
            if (decision.isEmpty()) {
                fail(resp, 400, "Resolution decision is required");
                return;
            }

            String error = complaintDAO.resolve(complaintId, decision.toUpperCase());
            if (error != null) {
                fail(resp, 400, error);
                return;
            }
            Complaint updated = complaintDAO.findById(complaintId);
            ok(resp, "Arbitration finding applied successfully.", updated);
            return;
        }

        // Actions on traders: /api/admin/traders/{id}/...
        if (p.length >= 3 && "traders".equalsIgnoreCase(p[0])) {
            int traderId = integer(p[1]);
            String action = p[2].toLowerCase();

            Trader target = traderDAO.findById(traderId);
            if (target == null) {
                fail(resp, 404, "Merchant not found");
                return;
            }

            // POST /api/admin/traders/{id}/score
            if ("score".equals(action)) {
                double newScore = number(body, "newScore");
                if (newScore < 0.0 || newScore > 10.0) {
                    fail(resp, 400, "Trust score must be between 0.00 and 10.00");
                    return;
                }
                traderDAO.setScore(traderId, newScore);
                target.trustScore = newScore;
                notificationDAO.create(traderId, "score_updated",
                        "Your trust score was updated by the Association Admin to " + String.format(java.util.Locale.US, "%.2f", newScore) + "/10.00.",
                        "/dashboard", null);
                ok(resp, "Trust score updated for " + target.businessName + " to " + newScore, target);
                return;
            }

            // POST /api/admin/traders/{id}/freeze
            if ("freeze".equals(action)) {
                boolean freeze = true;
                if (body.containsKey("freezeState")) {
                    freeze = Boolean.parseBoolean(String.valueOf(body.get("freezeState")));
                } else if (body.containsKey("scoreFrozen")) {
                    freeze = Boolean.parseBoolean(String.valueOf(body.get("scoreFrozen")));
                }
                traderDAO.setFrozen(traderId, freeze);
                target.scoreFrozen = freeze;
                ok(resp, "Score freeze status updated to: " + freeze, target);
                return;
            }

            // POST /api/admin/traders/{id}/verify
            if ("verify".equals(action)) {
                boolean verified = true;
                if (body.containsKey("isVerified")) {
                    verified = Boolean.parseBoolean(String.valueOf(body.get("isVerified")));
                } else if (body.containsKey("isVerifiedBadge")) {
                    verified = Boolean.parseBoolean(String.valueOf(body.get("isVerifiedBadge")));
                }
                traderDAO.setVerified(traderId, verified);
                target.isVerifiedBadge = verified;
                ok(resp, "Verification badge updated to: " + verified, target);
                return;
            }
        }

        fail(resp, 404, "Unrecognized admin command");
    }
}
