package com.kec.codingforum.admin;

import com.kec.codingforum.admin.dto.CreateDepartmentRequest;
import com.kec.codingforum.admin.dto.DepartmentDto;
import com.kec.codingforum.department.Department;
import com.kec.codingforum.department.DepartmentRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class DepartmentService {

    private final DepartmentRepository departments;

    public DepartmentService(DepartmentRepository departments) {
        this.departments = departments;
    }

    @Transactional(readOnly = true)
    public List<DepartmentDto> listActive() {
        return departments.findByActiveTrueOrderByCodeAsc().stream()
                .map(this::toDto)
                .toList();
    }

    @Transactional
    public DepartmentDto create(CreateDepartmentRequest request) {
        String code = request.code().trim().toUpperCase();
        if (departments.existsByCodeIgnoreCase(code)) {
            throw new IllegalArgumentException("Department code already exists.");
        }

        Department department = new Department();
        department.setCode(code);
        department.setName(request.name().trim());
        department.setActive(true);
        return toDto(departments.save(department));
    }

    DepartmentDto toDto(Department department) {
        return new DepartmentDto(department.getId(), department.getCode(), department.getName(), department.isActive());
    }
}
