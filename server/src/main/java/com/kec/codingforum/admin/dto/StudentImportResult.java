package com.kec.codingforum.admin.dto;

import java.util.List;

public record StudentImportResult(
        int totalRows,
        int successCount,
        int failedCount,
        List<StudentImportCreated> created,
        List<StudentImportError> errors
) {
}
