package com.tradetrust.config;

import com.tradetrust.servlet.*;
import jakarta.servlet.MultipartConfigElement;
import org.springframework.boot.web.servlet.ServletRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.io.File;

@Configuration
public class ServletConfig {

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
    public ServletRegistrationBean<BrowseServlet> browseServletBean() {
        return new ServletRegistrationBean<>(new BrowseServlet(), "/api/browse");
    }

    @Bean
    public ServletRegistrationBean<ComplaintServlet> complaintServletBean() {
        ServletRegistrationBean<ComplaintServlet> bean = new ServletRegistrationBean<>(new ComplaintServlet());
        bean.addUrlMappings("/api/complaint", "/api/complaints", "/api/complaint/*", "/api/complaints/*");
        return bean;
    }

    @Bean
    public ServletRegistrationBean<LedgerServlet> ledgerServletBean() {
        ServletRegistrationBean<LedgerServlet> bean = new ServletRegistrationBean<>(new LedgerServlet());
        bean.addUrlMappings("/api/ledger", "/api/ledger/*");
        return bean;
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
    public ServletRegistrationBean<ScoreServlet> scoreServletBean() {
        return new ServletRegistrationBean<>(new ScoreServlet(), "/api/score/*");
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
                10 * 1024 * 1024,   // max file size 10MB
                20 * 1024 * 1024,   // max request size 20MB
                1024 * 1024         // file size threshold 1MB
        );
        bean.setMultipartConfig(multipartConfig);
        return bean;
    }

    @Bean
    public ServletRegistrationBean<AdminServlet> adminServletBean() {
        return new ServletRegistrationBean<>(new AdminServlet(), "/api/admin/*");
    }
}
