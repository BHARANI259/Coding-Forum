package com.kec.codingforum.event.dto;

import java.time.LocalDateTime;

public record EventInchargeDto(
        Long assignmentId,
        Long eventId,
        String eventTitle,
        String eventCategory,
        String eventStatus,
        Long facultyId,
        String facultyName,
        String facultyCode,
        String facultyEmail,
        String facultyDepartmentCode,
        String facultyDepartmentName,
        boolean primaryIncharge,
        String responsibility,
        LocalDateTime assignedAt
) {
}
