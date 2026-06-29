package com.kec.codingforum.admin;

import com.kec.codingforum.admin.dto.CreateDepartmentRequest;
import com.kec.codingforum.admin.dto.DepartmentDto;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/admin/departments")
@PreAuthorize("hasRole('SUPER_ADMIN')")
public class AdminDepartmentController {

    private final DepartmentService departmentService;

    public AdminDepartmentController(DepartmentService departmentService) {
        this.departmentService = departmentService;
    }

    @GetMapping
    public List<DepartmentDto> list() {
        return departmentService.listActive();
    }

    @PostMapping
    public DepartmentDto create(@Valid @RequestBody CreateDepartmentRequest request) {
        return departmentService.create(request);
    }
}
