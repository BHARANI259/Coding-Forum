package com.kec.codingforum.analytics;

import com.kec.codingforum.analytics.dto.DepartmentStudentStatsDto;
import com.kec.codingforum.analytics.dto.FacultyDepartmentSummaryDto;
import com.kec.codingforum.analytics.dto.PageDto;
import com.kec.codingforum.analytics.dto.StudentLeaderboardRowDto;
import com.kec.codingforum.security.SecurityUtils;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/faculty/department-monitoring")
@PreAuthorize("hasRole('FACULTY')")
public class FacultyDepartmentMonitoringController {

    private final FacultyDepartmentMonitoringService service;

    public FacultyDepartmentMonitoringController(FacultyDepartmentMonitoringService service) {
        this.service = service;
    }

    @GetMapping("/summary")
    public FacultyDepartmentSummaryDto summary() {
        return service.summary(SecurityUtils.getCurrentFacultyId());
    }

    @GetMapping("/students")
    public PageDto<DepartmentStudentStatsDto> students(@RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "10") int size, @RequestParam(required = false) String search) {
        return service.students(SecurityUtils.getCurrentFacultyId(), page, size, search);
    }

    @GetMapping("/leaderboard")
    public PageDto<StudentLeaderboardRowDto> leaderboard() {
        return service.leaderboard(SecurityUtils.getCurrentFacultyId());
    }
}
