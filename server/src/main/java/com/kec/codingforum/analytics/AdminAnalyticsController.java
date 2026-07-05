package com.kec.codingforum.analytics;

import com.kec.codingforum.analytics.dto.AdminAnalyticsSummaryDto;
import com.kec.codingforum.analytics.dto.AdminAnalyticsFiltersDto;
import com.kec.codingforum.analytics.dto.CategoryAnalyticsDto;
import com.kec.codingforum.analytics.dto.CategoryParticipationChartDto;
import com.kec.codingforum.analytics.dto.DepartmentAnalyticsDto;
import com.kec.codingforum.analytics.dto.DepartmentParticipationChartDto;
import com.kec.codingforum.analytics.dto.DepartmentPointsChartDto;
import com.kec.codingforum.analytics.dto.EventEngagementDto;
import com.kec.codingforum.analytics.dto.EventStatusSummaryDto;
import com.kec.codingforum.analytics.dto.RecentActivityDto;
import com.kec.codingforum.analytics.dto.RegistrationTrendDto;
import com.kec.codingforum.analytics.dto.ResultDistributionDto;
import com.kec.codingforum.analytics.dto.TechnicalAreaParticipationDto;
import com.kec.codingforum.analytics.dto.TopDepartmentAnalyticsDto;
import com.kec.codingforum.analytics.dto.TopStudentAnalyticsDto;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
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

    @GetMapping("/overview")
    public AdminAnalyticsSummaryDto overview() {
        return service.overview();
    }

    @GetMapping("/department-participation")
    public List<DepartmentParticipationChartDto> departmentParticipation(
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate,
            @RequestParam(required = false) String technicalArea
    ) {
        return service.departmentParticipation(categoryId, fromDate, toDate, technicalArea);
    }

    @GetMapping("/department-points")
    public List<DepartmentPointsChartDto> departmentPoints(
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate,
            @RequestParam(required = false) String technicalArea
    ) {
        return service.departmentPoints(categoryId, fromDate, toDate, technicalArea);
    }

    @GetMapping("/category-participation")
    public List<CategoryParticipationChartDto> categoryParticipation(
            @RequestParam(required = false) Long departmentId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate,
            @RequestParam(required = false) String technicalArea
    ) {
        return service.categoryParticipation(departmentId, fromDate, toDate, technicalArea);
    }

    @GetMapping("/registration-trend")
    public List<RegistrationTrendDto> registrationTrend(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate,
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) Long departmentId,
            @RequestParam(required = false) String technicalArea,
            @RequestParam(required = false) String groupBy
    ) {
        return service.registrationTrend(fromDate, toDate, categoryId, departmentId, technicalArea, groupBy);
    }

    @GetMapping("/result-distribution")
    public List<ResultDistributionDto> resultDistribution(
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) Long departmentId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate,
            @RequestParam(required = false) String technicalArea
    ) {
        return service.resultDistribution(categoryId, departmentId, fromDate, toDate, technicalArea);
    }

    @GetMapping("/technical-area-participation")
    public List<TechnicalAreaParticipationDto> technicalAreaParticipation(
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) Long departmentId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate
    ) {
        return service.technicalAreaParticipation(categoryId, departmentId, fromDate, toDate);
    }

    @GetMapping("/event-status-summary")
    public List<EventStatusSummaryDto> eventStatusSummary() {
        return service.eventStatusSummary();
    }

    @GetMapping("/top-students")
    public List<TopStudentAnalyticsDto> topStudents(
            @RequestParam(required = false) Integer limit,
            @RequestParam(required = false) Long departmentId,
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate,
            @RequestParam(required = false) String technicalArea
    ) {
        return service.topStudents(limit, departmentId, categoryId, fromDate, toDate, technicalArea);
    }

    @GetMapping("/top-departments")
    public List<TopDepartmentAnalyticsDto> topDepartments(
            @RequestParam(required = false) Integer limit,
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate
    ) {
        return service.topDepartments(limit, categoryId, fromDate, toDate);
    }

    @GetMapping("/event-engagement")
    public List<EventEngagementDto> eventEngagement(
            @RequestParam(required = false) Integer limit,
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate,
            @RequestParam(required = false) String status
    ) {
        return service.eventEngagement(limit, categoryId, fromDate, toDate, status);
    }

    @GetMapping("/filters")
    public AdminAnalyticsFiltersDto filters() {
        return service.filters();
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
