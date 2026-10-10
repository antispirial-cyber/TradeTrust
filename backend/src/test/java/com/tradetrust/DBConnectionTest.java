package com.tradetrust;

import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

public class DBConnectionTest {

    @Test
    public void testDefaultConnectionSettings() {
        assertEquals("root", DBConnection.USER);
        assertEquals("tradetrust", DBConnection.PASSWORD);
        assertTrue(DBConnection.URL.contains("tradetrust_db"));
    }

    @Test
    public void testDriverClassExists() throws ClassNotFoundException {
        Class<?> driverClass = Class.forName(DBConnection.DRIVER);
        assertNotNull(driverClass);
    }

    @Test
    public void testDynamicResolutionFallback() {
        // Without environment variables set, getters return default values safely
        assertNotNull(DBConnection.getUrl());
        assertNotNull(DBConnection.getUser());
        assertNotNull(DBConnection.getPassword());
        assertTrue(DBConnection.getUrl().contains("jdbc:mysql:"));
    }
}
