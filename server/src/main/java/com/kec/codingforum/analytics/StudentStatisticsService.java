package com.kec.codingforum.analytics;

import com.kec.codingforum.analytics.dto.CategoryPointSummaryDto;
import com.kec.codingforum.analytics.dto.PageDto;
import com.kec.codingforum.analytics.dto.StudentPointHistoryDto;
import com.kec.codingforum.analytics.dto.StudentStatisticsDto;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class StudentStatisticsService {

    private final JdbcTemplate jdbc;

    public StudentStatisticsService(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public StudentStatisticsDto statistics(Long studentId) {
        var base = jdbc.queryForMap("""
                select s.id, s.name, s.register_number, d.code department_code,
                       coalesce((select sum(points) from student_points where student_id=s.id),0) total_points,
                       (select count(distinct event_id) from registrations where student_id=s.id and status='REGISTERED') total_events,
                       (select count(*) from results r left join registrations reg on reg.event_id=r.event_id and reg.student_id=s.id and reg.status='REGISTERED' where r.student_id=s.id or r.team_id=reg.team_id) total_results,
                       (select count(*) from student_points where student_id=s.id and point_type='WINNER') wins,
                       (select count(*) from student_points where student_id=s.id and point_type='RUNNER_UP') runner_ups,
                       (select count(*) from student_points where student_id=s.id and point_type='SECOND_RUNNER_UP') second_runner_ups,
                       (select count(*) from registrations where student_id=s.id and status='REGISTERED') participation_count
                from students s left join departments d on d.id=s.department_id where s.id=?
                """, studentId);
        List<CategoryPointSummaryDto> categories = jdbc.query("""
                select c.id, c.name, coalesce(sum(sp.points),0) total_points, count(distinct sp.event_id) events
                from student_points sp join event_categories c on c.id=sp.category_id
                where sp.student_id=?
                group by c.id, c.name order by total_points desc
                """, (rs, rowNum) -> new CategoryPointSummaryDto(rs.getLong("id"), rs.getString("name"), rs.getInt("total_points"), rs.getInt("events")), studentId);
        return new StudentStatisticsDto(
                ((Number) base.get("id")).longValue(),
                (String) base.get("name"),
                (String) base.get("register_number"),
                (String) base.get("department_code"),
                ((Number) base.get("total_points")).intValue(),
                ((Number) base.get("total_events")).intValue(),
                ((Number) base.get("total_results")).intValue(),
                ((Number) base.get("wins")).intValue(),
                ((Number) base.get("runner_ups")).intValue(),
                ((Number) base.get("second_runner_ups")).intValue(),
                ((Number) base.get("participation_count")).intValue(),
                categories
        );
    }

    public PageDto<StudentPointHistoryDto> history(Long studentId, int page, int size, Long categoryId, Long eventId) {
        int safePage = Math.max(page, 0);
        int safeSize = Math.min(Math.max(size, 1), 100);
        StringBuilder where = new StringBuilder(" where sp.student_id=?");
        java.util.List<Object> params = new java.util.ArrayList<>();
        params.add(studentId);
        if (categoryId != null) {
            where.append(" and sp.category_id=?");
            params.add(categoryId);
        }
        if (eventId != null) {
            where.append(" and sp.event_id=?");
            params.add(eventId);
        }
        Long total = jdbc.queryForObject("select count(*) from student_points sp" + where, Long.class, params.toArray());
        params.add(safeSize);
        params.add(safePage * safeSize);
        List<StudentPointHistoryDto> rows = jdbc.query("""
                select sp.id, sp.event_id, e.title event_title, sp.category_id, c.name category_name, sp.point_type, sp.points, sp.reason, sp.created_at
                from student_points sp
                left join events e on e.id=sp.event_id
                left join event_categories c on c.id=sp.category_id
                """ + where + " order by sp.created_at desc limit ? offset ?",
                (rs, rowNum) -> new StudentPointHistoryDto(rs.getLong("id"), rs.getLong("event_id"), rs.getString("event_title"), rs.getLong("category_id"), rs.getString("category_name"), rs.getString("point_type"), rs.getInt("points"), rs.getString("reason"), rs.getTimestamp("created_at").toLocalDateTime()),
                params.toArray());
        return new PageDto<>(rows, safePage, safeSize, total == null ? 0 : total);
    }
}
