package com.tradetrust.servlet;

import com.tradetrust.DBConnection;
import com.tradetrust.ScoreUtil;
import com.tradetrust.model.Session;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.sql.Connection;
import java.util.Map;

/**
 * Score Servlet: Exposes /api/score/{id} and /api/score/me
 * Returns detailed reputation score metrics for viva inspection and transparency.
 */
public class ScoreServlet extends ApiServlet {

    @Override
    protected void get(HttpServletRequest req, HttpServletResponse resp) throws Exception {
        String[] p = parts(req);
        int traderId;

        if (p.length == 0 || p[0].equalsIgnoreCase("me")) {
            Session session = requireTrader(req, resp);
            if (session == null) return;
            traderId = session.userId;
        } else {
            try {
                traderId = Integer.parseInt(p[0]);
            } catch (NumberFormatException e) {
                fail(resp, 400, "Invalid trader ID in path");
                return;
            }
        }

        try (Connection conn = DBConnection.getConnection()) {
            Map<String, Object> breakdown = ScoreUtil.calculateScoreBreakdown(traderId, conn);
            if (breakdown == null) {
                fail(resp, 404, "Trader not found");
                return;
            }
            ok(resp, "Trust score metrics loaded successfully", breakdown);
        }
    }
}
