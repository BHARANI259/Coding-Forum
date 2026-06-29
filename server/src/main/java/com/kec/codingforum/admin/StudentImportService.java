package com.kec.codingforum.admin;

import com.kec.codingforum.admin.dto.StudentImportCreated;
import com.kec.codingforum.admin.dto.StudentImportError;
import com.kec.codingforum.admin.dto.StudentImportResult;
import com.kec.codingforum.admin.util.CsvImportUtil;
import com.kec.codingforum.admin.util.ExcelImportUtil;
import com.kec.codingforum.admin.util.ImportRow;
import com.kec.codingforum.department.Department;
import com.kec.codingforum.department.DepartmentRepository;
import com.kec.codingforum.user.Student;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

@Service
public class StudentImportService {

    private final StudentAdminService studentAdminService;
    private final DepartmentRepository departments;

    public StudentImportService(StudentAdminService studentAdminService, DepartmentRepository departments) {
        this.studentAdminService = studentAdminService;
        this.departments = departments;
    }

    @Transactional
    public StudentImportResult importStudents(MultipartFile file) {
        List<ImportRow> rows = readRows(file);
        List<StudentImportCreated> created = new ArrayList<>();
        List<StudentImportError> errors = new ArrayList<>();

        for (ImportRow row : rows) {
            try {
                Department department = departments.findByCodeIgnoreCase(required(row, "departmentCode"))
                        .filter(Department::isActive)
                        .orElseThrow(() -> new IllegalArgumentException("Invalid departmentCode."));
                Integer year = parseYear(required(row, "year"));
                boolean placementWilling = parseBoolean(row.get("placementWilling"));

                Student student = studentAdminService.createStudentWithAccount(
                        required(row, "registerNumber"),
                        required(row, "name"),
                        required(row, "email"),
                        department.getId(),
                        year,
                        row.get("section"),
                        row.get("technicalArea"),
                        placementWilling
                );
                created.add(new StudentImportCreated(student.getRegisterNumber(), student.getEmail(), student.getRegisterNumber()));
            } catch (IllegalArgumentException exception) {
                errors.add(new StudentImportError(row.rowNumber(), exception.getMessage()));
            }
        }

        return new StudentImportResult(rows.size(), created.size(), errors.size(), created, errors);
    }

    private List<ImportRow> readRows(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Import file is required.");
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

    private static Integer parseYear(String value) {
        try {
            return Integer.parseInt(value);
        } catch (NumberFormatException exception) {
            throw new IllegalArgumentException("year must be a number.");
        }
    }

    private static boolean parseBoolean(String value) {
        return "true".equalsIgnoreCase(value) || "yes".equalsIgnoreCase(value) || "1".equals(value);
    }
}
