package com.tradetrust;

import com.tradetrust.servlet.ApiServlet;

/**
 * SHA-256 password hashing utility.
 */
public class PasswordUtil {

    public static String hash(String raw) {
        if (raw == null) return null;
        return ApiServlet.hash(raw);
    }

    public static boolean verify(String raw, String expectedHash) {
        if (raw == null || expectedHash == null) return false;
        String calculated = hash(raw);
        return calculated.equalsIgnoreCase(expectedHash);
    }
}
