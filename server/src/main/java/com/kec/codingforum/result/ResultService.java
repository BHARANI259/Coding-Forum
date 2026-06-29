package com.kec.codingforum.result;

import com.kec.codingforum.event.Event;
import com.kec.codingforum.event.EventRepository;
import com.kec.codingforum.notification.NotificationRecipientResolver;
import com.kec.codingforum.notification.NotificationService;
import com.kec.codingforum.points.StudentPoint;
import com.kec.codingforum.points.StudentPointRepository;
import com.kec.codingforum.points.StudentPointService;
import com.kec.codingforum.registration.Registration;
import com.kec.codingforum.registration.RegistrationRepository;
import com.kec.codingforum.result.dto.EventResultSummaryDto;
import com.kec.codingforum.result.dto.PublishResultsResponse;
import com.kec.codingforum.result.dto.ResultDto;
import com.kec.codingforum.result.dto.ResultMemberDto;
import com.kec.codingforum.result.dto.StudentResultDto;
import com.kec.codingforum.team.Team;
import com.kec.codingforum.team.TeamMemberRepository;
import com.kec.codingforum.team.TeamRepository;
import com.kec.codingforum.user.Student;
import com.kec.codingforum.user.StudentRepository;
import com.kec.codingforum.user.User;
import com.kec.codingforum.user.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;

@Service
public class ResultService {

    private static final Set<String> RESULT_TYPES = Set.of("WINNER", "RUNNER_UP", "SECOND_RUNNER_UP", "PARTICIPANT", "DISQUALIFIED");

    private final ResultRepository results;
    private final EventRepository events;
    private final StudentRepository students;
    private final TeamRepository teams;
    private final TeamMemberRepository teamMembers;
    private final RegistrationRepository registrations;
    private final UserRepository users;
    private final StudentPointRepository studentPoints;
    private final StudentPointService studentPointService;
    private final ResultPointPolicyService pointPolicy;
    private final NotificationService notificationService;
    private final NotificationRecipientResolver recipientResolver;

    public ResultService(
            ResultRepository results,
            EventRepository events,
            StudentRepository students,
            TeamRepository teams,
            TeamMemberRepository teamMembers,
            RegistrationRepository registrations,
            UserRepository users,
            StudentPointRepository studentPoints,
            StudentPointService studentPointService,
            ResultPointPolicyService pointPolicy,
            NotificationService notificationService,
            NotificationRecipientResolver recipientResolver
    ) {
        this.results = results;
        this.events = events;
        this.students = students;
        this.teams = teams;
        this.teamMembers = teamMembers;
        this.registrations = registrations;
        this.users = users;
        this.studentPoints = studentPoints;
        this.studentPointService = studentPointService;
        this.pointPolicy = pointPolicy;
        this.notificationService = notificationService;
        this.recipientResolver = recipientResolver;
    }

    @Transactional
    public ResultDto declareIndividualResult(Long eventId, Long studentId, String resultType, Long declaredByUserId) {
        Event event = findEvent(eventId);
        if (!"INDIVIDUAL".equals(event.getEventType())) {
            throw new IllegalArgumentException("Individual result is allowed only for individual events.");
        }
        Student student = students.findById(studentId).orElseThrow(() -> new IllegalArgumentException("Student not found."));
        if (!registrations.existsByEventIdAndStudentIdAndStatus(eventId, studentId, "REGISTERED")) {
            throw new IllegalArgumentException("Student is not registered for this event.");
        }
        Result result = results.findByEventIdAndStudentId(eventId, studentId).orElseGet(Result::new);
        result.setEvent(event);
        result.setStudent(student);
        result.setTeam(null);
        applyResult(result, resultType, declaredByUserId);
        return toDto(result);
    }

    @Transactional
    public ResultDto declareTeamResult(Long eventId, Long teamId, String resultType, Long declaredByUserId) {
        Event event = findEvent(eventId);
        if (!"TEAM".equals(event.getEventType())) {
            throw new IllegalArgumentException("Team result is allowed only for team events.");
        }
        Team team = teams.findById(teamId).orElseThrow(() -> new IllegalArgumentException("Team not found."));
        if (!team.getEvent().getId().equals(eventId)) {
            throw new IllegalArgumentException("Team does not belong to this event.");
        }
        List<Registration> registeredMembers = registrations.findByEventIdAndTeamIdAndStatus(eventId, teamId, "REGISTERED");
        if (registeredMembers.isEmpty()) {
            throw new IllegalArgumentException("Team is not registered for this event.");
        }
        Result result = results.findByEventIdAndTeamId(eventId, teamId).orElseGet(Result::new);
        result.setEvent(event);
        result.setTeam(team);
        result.setStudent(null);
        applyResult(result, resultType, declaredByUserId);
        return toDto(result);
    }

    @Transactional(readOnly = true)
    public EventResultSummaryDto listEventResults(Long eventId) {
        Event event = findEvent(eventId);
        return new EventResultSummaryDto(
                event.getId(),
                event.getTitle(),
                event.getEventType(),
                event.getCategory() == null ? null : event.getCategory().getName(),
                results.findByEventIdOrderByDeclaredAtDesc(eventId).stream().map(this::toDto).toList()
        );
    }

    @Transactional
    public PublishResultsResponse publishResults(Long eventId) {
        Event event = findEvent(eventId);
        if (!results.existsByEventId(eventId)) {
            throw new IllegalArgumentException("At least one result is required before publishing.");
        }
        if (event.isResultsPublished()) {
            return new PublishResultsResponse(event.getId(), true, event.getResultsPublishedAt(), event.getStatus(), event.isRegistrationOpen(), "Results already published.");
        }
        event.setResultsPublished(true);
        event.setResultsPublishedAt(LocalDateTime.now());
        event.setStatus("COMPLETED");
        event.setRegistrationOpen(false);
        event.setUpdatedAt(LocalDateTime.now());
        notificationService.notifyUsers(
                recipientResolver.combine(recipientResolver.getRegisteredStudentUserIds(eventId), recipientResolver.getAssignedFacultyUserIds(eventId)),
                "Results published",
                "Final results for " + event.getTitle() + " have been published.",
                "RESULT_PUBLISHED",
                "EVENT",
                event.getId()
        );
        notificationService.notifyUsers(
                recipientResolver.combine(recipientResolver.getRegisteredStudentUserIds(eventId), recipientResolver.getAssignedFacultyUserIds(eventId)),
                "Event completed",
                event.getTitle() + " has been marked as completed.",
                "EVENT_COMPLETED",
                "EVENT",
                event.getId()
        );
        return new PublishResultsResponse(event.getId(), true, event.getResultsPublishedAt(), event.getStatus(), event.isRegistrationOpen(), "Results published and event completed.");
    }

    @Transactional
    public void deleteResult(Long resultId) {
        Result result = results.findById(resultId).orElseThrow(() -> new IllegalArgumentException("Result not found."));
        studentPointService.deletePointsForResult(result);
        results.delete(result);
    }

    @Transactional(readOnly = true)
    public List<StudentResultDto> getStudentResults(Long studentId) {
        List<Result> ownResults = new ArrayList<>(results.findByStudentIdOrderByDeclaredAtDesc(studentId));
        List<Long> teamIds = teamMembers.findByStudentIdOrderByJoinedAtDesc(studentId).stream()
                .map(member -> member.getTeam().getId())
                .distinct()
                .toList();
        for (Long teamId : teamIds) {
            ownResults.addAll(results.findByTeamIdOrderByDeclaredAtDesc(teamId));
        }
        return ownResults.stream()
                .filter(result -> hasRegisteredStudent(result, studentId))
                .filter(result -> result.getEvent().isResultsPublished())
                .map(result -> toStudentResultDto(result, studentId))
                .toList();
    }

    @Transactional(readOnly = true)
    public StudentResultDto getStudentEventResult(Long eventId, Long studentId) {
        if (!registrations.existsByEventIdAndStudentIdAndStatus(eventId, studentId, "REGISTERED")) {
            throw new IllegalArgumentException("Student is not registered for this event.");
        }
        Event event = findEvent(eventId);
        if (!event.isResultsPublished()) {
            return null;
        }
        Result result;
        if ("INDIVIDUAL".equals(event.getEventType())) {
            result = results.findByEventIdAndStudentId(eventId, studentId).orElse(null);
        } else {
            Registration registration = registrations.findByStudentIdOrderByRegisteredAtDesc(studentId).stream()
                    .filter(item -> item.getEvent().getId().equals(eventId) && item.getTeam() != null && "REGISTERED".equals(item.getStatus()))
                    .findFirst()
                    .orElseThrow(() -> new IllegalArgumentException("Team registration not found."));
            result = results.findByEventIdAndTeamId(eventId, registration.getTeam().getId()).orElse(null);
        }
        return result == null ? null : toStudentResultDto(result, studentId);
    }

    private void applyResult(Result result, String resultType, Long declaredByUserId) {
        String normalized = validResultType(resultType);
        User declaredBy = users.findById(declaredByUserId).orElseThrow(() -> new IllegalArgumentException("Declaring user not found."));
        result.setResultType(normalized);
        result.setPointsAwarded(pointPolicy.calculatePoints(normalized, result.getEvent()));
        result.setDeclaredBy(declaredBy);
        result.setDeclaredAt(LocalDateTime.now());
        Result saved = results.save(result);
        studentPointService.replacePointsForResult(saved);
    }

    private boolean hasRegisteredStudent(Result result, Long studentId) {
        if (result.getStudent() != null) {
            return result.getStudent().getId().equals(studentId);
        }
        return registrations.existsByEventIdAndStudentIdAndStatus(result.getEvent().getId(), studentId, "REGISTERED");
    }

    private ResultDto toDto(Result result) {
        Student student = result.getStudent();
        Team team = result.getTeam();
        return new ResultDto(
                result.getId(),
                result.getEvent().getId(),
                result.getEvent().getTitle(),
                result.getEvent().getEventType(),
                student == null ? null : student.getId(),
                student == null ? null : student.getName(),
                student == null ? null : student.getRegisterNumber(),
                student == null || student.getDepartment() == null ? null : student.getDepartment().getCode(),
                team == null ? null : team.getId(),
                team == null ? null : team.getTeamName(),
                team == null ? null : team.getTeamCode(),
                result.getResultType(),
                result.getPointsAwarded(),
                result.getDeclaredBy() == null ? null : result.getDeclaredBy().getId(),
                result.getDeclaredBy() == null ? null : result.getDeclaredBy().getEmail(),
                result.getDeclaredAt(),
                team == null ? List.of() : teamMembers.findByTeamIdOrderByJoinedAtAsc(team.getId()).stream()
                        .map(member -> {
                            Student item = member.getStudent();
                            return new ResultMemberDto(item.getId(), item.getName(), item.getRegisterNumber(), item.getDepartment() == null ? null : item.getDepartment().getCode());
                        })
                        .toList()
        );
    }

    private StudentResultDto toStudentResultDto(Result result, Long studentId) {
        StudentPoint point = studentPoints.findByReason("RESULT:" + result.getId()).stream()
                .filter(item -> item.getStudent().getId().equals(studentId))
                .findFirst()
                .orElse(null);
        return new StudentResultDto(
                result.getId(),
                result.getEvent().getId(),
                result.getEvent().getTitle(),
                result.getEvent().getCategory() == null ? null : result.getEvent().getCategory().getName(),
                result.getEvent().getEventType(),
                result.getTeam() == null ? null : result.getTeam().getTeamName(),
                result.getResultType(),
                point == null ? result.getPointsAwarded() : point.getPoints(),
                result.getDeclaredAt()
        );
    }

    private Event findEvent(Long eventId) {
        return events.findById(eventId).orElseThrow(() -> new IllegalArgumentException("Event not found."));
    }

    private String validResultType(String resultType) {
        String normalized = resultType == null ? "" : resultType.trim().toUpperCase();
        if (!RESULT_TYPES.contains(normalized)) {
            throw new IllegalArgumentException("Invalid result type.");
        }
        return normalized;
    }
}
