package com.kec.codingforum.event;

import com.kec.codingforum.event.dto.CreateEventRoundRequest;
import com.kec.codingforum.event.dto.EventRoundDto;
import com.kec.codingforum.event.dto.UpdateEventRoundRequest;
import com.kec.codingforum.notification.NotificationRecipientResolver;
import com.kec.codingforum.notification.NotificationService;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;

@Service
public class EventRoundService {

    private static final Set<String> ADMIN_STATUSES = Set.of("ONGOING", "CANCELLED");

    private final EventRoundRepository rounds;
    private final EventRepository events;
    private final EventEligibilityService eligibilityService;
    private final NotificationService notificationService;
    private final NotificationRecipientResolver recipientResolver;

    public EventRoundService(EventRoundRepository rounds, EventRepository events, EventEligibilityService eligibilityService, NotificationService notificationService, NotificationRecipientResolver recipientResolver) {
        this.rounds = rounds;
        this.events = events;
        this.eligibilityService = eligibilityService;
        this.notificationService = notificationService;
        this.recipientResolver = recipientResolver;
    }

    @Transactional(readOnly = true)
    public List<EventRoundDto> adminList(Long eventId) {
        findEvent(eventId);
        return listDtos(eventId);
    }

    @Transactional(readOnly = true)
    public List<EventRoundDto> facultyList(Long eventId, Long facultyId) {
        requireAssigned(eventId, facultyId);
        return listDtos(eventId);
    }

    @Transactional(readOnly = true)
    public List<EventRoundDto> studentList(Long eventId, Long studentId) {
        Event event = findEvent(eventId);
        eligibilityService.assertEligibleByStudentId(event, studentId);
        return listDtos(eventId);
    }

    @Transactional
    public EventRoundDto create(Long eventId, CreateEventRoundRequest request) {
        Event event = findEvent(eventId);
        assertStructureEditable(event);
        if (rounds.existsByEventIdAndRoundOrder(eventId, request.roundOrder())) {
            throw new IllegalArgumentException("Round order already exists for this event.");
        }
        assertSingleFinal(eventId, null, request.finalRound());
        EventRound round = new EventRound();
        round.setEvent(event);
        apply(round, request.roundName(), request.roundOrder(), request.finalRound(), request.description(), request.scheduledAt());
        EventRound saved = rounds.save(round);
        return toDto(saved);
    }

    @Transactional
    public EventRoundDto facultyCreate(Long eventId, Long facultyId, CreateEventRoundRequest request) {
        requireAssigned(eventId, facultyId);
        return create(eventId, request);
    }

    @Transactional
    public EventRoundDto update(Long eventId, Long roundId, UpdateEventRoundRequest request) {
        EventRound round = findRound(eventId, roundId);
        assertStructureEditable(round.getEvent());
        assertEditable(round);
        if (rounds.existsByEventIdAndRoundOrderAndIdNot(eventId, request.roundOrder(), roundId)) {
            throw new IllegalArgumentException("Round order already exists for this event.");
        }
        assertSingleFinal(eventId, roundId, request.finalRound());
        apply(round, request.roundName(), request.roundOrder(), request.finalRound(), request.description(), request.scheduledAt());
        return toDto(round);
    }

    @Transactional
    public EventRoundDto facultyUpdate(Long eventId, Long facultyId, Long roundId, UpdateEventRoundRequest request) {
        requireAssigned(eventId, facultyId);
        return update(eventId, roundId, request);
    }

    @Transactional
    public EventRoundDto updateStatus(Long eventId, Long roundId, String status) {
        EventRound round = findRound(eventId, roundId);
        assertEditable(round);
        String normalized = validAdminStatus(status);
        if ("ONGOING".equals(normalized)) {
            startRound(round);
        } else {
            assertEventActive(round.getEvent());
            round.setStatus("CANCELLED");
        }
        round.setUpdatedAt(LocalDateTime.now());
        notifyRoundStatusChanged(round.getEvent(), round);
        return toDto(round);
    }

    @Transactional
    public EventRoundDto facultyUpdateStatus(Long eventId, Long facultyId, Long roundId, String status) {
        requireAssigned(eventId, facultyId);
        if (!"ONGOING".equalsIgnoreCase(status == null ? "" : status.trim())) {
            throw new AccessDeniedException("Faculty can start a round; round completion happens when its result is published.");
        }
        EventRound round = findRound(eventId, roundId);
        assertEditable(round);
        startRound(round);
        round.setUpdatedAt(LocalDateTime.now());
        notifyRoundStatusChanged(round.getEvent(), round);
        return toDto(round);
    }

    @Transactional
    public void delete(Long eventId, Long roundId) {
        EventRound round = findRound(eventId, roundId);
        assertStructureEditable(round.getEvent());
        assertEditable(round);
        rounds.delete(round);
    }

    private List<EventRoundDto> listDtos(Long eventId) {
        return rounds.findByEventIdOrderByRoundOrderAsc(eventId).stream().map(this::toDto).toList();
    }

    private void apply(EventRound round, String name, Integer order, Boolean finalRound, String description, LocalDateTime scheduledAt) {
        if (order == null || order < 1) {
            throw new IllegalArgumentException("Round order must be a positive number.");
        }
        round.setRoundName(required(name, "Round name is required."));
        round.setRoundOrder(order);
        round.setFinalRound(finalRound != null && finalRound);
        round.setDescription(blankToNull(description));
        round.setScheduledAt(scheduledAt);
        round.setUpdatedAt(LocalDateTime.now());
    }

    private void requireAssigned(Long eventId, Long facultyId) {
        events.findByIdAndInchargesId(eventId, facultyId)
                .orElseThrow(() -> new AccessDeniedException("This event is not assigned to you."));
    }

    private Event findEvent(Long eventId) {
        return events.findById(eventId).orElseThrow(() -> new IllegalArgumentException("Event not found."));
    }

    private EventRound findRound(Long eventId, Long roundId) {
        return rounds.findByIdAndEventId(roundId, eventId).orElseThrow(() -> new IllegalArgumentException("Round not found."));
    }

    private void assertEditable(EventRound round) {
        if (round.isResultPublished()) {
            throw new IllegalArgumentException("This round result has been published. Editing is disabled.");
        }
        assertEventActive(round.getEvent());
    }

    private void assertStructureEditable(Event event) {
        if (!"DRAFT".equals(event.getStatus()) || event.isResultsPublished()) {
            throw new IllegalArgumentException("Round structure can be changed only while the event is in Draft.");
        }
    }

    private void assertEventActive(Event event) {
        if (event.isResultsPublished() || "COMPLETED".equals(event.getStatus()) || "CANCELLED".equals(event.getStatus())) {
            throw new IllegalArgumentException("This event is closed. Round changes are disabled.");
        }
    }

    private void assertSingleFinal(Long eventId, Long roundId, Boolean finalRound) {
        if (!Boolean.TRUE.equals(finalRound)) {
            return;
        }
        boolean anotherFinal = roundId == null
                ? rounds.existsByEventIdAndFinalRoundTrue(eventId)
                : rounds.existsByEventIdAndFinalRoundTrueAndIdNot(eventId, roundId);
        if (anotherFinal) {
            throw new IllegalArgumentException("An event can have only one final round.");
        }
    }

    private void startRound(EventRound round) {
        Event event = round.getEvent();
        assertEventActive(event);
        if ("ONGOING".equals(round.getStatus())) {
            return;
        }
        if (!"NOT_STARTED".equals(round.getStatus())) {
            throw new IllegalArgumentException("Only a round that has not started can be started.");
        }
        boolean previousRoundPending = rounds.findByEventIdOrderByRoundOrderAsc(event.getId()).stream()
                .filter(item -> item.getRoundOrder() < round.getRoundOrder())
                .anyMatch(item -> !item.isResultPublished());
        if (previousRoundPending) {
            throw new IllegalArgumentException("Publish the previous round result before starting this round.");
        }
        if (!Set.of("PUBLISHED", "ONGOING").contains(event.getStatus())) {
            throw new IllegalArgumentException("Publish the event before starting its rounds.");
        }
        round.setStatus("ONGOING");
        event.setStatus("ONGOING");
        event.setRegistrationOpen(false);
        event.setUpdatedAt(LocalDateTime.now());
    }

    private void notifyRoundStatusChanged(Event event, EventRound round) {
        String action = "ONGOING".equals(round.getStatus()) ? "started" : "cancelled";
        notificationService.notifyUsers(
                recipientResolver.combine(recipientResolver.getRegisteredStudentUserIds(event.getId()), recipientResolver.getAssignedFacultyUserIds(event.getId())),
                "Round " + action,
                round.getRoundName() + " has been " + action + " for " + event.getTitle() + ".",
                "ROUND_UPDATED",
                "ROUND",
                round.getId()
        );
    }

    private EventRoundDto toDto(EventRound round) {
        return new EventRoundDto(round.getId(), round.getEvent().getId(), round.getRoundName(), round.getRoundOrder(), round.getStatus(), round.isFinalRound(), round.getDescription(), round.getScheduledAt(), round.isResultPublished(), round.getResultPublishedAt());
    }

    private String validAdminStatus(String status) {
        String normalized = status == null ? "" : status.trim().toUpperCase();
        if (!ADMIN_STATUSES.contains(normalized)) {
            throw new IllegalArgumentException("Use Start Round or Cancel Round. A round is completed only by publishing its result.");
        }
        return normalized;
    }

    private String required(String value, String message) {
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException(message);
        }
        return value.trim();
    }

    private String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
