package com.kec.codingforum.admin.dto;

import java.util.List;

public record FacultyImportResult(
        int totalRows,
        int successCount,
        int failedCount,
        List<FacultyImportCreated> created,
        List<FacultyImportError> errors
) {
}
