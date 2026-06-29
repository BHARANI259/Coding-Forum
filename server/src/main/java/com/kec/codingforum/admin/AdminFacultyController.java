package com.kec.codingforum.admin;

import com.kec.codingforum.admin.dto.CreateFacultyRequest;
import com.kec.codingforum.admin.dto.CreatedFacultyResponse;
import com.kec.codingforum.admin.dto.FacultyDto;
import com.kec.codingforum.admin.dto.FacultyImportResult;
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
@RequestMapping("/api/admin/faculty")
@PreAuthorize("hasRole('SUPER_ADMIN')")
public class AdminFacultyController {

    private final FacultyAdminService facultyAdminService;
    private final FacultyImportService facultyImportService;

    public AdminFacultyController(FacultyAdminService facultyAdminService, FacultyImportService facultyImportService) {
        this.facultyAdminService = facultyAdminService;
        this.facultyImportService = facultyImportService;
    }

    @GetMapping
    public Page<FacultyDto> list(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Long departmentId,
            @RequestParam(required = false) Boolean deptMonitoringEnabled,
            @RequestParam(required = false) Boolean active
    ) {
        PageRequest pageable = PageRequest.of(Math.max(page, 0), Math.min(Math.max(size, 1), 100), Sort.by("createdAt").descending());
        return facultyAdminService.list(pageable, search, departmentId, deptMonitoringEnabled, active);
    }

    @PostMapping
    public CreatedFacultyResponse create(@Valid @RequestBody CreateFacultyRequest request) {
        return facultyAdminService.create(request);
    }

    @PostMapping(value = "/import", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public FacultyImportResult importFaculty(@RequestPart("file") MultipartFile file) {
        return facultyImportService.importFaculty(file);
    }
}
