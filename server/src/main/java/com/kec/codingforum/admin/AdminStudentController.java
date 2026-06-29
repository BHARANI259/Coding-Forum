package com.kec.codingforum.admin;

import com.kec.codingforum.admin.dto.CreateStudentRequest;
import com.kec.codingforum.admin.dto.CreatedStudentResponse;
import com.kec.codingforum.admin.dto.StudentDto;
import com.kec.codingforum.admin.dto.StudentImportResult;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.MediaType;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/admin/students")
@PreAuthorize("hasRole('SUPER_ADMIN')")
public class AdminStudentController {

    private final StudentAdminService studentAdminService;
    private final StudentImportService studentImportService;

    public AdminStudentController(StudentAdminService studentAdminService, StudentImportService studentImportService) {
        this.studentAdminService = studentAdminService;
        this.studentImportService = studentImportService;
    }

    @GetMapping
    public Page<StudentDto> list(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Long departmentId,
            @RequestParam(required = false) Integer year,
            @RequestParam(required = false) String section,
            @RequestParam(required = false) String technicalArea,
            @RequestParam(required = false) Boolean placementWilling,
            @RequestParam(required = false) Boolean active
    ) {
        PageRequest pageable = PageRequest.of(Math.max(page, 0), Math.min(Math.max(size, 1), 100), Sort.by("createdAt").descending());
        return studentAdminService.list(pageable, search, departmentId, year, section, technicalArea, placementWilling, active);
    }

    @PostMapping
    public CreatedStudentResponse create(@Valid @RequestBody CreateStudentRequest request) {
        return studentAdminService.create(request);
    }

    @PostMapping(value = "/import", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public StudentImportResult importStudents(@RequestPart("file") MultipartFile file) {
        return studentImportService.importStudents(file);
    }
}
