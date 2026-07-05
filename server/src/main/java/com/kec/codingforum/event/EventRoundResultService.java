package com.kec.codingforum.event;

import com.kec.codingforum.event.dto.RoundResultDto;
import com.kec.codingforum.registration.RegistrationRepository;
import com.kec.codingforum.registration.Registration;
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
    private static final Set<String> FINAL_STATUSES = Set.of("WINNER", "RUNNER_UP", "SECOND_RUNNER_UP", "PARTICIPANT", "DISQUALIFIED");

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
        assertRoundEditable(round);
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
        return toDto(saved);
    }

    @Transactional
    public RoundResultDto saveStudent(Long eventId, Long roundId, Long studentId, String status, Long declaredByUserId) {
        EventRound round = findRound(eventId, roundId);
        Event event = round.getEvent();
        assertRoundEditable(round);
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
        return toDto(saved);
    }

    @Transactional
    public void publishRoundResult(Long eventId, Long roundId, Long userId) {
        EventRound round = findRound(eventId, roundId);
        Event event = round.getEvent();
        if (round.isFinalRound()) {
            throw new IllegalArgumentException("Use Publish Final Result for the final round.");
        }
        if (round.isResultPublished()) {
            throw new IllegalArgumentException("This round result has already been published.");
        }
        if (event.isResultsPublished()) {
            throw new IllegalArgumentException("Final results have already been published.");
        }
        if ("TEAM".equals(event.getEventType())) {
            publishTeamShortlist(event, round, userId);
        } else {
            publishStudentShortlist(event, round, userId);
        }
        markRoundPublished(round, userId);
    }

    @Transactional
    public void publishFinalResult(Long eventId, Long roundId, Long userId) {
        EventRound round = findRound(eventId, roundId);
        Event event = round.getEvent();
        if (!round.isFinalRound()) {
            throw new IllegalArgumentException("Use Publish Round Result for non-final rounds.");
        }
        if (round.isResultPublished() || event.isResultsPublished()) {
            throw new IllegalArgumentException("Final results have already been published.");
        }
        List<EventRoundResult> drafts = roundResults.findByEventIdAndRoundIdOrderByDeclaredAtDesc(eventId, roundId);
        if (drafts.isEmpty()) {
            throw new IllegalArgumentException("At least one final result is required before publishing.");
        }
        for (EventRoundResult draft : drafts) {
            if (draft.getTeam() != null) {
                resultService.declareTeamResult(eventId, draft.getTeam().getId(), draft.getStatus(), userId);
            } else {
                resultService.declareIndividualResult(eventId, draft.getStudent().getId(), draft.getStatus(), userId);
            }
        }
        markRoundPublished(round, userId);
        resultService.publishResults(eventId);
    }

    @Transactional(readOnly = true)
    public RoundResultDto getStudentRoundResult(Long eventId, Long roundId, Long studentId) {
        EventRound round = findRound(eventId, roundId);
        if (!round.isResultPublished()) {
            return null;
        }
        if ("INDIVIDUAL".equals(round.getEvent().getEventType())) {
            return roundResults.findByRoundIdAndStudentId(roundId, studentId).map(this::toDto).orElse(null);
        }
        return registrations.findByStudentIdOrderByRegisteredAtDesc(studentId).stream()
                .filter(registration -> registration.getEvent().getId().equals(eventId) && registration.getTeam() != null && "REGISTERED".equals(registration.getStatus()))
                .findFirst()
                .flatMap(registration -> roundResults.findByRoundIdAndTeamId(roundId, registration.getTeam().getId()))
                .map(this::toDto)
                .orElse(null);
    }

    @Transactional(readOnly = true)
    public void requireAssigned(Long eventId, Long facultyId) {
        events.findByIdAndInchargesId(eventId, facultyId)
                .orElseThrow(() -> new AccessDeniedException("This event is not assigned to you."));
    }

    private String validStatus(EventRound round, String status) {
        String normalized = status == null ? "" : status.trim().toUpperCase(Locale.ROOT);
        Set<String> allowed = round.isFinalRound() ? FINAL_STATUSES : NON_FINAL_STATUSES;
        if (!round.isFinalRound() && "SELECTED".equals(normalized)) {
            normalized = "QUALIFIED";
        }
        if (!round.isFinalRound()) {
            allowed = Set.of("QUALIFIED", "DISQUALIFIED");
        }
        if (!allowed.contains(normalized)) {
            throw new IllegalArgumentException(round.isFinalRound()
                    ? "Final round status must be WINNER, RUNNER_UP, SECOND_RUNNER_UP, PARTICIPANT, or DISQUALIFIED."
                    : "Non-final round status must be QUALIFIED or DISQUALIFIED.");
        }
        return normalized;
    }

    private void assertRoundEditable(EventRound round) {
        if (round.isResultPublished()) {
            throw new IllegalArgumentException("This round result has been published. Editing is disabled.");
        }
        Event event = round.getEvent();
        if (event.isResultsPublished() || "COMPLETED".equals(event.getStatus())) {
            throw new IllegalArgumentException("Final results have been published. Event is completed. Editing is disabled.");
        }
    }

    private void publishTeamShortlist(Event event, EventRound round, Long userId) {
        User user = users.findById(userId).orElseThrow(() -> new IllegalArgumentException("Publishing user not found."));
        List<Team> participatingTeams = participatingTeams(event, round);
        if (participatingTeams.isEmpty()) {
            throw new IllegalArgumentException("No participants found for this round.");
        }
        for (Team team : participatingTeams) {
            EventRoundResult result = roundResults.findByRoundIdAndTeamId(round.getId(), team.getId()).orElseGet(EventRoundResult::new);
            result.setEvent(event);
            result.setRound(round);
            result.setTeam(team);
            result.setStudent(null);
            result.setStatus("DISQUALIFIED".equals(result.getStatus()) ? "DISQUALIFIED" : "QUALIFIED");
            result.setDeclaredBy(user);
            result.setDeclaredAt(LocalDateTime.now());
            roundResults.save(result);
        }
        createNextRoundRows(event, round, user);
    }

    private void publishStudentShortlist(Event event, EventRound round, Long userId) {
        User user = users.findById(userId).orElseThrow(() -> new IllegalArgumentException("Publishing user not found."));
        List<Student> participatingStudents = participatingStudents(event, round);
        if (participatingStudents.isEmpty()) {
            throw new IllegalArgumentException("No participants found for this round.");
        }
        participatingStudents.forEach(student -> {
            EventRoundResult result = roundResults.findByRoundIdAndStudentId(round.getId(), student.getId()).orElseGet(EventRoundResult::new);
            result.setEvent(event);
            result.setRound(round);
            result.setTeam(null);
            result.setStudent(student);
            result.setStatus("DISQUALIFIED".equals(result.getStatus()) ? "DISQUALIFIED" : "QUALIFIED");
            result.setDeclaredBy(user);
            result.setDeclaredAt(LocalDateTime.now());
            roundResults.save(result);
        });
        createNextRoundRows(event, round, user);
    }

    private List<Team> participatingTeams(Event event, EventRound round) {
        if (isFirstRound(event, round)) {
            return registrations.findByEventIdAndStatus(event.getId(), "REGISTERED").stream()
                    .map(Registration::getTeam)
                    .filter(team -> team != null)
                    .distinct()
                    .toList();
        }
        return roundResults.findByRoundId(round.getId()).stream()
                .map(EventRoundResult::getTeam)
                .filter(team -> team != null)
                .distinct()
                .toList();
    }

    private List<Student> participatingStudents(Event event, EventRound round) {
        if (isFirstRound(event, round)) {
            return registrations.findByEventIdAndStatus(event.getId(), "REGISTERED").stream()
                    .map(Registration::getStudent)
                    .distinct()
                    .toList();
        }
        return roundResults.findByRoundId(round.getId()).stream()
                .map(EventRoundResult::getStudent)
                .filter(student -> student != null)
                .distinct()
                .toList();
    }

    private boolean isFirstRound(Event event, EventRound round) {
        return rounds.findByEventIdOrderByRoundOrderAsc(event.getId()).stream()
                .noneMatch(item -> item.getRoundOrder() < round.getRoundOrder());
    }

    private void createNextRoundRows(Event event, EventRound round, User user) {
        EventRound nextRound = rounds.findByEventIdOrderByRoundOrderAsc(event.getId()).stream()
                .filter(item -> item.getRoundOrder() > round.getRoundOrder())
                .findFirst()
                .orElse(null);
        if (nextRound == null) {
            return;
        }
        roundResults.findByRoundId(round.getId()).stream()
                .filter(result -> "QUALIFIED".equals(result.getStatus()))
                .forEach(result -> {
                    EventRoundResult next = result.getTeam() != null
                            ? roundResults.findByRoundIdAndTeamId(nextRound.getId(), result.getTeam().getId()).orElseGet(EventRoundResult::new)
                            : roundResults.findByRoundIdAndStudentId(nextRound.getId(), result.getStudent().getId()).orElseGet(EventRoundResult::new);
                    next.setEvent(event);
                    next.setRound(nextRound);
                    next.setTeam(result.getTeam());
                    next.setStudent(result.getStudent());
                    next.setStatus("QUALIFIED");
                    next.setDeclaredBy(user);
                    next.setDeclaredAt(LocalDateTime.now());
                    roundResults.save(next);
                });
    }

    private void markRoundPublished(EventRound round, Long userId) {
        User user = users.findById(userId).orElseThrow(() -> new IllegalArgumentException("Publishing user not found."));
        round.setStatus("COMPLETED");
        round.setResultPublished(true);
        round.setResultPublishedAt(LocalDateTime.now());
        round.setPublishedBy(user);
        round.setUpdatedAt(LocalDateTime.now());
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
