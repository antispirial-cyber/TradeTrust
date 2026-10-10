package com.tradetrust.servlet;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.util.Map;

/**
 * Health check endpoint for verifying Tomcat and servlet availability.
 *   GET /api/ping
 */
public class PingServlet extends ApiServlet {

    @Override
    protected void get(HttpServletRequest req, HttpServletResponse resp) throws Exception {
        ok(resp, "TradeTrust Mumbai Bazaar Backend is online", Map.of(
                "status", "UP",
                "service", "TradeTrust Tomcat Servlet Engine",
                "timestamp", System.currentTimeMillis()
        ));
    }
}
