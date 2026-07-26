package com.kec.codingforum.admin;

import com.kec.codingforum.admin.dto.CreateStudentRequest;
import com.kec.codingforum.admin.dto.CreatedStudentResponse;
import com.kec.codingforum.admin.dto.StudentDto;
import com.kec.codingforum.auth.UserRole;
import com.kec.codingforum.department.Department;
import com.kec.codingforum.department.DepartmentRepository;
import com.kec.codingforum.user.Student;
import com.kec.codingforum.user.StudentRepository;
import com.kec.codingforum.user.StudentYearService;
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
public class StudentAdminService {

    private final StudentRepository students;
    private final DepartmentRepository departments;
    private final UserRepository users;
    private final PasswordEncoder passwordEncoder;
    private final StudentYearService studentYearService;

    public StudentAdminService(
            StudentRepository students,
            DepartmentRepository departments,
            UserRepository users,
            PasswordEncoder passwordEncoder,
            StudentYearService studentYearService
    ) {
        this.students = students;
        this.departments = departments;
        this.users = users;
        this.passwordEncoder = passwordEncoder;
        this.studentYearService = studentYearService;
    }

    @Transactional(readOnly = true)
    public Page<StudentDto> list(
            Pageable pageable,
            String search,
            Long departmentId,
            Integer year,
            String section,
            String technicalArea,
            Boolean placementWilling,
            Boolean active
    ) {
        Page<Student> studentPage = students.findAll(studentSpec(search, departmentId, year, section, technicalArea, placementWilling, active), pageable);
        Map<Long, User> linkedUsers = users.findByStudentIdIn(studentPage.getContent().stream().map(Student::getId).toList()).stream()
                .collect(Collectors.toMap(user -> user.getStudent().getId(), Function.identity()));
        return studentPage.map(student -> AdminMapping.studentDto(
                student,
                linkedUsers.containsKey(student.getId()) ? linkedUsers.get(student.getId()).getId() : null,
                studentYearService.resolveYear(student.getRegisterNumber(), student.getYear())
        ));
    }

    @Transactional
    public CreatedStudentResponse create(CreateStudentRequest request) {
        Student student = createStudentWithAccount(
                request.registerNumber(),
                request.name(),
                request.email(),
                request.departmentId(),
                request.year(),
                request.section(),
                request.technicalArea(),
                request.placementWilling()
        );
        return new CreatedStudentResponse(AdminMapping.studentDto(student, users), student.getRegisterNumber());
    }

    @Transactional
    public Student createStudentWithAccount(
            String registerNumber,
            String name,
            String email,
            Long departmentId,
            Integer year,
            String section,
            String technicalArea,
            boolean placementWilling
    ) {
        String normalizedRegisterNumber = required(registerNumber, "Register number is required.").toUpperCase(Locale.ROOT);
        String normalizedEmail = normalizeEmail(email);
        String normalizedSection = blankToNull(section);

        if (students.existsByRegisterNumberIgnoreCase(normalizedRegisterNumber)) {
            throw new IllegalArgumentException("Register number already exists.");
        }
        if (students.existsByEmailIgnoreCase(normalizedEmail) || users.existsByEmailIgnoreCase(normalizedEmail)) {
            throw new IllegalArgumentException("Email already exists.");
        }
        Integer effectiveYear = studentYearService.resolveYear(normalizedRegisterNumber, year);
        int maxCourseYears = studentYearService.courseDuration(normalizedRegisterNumber);
        if (effectiveYear == null || effectiveYear < 1 || effectiveYear > maxCourseYears) {
            throw new IllegalArgumentException("Year must be between 1 and " + maxCourseYears + " for this course.");
        }

        Department department = departments.findById(departmentId)
                .filter(Department::isActive)
                .orElseThrow(() -> new IllegalArgumentException("Department not found."));

        Student student = new Student();
        student.setRegisterNumber(normalizedRegisterNumber);
        student.setName(required(name, "Name is required."));
        student.setEmail(normalizedEmail);
        student.setDepartment(department);
        student.setYear(effectiveYear);
        student.setSection(normalizedSection);
        student.setTechnicalArea(validTechnicalArea(technicalArea));
        student.setPlacementWilling(placementWilling);
        student.setActive(true);
        Student savedStudent = students.save(student);

        User user = new User();
        user.setEmail(normalizedEmail);
        user.setPasswordHash(passwordEncoder.encode(normalizedRegisterNumber));
        user.setRole(UserRole.STUDENT.name());
        user.setStudent(savedStudent);
        user.setFaculty(null);
        user.setFirstLoginRequired(true);
        user.setActive(true);
        users.save(user);

        return savedStudent;
    }

    private Specification<Student> studentSpec(
            String search,
            Long departmentId,
            Integer year,
            String section,
            String technicalArea,
            Boolean placementWilling,
            Boolean active
    ) {
        return (root, query, builder) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (search != null && !search.isBlank()) {
                String like = "%" + search.toLowerCase(Locale.ROOT).trim() + "%";
                predicates.add(builder.or(
                        builder.like(builder.lower(root.get("registerNumber")), like),
                        builder.like(builder.lower(root.get("name")), like),
                        builder.like(builder.lower(root.get("email")), like)
                ));
            }
            if (departmentId != null) {
                predicates.add(builder.equal(root.get("department").get("id"), departmentId));
            }
            if (year != null) {
                predicates.add(builder.equal(root.get("year"), year));
            }
            if (section != null && !section.isBlank()) {
                predicates.add(builder.equal(builder.lower(root.get("section")), section.toLowerCase(Locale.ROOT).trim()));
            }
            if (technicalArea != null && !technicalArea.isBlank()) {
                predicates.add(builder.equal(root.get("technicalArea"), validTechnicalArea(technicalArea)));
            }
            if (placementWilling != null) {
                predicates.add(builder.equal(root.get("placementWilling"), placementWilling));
            }
            if (active != null) {
                predicates.add(builder.equal(root.get("active"), active));
            }
            return builder.and(predicates.toArray(Predicate[]::new));
        };
    }

    static String normalizeEmail(String email) {
        String normalized = required(email, "Email is required.").toLowerCase(Locale.ROOT);
        if (!normalized.endsWith("@kongu.edu")) {
            throw new IllegalArgumentException("Only @kongu.edu email addresses are allowed.");
        }
        return normalized;
    }

    static String required(String value, String message) {
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException(message);
        }
        return value.trim();
    }

    static String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    static String validTechnicalArea(String value) {
        String normalized = value == null || value.isBlank() ? "SOFTWARE" : value.trim().toUpperCase(Locale.ROOT);
        if (!List.of("SOFTWARE", "HARDWARE").contains(normalized)) {
            throw new IllegalArgumentException("Technical area must be SOFTWARE or HARDWARE.");
        }
        return normalized;
    }
}
