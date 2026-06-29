package com.kec.codingforum.analytics;

import com.kec.codingforum.analytics.dto.AdminAnalyticsSummaryDto;
import com.kec.codingforum.analytics.dto.CategoryAnalyticsDto;
import com.kec.codingforum.analytics.dto.DepartmentAnalyticsDto;
import com.kec.codingforum.analytics.dto.RecentActivityDto;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/admin/analytics")
@PreAuthorize("hasRole('SUPER_ADMIN')")
public class AdminAnalyticsController {

    private final AdminAnalyticsService service;

    public AdminAnalyticsController(AdminAnalyticsService service) {
        this.service = service;
    }

    @GetMapping("/summary")
    public AdminAnalyticsSummaryDto summary() {
        return service.summary();
    }

    @GetMapping("/departments")
    public List<DepartmentAnalyticsDto> departments() {
        return service.departments();
    }

    @GetMapping("/categories")
    public List<CategoryAnalyticsDto> categories() {
        return service.categories();
    }

    @GetMapping("/recent-activity")
    public List<RecentActivityDto> recentActivity() {
        return service.recentActivity();
    }
}
