package com.tradetrust;

import com.tradetrust.util.DBConnection;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.jdbc.DataSourceAutoConfiguration;
import org.springframework.boot.autoconfigure.orm.jpa.HibernateJpaAutoConfiguration;
import org.springframework.context.annotation.Bean;

import java.sql.Connection;
import java.sql.ResultSet;
import java.sql.Statement;

@SpringBootApplication(exclude = {DataSourceAutoConfiguration.class, HibernateJpaAutoConfiguration.class})
public class TradeTrustApplication {

    public static void main(String[] args) {
        SpringApplication.run(TradeTrustApplication.class, args);
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
                    System.out.println("Database connection verified! Total registered traders: " + count);
                }
            } catch (Exception e) {
                System.err.println("Database connectivity warning: " + e.getMessage());
            }
            System.out.println("TradeTrust Backend ready on http://localhost:8080");
            System.out.println("==================================================");
        };
    }
}
