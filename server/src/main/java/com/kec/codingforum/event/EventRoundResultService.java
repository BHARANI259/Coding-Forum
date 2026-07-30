package com.kec.codingforum.event;

import com.kec.codingforum.event.dto.RoundResultDto;
import com.kec.codingforum.notification.NotificationService;
import com.kec.codingforum.registration.RegistrationRepository;
import com.kec.codingforum.registration.Registration;
import com.kec.codingforum.result.ResultService;
import com.kec.codingforum.team.Team;
import com.kec.codingforum.team.TeamMemberRepository;
import com.kec.codingforum.team.TeamRepository;
import com.kec.codingforum.user.Student;
import com.kec.codingforum.user.StudentRepository;
import com.kec.codingforum.user.User;
import com.kec.codingforum.user.UserRepository;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.apache.poi.ss.usermodel.DataFormatter;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.ss.usermodel.WorkbookFactory;

import java.io.IOException;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

@Service
public class EventRoundResultService {

    private static final long MAX_MARKS_IMPORT_SIZE_BYTES = 5 * 1024 * 1024;
    private static final Set<String> NON_FINAL_STATUSES = Set.of("SELECTED", "QUALIFIED", "DISQUALIFIED", "NOT_PRESENTED");
    private static final Set<String> FINAL_STATUSES = Set.of("WINNER", "RUNNER_UP", "SECOND_RUNNER_UP", "PARTICIPANT", "DISQUALIFIED", "NOT_PRESENTED");

    private final EventRoundResultRepository roundResults;
    private final EventRoundRepository rounds;
    private final EventRepository events;
    private final TeamRepository teams;
    private final StudentRepository students;
    private final UserRepository users;
    private final RegistrationRepository registrations;
    private final ResultService resultService;
    private final TeamMemberRepository teamMembers;
    private final NotificationService notificationService;

    public EventRoundResultService(
            EventRoundResultRepository roundResults,
            EventRoundRepository rounds,
            EventRepository events,
            TeamRepository teams,
            StudentRepository students,
            UserRepository users,
            RegistrationRepository registrations,
            ResultService resultService,
            TeamMemberRepository teamMembers,
            NotificationService notificationService
    ) {
        this.roundResults = roundResults;
        this.rounds = rounds;
        this.events = events;
        this.teams = teams;
        this.students = students;
        this.users = users;
        this.registrations = registrations;
        this.resultService = resultService;
        this.teamMembers = teamMembers;
        this.notificationService = notificationService;
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
        assertRoundEditable(round);
        if (round.isFinalRound()) {
            throw new IllegalArgumentException("Use Publish Final Result for the final round.");
        }
        if (!"ONGOING".equals(round.getStatus())) {
            throw new IllegalArgumentException("Start this round before publishing its result.");
        }
        boolean hasNextRound = rounds.findByEventIdOrderByRoundOrderAsc(eventId).stream()
                .anyMatch(item -> item.getRoundOrder() > round.getRoundOrder());
        if (!hasNextRound) {
            throw new IllegalArgumentException("Configure a following round before publishing this non-final round.");
        }
        if ("TEAM".equals(event.getEventType())) {
            publishTeamShortlist(event, round, userId);
        } else {
            publishStudentShortlist(event, round, userId);
        }
        markRoundPublished(round, userId);
        notifyRoundProgress(event, round);
    }

    @Transactional
    public void publishFinalResult(Long eventId, Long roundId, Long userId) {
        EventRound round = findRound(eventId, roundId);
        Event event = round.getEvent();
        assertRoundEditable(round);
        if (!round.isFinalRound()) {
            throw new IllegalArgumentException("Use Publish Round Result for non-final rounds.");
        }
        if (!"ONGOING".equals(round.getStatus())) {
            throw new IllegalArgumentException("Start the final round before publishing its result.");
        }
        if (rounds.countByEventIdAndFinalRoundTrue(eventId) != 1) {
            throw new IllegalArgumentException("Exactly one final round must be configured before publishing final results.");
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
        notifyRoundProgress(event, round);
        resultService.publishResults(eventId);
    }

    @Transactional
    public List<RoundResultDto> importMarks(Long eventId, Long roundId, MultipartFile file, Long declaredByUserId) {
        EventRound round = findRound(eventId, roundId);
        Event event = round.getEvent();
        assertRoundEditable(round);
        if (!round.isFinalRound()) {
            throw new IllegalArgumentException("Marks import is available only for the final round.");
        }
        if (!isMarksImportCategory(event)) {
            throw new IllegalArgumentException("Marks import is available only for coding contest or placement drill events.");
        }
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Choose an Excel file to import marks.");
        }
        if (file.getSize() > MAX_MARKS_IMPORT_SIZE_BYTES) {
            throw new IllegalArgumentException("Marks import file must be 5 MB or smaller.");
        }
        String name = file.getOriginalFilename() == null ? "" : file.getOriginalFilename().toLowerCase(Locale.ROOT);
        if (!name.endsWith(".xlsx") && !name.endsWith(".xls")) {
            throw new IllegalArgumentException("Upload an Excel file with .xlsx or .xls extension.");
        }
        User declaredBy = users.findById(declaredByUserId).orElseThrow(() -> new IllegalArgumentException("Declaring user not found."));
        List<ImportedMarkRow> importedRows = readMarkRows(file);
        if (importedRows.isEmpty()) {
            throw new IllegalArgumentException("No valid marks found in the Excel file.");
        }
        List<EventRoundResult> savedRows = new ArrayList<>();
        for (ImportedMarkRow row : importedRows) {
            EventRoundResult result = resolveImportTarget(event, round, row);
            result.setStatus(row.status() == null ? "PARTICIPANT" : validStatus(round, row.status()));
            result.setMarks(row.marks());
            result.setDeclaredBy(declaredBy);
            result.setDeclaredAt(LocalDateTime.now());
            savedRows.add(roundResults.save(result));
        }
        List<EventRoundResult> allRoundRows = roundResults.findByEventIdAndRoundIdOrderByDeclaredAtDesc(eventId, roundId);
        assignRanksFromMarks(allRoundRows);
        return allRoundRows.stream()
                .sorted(Comparator.comparing((EventRoundResult item) -> item.getMarks() == null ? BigDecimal.valueOf(-1) : item.getMarks()).reversed())
                .map(this::toDto)
                .toList();
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
        if (!allowed.contains(normalized)) {
            throw new IllegalArgumentException(round.isFinalRound()
                    ? "Final round status must be WINNER, RUNNER_UP, SECOND_RUNNER_UP, PARTICIPANT, DISQUALIFIED, or NOT_PRESENTED."
                    : "Non-final round status must be QUALIFIED, DISQUALIFIED, or NOT_PRESENTED.");
        }
        return normalized;
    }

    private void assertRoundEditable(EventRound round) {
        if (round.isResultPublished()) {
            throw new IllegalArgumentException("This round result has been published. Editing is disabled.");
        }
        Event event = round.getEvent();
        if (event.isResultsPublished() || "CANCELLED".equals(event.getStatus())) {
            throw new IllegalArgumentException("This event is closed. Result editing is disabled.");
        }
        if (!Set.of("PUBLISHED", "ONGOING", "COMPLETED").contains(event.getStatus())) {
            throw new IllegalArgumentException("Publish the event before entering round results.");
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
            result.setStatus(Set.of("DISQUALIFIED", "NOT_PRESENTED").contains(result.getStatus()) ? result.getStatus() : "QUALIFIED");
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
            result.setStatus(Set.of("DISQUALIFIED", "NOT_PRESENTED").contains(result.getStatus()) ? result.getStatus() : "QUALIFIED");
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

    private void notifyRoundProgress(Event event, EventRound round) {
        List<EventRoundResult> publishedRows = roundResults.findByEventIdAndRoundIdOrderByDeclaredAtDesc(event.getId(), round.getId());
        for (EventRoundResult result : publishedRows) {
            if (result.getTeam() != null) {
                List<Long> studentIds = teamMembers.findByTeamIdOrderByJoinedAtAsc(result.getTeam().getId()).stream()
                        .map(member -> member.getStudent().getId())
                        .distinct()
                        .toList();
                List<Long> userIds = users.findByStudentIdIn(studentIds).stream().map(User::getId).toList();
                notificationService.notifyUsers(
                        userIds,
                        round.isFinalRound() ? "Final result published" : "Round result published",
                        teamProgressMessage(event, round, result),
                        "RESULT_PUBLISHED",
                        "EVENT",
                        event.getId()
                );
            } else if (result.getStudent() != null) {
                users.findByStudentId(result.getStudent().getId()).ifPresent(user -> notificationService.notifyUsers(
                        List.of(user.getId()),
                        round.isFinalRound() ? "Final result published" : "Round result published",
                        studentProgressMessage(event, round, result),
                        "RESULT_PUBLISHED",
                        "EVENT",
                        event.getId()
                ));
            }
        }
    }

    private String studentProgressMessage(Event event, EventRound round, EventRoundResult result) {
        return round.getRoundName() + " result for " + event.getTitle() + " is published. Your progress: " + progressText(result.getStatus(), round.isFinalRound()) + ".";
    }

    private String teamProgressMessage(Event event, EventRound round, EventRoundResult result) {
        return round.getRoundName() + " result for " + event.getTitle() + " is published. Team " + result.getTeam().getTeamName() + " progress: " + progressText(result.getStatus(), round.isFinalRound()) + ".";
    }

    private String progressText(String status, boolean finalRound) {
        return switch (status == null ? "" : status) {
            case "QUALIFIED" -> "Qualified for the next round";
            case "DISQUALIFIED" -> "Disqualified in this round";
            case "NOT_PRESENTED" -> "Marked as not presented";
            case "WINNER" -> "Winner";
            case "RUNNER_UP" -> "Runner up";
            case "SECOND_RUNNER_UP" -> "Second runner up";
            case "PARTICIPANT" -> finalRound ? "Participant in the final result" : "Participant";
            default -> "Result updated";
        };
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
                result.getMarks(),
                result.getDeclaredBy() == null ? null : result.getDeclaredBy().getId(),
                result.getDeclaredAt()
        );
    }

    private boolean isMarksImportCategory(Event event) {
        String category = event.getCategory() == null ? "" : event.getCategory().getName().toLowerCase(Locale.ROOT);
        return category.contains("coding") || category.contains("contest") || category.contains("placement") || category.contains("drill");
    }

    private List<ImportedMarkRow> readMarkRows(MultipartFile file) {
        try (Workbook workbook = WorkbookFactory.create(file.getInputStream())) {
            Sheet sheet = workbook.getSheetAt(0);
            DataFormatter formatter = new DataFormatter();
            Map<String, Integer> headers = headers(sheet.getRow(0), formatter);
            Integer identifierIndex = firstPresent(headers, "registernumber", "register number", "register_no", "regno", "teamcode", "team code");
            Integer marksIndex = firstPresent(headers, "marks", "score", "points");
            Integer statusIndex = firstPresent(headers, "status", "result");
            if (identifierIndex == null || marksIndex == null) {
                throw new IllegalArgumentException("Excel must include Register Number or Team Code and Marks columns.");
            }
            List<ImportedMarkRow> rows = new ArrayList<>();
            for (int index = 1; index <= sheet.getLastRowNum(); index++) {
                Row row = sheet.getRow(index);
                if (row == null) {
                    continue;
                }
                String identifier = formatter.formatCellValue(row.getCell(identifierIndex)).trim();
                String marksText = formatter.formatCellValue(row.getCell(marksIndex)).trim();
                if (identifier.isBlank() || marksText.isBlank()) {
                    continue;
                }
                String status = statusIndex == null ? null : formatter.formatCellValue(row.getCell(statusIndex)).trim();
                rows.add(new ImportedMarkRow(identifier, new BigDecimal(marksText), status.isBlank() ? null : status));
            }
            return rows;
        } catch (IOException exception) {
            throw new IllegalArgumentException("Unable to read the Excel file.");
        } catch (NumberFormatException exception) {
            throw new IllegalArgumentException("Marks column must contain numbers only.");
        }
    }

    private Map<String, Integer> headers(Row headerRow, DataFormatter formatter) {
        if (headerRow == null) {
            throw new IllegalArgumentException("Excel must include a header row.");
        }
        Map<String, Integer> headers = new HashMap<>();
        for (int index = 0; index < headerRow.getLastCellNum(); index++) {
            String value = formatter.formatCellValue(headerRow.getCell(index)).trim().toLowerCase(Locale.ROOT);
            if (!value.isBlank()) {
                headers.put(value.replaceAll("[^a-z0-9]", ""), index);
                headers.put(value, index);
            }
        }
        return headers;
    }

    private Integer firstPresent(Map<String, Integer> headers, String... names) {
        for (String name : names) {
            Integer index = headers.get(name.replaceAll("[^a-z0-9]", "").toLowerCase(Locale.ROOT));
            if (index != null) {
                return index;
            }
        }
        return null;
    }

    private EventRoundResult resolveImportTarget(Event event, EventRound round, ImportedMarkRow row) {
        EventRoundResult result;
        if ("TEAM".equals(event.getEventType())) {
            Team team = teams.findByTeamCodeIgnoreCase(row.identifier()).orElseThrow(() -> new IllegalArgumentException("Team code not found: " + row.identifier()));
            if (!team.getEvent().getId().equals(event.getId())) {
                throw new IllegalArgumentException("Team code does not belong to this event: " + row.identifier());
            }
            result = roundResults.findByRoundIdAndTeamId(round.getId(), team.getId()).orElseGet(EventRoundResult::new);
            result.setTeam(team);
            result.setStudent(null);
        } else {
            Student student = students.findByRegisterNumberIgnoreCase(row.identifier()).orElseThrow(() -> new IllegalArgumentException("Register number not found: " + row.identifier()));
            if (!registrations.existsByEventIdAndStudentIdAndStatus(event.getId(), student.getId(), "REGISTERED")) {
                throw new IllegalArgumentException("Student is not registered for this event: " + row.identifier());
            }
            result = roundResults.findByRoundIdAndStudentId(round.getId(), student.getId()).orElseGet(EventRoundResult::new);
            result.setStudent(student);
            result.setTeam(null);
        }
        result.setEvent(event);
        result.setRound(round);
        return result;
    }

    private void assignRanksFromMarks(List<EventRoundResult> rows) {
        List<EventRoundResult> presentRows = rows.stream()
                .filter(row -> !"NOT_PRESENTED".equals(row.getStatus()) && !"DISQUALIFIED".equals(row.getStatus()))
                .sorted(Comparator.comparing(EventRoundResult::getMarks, Comparator.nullsLast(Comparator.reverseOrder())))
                .toList();
        for (int index = 0; index < presentRows.size(); index++) {
            EventRoundResult row = presentRows.get(index);
            row.setStatus(switch (index) {
                case 0 -> "WINNER";
                case 1 -> "RUNNER_UP";
                case 2 -> "SECOND_RUNNER_UP";
                default -> "PARTICIPANT";
            });
        }
    }

    private record ImportedMarkRow(String identifier, BigDecimal marks, String status) {
    }
}
