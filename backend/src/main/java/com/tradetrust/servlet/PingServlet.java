package com.tradetrust.servlet;

import com.tradetrust.util.JsonUtil;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;
import java.time.Instant;
import java.util.Map;

@WebServlet("/api/ping")
public class PingServlet extends HttpServlet {
    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        JsonUtil.writeSuccess(resp, "TradeTrust Backend API is online", Map.of(
                "status", "UP",
                "timestamp", Instant.now().toString(),
                "bazaar", "Mumbai Trade Network"
        ));
    }
}
