package com.tradetrust.model;

/** A logged-in user. role is TRADER or ADMIN. */
public class Session {
    public String token;
    public int userId;
    public String role;

    public boolean isAdmin() {
        return "ADMIN".equals(role);
    }
}
