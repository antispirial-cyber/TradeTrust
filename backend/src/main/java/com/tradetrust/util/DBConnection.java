package com.tradetrust.util;

import java.io.InputStream;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;
import java.util.Properties;

public class DBConnection {
    private static String url;
    private static String user;
    private static String password;

    static {
        try {
            Class.forName("com.mysql.cj.jdbc.Driver");
            Properties props = new Properties();
            try (InputStream in = DBConnection.class.getClassLoader().getResourceAsStream("application.properties")) {
                if (in != null) {
                    props.load(in);
                }
            }
            url = props.getProperty("db.url", "jdbc:mysql://localhost:3306/tradetrust_db?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC");
            user = props.getProperty("db.user", "root");
            String rawPass = props.getProperty("db.password", "");
            if (rawPass.startsWith("${") && rawPass.endsWith("}")) {
                // Parse ${DB_PASSWORD:fallback}
                String inner = rawPass.substring(2, rawPass.length() - 1);
                String[] parts = inner.split(":", 2);
                String envVal = System.getenv(parts[0]);
                if (envVal != null && !envVal.isEmpty()) {
                    password = envVal;
                } else if (parts.length > 1) {
                    password = parts[1];
                } else {
                    password = "";
                }
            } else {
                password = rawPass;
            }
        } catch (Exception e) {
            System.err.println("[DBConnection] Initialization error: " + e.getMessage());
            e.printStackTrace();
        }
    }

    public static Connection getConnection() throws SQLException {
        return DriverManager.getConnection(url, user, password);
    }
}
