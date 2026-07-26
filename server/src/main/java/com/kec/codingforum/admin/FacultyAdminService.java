package com.kec.codingforum.admin;

import com.kec.codingforum.admin.dto.CreateFacultyRequest;
import com.kec.codingforum.admin.dto.CreatedFacultyResponse;
import com.kec.codingforum.admin.dto.FacultyDto;
import com.kec.codingforum.admin.util.TemporaryPasswordGenerator;
import com.kec.codingforum.auth.UserRole;
import com.kec.codingforum.department.Department;
import com.kec.codingforum.department.DepartmentRepository;
import com.kec.codingforum.user.Faculty;
import com.kec.codingforum.user.FacultyRepository;
import com.kec.codingforum.user.User;
import com.kec.codingforum.user.UserRepository;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class FacultyAdminService {

    private final FacultyRepository faculties;
    private final DepartmentRepository departments;
    private final UserRepository users;
    private final PasswordEncoder passwordEncoder;

    public FacultyAdminService(
            FacultyRepository faculties,
            DepartmentRepository departments,
            UserRepository users,
            PasswordEncoder passwordEncoder
    ) {
        this.faculties = faculties;
        this.departments = departments;
        this.users = users;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional(readOnly = true)
    public Page<FacultyDto> list(
            Pageable pageable,
            String search,
            Long departmentId,
            Boolean deptMonitoringEnabled,
            Boolean active
    ) {
        Page<Faculty> facultyPage = faculties.findAll(facultySpec(search, departmentId, deptMonitoringEnabled, active), pageable);
        Map<Long, User> linkedUsers = users.findByFacultyIdIn(facultyPage.getContent().stream().map(Faculty::getId).toList()).stream()
                .collect(Collectors.toMap(user -> user.getFaculty().getId(), Function.identity()));
        return facultyPage.map(faculty -> AdminMapping.facultyDto(
                faculty,
                linkedUsers.containsKey(faculty.getId()) ? linkedUsers.get(faculty.getId()).getId() : null
        ));
    }

    @Transactional
    public CreatedFacultyResponse create(CreateFacultyRequest request) {
        FacultyCreateResult result = createFacultyWithAccount(
                request.facultyCode(),
                request.name(),
                request.email(),
                request.departmentId(),
                request.deptMonitoringEnabled()
        );
        Faculty faculty = result.faculty();
        return new CreatedFacultyResponse(
                faculty.getId(),
                faculty.getFacultyCode(),
                faculty.getName(),
                faculty.getEmail(),
                result.temporaryPassword()
        );
    }

    @Transactional
    public FacultyCreateResult createFacultyWithAccount(
            String facultyCode,
            String name,
            String email,
            Long departmentId,
            boolean deptMonitoringEnabled
    ) {
        String normalizedFacultyCode = StudentAdminService.blankToNull(facultyCode);
        if (normalizedFacultyCode != null) {
            normalizedFacultyCode = normalizedFacultyCode.toUpperCase(Locale.ROOT);
            if (faculties.existsByFacultyCodeIgnoreCase(normalizedFacultyCode)) {
                throw new IllegalArgumentException("Faculty code already exists.");
            }
        }

        String normalizedEmail = StudentAdminService.normalizeEmail(email);
        if (faculties.existsByEmailIgnoreCase(normalizedEmail) || users.existsByEmailIgnoreCase(normalizedEmail)) {
            throw new IllegalArgumentException("Email already exists.");
        }

        Department department = departments.findById(departmentId)
                .filter(Department::isActive)
                .orElseThrow(() -> new IllegalArgumentException("Department not found."));

        Faculty faculty = new Faculty();
        faculty.setFacultyCode(normalizedFacultyCode);
        faculty.setName(StudentAdminService.required(name, "Name is required."));
        faculty.setEmail(normalizedEmail);
        faculty.setDepartment(department);
        faculty.setDeptMonitoringEnabled(deptMonitoringEnabled);
        faculty.setActive(true);
        Faculty savedFaculty = faculties.save(faculty);

        String temporaryPassword = normalizedFacultyCode == null ? TemporaryPasswordGenerator.generate() : normalizedFacultyCode;
        User user = new User();
        user.setEmail(normalizedEmail);
        user.setPasswordHash(passwordEncoder.encode(temporaryPassword));
        user.setRole(UserRole.FACULTY.name());
        user.setStudent(null);
        user.setFaculty(savedFaculty);
        user.setFirstLoginRequired(true);
        user.setActive(true);
        users.save(user);

        return new FacultyCreateResult(savedFaculty, temporaryPassword);
    }

    private Specification<Faculty> facultySpec(
            String search,
            Long departmentId,
            Boolean deptMonitoringEnabled,
            Boolean active
    ) {
        return (root, query, builder) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (search != null && !search.isBlank()) {
                String like = "%" + search.toLowerCase(Locale.ROOT).trim() + "%";
                predicates.add(builder.or(
                        builder.like(builder.lower(root.get("facultyCode")), like),
                        builder.like(builder.lower(root.get("name")), like),
                        builder.like(builder.lower(root.get("email")), like)
                ));
            }
            if (departmentId != null) {
                predicates.add(builder.equal(root.get("department").get("id"), departmentId));
            }
            if (deptMonitoringEnabled != null) {
                predicates.add(builder.equal(root.get("deptMonitoringEnabled"), deptMonitoringEnabled));
            }
            if (active != null) {
                predicates.add(builder.equal(root.get("active"), active));
            }
            return builder.and(predicates.toArray(Predicate[]::new));
        };
    }

    public record FacultyCreateResult(Faculty faculty, String temporaryPassword) {
    }
}
