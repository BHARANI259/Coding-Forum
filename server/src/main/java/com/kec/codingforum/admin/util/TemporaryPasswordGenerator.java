package com.kec.codingforum.admin.util;

import java.security.SecureRandom;

public final class TemporaryPasswordGenerator {

    private static final String CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789@#";
    private static final SecureRandom RANDOM = new SecureRandom();

    private TemporaryPasswordGenerator() {
    }

    public static String generate() {
        StringBuilder password = new StringBuilder("Kec@");
        for (int i = 0; i < 8; i++) {
            password.append(CHARS.charAt(RANDOM.nextInt(CHARS.length())));
        }
        return password.toString();
    }
}
