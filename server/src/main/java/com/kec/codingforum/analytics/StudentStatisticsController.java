package com.kec.codingforum.analytics;

import com.kec.codingforum.analytics.dto.PageDto;
import com.kec.codingforum.analytics.dto.StudentPointHistoryDto;
import com.kec.codingforum.analytics.dto.StudentStatisticsDto;
import com.kec.codingforum.security.SecurityUtils;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/student")
@PreAuthorize("hasRole('STUDENT')")
public class StudentStatisticsController {

    private final StudentStatisticsService service;

    public StudentStatisticsController(StudentStatisticsService service) {
        this.service = service;
    }

    @GetMapping("/statistics")
    public StudentStatisticsDto statistics() {
        return service.statistics(SecurityUtils.getCurrentStudentId());
    }

    @GetMapping("/points/history")
    public PageDto<StudentPointHistoryDto> history(@RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "10") int size, @RequestParam(required = false) Long categoryId, @RequestParam(required = false) Long eventId) {
        return service.history(SecurityUtils.getCurrentStudentId(), page, size, categoryId, eventId);
    }
}
