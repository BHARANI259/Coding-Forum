package com.kec.codingforum.analytics;

import com.kec.codingforum.analytics.dto.DepartmentLeaderboardRowDto;
import com.kec.codingforum.analytics.dto.PageDto;
import com.kec.codingforum.analytics.dto.StudentLeaderboardRowDto;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class LeaderboardService {

    private final JdbcTemplate jdbc;

    public LeaderboardService(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public PageDto<StudentLeaderboardRowDto> studentLeaderboard(int page, int size, Long departmentId, Long categoryId, String search) {
        int safePage = Math.max(page, 0);
        int safeSize = Math.min(Math.max(size, 1), 100);
        List<Object> params = new ArrayList<>();
        String where = studentWhere(departmentId, categoryId, search, params);
        Long total = jdbc.queryForObject("select count(*) from students s left join departments d on d.id=s.department_id where s.active=true" + where, Long.class, params.toArray());
        params.add(safeSize);
        params.add(safePage * safeSize);
        String sql = """
                select s.id, s.register_number, s.name, d.code, d.name as department_name,
                       coalesce(sum(sp.points),0) total_points,
                       count(distinct r.event_id) events_participated,
                       coalesce(sum(case when sp.point_type='WINNER' then 1 else 0 end),0) wins,
                       coalesce(sum(case when sp.point_type='RUNNER_UP' then 1 else 0 end),0) runner_ups
                from students s
                left join departments d on d.id=s.department_id
                left join student_points sp on sp.student_id=s.id
                left join registrations r on r.student_id=s.id and r.status='REGISTERED'
                where s.active=true
                """ + where + """
                group by s.id, s.register_number, s.name, d.code, d.name
                order by total_points desc, wins desc, events_participated desc, s.name asc
                limit ? offset ?
                """;
        List<StudentLeaderboardRowDto> rows = jdbc.query(sql, (rs, rowNum) -> new StudentLeaderboardRowDto(
                safePage * safeSize + rowNum + 1,
                rs.getLong("id"),
                rs.getString("register_number"),
                rs.getString("name"),
                rs.getString("code"),
                rs.getString("department_name"),
                rs.getInt("total_points"),
                rs.getInt("events_participated"),
                rs.getInt("wins"),
                rs.getInt("runner_ups")
        ), params.toArray());
        return new PageDto<>(rows, safePage, safeSize, total == null ? 0 : total);
    }

    public List<DepartmentLeaderboardRowDto> departmentLeaderboard(Long categoryId) {
        List<Object> params = new ArrayList<>();
        String categoryFilter = "";
        if (categoryId != null) {
            categoryFilter = " and sp.category_id=?";
            params.add(categoryId);
        }
        String sql = """
                select d.id, d.code, d.name,
                       coalesce(sum(sp.points),0) total_points,
                       count(distinct sp.student_id) total_participants,
                       coalesce(sum(case when sp.point_type='WINNER' then 1 else 0 end),0) wins
                from departments d
                left join students s on s.department_id=d.id
                left join student_points sp on sp.student_id=s.id
                """ + (categoryId == null ? "" : " and sp.category_id=? ") + """
                where d.active=true
                group by d.id, d.code, d.name
                order by total_points desc, wins desc, total_participants desc, d.code asc
                """;
        return jdbc.query(sql, (rs, rowNum) -> new DepartmentLeaderboardRowDto(
                rowNum + 1,
                rs.getLong("id"),
                rs.getString("code"),
                rs.getString("name"),
                rs.getInt("total_points"),
                rs.getInt("total_participants"),
                rs.getInt("wins")
        ), params.toArray());
    }

    public PageDto<StudentLeaderboardRowDto> categoryStudentLeaderboard(Long categoryId, int page, int size) {
        return studentLeaderboard(page, size, null, categoryId, null);
    }

    public PageDto<StudentLeaderboardRowDto> bestCoders(int page, int size) {
        int safePage = Math.max(page, 0);
        int safeSize = Math.min(Math.max(size, 1), 100);
        String sql = """
                select s.id, s.register_number, s.name, d.code, d.name as department_name,
                       coalesce(sum(sp.points),0) total_points,
                       count(distinct r.event_id) events_participated,
                       coalesce(sum(case when sp.point_type='WINNER' then 1 else 0 end),0) wins,
                       coalesce(sum(case when sp.point_type='RUNNER_UP' then 1 else 0 end),0) runner_ups
                from students s
                left join departments d on d.id=s.department_id
                join student_points sp on sp.student_id=s.id
                join event_categories c on c.id=sp.category_id
                left join registrations r on r.student_id=s.id and r.status='REGISTERED'
                where s.active=true and (lower(c.name) like '%coding%' or lower(c.name) like '%contest%' or lower(c.name) like '%hackathon%')
                group by s.id, s.register_number, s.name, d.code, d.name
                order by total_points desc, wins desc, events_participated desc, s.name asc
                limit ? offset ?
                """;
        List<StudentLeaderboardRowDto> rows = jdbc.query(sql, (rs, rowNum) -> row(rs, safePage * safeSize + rowNum + 1), safeSize, safePage * safeSize);
        return new PageDto<>(rows, safePage, safeSize, rows.size());
    }

    public PageDto<StudentLeaderboardRowDto> topEngagingStudents(int page, int size) {
        int safePage = Math.max(page, 0);
        int safeSize = Math.min(Math.max(size, 1), 100);
        String sql = """
                select s.id, s.register_number, s.name, d.code, d.name as department_name,
                       coalesce(sum(sp.points),0) total_points,
                       count(distinct r.event_id) events_participated,
                       coalesce(sum(case when sp.point_type='WINNER' then 1 else 0 end),0) wins,
                       coalesce(sum(case when sp.point_type='RUNNER_UP' then 1 else 0 end),0) runner_ups
                from students s
                left join departments d on d.id=s.department_id
                left join student_points sp on sp.student_id=s.id
                left join registrations r on r.student_id=s.id and r.status='REGISTERED'
                where s.active=true
                group by s.id, s.register_number, s.name, d.code, d.name
                order by events_participated desc, total_points desc, wins desc, s.name asc
                limit ? offset ?
                """;
        List<StudentLeaderboardRowDto> rows = jdbc.query(sql, (rs, rowNum) -> row(rs, safePage * safeSize + rowNum + 1), safeSize, safePage * safeSize);
        return new PageDto<>(rows, safePage, safeSize, rows.size());
    }

    private String studentWhere(Long departmentId, Long categoryId, String search, List<Object> params) {
        StringBuilder where = new StringBuilder();
        if (departmentId != null) {
            where.append(" and s.department_id=?");
            params.add(departmentId);
        }
        if (search != null && !search.isBlank()) {
            where.append(" and (lower(s.name) like ? or lower(s.register_number) like ?)");
            String value = "%" + search.toLowerCase().trim() + "%";
            params.add(value);
            params.add(value);
        }
        if (categoryId != null) {
            where.append(" and exists (select 1 from student_points spf where spf.student_id=s.id and spf.category_id=?)");
            params.add(categoryId);
        }
        return where.toString();
    }

    private StudentLeaderboardRowDto row(java.sql.ResultSet rs, int rank) throws java.sql.SQLException {
        return new StudentLeaderboardRowDto(rank, rs.getLong("id"), rs.getString("register_number"), rs.getString("name"), rs.getString("code"), rs.getString("department_name"), rs.getInt("total_points"), rs.getInt("events_participated"), rs.getInt("wins"), rs.getInt("runner_ups"));
    }
}
