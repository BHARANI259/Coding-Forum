package com.kec.codingforum.analytics;

import com.kec.codingforum.analytics.dto.AdminAnalyticsSummaryDto;
import com.kec.codingforum.analytics.dto.CategoryAnalyticsDto;
import com.kec.codingforum.analytics.dto.DepartmentAnalyticsDto;
import com.kec.codingforum.analytics.dto.RecentActivityDto;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class AdminAnalyticsService {

    private final JdbcTemplate jdbc;

    public AdminAnalyticsService(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public AdminAnalyticsSummaryDto summary() {
        return new AdminAnalyticsSummaryDto(
                count("students"),
                count("faculties"),
                count("departments"),
                count("events"),
                countWhere("events", "status='PUBLISHED'"),
                countWhere("events", "status in ('PUBLISHED','ONGOING')"),
                count("registrations"),
                count("teams"),
                count("results"),
                jdbc.queryForObject("select coalesce(sum(points),0) from student_points", Long.class)
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
                """, (rs, rowNum) -> new DepartmentAnalyticsDto(rs.getLong("id"), rs.getString("code"), rs.getString("name"), rs.getInt("total_points"), rs.getLong("total_students"), rs.getLong("active_students"), rs.getLong("participations"), rs.getLong("total_students") == 0 ? 0 : (double) rs.getLong("participations") / rs.getLong("total_students"), rs.getInt("wins"), List.of()));
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

    private Long count(String table) {
        return jdbc.queryForObject("select count(*) from " + table, Long.class);
    }

    private Long countWhere(String table, String where) {
        return jdbc.queryForObject("select count(*) from " + table + " where " + where, Long.class);
    }
}
