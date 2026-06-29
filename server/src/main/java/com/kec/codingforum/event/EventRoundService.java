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

    private static final Set<String> STATUSES = Set.of("NOT_STARTED", "ONGOING", "COMPLETED", "CANCELLED");

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
        if (rounds.existsByEventIdAndRoundOrder(eventId, request.roundOrder())) {
            throw new IllegalArgumentException("Round order already exists for this event.");
        }
        EventRound round = new EventRound();
        round.setEvent(event);
        apply(round, request.roundName(), request.roundOrder(), request.finalRound(), request.description(), request.scheduledAt());
        EventRound saved = rounds.save(round);
        notifyRoundUpdated(event, saved);
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
        if (rounds.existsByEventIdAndRoundOrderAndIdNot(eventId, request.roundOrder(), roundId)) {
            throw new IllegalArgumentException("Round order already exists for this event.");
        }
        apply(round, request.roundName(), request.roundOrder(), request.finalRound(), request.description(), request.scheduledAt());
        notifyRoundUpdated(round.getEvent(), round);
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
        round.setStatus(validStatus(status));
        round.setUpdatedAt(LocalDateTime.now());
        notifyRoundUpdated(round.getEvent(), round);
        return toDto(round);
    }

    @Transactional
    public EventRoundDto facultyUpdateStatus(Long eventId, Long facultyId, Long roundId, String status) {
        requireAssigned(eventId, facultyId);
        return updateStatus(eventId, roundId, status);
    }

    @Transactional
    public void delete(Long eventId, Long roundId) {
        rounds.delete(findRound(eventId, roundId));
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

    private void notifyRoundUpdated(Event event, EventRound round) {
        notificationService.notifyUsers(
                recipientResolver.combine(recipientResolver.getRegisteredStudentUserIds(event.getId()), recipientResolver.getAssignedFacultyUserIds(event.getId())),
                "Round updated",
                round.getRoundName() + " has been updated for " + event.getTitle() + ".",
                "ROUND_UPDATED",
                "ROUND",
                round.getId()
        );
    }

    private EventRoundDto toDto(EventRound round) {
        return new EventRoundDto(round.getId(), round.getEvent().getId(), round.getRoundName(), round.getRoundOrder(), round.getStatus(), round.isFinalRound(), round.getDescription(), round.getScheduledAt());
    }

    private String validStatus(String status) {
        String normalized = status == null ? "" : status.trim().toUpperCase();
        if (!STATUSES.contains(normalized)) {
            throw new IllegalArgumentException("Invalid round status.");
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
