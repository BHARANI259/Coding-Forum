package com.kec.codingforum.admin.dto;

public record StudentImportCreated(
        String registerNumber,
        String email,
        String temporaryPassword
) {
}
