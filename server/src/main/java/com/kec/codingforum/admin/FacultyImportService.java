package com.kec.codingforum.admin;

import com.kec.codingforum.admin.dto.FacultyImportCreated;
import com.kec.codingforum.admin.dto.FacultyImportError;
import com.kec.codingforum.admin.dto.FacultyImportResult;
import com.kec.codingforum.admin.util.CsvImportUtil;
import com.kec.codingforum.admin.util.ExcelImportUtil;
import com.kec.codingforum.admin.util.ImportRow;
import com.kec.codingforum.department.Department;
import com.kec.codingforum.department.DepartmentRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

@Service
public class FacultyImportService {

    private static final long MAX_IMPORT_SIZE_BYTES = 5 * 1024 * 1024;

    private final FacultyAdminService facultyAdminService;
    private final DepartmentRepository departments;

    public FacultyImportService(FacultyAdminService facultyAdminService, DepartmentRepository departments) {
        this.facultyAdminService = facultyAdminService;
        this.departments = departments;
    }

    @Transactional
    public FacultyImportResult importFaculty(MultipartFile file) {
        List<ImportRow> rows = readRows(file);
        List<FacultyImportCreated> created = new ArrayList<>();
        List<FacultyImportError> errors = new ArrayList<>();

        for (ImportRow row : rows) {
            try {
                Department department = departments.findByCodeIgnoreCase(required(row, "departmentCode"))
                        .filter(Department::isActive)
                        .orElseThrow(() -> new IllegalArgumentException("Invalid departmentCode."));
                FacultyAdminService.FacultyCreateResult result = facultyAdminService.createFacultyWithAccount(
                        row.get("facultyCode"),
                        required(row, "name"),
                        required(row, "email"),
                        department.getId(),
                        parseBoolean(row.get("deptMonitoringEnabled"))
                );
                created.add(new FacultyImportCreated(
                        result.faculty().getFacultyCode(),
                        result.faculty().getEmail(),
                        result.temporaryPassword()
                ));
            } catch (IllegalArgumentException exception) {
                errors.add(new FacultyImportError(row.rowNumber(), exception.getMessage()));
            }
        }

        return new FacultyImportResult(rows.size(), created.size(), errors.size(), created, errors);
    }

    private List<ImportRow> readRows(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Import file is required.");
        }
        if (file.getSize() > MAX_IMPORT_SIZE_BYTES) {
            throw new IllegalArgumentException("Import file must be 5 MB or smaller.");
        }
        String filename = file.getOriginalFilename() == null ? "" : file.getOriginalFilename().toLowerCase();
        try {
            if (filename.endsWith(".xlsx")) {
                return ExcelImportUtil.read(file.getInputStream());
            }
            if (filename.endsWith(".csv")) {
                return CsvImportUtil.read(file.getInputStream());
            }
        } catch (IOException exception) {
            throw new IllegalArgumentException("Unable to read import file.");
        }
        throw new IllegalArgumentException("Only CSV and XLSX files are supported.");
    }

    private static String required(ImportRow row, String column) {
        String value = row.get(column);
        if (value.isBlank()) {
            throw new IllegalArgumentException(column + " is required.");
        }
        return value;
    }

    private static boolean parseBoolean(String value) {
        return "true".equalsIgnoreCase(value) || "yes".equalsIgnoreCase(value) || "1".equals(value);
    }
}
