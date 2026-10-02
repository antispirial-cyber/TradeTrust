package com.tradetrust.util;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;

public class PasswordUtil {

    public static String hash(String rawPassword) {
        if (rawPassword == null) return null;
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            byte[] hash = md.digest(rawPassword.getBytes(StandardCharsets.UTF_8));
            StringBuilder hexString = new StringBuilder();
            for (byte b : hash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) hexString.append('0');
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("SHA-256 algorithm not available", e);
        }
    }

    public static boolean verify(String rawPassword, String hashedPassword) {
        if (rawPassword == null || hashedPassword == null) return false;
        return hash(rawPassword).equalsIgnoreCase(hashedPassword);
    }
}
