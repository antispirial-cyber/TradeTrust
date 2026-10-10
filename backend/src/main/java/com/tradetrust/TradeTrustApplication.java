package com.tradetrust;

import com.tradetrust.servlet.AdminServlet;
import com.tradetrust.servlet.AuthServlet;
import com.tradetrust.servlet.ComplaintServlet;
import com.tradetrust.servlet.ConnectionServlet;
import com.tradetrust.servlet.LedgerServlet;
import com.tradetrust.servlet.NotificationServlet;
import com.tradetrust.servlet.PingServlet;
import com.tradetrust.servlet.ScoreServlet;
import com.tradetrust.servlet.TraderServlet;
import com.tradetrust.servlet.UploadServlet;
import jakarta.servlet.MultipartConfigElement;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.jdbc.DataSourceAutoConfiguration;
import org.springframework.boot.autoconfigure.orm.jpa.HibernateJpaAutoConfiguration;
import org.springframework.boot.web.servlet.ServletRegistrationBean;
import org.springframework.context.annotation.Bean;

import java.io.File;
import java.sql.Connection;
import java.sql.ResultSet;
import java.sql.Statement;

/**
 * Main application runner.
 */
@SpringBootApplication(exclude = {DataSourceAutoConfiguration.class, HibernateJpaAutoConfiguration.class})
public class TradeTrustApplication {

    public static void main(String[] args) {
        SpringApplication.run(TradeTrustApplication.class, args);
    }

    @Bean
    public ServletRegistrationBean<PingServlet> pingServletBean() {
        return new ServletRegistrationBean<>(new PingServlet(), "/api/ping");
    }

    @Bean
    public ServletRegistrationBean<AuthServlet> authServletBean() {
        return new ServletRegistrationBean<>(new AuthServlet(), "/api/auth/*");
    }

    @Bean
    public ServletRegistrationBean<TraderServlet> traderServletBean() {
        ServletRegistrationBean<TraderServlet> bean = new ServletRegistrationBean<>(new TraderServlet());
        bean.addUrlMappings("/api/traders", "/api/traders/*", "/api/trader/*");
        return bean;
    }

    @Bean
    public ServletRegistrationBean<ComplaintServlet> complaintServletBean() {
        ServletRegistrationBean<ComplaintServlet> bean = new ServletRegistrationBean<>(new ComplaintServlet());
        bean.addUrlMappings("/api/complaints", "/api/complaints/*", "/api/complaint/*");
        return bean;
    }

    @Bean
    public ServletRegistrationBean<AdminServlet> adminServletBean() {
        return new ServletRegistrationBean<>(new AdminServlet(), "/api/admin/*");
    }

    @Bean
    public ServletRegistrationBean<ConnectionServlet> connectionServletBean() {
        return new ServletRegistrationBean<>(new ConnectionServlet(), "/api/connect/*");
    }

    @Bean
    public ServletRegistrationBean<NotificationServlet> notificationServletBean() {
        ServletRegistrationBean<NotificationServlet> bean = new ServletRegistrationBean<>(new NotificationServlet());
        bean.addUrlMappings("/api/notifications", "/api/notifications/*");
        return bean;
    }

    @Bean
    public ServletRegistrationBean<LedgerServlet> ledgerServletBean() {
        ServletRegistrationBean<LedgerServlet> bean = new ServletRegistrationBean<>(new LedgerServlet());
        bean.addUrlMappings("/api/ledger", "/api/ledger/*");
        return bean;
    }

    @Bean
    public ServletRegistrationBean<ScoreServlet> scoreServletBean() {
        ServletRegistrationBean<ScoreServlet> bean = new ServletRegistrationBean<>(new ScoreServlet());
        bean.addUrlMappings("/api/score", "/api/score/*");
        return bean;
    }

    @Bean
    public ServletRegistrationBean<UploadServlet> uploadServletBean() {
        ServletRegistrationBean<UploadServlet> bean = new ServletRegistrationBean<>(new UploadServlet());
        bean.addUrlMappings("/api/upload", "/uploads/*");

        File uploadLocation = new File("uploads");
        if (!uploadLocation.exists()) {
            uploadLocation.mkdirs();
        }

        MultipartConfigElement multipartConfig = new MultipartConfigElement(
                uploadLocation.getAbsolutePath(),
                10 * 1024 * 1024,   // max file 10MB
                12 * 1024 * 1024,   // max request 12MB
                1024 * 1024         // file size threshold 1MB
        );
        bean.setMultipartConfig(multipartConfig);
        return bean;
    }

    @Bean
    public CommandLineRunner testDatabaseConnection() {
        return args -> {
            System.out.println("==================================================");
            System.out.println("TradeTrust Mumbai Bazaar Platform starting...");
            try (Connection conn = DBConnection.getConnection();
                 Statement stmt = conn.createStatement();
                 ResultSet rs = stmt.executeQuery("SELECT COUNT(*) FROM traders")) {
                if (rs.next()) {
                    int count = rs.getInt(1);
                    System.out.println("Database connected. Total traders: " + count);
                }
            } catch (Exception e) {
                System.err.println("Database connection error: " + e.getMessage());
                System.err.println("Note: Check DB credentials in DBConnection.java");
            }
            System.out.println("TradeTrust Backend running on http://localhost:8080");
            System.out.println("==================================================");
        };
    }
}
