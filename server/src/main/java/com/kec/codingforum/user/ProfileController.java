package com.kec.codingforum.user;

import com.kec.codingforum.admin.dto.DepartmentSummary;
import com.kec.codingforum.security.SecurityUtils;
import com.kec.codingforum.user.ProfileDtos.FacultyProfileResponse;
import com.kec.codingforum.user.ProfileDtos.StudentProfileResponse;
import com.kec.codingforum.user.ProfileDtos.UpdateFacultyProfileRequest;
import com.kec.codingforum.user.ProfileDtos.UpdateStudentProfileRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Set;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class ProfileController {

    private final StudentRepository students;
    private final FacultyRepository faculties;
    private final UserRepository users;
    private final StudentYearService studentYearService;

    @GetMapping("/student/profile")
    @PreAuthorize("hasRole('STUDENT')")
    public StudentProfileResponse studentProfile() {
        Student student = students.findById(SecurityUtils.getCurrentStudentId())
                .orElseThrow(() -> new IllegalArgumentException("Student profile not found."));
        return studentResponse(student);
    }

    @PutMapping("/student/profile")
    @PreAuthorize("hasRole('STUDENT')")
    @Transactional
    public StudentProfileResponse updateStudentProfile(@RequestBody UpdateStudentProfileRequest request) {
        Student student = students.findById(SecurityUtils.getCurrentStudentId())
                .orElseThrow(() -> new IllegalArgumentException("Student profile not found."));
        User user = users.findByStudentId(student.getId())
                .orElseThrow(() -> new IllegalArgumentException("Linked student login not found."));

        validateName(request.name());
        validateKonguEmail(request.email());
        validateEmailAvailable(request.email(), user.getId());
        validateTechnicalArea(request.technicalArea());

        student.setName(request.name().trim());
        student.setEmail(request.email().trim().toLowerCase());
        student.setContactNumber(cleanContact(request.contactNumber()));
        student.setSection(blankToNull(request.section()));
        student.setTechnicalArea(request.technicalArea().trim().toUpperCase());
        student.setYear(studentYearService.resolveYear(student.getRegisterNumber(), student.getYear()));
        student.setPlacementWilling(request.placementWilling());
        user.setEmail(student.getEmail());
        user.setUpdatedAt(LocalDateTime.now());
        users.save(user);
        return studentResponse(students.save(student));
    }

    @GetMapping("/faculty/profile")
    @PreAuthorize("hasRole('FACULTY')")
    public FacultyProfileResponse facultyProfile() {
        Faculty faculty = faculties.findById(SecurityUtils.getCurrentFacultyId())
                .orElseThrow(() -> new IllegalArgumentException("Faculty profile not found."));
        return facultyResponse(faculty);
    }

    @PutMapping("/faculty/profile")
    @PreAuthorize("hasRole('FACULTY')")
    @Transactional
    public FacultyProfileResponse updateFacultyProfile(@RequestBody UpdateFacultyProfileRequest request) {
        Faculty faculty = faculties.findById(SecurityUtils.getCurrentFacultyId())
                .orElseThrow(() -> new IllegalArgumentException("Faculty profile not found."));
        User user = users.findByFacultyId(faculty.getId())
                .orElseThrow(() -> new IllegalArgumentException("Linked faculty login not found."));

        validateName(request.name());
        validateKonguEmail(request.email());
        validateEmailAvailable(request.email(), user.getId());

        faculty.setName(request.name().trim());
        faculty.setEmail(request.email().trim().toLowerCase());
        faculty.setContactNumber(cleanContact(request.contactNumber()));
        user.setEmail(faculty.getEmail());
        user.setUpdatedAt(LocalDateTime.now());
        users.save(user);
        return facultyResponse(faculties.save(faculty));
    }

    private StudentProfileResponse studentResponse(Student student) {
        return new StudentProfileResponse(
                student.getId(),
                student.getRegisterNumber(),
                student.getName(),
                student.getEmail(),
                student.getContactNumber(),
                department(student),
                studentYearService.resolveYear(student.getRegisterNumber(), student.getYear()),
                student.getSection(),
                student.getTechnicalArea(),
                student.isPlacementWilling(),
                student.isActive()
        );
    }

    private FacultyProfileResponse facultyResponse(Faculty faculty) {
        return new FacultyProfileResponse(
                faculty.getId(),
                faculty.getFacultyCode(),
                faculty.getName(),
                faculty.getEmail(),
                faculty.getContactNumber(),
                faculty.getDepartment() == null ? null : new DepartmentSummary(faculty.getDepartment().getId(), faculty.getDepartment().getCode(), faculty.getDepartment().getName()),
                faculty.isDeptMonitoringEnabled(),
                faculty.isActive()
        );
    }

    private DepartmentSummary department(Student student) {
        if (student.getDepartment() == null) {
            return null;
        }
        return new DepartmentSummary(student.getDepartment().getId(), student.getDepartment().getCode(), student.getDepartment().getName());
    }

    private void validateName(String name) {
        if (name == null || name.isBlank()) {
            throw new IllegalArgumentException("Name is required.");
        }
    }

    private void validateKonguEmail(String email) {
        if (email == null || email.isBlank() || !email.trim().toLowerCase().endsWith("@kongu.edu")) {
            throw new IllegalArgumentException("Only @kongu.edu email addresses are allowed.");
        }
    }

    private void validateEmailAvailable(String email, Long userId) {
        if (users.existsByEmailIgnoreCaseAndIdNot(email.trim(), userId)) {
            throw new IllegalArgumentException("Email is already used by another login account.");
        }
    }

    private void validateTechnicalArea(String technicalArea) {
        if (technicalArea == null || !Set.of("SOFTWARE", "HARDWARE").contains(technicalArea.trim().toUpperCase())) {
            throw new IllegalArgumentException("Technical area must be SOFTWARE or HARDWARE.");
        }
    }

    private String cleanContact(String contactNumber) {
        if (contactNumber == null || contactNumber.isBlank()) {
            return null;
        }
        String cleaned = contactNumber.trim();
        if (!cleaned.matches("[0-9+\\-() ]{6,30}")) {
            throw new IllegalArgumentException("Contact number must be 6 to 30 characters and contain only numbers, spaces, +, -, or brackets.");
        }
        return cleaned;
    }

    private String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
