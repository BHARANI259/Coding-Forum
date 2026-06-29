package com.kec.codingforum.analytics;

import com.kec.codingforum.analytics.dto.DepartmentStudentStatsDto;
import com.kec.codingforum.analytics.dto.FacultyDepartmentSummaryDto;
import com.kec.codingforum.analytics.dto.PageDto;
import com.kec.codingforum.analytics.dto.StudentLeaderboardRowDto;
import com.kec.codingforum.user.Faculty;
import com.kec.codingforum.user.FacultyRepository;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class FacultyDepartmentMonitoringService {

    private final FacultyRepository faculties;
    private final JdbcTemplate jdbc;

    public FacultyDepartmentMonitoringService(FacultyRepository faculties, JdbcTemplate jdbc) {
        this.faculties = faculties;
        this.jdbc = jdbc;
    }

    public FacultyDepartmentSummaryDto summary(Long facultyId) {
        Faculty faculty = monitoringFaculty(facultyId);
        Long departmentId = faculty.getDepartment().getId();
        var row = jdbc.queryForMap("""
                select d.id, d.code, d.name, count(distinct s.id) students,
                       coalesce(sum(sp.points),0) points,
                       count(distinct r.id) participations
                from departments d
                left join students s on s.department_id=d.id
                left join student_points sp on sp.student_id=s.id
                left join registrations r on r.student_id=s.id and r.status='REGISTERED'
                where d.id=?
                group by d.id,d.code,d.name
                """, departmentId);
        return new FacultyDepartmentSummaryDto(((Number) row.get("id")).longValue(), (String) row.get("code"), (String) row.get("name"), ((Number) row.get("students")).longValue(), ((Number) row.get("points")).intValue(), ((Number) row.get("participations")).longValue());
    }

    public PageDto<DepartmentStudentStatsDto> students(Long facultyId, int page, int size, String search) {
        Faculty faculty = monitoringFaculty(facultyId);
        int safePage = Math.max(page, 0);
        int safeSize = Math.min(Math.max(size, 1), 100);
        String filter = search == null || search.isBlank() ? "" : " and (lower(s.name) like ? or lower(s.register_number) like ?)";
        Object[] params = search == null || search.isBlank()
                ? new Object[]{faculty.getDepartment().getId(), safeSize, safePage * safeSize}
                : new Object[]{faculty.getDepartment().getId(), "%" + search.toLowerCase().trim() + "%", "%" + search.toLowerCase().trim() + "%", safeSize, safePage * safeSize};
        List<DepartmentStudentStatsDto> rows = jdbc.query("""
                select s.id, s.register_number, s.name, coalesce(sum(sp.points),0) points,
                       count(distinct r.event_id) events, coalesce(sum(case when sp.point_type='WINNER' then 1 else 0 end),0) wins
                from students s
                left join student_points sp on sp.student_id=s.id
                left join registrations r on r.student_id=s.id and r.status='REGISTERED'
                where s.department_id=?
                """ + filter + """
                group by s.id,s.register_number,s.name
                order by points desc, wins desc, events desc, s.name asc
                limit ? offset ?
                """, (rs, rowNum) -> new DepartmentStudentStatsDto(rs.getLong("id"), rs.getString("register_number"), rs.getString("name"), rs.getInt("points"), rs.getInt("events"), rs.getInt("wins")), params);
        return new PageDto<>(rows, safePage, safeSize, rows.size());
    }

    public PageDto<StudentLeaderboardRowDto> leaderboard(Long facultyId) {
        Faculty faculty = monitoringFaculty(facultyId);
        List<StudentLeaderboardRowDto> rows = jdbc.query("""
                select s.id, s.register_number, s.name, d.code, d.name as department_name,
                       coalesce(sum(sp.points),0) total_points,
                       count(distinct r.event_id) events_participated,
                       coalesce(sum(case when sp.point_type='WINNER' then 1 else 0 end),0) wins,
                       coalesce(sum(case when sp.point_type='RUNNER_UP' then 1 else 0 end),0) runner_ups
                from students s
                left join departments d on d.id=s.department_id
                left join student_points sp on sp.student_id=s.id
                left join registrations r on r.student_id=s.id and r.status='REGISTERED'
                where s.active=true and s.department_id=?
                group by s.id, s.register_number, s.name, d.code, d.name
                order by total_points desc, wins desc, events_participated desc, s.name asc
                limit 20
                """, (rs, rowNum) -> new StudentLeaderboardRowDto(
                rowNum + 1,
                rs.getLong("id"),
                rs.getString("register_number"),
                rs.getString("name"),
                rs.getString("code"),
                rs.getString("department_name"),
                rs.getInt("total_points"),
                rs.getInt("events_participated"),
                rs.getInt("wins"),
                rs.getInt("runner_ups")
        ), faculty.getDepartment().getId());
        return new PageDto<>(rows, 0, 20, rows.size());
    }

    private Faculty monitoringFaculty(Long facultyId) {
        Faculty faculty = faculties.findById(facultyId).orElseThrow(() -> new AccessDeniedException("Faculty profile not found."));
        if (!faculty.isDeptMonitoringEnabled() || faculty.getDepartment() == null) {
            throw new AccessDeniedException("Department monitoring is not enabled for this account.");
        }
        return faculty;
    }
}
