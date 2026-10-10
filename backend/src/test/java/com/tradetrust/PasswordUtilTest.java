package com.tradetrust;

import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

public class PasswordUtilTest {

    @Test
    public void testHashProduces64HexChars() {
        String raw = "tradetrust";
        String hash = PasswordUtil.hash(raw);
        assertNotNull(hash);
        assertEquals(64, hash.length());
    }

    @Test
    public void testKnownHashForTradetrust() {
        // "tradetrust" standard SHA-256 hash
        String expected = "e041baff2d3294f61dcc6b8c265e26562bfd8b21c9400ee8dc6d7ab6e1e09e0a";
        String hash = PasswordUtil.hash("tradetrust");
        assertEquals(expected.toLowerCase(), hash.toLowerCase());
    }

    @Test
    public void testVerifySuccess() {
        String raw = "admin123";
        String hash = PasswordUtil.hash(raw);
        assertTrue(PasswordUtil.verify(raw, hash));
    }

    @Test
    public void testVerifyFailure() {
        String raw = "correctPassword";
        String hash = PasswordUtil.hash(raw);
        assertFalse(PasswordUtil.verify("wrongPassword", hash));
    }

    @Test
    public void testNullHandling() {
        assertNull(PasswordUtil.hash(null));
        assertFalse(PasswordUtil.verify(null, "hash"));
        assertFalse(PasswordUtil.verify("pwd", null));
    }
}
