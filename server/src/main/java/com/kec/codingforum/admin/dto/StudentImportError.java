package com.kec.codingforum.admin.dto;

public record StudentImportError(
        int rowNumber,
        String message
) {
}
