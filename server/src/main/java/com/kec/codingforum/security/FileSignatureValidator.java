package com.kec.codingforum.security;

import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.util.Locale;

public final class FileSignatureValidator {

    private FileSignatureValidator() {
    }

    public static boolean hasExpectedImageSignature(MultipartFile file, String contentType) {
        byte[] header = readHeader(file, 16);
        String normalizedType = normalize(contentType);
        return switch (normalizedType) {
            case "image/jpeg" -> isJpeg(header);
            case "image/png" -> isPng(header);
            case "image/webp" -> isWebp(header);
            default -> false;
        };
    }

    public static boolean hasExpectedSpreadsheetSignature(MultipartFile file, String originalFileName) {
        byte[] header = readHeader(file, 8);
        String lower = originalFileName == null ? "" : originalFileName.toLowerCase(Locale.ROOT);
        if (lower.endsWith(".xlsx")) {
            return isZip(header);
        }
        if (lower.endsWith(".xls")) {
            return isOle(header);
        }
        if (lower.endsWith(".csv")) {
            return !isExecutableOrArchive(header);
        }
        return false;
    }

    private static byte[] readHeader(MultipartFile file, int length) {
        try (InputStream input = file.getInputStream()) {
            return input.readNBytes(length);
        } catch (IOException exception) {
            throw new IllegalArgumentException("Unable to inspect uploaded file.");
        }
    }

    private static boolean isJpeg(byte[] header) {
        return header.length >= 3
                && unsigned(header[0]) == 0xFF
                && unsigned(header[1]) == 0xD8
                && unsigned(header[2]) == 0xFF;
    }

    private static boolean isPng(byte[] header) {
        return header.length >= 8
                && unsigned(header[0]) == 0x89
                && header[1] == 0x50
                && header[2] == 0x4E
                && header[3] == 0x47
                && header[4] == 0x0D
                && header[5] == 0x0A
                && header[6] == 0x1A
                && header[7] == 0x0A;
    }

    private static boolean isWebp(byte[] header) {
        return header.length >= 12
                && header[0] == 0x52
                && header[1] == 0x49
                && header[2] == 0x46
                && header[3] == 0x46
                && header[8] == 0x57
                && header[9] == 0x45
                && header[10] == 0x42
                && header[11] == 0x50;
    }

    private static boolean isZip(byte[] header) {
        return header.length >= 4
                && header[0] == 0x50
                && header[1] == 0x4B
                && (header[2] == 0x03 || header[2] == 0x05 || header[2] == 0x07)
                && (header[3] == 0x04 || header[3] == 0x06 || header[3] == 0x08);
    }

    private static boolean isOle(byte[] header) {
        return header.length >= 8
                && unsigned(header[0]) == 0xD0
                && unsigned(header[1]) == 0xCF
                && unsigned(header[2]) == 0x11
                && unsigned(header[3]) == 0xE0
                && unsigned(header[4]) == 0xA1
                && unsigned(header[5]) == 0xB1
                && unsigned(header[6]) == 0x1A
                && unsigned(header[7]) == 0xE1;
    }

    private static boolean isExecutableOrArchive(byte[] header) {
        return isZip(header)
                || isOle(header)
                || (header.length >= 2 && header[0] == 0x4D && header[1] == 0x5A);
    }

    private static int unsigned(byte value) {
        return value & 0xFF;
    }

    private static String normalize(String contentType) {
        return contentType == null ? "" : contentType.toLowerCase(Locale.ROOT).trim();
    }
}
