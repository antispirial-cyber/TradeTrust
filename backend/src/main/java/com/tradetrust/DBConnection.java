package com.tradetrust;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;

/**
 * Database connection helper.
 */
public class DBConnection {

    public static final String DRIVER = "com.mysql.cj.jdbc.Driver";
    public static final String URL = "jdbc:mysql://localhost:3306/tradetrust_db?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC";
    public static final String USER = "root";
    public static final String PASSWORD = "tradetrust";

    public static String getUrl() {
        String env = System.getenv("DB_URL");
        if (env != null && !env.trim().isEmpty()) return env.trim();
        String prop = System.getProperty("db.url");
        if (prop != null && !prop.trim().isEmpty()) return prop.trim();
        return URL;
    }

    public static String getUser() {
        String env = System.getenv("DB_USER");
        if (env != null && !env.trim().isEmpty()) return env.trim();
        String prop = System.getProperty("db.user");
        if (prop != null && !prop.trim().isEmpty()) return prop.trim();
        return USER;
    }

    public static String getPassword() {
        String env = System.getenv("DB_PASSWORD");
        if (env != null && !env.trim().isEmpty()) return env.trim();
        String prop = System.getProperty("db.password");
        if (prop != null && !prop.trim().isEmpty()) return prop.trim();
        return PASSWORD;
    }

    public static Connection getConnection() throws SQLException {
        try {
            Class.forName(DRIVER);
        } catch (ClassNotFoundException e) {
            throw new SQLException("MySQL JDBC driver not found", e);
        }
        return DriverManager.getConnection(getUrl(), getUser(), getPassword());
    }
}
