package com.kec.codingforum.event;

import com.kec.codingforum.user.Student;
import com.kec.codingforum.user.StudentRepository;
import com.kec.codingforum.user.StudentYearService;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;

@Service
public class EventEligibilityService {

    private final StudentRepository students;
    private final StudentYearService studentYearService;

    public EventEligibilityService(StudentRepository students, StudentYearService studentYearService) {
        this.students = students;
        this.studentYearService = studentYearService;
    }

    public boolean isEligible(Event event, Student student) {
        return departmentAllowed(event, student)
                && yearAllowed(event, student)
                && sectionAllowed(event, student)
                && placementAllowed(event, student)
                && technicalAreaAllowed(event, student);
    }

    public void assertEligible(Event event, Student student) {
        if (!isEligible(event, student)) {
            throw new AccessDeniedException("You are not eligible for this event.");
        }
    }

    public void assertEligibleByStudentId(Event event, Long studentId) {
        Student student = students.findById(studentId).orElseThrow(() -> new AccessDeniedException("Student profile not found."));
        assertEligible(event, student);
    }

    private boolean departmentAllowed(Event event, Student student) {
        return event.getAllowedDepartments().isEmpty()
                || event.getAllowedDepartments().stream().anyMatch(department -> student.getDepartment() != null && department.getId().equals(student.getDepartment().getId()));
    }

    private boolean yearAllowed(Event event, Student student) {
        Integer currentYear = studentYearService.resolveYear(student.getRegisterNumber(), student.getYear());
        return event.getAllowedYears().isEmpty() || event.getAllowedYears().contains(currentYear);
    }

    private boolean sectionAllowed(Event event, Student student) {
        return event.getAllowedSections().isEmpty()
                || event.getAllowedSections().stream().anyMatch(section -> section.equalsIgnoreCase(student.getSection() == null ? "" : student.getSection()));
    }

    private boolean placementAllowed(Event event, Student student) {
        return !event.isPlacementWillingOnly() || student.isPlacementWilling();
    }

    private boolean technicalAreaAllowed(Event event, Student student) {
        return event.getAllowedTechnicalAreas().isEmpty() || event.getAllowedTechnicalAreas().contains(student.getTechnicalArea());
    }
}
