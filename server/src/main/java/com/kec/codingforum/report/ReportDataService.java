package com.kec.codingforum.report;

import com.kec.codingforum.department.Department;
import com.kec.codingforum.department.DepartmentRepository;
import com.kec.codingforum.event.Event;
import com.kec.codingforum.event.EventProblemStatementRepository;
import com.kec.codingforum.event.EventRepository;
import com.kec.codingforum.event.EventRoundRepository;
import com.kec.codingforum.points.StudentPoint;
import com.kec.codingforum.points.StudentPointRepository;
import com.kec.codingforum.registration.Registration;
import com.kec.codingforum.registration.RegistrationRepository;
import com.kec.codingforum.report.ReportModels.CategorySummaryRow;
import com.kec.codingforum.report.ReportModels.DepartmentReportData;
import com.kec.codingforum.report.ReportModels.DepartmentStudentPerformanceRow;
import com.kec.codingforum.report.ReportModels.DepartmentSummaryRow;
import com.kec.codingforum.report.ReportModels.EventParticipantReportRow;
import com.kec.codingforum.report.ReportModels.EventReportData;
import com.kec.codingforum.report.ReportModels.EventResultReportRow;
import com.kec.codingforum.report.ReportModels.EventTeamReportRow;
import com.kec.codingforum.report.ReportModels.FacultyRow;
import com.kec.codingforum.report.ReportModels.LeaderboardExportRow;
import com.kec.codingforum.report.ReportModels.PointReportRow;
import com.kec.codingforum.report.ReportModels.ProblemRow;
import com.kec.codingforum.report.ReportModels.RoundRow;
import com.kec.codingforum.result.Result;
import com.kec.codingforum.result.ResultRepository;
import com.kec.codingforum.team.Team;
import com.kec.codingforum.team.TeamMember;
import com.kec.codingforum.team.TeamMemberRepository;
import com.kec.codingforum.team.TeamRepository;
import com.kec.codingforum.user.Student;
import com.kec.codingforum.user.StudentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ReportDataService {

    private final EventRepository events;
    private final DepartmentRepository departments;
    private final RegistrationRepository registrations;
    private final TeamRepository teams;
    private final TeamMemberRepository teamMembers;
    private final ResultRepository results;
    private final StudentPointRepository points;
    private final StudentRepository students;
    private final EventProblemStatementRepository problemStatements;
    private final EventRoundRepository rounds;

    @Transactional(readOnly = true)
    public EventReportData getEventReportData(Long eventId) {
        Event event = findEvent(eventId);
        List<Registration> eventRegistrations = registrations.findByEventIdOrderByRegisteredAtDesc(eventId);
        List<Team> eventTeams = teams.findByEventIdOrderByCreatedAtAsc(eventId);
        List<Result> eventResults = results.findByEventIdOrderByDeclaredAtDesc(eventId);
        Map<Long, Result> studentResults = eventResults.stream()
                .filter(result -> result.getStudent() != null)
                .collect(Collectors.toMap(result -> result.getStudent().getId(), Function.identity(), (left, right) -> left));
        Map<Long, Result> teamResults = eventResults.stream()
                .filter(result -> result.getTeam() != null)
                .collect(Collectors.toMap(result -> result.getTeam().getId(), Function.identity(), (left, right) -> left));

        List<EventParticipantReportRow> participantRows = eventRegistrations.stream()
                .map(registration -> participantRow(registration, studentResults, teamResults))
                .sorted(Comparator.comparing(EventParticipantReportRow::departmentCode, Comparator.nullsLast(String::compareTo))
                        .thenComparing(EventParticipantReportRow::registerNumber))
                .toList();

        List<EventTeamReportRow> teamRows = eventTeams.stream()
                .map(team -> teamRow(team, eventRegistrations, teamResults.get(team.getId())))
                .toList();

        return new EventReportData(
                event.getId(),
                event.getTitle(),
                event.getDescription(),
                event.getCategory() == null ? "-" : event.getCategory().getName(),
                event.getEventType(),
                event.getVenue(),
                event.getStartDatetime(),
                event.getEndDatetime(),
                event.getRegistrationStart(),
                event.getRegistrationEnd(),
                event.getStatus(),
                event.isRegistrationOpen(),
                event.isResultsPublished(),
                event.getResultsPublishedAt(),
                event.getAllowedDepartments().stream().map(Department::getCode).sorted().collect(Collectors.joining(", ")),
                event.getAllowedYears().stream().sorted().map(String::valueOf).collect(Collectors.joining(", ")),
                event.getAllowedSections().stream().sorted().collect(Collectors.joining(", ")),
                event.getAllowedTechnicalAreas().stream().sorted().collect(Collectors.joining(", ")),
                event.isPlacementWillingOnly(),
                event.getMaxParticipants(),
                event.getMaxTeams(),
                event.getMinTeamSize(),
                event.getMaxTeamSize(),
                event.getIncharges().stream()
                        .map(faculty -> new FacultyRow(faculty.getName(), faculty.getFacultyCode(), faculty.getEmail(), departmentCode(faculty.getDepartment())))
                        .sorted(Comparator.comparing(FacultyRow::name))
                        .toList(),
                problemStatements.findByEventIdOrderByIdAsc(eventId).stream()
                        .map(item -> new ProblemRow(item.getTitle(), item.getDescription(), item.getReferenceLink(), item.isActive()))
                        .toList(),
                rounds.findByEventIdOrderByRoundOrderAsc(eventId).stream()
                        .map(round -> new RoundRow(round.getRoundOrder(), round.getRoundName(), round.getStatus(), round.getScheduledAt(), round.getDescription(), round.isFinalRound()))
                        .toList(),
                participantRows,
                teamRows,
                eventResults.stream().map(result -> resultRow(event, result)).toList(),
                departmentSummary(participantRows, eventResults)
        );
    }

    @Transactional(readOnly = true)
    public List<EventParticipantReportRow> getEventStudentRows(Long eventId) {
        return getEventReportData(eventId).participants();
    }

    @Transactional(readOnly = true)
    public List<EventTeamReportRow> getEventTeamRows(Long eventId) {
        return getEventReportData(eventId).teams();
    }

    @Transactional(readOnly = true)
    public List<EventResultReportRow> getEventResultRows(Long eventId) {
        return getEventReportData(eventId).results();
    }

    @Transactional(readOnly = true)
    public List<PointReportRow> getEventPointRows(Long eventId) {
        return points.findByEventIdOrderByCreatedAtDesc(eventId).stream().map(this::pointRow).toList();
    }

    @Transactional(readOnly = true)
    public DepartmentReportData getDepartmentReportData(Long departmentId, LocalDate fromDate, LocalDate toDate, Long categoryId) {
        Department department = departments.findById(departmentId).orElseThrow(() -> new IllegalArgumentException("Department not found."));
        List<Student> departmentStudents = students.findByDepartmentIdOrderByRegisterNumberAsc(departmentId);
        Set<Long> studentIds = departmentStudents.stream().map(Student::getId).collect(Collectors.toSet());
        List<StudentPoint> departmentPoints = points.findByDepartmentIdOrderByCreatedAtDesc(departmentId).stream()
                .filter(point -> withinFilters(point, fromDate, toDate, categoryId))
                .toList();
        List<Registration> allRegistrations = registrations.findAll().stream()
                .filter(registration -> registration.getStudent() != null && studentIds.contains(registration.getStudent().getId()))
                .toList();
        List<Result> allResults = results.findAll().stream()
                .filter(result -> result.getStudent() != null && studentIds.contains(result.getStudent().getId())
                        || result.getTeam() != null && teamMemberStudentIds(result.getTeam()).stream().anyMatch(studentIds::contains))
                .toList();

        List<DepartmentStudentPerformanceRow> studentRows = getDepartmentStudentPerformanceRows(departmentId, fromDate, toDate, categoryId);

        Map<String, List<StudentPoint>> byCategory = departmentPoints.stream()
                .collect(Collectors.groupingBy(point -> point.getCategory() == null ? "-" : point.getCategory().getName(), LinkedHashMap::new, Collectors.toList()));
        List<CategorySummaryRow> categories = byCategory.entrySet().stream()
                .map(entry -> new CategorySummaryRow(
                        entry.getKey(),
                        entry.getValue().stream().mapToInt(StudentPoint::getPoints).sum(),
                        entry.getValue().stream().map(StudentPoint::getReason).filter(Objects::nonNull).distinct().count(),
                        entry.getValue().stream().map(point -> point.getStudent().getId()).distinct().count()
                ))
                .sorted(Comparator.comparing(CategorySummaryRow::points).reversed())
                .toList();

        return new DepartmentReportData(
                department.getId(),
                department.getCode(),
                department.getName(),
                departmentStudents.size(),
                departmentStudents.stream().filter(Student::isActive).count(),
                allRegistrations.stream().filter(registration -> "REGISTERED".equals(registration.getStatus())).count(),
                departmentPoints.stream().mapToInt(StudentPoint::getPoints).sum(),
                allResults.stream().filter(result -> "WINNER".equals(result.getResultType())).count(),
                allResults.stream().filter(result -> "RUNNER_UP".equals(result.getResultType())).count(),
                categories,
                studentRows
        );
    }

    @Transactional(readOnly = true)
    public List<DepartmentStudentPerformanceRow> getDepartmentStudentPerformanceRows(Long departmentId, LocalDate fromDate, LocalDate toDate, Long categoryId) {
        List<Student> departmentStudents = students.findByDepartmentIdOrderByRegisterNumberAsc(departmentId);
        Map<Long, List<StudentPoint>> pointsByStudent = points.findByDepartmentIdOrderByCreatedAtDesc(departmentId).stream()
                .filter(point -> withinFilters(point, fromDate, toDate, categoryId))
                .collect(Collectors.groupingBy(point -> point.getStudent().getId()));
        Map<Long, List<Registration>> registrationsByStudent = registrations.findAll().stream()
                .filter(registration -> registration.getStudent() != null)
                .collect(Collectors.groupingBy(registration -> registration.getStudent().getId()));

        return departmentStudents.stream()
                .map(student -> {
                    List<StudentPoint> studentPoints = pointsByStudent.getOrDefault(student.getId(), List.of());
                    List<Registration> studentRegistrations = registrationsByStudent.getOrDefault(student.getId(), List.of());
                    return new DepartmentStudentPerformanceRow(
                            student.getRegisterNumber(),
                            student.getName(),
                            student.getEmail(),
                            student.getYear(),
                            student.getSection(),
                            student.getTechnicalArea(),
                            student.isPlacementWilling(),
                            studentRegistrations.stream().map(registration -> registration.getEvent().getId()).distinct().count(),
                            studentPoints.stream().mapToInt(StudentPoint::getPoints).sum(),
                            studentPoints.stream().filter(point -> "WINNER".equals(point.getPointType())).count(),
                            studentPoints.stream().filter(point -> "RUNNER_UP".equals(point.getPointType())).count(),
                            studentPoints.stream().filter(point -> "SECOND_RUNNER_UP".equals(point.getPointType())).count(),
                            studentPoints.stream().filter(point -> "PARTICIPATION".equals(point.getPointType()) || "PARTICIPANT".equals(point.getPointType())).count()
                    );
                })
                .sorted(Comparator.comparing(DepartmentStudentPerformanceRow::totalPoints).reversed()
                        .thenComparing(DepartmentStudentPerformanceRow::studentName))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<LeaderboardExportRow> getCollegeLeaderboardRows(Long departmentId, Long categoryId, LocalDate fromDate, LocalDate toDate) {
        List<Student> sourceStudents = departmentId == null ? students.findAll() : students.findByDepartmentIdOrderByRegisterNumberAsc(departmentId);
        Map<Long, List<StudentPoint>> pointsByStudent = points.findAll().stream()
                .filter(point -> departmentId == null || point.getDepartment() != null && departmentId.equals(point.getDepartment().getId()))
                .filter(point -> withinFilters(point, fromDate, toDate, categoryId))
                .collect(Collectors.groupingBy(point -> point.getStudent().getId()));
        Map<Long, List<Registration>> registrationsByStudent = registrations.findAll().stream()
                .filter(registration -> registration.getStudent() != null)
                .collect(Collectors.groupingBy(registration -> registration.getStudent().getId()));

        List<LeaderboardExportRow> rows = new ArrayList<>();
        List<LeaderboardExportRow> sorted = sourceStudents.stream()
                .map(student -> {
                    List<StudentPoint> studentPoints = pointsByStudent.getOrDefault(student.getId(), List.of());
                    List<Registration> studentRegistrations = registrationsByStudent.getOrDefault(student.getId(), List.of());
                    return new LeaderboardExportRow(
                            0,
                            student.getRegisterNumber(),
                            student.getName(),
                            departmentCode(student.getDepartment()),
                            student.getYear(),
                            student.getSection(),
                            student.getTechnicalArea(),
                            studentRegistrations.stream().map(registration -> registration.getEvent().getId()).distinct().count(),
                            studentPoints.stream().mapToInt(StudentPoint::getPoints).sum(),
                            studentPoints.stream().filter(point -> "WINNER".equals(point.getPointType())).count(),
                            studentPoints.stream().filter(point -> "RUNNER_UP".equals(point.getPointType())).count(),
                            studentPoints.stream().filter(point -> "SECOND_RUNNER_UP".equals(point.getPointType())).count()
                    );
                })
                .sorted(Comparator.comparing(LeaderboardExportRow::totalPoints).reversed()
                        .thenComparing(LeaderboardExportRow::wins).reversed()
                        .thenComparing(LeaderboardExportRow::studentName))
                .toList();
        for (int index = 0; index < sorted.size(); index++) {
            LeaderboardExportRow row = sorted.get(index);
            rows.add(new LeaderboardExportRow(index + 1, row.registerNumber(), row.studentName(), row.department(), row.year(), row.section(), row.technicalArea(), row.eventsParticipated(), row.totalPoints(), row.wins(), row.runnerUps(), row.secondRunnerUps()));
        }
        return rows;
    }

    private Event findEvent(Long eventId) {
        return events.findById(eventId).orElseThrow(() -> new IllegalArgumentException("Event not found."));
    }

    private EventParticipantReportRow participantRow(Registration registration, Map<Long, Result> studentResults, Map<Long, Result> teamResults) {
        Student student = registration.getStudent();
        Team team = registration.getTeam();
        Result result = team == null ? studentResults.get(student.getId()) : teamResults.get(team.getId());
        return new EventParticipantReportRow(
                student.getRegisterNumber(),
                student.getName(),
                student.getEmail(),
                departmentCode(student.getDepartment()),
                student.getDepartment() == null ? "-" : student.getDepartment().getName(),
                student.getYear(),
                student.getSection(),
                student.getTechnicalArea(),
                student.isPlacementWilling(),
                registration.getRegistrationType(),
                team == null ? null : team.getTeamName(),
                team == null ? null : team.getTeamCode(),
                team != null && team.getLeaderStudent() != null && team.getLeaderStudent().getId().equals(student.getId()),
                registration.getProblemStatement() == null ? null : registration.getProblemStatement().getTitle(),
                registration.getStatus(),
                registration.getRegisteredAt(),
                result == null ? null : result.getResultType(),
                result == null ? null : result.getPointsAwarded()
        );
    }

    private EventTeamReportRow teamRow(Team team, List<Registration> eventRegistrations, Result result) {
        long registeredMembers = eventRegistrations.stream()
                .filter(registration -> registration.getTeam() != null && registration.getTeam().getId().equals(team.getId()))
                .filter(registration -> "REGISTERED".equals(registration.getStatus()))
                .count();
        String registrationStatus = registeredMembers > 0 ? "REGISTERED" : "NOT_REGISTERED";
        return new EventTeamReportRow(
                team.getId(),
                team.getTeamName(),
                team.getTeamCode(),
                team.getLeaderStudent() == null ? "-" : team.getLeaderStudent().getRegisterNumber(),
                team.getLeaderStudent() == null ? "-" : team.getLeaderStudent().getName(),
                Math.toIntExact(teamMembers.countByTeamId(team.getId())),
                team.getProblemStatement() == null ? null : team.getProblemStatement().getTitle(),
                team.isLockedAfterRegistration(),
                registrationStatus,
                result == null ? null : result.getResultType(),
                result == null ? null : result.getPointsAwarded()
        );
    }

    private EventResultReportRow resultRow(Event event, Result result) {
        Student student = result.getStudent();
        Team team = result.getTeam();
        return new EventResultReportRow(
                event.getTitle(),
                event.getEventType(),
                event.getCategory() == null ? "-" : event.getCategory().getName(),
                team == null ? null : team.getTeamName(),
                team == null ? null : team.getTeamCode(),
                student == null ? null : student.getRegisterNumber(),
                student == null ? null : student.getName(),
                student == null ? null : departmentCode(student.getDepartment()),
                result.getResultType(),
                result.getPointsAwarded(),
                result.getDeclaredBy() == null ? "-" : result.getDeclaredBy().getEmail(),
                result.getDeclaredAt(),
                event.isResultsPublished()
        );
    }

    private PointReportRow pointRow(StudentPoint point) {
        Student student = point.getStudent();
        return new PointReportRow(
                student == null ? "-" : student.getRegisterNumber(),
                student == null ? "-" : student.getName(),
                point.getDepartment() == null ? "-" : point.getDepartment().getCode(),
                point.getCategory() == null ? "-" : point.getCategory().getName(),
                point.getEvent() == null ? "-" : point.getEvent().getTitle(),
                point.getPointType(),
                point.getPoints(),
                point.getReason(),
                point.getCreatedAt()
        );
    }

    private List<DepartmentSummaryRow> departmentSummary(List<EventParticipantReportRow> participants, List<Result> eventResults) {
        Map<String, List<EventParticipantReportRow>> byDepartment = participants.stream()
                .collect(Collectors.groupingBy(row -> blank(row.departmentCode()) ? "-" : row.departmentCode(), LinkedHashMap::new, Collectors.toList()));
        return byDepartment.entrySet().stream()
                .map(entry -> {
                    String departmentCode = entry.getKey();
                    List<EventParticipantReportRow> rows = entry.getValue();
                    int totalPoints = rows.stream().map(EventParticipantReportRow::pointsAwarded).filter(Objects::nonNull).mapToInt(Integer::intValue).sum();
                    long wins = rows.stream().filter(row -> "WINNER".equals(row.resultType())).count();
                    long runnerUps = rows.stream().filter(row -> "RUNNER_UP".equals(row.resultType())).count();
                    String departmentName = rows.stream().map(EventParticipantReportRow::departmentName).filter(value -> !blank(value)).findFirst().orElse("-");
                    return new DepartmentSummaryRow(departmentCode, departmentName, rows.size(), totalPoints, wins, runnerUps);
                })
                .toList();
    }

    private boolean withinFilters(StudentPoint point, LocalDate fromDate, LocalDate toDate, Long categoryId) {
        if (categoryId != null && (point.getCategory() == null || !categoryId.equals(point.getCategory().getId()))) {
            return false;
        }
        LocalDate createdDate = point.getCreatedAt().toLocalDate();
        if (fromDate != null && createdDate.isBefore(fromDate)) {
            return false;
        }
        return toDate == null || !createdDate.isAfter(toDate);
    }

    private Set<Long> teamMemberStudentIds(Team team) {
        if (team == null) {
            return Set.of();
        }
        return teamMembers.findByTeamIdOrderByJoinedAtAsc(team.getId()).stream()
                .map(TeamMember::getStudent)
                .filter(Objects::nonNull)
                .map(Student::getId)
                .collect(Collectors.toCollection(HashSet::new));
    }

    private String departmentCode(Department department) {
        return department == null ? "-" : department.getCode();
    }

    private boolean blank(String value) {
        return value == null || value.isBlank();
    }
}
