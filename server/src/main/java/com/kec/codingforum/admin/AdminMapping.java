package com.kec.codingforum.admin;

import com.kec.codingforum.admin.dto.DepartmentSummary;
import com.kec.codingforum.admin.dto.FacultyDto;
import com.kec.codingforum.admin.dto.StudentDto;
import com.kec.codingforum.department.Department;
import com.kec.codingforum.user.Faculty;
import com.kec.codingforum.user.Student;
import com.kec.codingforum.user.UserRepository;

final class AdminMapping {

    private AdminMapping() {
    }

    static DepartmentSummary departmentSummary(Department department) {
        if (department == null) {
            return null;
        }
        return new DepartmentSummary(department.getId(), department.getCode(), department.getName());
    }

    static StudentDto studentDto(Student student, UserRepository users) {
        Long linkedUserId = users.findByStudentId(student.getId()).map(user -> user.getId()).orElse(null);
        return studentDto(student, linkedUserId, student.getYear());
    }

    static StudentDto studentDto(Student student, Long linkedUserId, Integer currentYear) {
        return new StudentDto(
                student.getId(),
                student.getRegisterNumber(),
                student.getName(),
                student.getEmail(),
                departmentSummary(student.getDepartment()),
                currentYear,
                student.getSection(),
                student.getTechnicalArea(),
                student.isPlacementWilling(),
                student.isActive(),
                linkedUserId
        );
    }

    static FacultyDto facultyDto(Faculty faculty, UserRepository users) {
        Long linkedUserId = users.findByFacultyId(faculty.getId()).map(user -> user.getId()).orElse(null);
        return facultyDto(faculty, linkedUserId);
    }

    static FacultyDto facultyDto(Faculty faculty, Long linkedUserId) {
        return new FacultyDto(
                faculty.getId(),
                faculty.getFacultyCode(),
                faculty.getName(),
                faculty.getEmail(),
                departmentSummary(faculty.getDepartment()),
                faculty.isDeptMonitoringEnabled(),
                faculty.isActive(),
                linkedUserId
        );
    }
}
