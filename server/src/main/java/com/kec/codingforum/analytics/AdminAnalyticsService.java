package com.kec.codingforum.analytics;

import com.kec.codingforum.analytics.dto.AdminAnalyticsFiltersDto;
import com.kec.codingforum.analytics.dto.AdminAnalyticsSummaryDto;
import com.kec.codingforum.analytics.dto.AnalyticsFilterOptionDto;
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
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.sql.Timestamp;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

@Service
public class AdminAnalyticsService {

    private final JdbcTemplate jdbc;

    public AdminAnalyticsService(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public AdminAnalyticsSummaryDto summary() {
        return overview();
    }

    public AdminAnalyticsSummaryDto overview() {
        return new AdminAnalyticsSummaryDto(
                count("students"),
                count("faculties"),
                count("departments"),
                count("events"),
                countWhere("events", "status='PUBLISHED'"),
                countWhere("events", "status='COMPLETED'"),
                countWhere("events", "status in ('PUBLISHED','ONGOING')"),
                count("registrations"),
                countWhere("teams", "locked_after_registration=true"),
                count("results"),
                singleLong("select coalesce(sum(points),0) from student_points"),
                count("event_problem_statements"),
                countWhere("event_media", "deleted=false")
        );
    }

    public List<DepartmentParticipationChartDto> departmentParticipation(Long categoryId, LocalDate fromDate, LocalDate toDate, String technicalArea) {
        List<Object> params = new ArrayList<>();
        StringBuilder sql = new StringBuilder("""
                select d.id, d.code, d.name,
                       count(r.id) total_registrations,
                       count(distinct r.student_id) unique_students
                from departments d
                left join students s on s.department_id=d.id
                left join registrations r on r.student_id=s.id and r.status='REGISTERED'
                """);
        appendRegistrationJoinFilters(sql, params, categoryId, fromDate, toDate);
        sql.append(" where 1=1 ");
        appendTechnicalAreaFilter(sql, params, technicalArea, "s");
        sql.append(" group by d.id,d.code,d.name order by total_registrations desc, d.code asc");
        return jdbc.query(sql.toString(), (rs, rowNum) -> new DepartmentParticipationChartDto(
                rs.getLong("id"),
                rs.getString("code"),
                rs.getString("name"),
                rs.getLong("total_registrations"),
                rs.getLong("unique_students")
        ), params.toArray());
    }

    public List<DepartmentPointsChartDto> departmentPoints(Long categoryId, LocalDate fromDate, LocalDate toDate, String technicalArea) {
        List<Object> params = new ArrayList<>();
        StringBuilder sql = new StringBuilder("""
                select d.id, d.code, d.name,
                       coalesce(sum(sp.points),0) total_points,
                       coalesce(sum(case when sp.point_type='WINNER' then 1 else 0 end),0) wins,
                       coalesce(sum(case when sp.point_type='RUNNER_UP' then 1 else 0 end),0) runner_ups,
                       coalesce(sum(case when sp.point_type='SECOND_RUNNER_UP' then 1 else 0 end),0) second_runner_ups
                from departments d
                left join students s on s.department_id=d.id
                left join student_points sp on sp.student_id=s.id
                """);
        appendPointJoinFilters(sql, params, categoryId, fromDate, toDate);
        sql.append(" where 1=1 ");
        appendTechnicalAreaFilter(sql, params, technicalArea, "s");
        sql.append(" group by d.id,d.code,d.name order by total_points desc, wins desc, d.code asc");
        return jdbc.query(sql.toString(), (rs, rowNum) -> new DepartmentPointsChartDto(
                rs.getLong("id"),
                rs.getString("code"),
                rs.getString("name"),
                rs.getLong("total_points"),
                rs.getLong("wins"),
                rs.getLong("runner_ups"),
                rs.getLong("second_runner_ups")
        ), params.toArray());
    }

    public List<CategoryParticipationChartDto> categoryParticipation(Long departmentId, LocalDate fromDate, LocalDate toDate, String technicalArea) {
        List<Object> params = new ArrayList<>();
        StringBuilder sql = new StringBuilder("""
                select c.id, c.name,
                       count(r.id) registration_count,
                       count(distinct r.student_id) unique_students
                from event_categories c
                left join events e on e.category_id=c.id
                left join registrations r on r.event_id=e.id and r.status='REGISTERED'
                left join students s on s.id=r.student_id
                where 1=1
                """);
        appendRegistrationDateFilters(sql, params, fromDate, toDate, "r");
        appendDepartmentFilter(sql, params, departmentId, "s");
        appendTechnicalAreaFilter(sql, params, technicalArea, "s");
        sql.append(" group by c.id,c.name order by registration_count desc, c.name asc");
        return jdbc.query(sql.toString(), (rs, rowNum) -> new CategoryParticipationChartDto(
                rs.getLong("id"),
                rs.getString("name"),
                rs.getLong("registration_count"),
                rs.getLong("unique_students")
        ), params.toArray());
    }

    public List<RegistrationTrendDto> registrationTrend(LocalDate fromDate, LocalDate toDate, Long categoryId, Long departmentId, String technicalArea, String groupBy) {
        LocalDate effectiveFrom = fromDate != null ? fromDate : LocalDate.now().minusDays(30);
        String grouping = normalizeGroupBy(groupBy);
        String bucketExpression = switch (grouping) {
            case "MONTH" -> "date_trunc('month', r.registered_at)";
            case "WEEK" -> "date_trunc('week', r.registered_at)";
            default -> "date_trunc('day', r.registered_at)";
        };
        String labelExpression = switch (grouping) {
            case "MONTH" -> "to_char(date_trunc('month', r.registered_at), 'YYYY-MM')";
            default -> "to_char(" + bucketExpression + ", 'YYYY-MM-DD')";
        };
        List<Object> params = new ArrayList<>();
        StringBuilder sql = new StringBuilder("""
                select %s period, %s bucket, count(r.id) registration_count
                from registrations r
                join students s on s.id=r.student_id
                join events e on e.id=r.event_id
                where r.status='REGISTERED'
                """.formatted(labelExpression, bucketExpression));
        appendRegistrationDateFilters(sql, params, effectiveFrom, toDate, "r");
        appendCategoryFilter(sql, params, categoryId, "e");
        appendDepartmentFilter(sql, params, departmentId, "s");
        appendTechnicalAreaFilter(sql, params, technicalArea, "s");
        sql.append(" group by period, bucket order by bucket asc");
        return jdbc.query(sql.toString(), (rs, rowNum) -> new RegistrationTrendDto(
                rs.getString("period"),
                rs.getLong("registration_count")
        ), params.toArray());
    }

    public List<ResultDistributionDto> resultDistribution(Long categoryId, Long departmentId, LocalDate fromDate, LocalDate toDate, String technicalArea) {
        List<Object> params = new ArrayList<>();
        StringBuilder sql = new StringBuilder("""
                select res.result_type, count(distinct res.id) result_count
                from results res
                join events e on e.id=res.event_id
                left join registrations r on r.event_id=res.event_id
                    and r.status='REGISTERED'
                    and ((res.student_id is not null and r.student_id=res.student_id)
                         or (res.team_id is not null and r.team_id=res.team_id))
                left join students s on s.id=coalesce(res.student_id, r.student_id)
                where 1=1
                """);
        appendCategoryFilter(sql, params, categoryId, "e");
        appendDepartmentFilter(sql, params, departmentId, "s");
        appendTechnicalAreaFilter(sql, params, technicalArea, "s");
        appendResultDateFilters(sql, params, fromDate, toDate, "res");
        sql.append(" group by res.result_type order by result_count desc, res.result_type asc");
        return jdbc.query(sql.toString(), (rs, rowNum) -> new ResultDistributionDto(
                rs.getString("result_type"),
                rs.getLong("result_count")
        ), params.toArray());
    }

    public List<TechnicalAreaParticipationDto> technicalAreaParticipation(Long categoryId, Long departmentId, LocalDate fromDate, LocalDate toDate) {
        List<Object> params = new ArrayList<>();
        StringBuilder sql = new StringBuilder("""
                select coalesce(s.technical_area,'SOFTWARE') technical_area,
                       count(r.id) registration_count,
                       count(distinct r.student_id) unique_students
                from registrations r
                join students s on s.id=r.student_id
                join events e on e.id=r.event_id
                where r.status='REGISTERED'
                """);
        appendCategoryFilter(sql, params, categoryId, "e");
        appendDepartmentFilter(sql, params, departmentId, "s");
        appendRegistrationDateFilters(sql, params, fromDate, toDate, "r");
        sql.append(" group by technical_area order by technical_area asc");
        return jdbc.query(sql.toString(), (rs, rowNum) -> new TechnicalAreaParticipationDto(
                rs.getString("technical_area"),
                rs.getLong("registration_count"),
                rs.getLong("unique_students")
        ), params.toArray());
    }

    public List<EventStatusSummaryDto> eventStatusSummary() {
        return jdbc.query("""
                select status, count(*) status_count
                from events
                group by status
                order by status asc
                """, (rs, rowNum) -> new EventStatusSummaryDto(rs.getString("status"), rs.getLong("status_count")));
    }

    public List<TopStudentAnalyticsDto> topStudents(Integer limit, Long departmentId, Long categoryId, LocalDate fromDate, LocalDate toDate, String technicalArea) {
        int rowLimit = sanitizeLimit(limit);
        List<Object> params = new ArrayList<>();
        StringBuilder pointFilters = new StringBuilder(" where 1=1 ");
        appendPointDateFilters(pointFilters, params, fromDate, toDate, "sp");
        if (categoryId != null) {
            pointFilters.append(" and sp.category_id=? ");
            params.add(categoryId);
        }
        StringBuilder registrationFilters = new StringBuilder(" where r.status='REGISTERED' ");
        appendRegistrationDateFilters(registrationFilters, params, fromDate, toDate, "r");
        if (categoryId != null) {
            registrationFilters.append(" and e.category_id=? ");
            params.add(categoryId);
        }
        StringBuilder sql = new StringBuilder("""
                with point_totals as (
                    select sp.student_id,
                           coalesce(sum(sp.points),0) total_points,
                           coalesce(sum(case when sp.point_type='WINNER' then 1 else 0 end),0) wins
                    from student_points sp
                    %s
                    group by sp.student_id
                ),
                participation_totals as (
                    select r.student_id, count(distinct r.event_id) events_participated
                    from registrations r
                    join events e on e.id=r.event_id
                    %s
                    group by r.student_id
                )
                select s.id, s.register_number, s.name, d.code department_code, s.year, s.section, s.technical_area,
                       coalesce(pt.total_points,0) total_points,
                       coalesce(part.events_participated,0) events_participated,
                       coalesce(pt.wins,0) wins
                from students s
                left join departments d on d.id=s.department_id
                left join point_totals pt on pt.student_id=s.id
                left join participation_totals part on part.student_id=s.id
                where s.active=true
                """.formatted(pointFilters, registrationFilters));
        appendDepartmentFilter(sql, params, departmentId, "s");
        appendTechnicalAreaFilter(sql, params, technicalArea, "s");
        sql.append(" order by total_points desc, wins desc, events_participated desc, s.name asc limit ? ");
        params.add(rowLimit);
        List<TopStudentAnalyticsDto> rows = jdbc.query(sql.toString(), (rs, rowNum) -> new TopStudentAnalyticsDto(
                rowNum + 1,
                rs.getLong("id"),
                rs.getString("register_number"),
                rs.getString("name"),
                rs.getString("department_code"),
                rs.getInt("year"),
                rs.getString("section"),
                rs.getString("technical_area"),
                rs.getLong("total_points"),
                rs.getLong("events_participated"),
                rs.getLong("wins")
        ), params.toArray());
        return rows;
    }

    public List<TopDepartmentAnalyticsDto> topDepartments(Integer limit, Long categoryId, LocalDate fromDate, LocalDate toDate) {
        int rowLimit = sanitizeLimit(limit);
        List<Object> params = new ArrayList<>();
        StringBuilder sql = new StringBuilder("""
                select d.id, d.code, d.name,
                       coalesce(sum(sp.points),0) total_points,
                       count(distinct r.id) participation_count,
                       coalesce(sum(case when sp.point_type='WINNER' then 1 else 0 end),0) wins
                from departments d
                left join students s on s.department_id=d.id
                left join student_points sp on sp.student_id=s.id
                """);
        appendPointJoinFilters(sql, params, categoryId, fromDate, toDate);
        sql.append(" left join registrations r on r.student_id=s.id and r.status='REGISTERED' ");
        appendRegistrationJoinFilters(sql, params, categoryId, fromDate, toDate);
        sql.append(" group by d.id,d.code,d.name order by total_points desc, wins desc, participation_count desc, d.code asc limit ? ");
        params.add(rowLimit);
        return jdbc.query(sql.toString(), (rs, rowNum) -> new TopDepartmentAnalyticsDto(
                rowNum + 1,
                rs.getLong("id"),
                rs.getString("code"),
                rs.getString("name"),
                rs.getLong("total_points"),
                rs.getLong("participation_count"),
                rs.getLong("wins")
        ), params.toArray());
    }

    public List<EventEngagementDto> eventEngagement(Integer limit, Long categoryId, LocalDate fromDate, LocalDate toDate, String status) {
        int rowLimit = sanitizeLimit(limit);
        List<Object> params = new ArrayList<>();
        StringBuilder sql = new StringBuilder("""
                select e.id, e.title, coalesce(c.name,'Uncategorized') category_name, e.event_type,
                       count(distinct r.id) registration_count,
                       count(distinct t.id) team_count,
                       e.results_published
                from events e
                left join event_categories c on c.id=e.category_id
                left join registrations r on r.event_id=e.id and r.status='REGISTERED'
                """);
        appendRegistrationJoinDateOnly(sql, params, fromDate, toDate);
        sql.append(" left join teams t on t.event_id=e.id and t.locked_after_registration=true where 1=1 ");
        appendCategoryFilter(sql, params, categoryId, "e");
        if (status != null && !status.isBlank()) {
            sql.append(" and e.status=? ");
            params.add(status.trim().toUpperCase(Locale.ROOT));
        }
        sql.append(" group by e.id,e.title,c.name,e.event_type,e.results_published order by registration_count desc, team_count desc, e.title asc limit ? ");
        params.add(rowLimit);
        return jdbc.query(sql.toString(), (rs, rowNum) -> new EventEngagementDto(
                rs.getLong("id"),
                rs.getString("title"),
                rs.getString("category_name"),
                rs.getString("event_type"),
                rs.getLong("registration_count"),
                rs.getLong("team_count"),
                rs.getBoolean("results_published")
        ), params.toArray());
    }

    public AdminAnalyticsFiltersDto filters() {
        List<AnalyticsFilterOptionDto> departments = jdbc.query("""
                select id, code, name from departments where active=true order by code
                """, (rs, rowNum) -> new AnalyticsFilterOptionDto(rs.getLong("id"), rs.getString("code"), rs.getString("name")));
        List<AnalyticsFilterOptionDto> categories = jdbc.query("""
                select id, name from event_categories where active=true order by name
                """, (rs, rowNum) -> new AnalyticsFilterOptionDto(rs.getLong("id"), rs.getString("name"), null));
        return new AdminAnalyticsFiltersDto(
                departments,
                categories,
                List.of("SOFTWARE", "HARDWARE"),
                List.of("DRAFT", "PUBLISHED", "ONGOING", "COMPLETED", "CANCELLED")
        );
    }

    public List<DepartmentAnalyticsDto> departments() {
        return jdbc.query("""
                select d.id, d.code, d.name,
                       coalesce(sum(sp.points),0) total_points,
                       count(distinct s.id) total_students,
                       count(distinct case when s.active then s.id end) active_students,
                       count(distinct r.id) participations,
                       coalesce(sum(case when sp.point_type='WINNER' then 1 else 0 end),0) wins
                from departments d
                left join students s on s.department_id=d.id
                left join student_points sp on sp.student_id=s.id
                left join registrations r on r.student_id=s.id and r.status='REGISTERED'
                group by d.id,d.code,d.name order by total_points desc
                """, (rs, rowNum) -> new DepartmentAnalyticsDto(
                rs.getLong("id"),
                rs.getString("code"),
                rs.getString("name"),
                rs.getInt("total_points"),
                rs.getLong("total_students"),
                rs.getLong("active_students"),
                rs.getLong("participations"),
                rs.getLong("total_students") == 0 ? 0 : (double) rs.getLong("participations") / rs.getLong("total_students"),
                rs.getInt("wins"),
                List.of()
        ));
    }

    public List<CategoryAnalyticsDto> categories() {
        return jdbc.query("""
                select c.id, c.name, coalesce(sum(sp.points),0) total_points, count(distinct r.id) total_results, count(distinct sp.student_id) participants
                from event_categories c
                left join student_points sp on sp.category_id=c.id
                left join results r on r.event_id=sp.event_id
                group by c.id,c.name order by total_points desc
                """, (rs, rowNum) -> new CategoryAnalyticsDto(rs.getLong("id"), rs.getString("name"), rs.getInt("total_points"), rs.getInt("total_results"), rs.getInt("participants")));
    }

    public List<RecentActivityDto> recentActivity() {
        return jdbc.query("""
                select 'POINT' activity_type, e.title, s.name subtitle, sp.points, sp.created_at occurred_at
                from student_points sp
                left join events e on e.id=sp.event_id
                left join students s on s.id=sp.student_id
                order by sp.created_at desc limit 10
                """, (rs, rowNum) -> new RecentActivityDto(rs.getString("activity_type"), rs.getString("title"), rs.getString("subtitle"), rs.getInt("points"), rs.getTimestamp("occurred_at").toLocalDateTime()));
    }

    private void appendRegistrationJoinFilters(StringBuilder sql, List<Object> params, Long categoryId, LocalDate fromDate, LocalDate toDate) {
        appendRegistrationJoinDateOnly(sql, params, fromDate, toDate);
        if (categoryId != null) {
            sql.append(" and exists (select 1 from events filter_event where filter_event.id=r.event_id and filter_event.category_id=?) ");
            params.add(categoryId);
        }
    }

    private void appendRegistrationJoinDateOnly(StringBuilder sql, List<Object> params, LocalDate fromDate, LocalDate toDate) {
        if (fromDate != null) {
            sql.append(" and r.registered_at >= ? ");
            params.add(Timestamp.valueOf(fromDate.atStartOfDay()));
        }
        if (toDate != null) {
            sql.append(" and r.registered_at < ? ");
            params.add(Timestamp.valueOf(toDate.plusDays(1).atStartOfDay()));
        }
    }

    private void appendPointJoinFilters(StringBuilder sql, List<Object> params, Long categoryId, LocalDate fromDate, LocalDate toDate) {
        if (categoryId != null) {
            sql.append(" and sp.category_id=? ");
            params.add(categoryId);
        }
        if (fromDate != null) {
            sql.append(" and sp.created_at >= ? ");
            params.add(Timestamp.valueOf(fromDate.atStartOfDay()));
        }
        if (toDate != null) {
            sql.append(" and sp.created_at < ? ");
            params.add(Timestamp.valueOf(toDate.plusDays(1).atStartOfDay()));
        }
    }

    private void appendRegistrationDateFilters(StringBuilder sql, List<Object> params, LocalDate fromDate, LocalDate toDate, String alias) {
        if (fromDate != null) {
            sql.append(" and ").append(alias).append(".registered_at >= ? ");
            params.add(Timestamp.valueOf(fromDate.atStartOfDay()));
        }
        if (toDate != null) {
            sql.append(" and ").append(alias).append(".registered_at < ? ");
            params.add(Timestamp.valueOf(toDate.plusDays(1).atStartOfDay()));
        }
    }

    private void appendPointDateFilters(StringBuilder sql, List<Object> params, LocalDate fromDate, LocalDate toDate, String alias) {
        if (fromDate != null) {
            sql.append(" and ").append(alias).append(".created_at >= ? ");
            params.add(Timestamp.valueOf(fromDate.atStartOfDay()));
        }
        if (toDate != null) {
            sql.append(" and ").append(alias).append(".created_at < ? ");
            params.add(Timestamp.valueOf(toDate.plusDays(1).atStartOfDay()));
        }
    }

    private void appendResultDateFilters(StringBuilder sql, List<Object> params, LocalDate fromDate, LocalDate toDate, String alias) {
        if (fromDate != null) {
            sql.append(" and ").append(alias).append(".declared_at >= ? ");
            params.add(Timestamp.valueOf(fromDate.atStartOfDay()));
        }
        if (toDate != null) {
            sql.append(" and ").append(alias).append(".declared_at < ? ");
            params.add(Timestamp.valueOf(toDate.plusDays(1).atStartOfDay()));
        }
    }

    private void appendCategoryFilter(StringBuilder sql, List<Object> params, Long categoryId, String eventAlias) {
        if (categoryId != null) {
            sql.append(" and ").append(eventAlias).append(".category_id=? ");
            params.add(categoryId);
        }
    }

    private void appendDepartmentFilter(StringBuilder sql, List<Object> params, Long departmentId, String studentAlias) {
        if (departmentId != null) {
            sql.append(" and ").append(studentAlias).append(".department_id=? ");
            params.add(departmentId);
        }
    }

    private void appendTechnicalAreaFilter(StringBuilder sql, List<Object> params, String technicalArea, String studentAlias) {
        if (technicalArea != null && !technicalArea.isBlank()) {
            sql.append(" and ").append(studentAlias).append(".technical_area=? ");
            params.add(technicalArea.trim().toUpperCase(Locale.ROOT));
        }
    }

    private String normalizeGroupBy(String groupBy) {
        if (groupBy == null || groupBy.isBlank()) {
            return "DAY";
        }
        String normalized = groupBy.trim().toUpperCase(Locale.ROOT);
        if (!List.of("DAY", "WEEK", "MONTH").contains(normalized)) {
            return "DAY";
        }
        return normalized;
    }

    private int sanitizeLimit(Integer limit) {
        if (limit == null || limit < 1) {
            return 10;
        }
        return Math.min(limit, 50);
    }

    private Long count(String table) {
        return jdbc.queryForObject("select count(*) from " + table, Long.class);
    }

    private Long countWhere(String table, String where) {
        return jdbc.queryForObject("select count(*) from " + table + " where " + where, Long.class);
    }

    private Long singleLong(String sql) {
        return jdbc.queryForObject(sql, Long.class);
    }
}
