package com.kec.codingforum.event;

import com.kec.codingforum.event.dto.RoundResultDto;
import com.kec.codingforum.registration.RegistrationRepository;
import com.kec.codingforum.result.ResultService;
import com.kec.codingforum.team.Team;
import com.kec.codingforum.team.TeamRepository;
import com.kec.codingforum.user.Student;
import com.kec.codingforum.user.StudentRepository;
import com.kec.codingforum.user.User;
import com.kec.codingforum.user.UserRepository;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Locale;
import java.util.Set;

@Service
public class EventRoundResultService {

    private static final Set<String> NON_FINAL_STATUSES = Set.of("SELECTED", "DISQUALIFIED");
    private static final Set<String> FINAL_STATUSES = Set.of("WINNER", "RUNNER_UP", "PARTICIPANT", "DISQUALIFIED");

    private final EventRoundResultRepository roundResults;
    private final EventRoundRepository rounds;
    private final EventRepository events;
    private final TeamRepository teams;
    private final StudentRepository students;
    private final UserRepository users;
    private final RegistrationRepository registrations;
    private final ResultService resultService;

    public EventRoundResultService(
            EventRoundResultRepository roundResults,
            EventRoundRepository rounds,
            EventRepository events,
            TeamRepository teams,
            StudentRepository students,
            UserRepository users,
            RegistrationRepository registrations,
            ResultService resultService
    ) {
        this.roundResults = roundResults;
        this.rounds = rounds;
        this.events = events;
        this.teams = teams;
        this.students = students;
        this.users = users;
        this.registrations = registrations;
        this.resultService = resultService;
    }

    @Transactional(readOnly = true)
    public List<RoundResultDto> list(Long eventId, Long roundId) {
        findRound(eventId, roundId);
        return roundResults.findByEventIdAndRoundIdOrderByDeclaredAtDesc(eventId, roundId).stream().map(this::toDto).toList();
    }

    @Transactional
    public RoundResultDto saveTeam(Long eventId, Long roundId, Long teamId, String status, Long declaredByUserId) {
        EventRound round = findRound(eventId, roundId);
        Event event = round.getEvent();
        if (!"TEAM".equals(event.getEventType())) {
            throw new IllegalArgumentException("Team round result is allowed only for team events.");
        }
        Team team = teams.findById(teamId).orElseThrow(() -> new IllegalArgumentException("Team not found."));
        if (!team.getEvent().getId().equals(eventId)) {
            throw new IllegalArgumentException("Team does not belong to this event.");
        }
        if (registrations.findByEventIdAndTeamIdAndStatus(eventId, teamId, "REGISTERED").isEmpty()) {
            throw new IllegalArgumentException("Team is not registered for this event.");
        }
        String normalized = validStatus(round, status);
        User declaredBy = users.findById(declaredByUserId).orElseThrow(() -> new IllegalArgumentException("Declaring user not found."));
        EventRoundResult result = roundResults.findByRoundIdAndTeamId(roundId, teamId).orElseGet(EventRoundResult::new);
        result.setEvent(event);
        result.setRound(round);
        result.setTeam(team);
        result.setStudent(null);
        result.setStatus(normalized);
        result.setDeclaredBy(declaredBy);
        result.setDeclaredAt(LocalDateTime.now());
        EventRoundResult saved = roundResults.save(result);
        if (round.isFinalRound()) {
            resultService.declareTeamResult(eventId, teamId, normalized, declaredByUserId);
        }
        return toDto(saved);
    }

    @Transactional
    public RoundResultDto saveStudent(Long eventId, Long roundId, Long studentId, String status, Long declaredByUserId) {
        EventRound round = findRound(eventId, roundId);
        Event event = round.getEvent();
        if (!"INDIVIDUAL".equals(event.getEventType())) {
            throw new IllegalArgumentException("Student round result is allowed only for individual events.");
        }
        Student student = students.findById(studentId).orElseThrow(() -> new IllegalArgumentException("Student not found."));
        if (!registrations.existsByEventIdAndStudentIdAndStatus(eventId, studentId, "REGISTERED")) {
            throw new IllegalArgumentException("Student is not registered for this event.");
        }
        String normalized = validStatus(round, status);
        User declaredBy = users.findById(declaredByUserId).orElseThrow(() -> new IllegalArgumentException("Declaring user not found."));
        EventRoundResult result = roundResults.findByRoundIdAndStudentId(roundId, studentId).orElseGet(EventRoundResult::new);
        result.setEvent(event);
        result.setRound(round);
        result.setTeam(null);
        result.setStudent(student);
        result.setStatus(normalized);
        result.setDeclaredBy(declaredBy);
        result.setDeclaredAt(LocalDateTime.now());
        EventRoundResult saved = roundResults.save(result);
        if (round.isFinalRound()) {
            resultService.declareIndividualResult(eventId, studentId, normalized, declaredByUserId);
        }
        return toDto(saved);
    }

    @Transactional(readOnly = true)
    public void requireAssigned(Long eventId, Long facultyId) {
        events.findByIdAndInchargesId(eventId, facultyId)
                .orElseThrow(() -> new AccessDeniedException("This event is not assigned to you."));
    }

    private String validStatus(EventRound round, String status) {
        String normalized = status == null ? "" : status.trim().toUpperCase(Locale.ROOT);
        Set<String> allowed = round.isFinalRound() ? FINAL_STATUSES : NON_FINAL_STATUSES;
        if (!allowed.contains(normalized)) {
            throw new IllegalArgumentException(round.isFinalRound()
                    ? "Final round status must be WINNER, RUNNER_UP, PARTICIPANT, or DISQUALIFIED."
                    : "Non-final round status must be SELECTED or DISQUALIFIED.");
        }
        return normalized;
    }

    private EventRound findRound(Long eventId, Long roundId) {
        return rounds.findByIdAndEventId(roundId, eventId).orElseThrow(() -> new IllegalArgumentException("Round not found."));
    }

    private RoundResultDto toDto(EventRoundResult result) {
        Team team = result.getTeam();
        Student student = result.getStudent();
        return new RoundResultDto(
                result.getId(),
                result.getEvent().getId(),
                result.getRound().getId(),
                result.getRound().isFinalRound(),
                team == null ? null : team.getId(),
                team == null ? null : team.getTeamName(),
                team == null ? null : team.getTeamCode(),
                student == null ? null : student.getId(),
                student == null ? null : student.getName(),
                student == null ? null : student.getRegisterNumber(),
                result.getStatus(),
                result.getDeclaredBy() == null ? null : result.getDeclaredBy().getId(),
                result.getDeclaredAt()
        );
    }
}
