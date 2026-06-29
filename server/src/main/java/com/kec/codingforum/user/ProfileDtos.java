package com.kec.codingforum.user;

import com.kec.codingforum.admin.dto.DepartmentSummary;

public final class ProfileDtos {
    private ProfileDtos() {
    }

    public record StudentProfileResponse(
            Long id,
            String registerNumber,
            String name,
            String email,
            String contactNumber,
            DepartmentSummary department,
            Integer year,
            String section,
            String technicalArea,
            boolean placementWilling,
            boolean active
    ) {
    }

    public record UpdateStudentProfileRequest(
            String name,
            String email,
            String contactNumber,
            String section,
            String technicalArea,
            boolean placementWilling
    ) {
    }

    public record FacultyProfileResponse(
            Long id,
            String facultyCode,
            String name,
            String email,
            String contactNumber,
            DepartmentSummary department,
            boolean deptMonitoringEnabled,
            boolean active
    ) {
    }

    public record UpdateFacultyProfileRequest(
            String name,
            String email,
            String contactNumber
    ) {
    }
}
