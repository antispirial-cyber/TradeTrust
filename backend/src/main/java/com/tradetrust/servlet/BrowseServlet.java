package com.tradetrust.servlet;

import com.tradetrust.dao.TraderDAO;
import com.tradetrust.model.Trader;
import com.tradetrust.util.DBConnection;
import com.tradetrust.util.JsonUtil;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.util.*;

@WebServlet("/api/browse")
public class BrowseServlet extends HttpServlet {
    private final TraderDAO traderDAO = new TraderDAO();

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        try {
            List<String> clusters = new ArrayList<>();
            List<String> sectors = new ArrayList<>();

            try (Connection conn = DBConnection.getConnection()) {
                try (PreparedStatement ps = conn.prepareStatement("SELECT DISTINCT cluster FROM traders ORDER BY cluster");
                     ResultSet rs = ps.executeQuery()) {
                    while (rs.next()) {
                        String c = rs.getString("cluster");
                        if (c != null && !c.isBlank()) clusters.add(c);
                    }
                }
                try (PreparedStatement ps = conn.prepareStatement("SELECT DISTINCT sector FROM traders ORDER BY sector");
                     ResultSet rs = ps.executeQuery()) {
                    while (rs.next()) {
                        String s = rs.getString("sector");
                        if (s != null && !s.isBlank()) sectors.add(s);
                    }
                }
            }

            List<Trader> topTraders = traderDAO.findAll(null, null, null, null, "score_desc", -1);
            if (topTraders.size() > 6) {
                topTraders = topTraders.subList(0, 6);
            }

            Map<String, Object> data = new HashMap<>();
            data.put("clusters", clusters);
            data.put("sectors", sectors);
            data.put("topTraders", topTraders);

            JsonUtil.writeSuccess(resp, "Browse metadata loaded", data);
        } catch (Exception e) {
            e.printStackTrace();
            JsonUtil.writeError(resp, HttpServletResponse.SC_INTERNAL_SERVER_ERROR, "Browse error: " + e.getMessage());
        }
    }
}
