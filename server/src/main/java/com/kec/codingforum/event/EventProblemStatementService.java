package com.kec.codingforum.event;

import com.kec.codingforum.event.dto.CreateProblemStatementRequest;
import com.kec.codingforum.event.dto.ProblemStatementDto;
import com.kec.codingforum.event.dto.UpdateProblemStatementRequest;
import com.kec.codingforum.notification.NotificationRecipientResolver;
import com.kec.codingforum.notification.NotificationService;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class EventProblemStatementService {

    private final EventProblemStatementRepository problemStatements;
    private final EventRepository events;
    private final EventEligibilityService eligibilityService;
    private final NotificationService notificationService;
    private final NotificationRecipientResolver recipientResolver;

    public EventProblemStatementService(EventProblemStatementRepository problemStatements, EventRepository events, EventEligibilityService eligibilityService, NotificationService notificationService, NotificationRecipientResolver recipientResolver) {
        this.problemStatements = problemStatements;
        this.events = events;
        this.eligibilityService = eligibilityService;
        this.notificationService = notificationService;
        this.recipientResolver = recipientResolver;
    }

    @Transactional(readOnly = true)
    public List<ProblemStatementDto> adminList(Long eventId) {
        findEvent(eventId);
        return problemStatements.findByEventIdOrderByIdAsc(eventId).stream().map(this::toDto).toList();
    }

    @Transactional
    public ProblemStatementDto create(Long eventId, CreateProblemStatementRequest request) {
        Event event = findEvent(eventId);
        EventProblemStatement item = new EventProblemStatement();
        item.setEvent(event);
        apply(item, request.title(), request.description(), request.referenceLink(), request.active());
        EventProblemStatement saved = problemStatements.save(item);
        notifyProblemStatementUpdated(event, saved);
        return toDto(saved);
    }

    @Transactional
    public ProblemStatementDto update(Long eventId, Long problemStatementId, UpdateProblemStatementRequest request) {
        EventProblemStatement item = findForEvent(eventId, problemStatementId);
        apply(item, request.title(), request.description(), request.referenceLink(), request.active());
        notifyProblemStatementUpdated(item.getEvent(), item);
        return toDto(item);
    }

    @Transactional
    public ProblemStatementDto updateStatus(Long eventId, Long problemStatementId, boolean active) {
        EventProblemStatement item = findForEvent(eventId, problemStatementId);
        item.setActive(active);
        item.setUpdatedAt(LocalDateTime.now());
        notifyProblemStatementUpdated(item.getEvent(), item);
        return toDto(item);
    }

    @Transactional(readOnly = true)
    public List<ProblemStatementDto> facultyList(Long eventId, Long facultyId) {
        events.findByIdAndInchargesId(eventId, facultyId)
                .orElseThrow(() -> new AccessDeniedException("This event is not assigned to you."));
        return problemStatements.findByEventIdOrderByIdAsc(eventId).stream().map(this::toDto).toList();
    }

    @Transactional(readOnly = true)
    public List<ProblemStatementDto> studentList(Long eventId, Long studentId) {
        Event event = findEvent(eventId);
        eligibilityService.assertEligibleByStudentId(event, studentId);
        return problemStatements.findByEventIdAndActiveTrueOrderByIdAsc(eventId).stream().map(this::toDto).toList();
    }

    public EventProblemStatement requireForRegistration(Event event, Long problemStatementId) {
        long activeCount = problemStatements.countByEventIdAndActiveTrue(event.getId());
        if (activeCount == 0) {
            return null;
        }
        if (problemStatementId == null) {
            throw new IllegalArgumentException("Problem statement selection is required for this event.");
        }
        EventProblemStatement item = findForEvent(event.getId(), problemStatementId);
        if (!item.isActive()) {
            throw new IllegalArgumentException("Selected problem statement is not active.");
        }
        return item;
    }

    private void apply(EventProblemStatement item, String title, String description, String referenceLink, Boolean active) {
        item.setTitle(required(title, "Problem statement title is required."));
        item.setDescription(blankToNull(description));
        item.setReferenceLink(blankToNull(referenceLink));
        item.setActive(active == null || active);
        item.setUpdatedAt(LocalDateTime.now());
    }

    private Event findEvent(Long eventId) {
        return events.findById(eventId).orElseThrow(() -> new IllegalArgumentException("Event not found."));
    }

    private EventProblemStatement findForEvent(Long eventId, Long problemStatementId) {
        return problemStatements.findByIdAndEventId(problemStatementId, eventId)
                .orElseThrow(() -> new IllegalArgumentException("Problem statement not found."));
    }

    private void notifyProblemStatementUpdated(Event event, EventProblemStatement item) {
        var registeredUsers = recipientResolver.getRegisteredStudentUserIds(event.getId());
        if (registeredUsers.isEmpty()) {
            return;
        }
        notificationService.notifyUsers(
                registeredUsers,
                "Problem statement updated",
                item.getTitle() + " was updated for " + event.getTitle() + ".",
                "PROBLEM_STATEMENT_UPDATED",
                "PROBLEM_STATEMENT",
                item.getId()
        );
    }

    private ProblemStatementDto toDto(EventProblemStatement item) {
        return new ProblemStatementDto(item.getId(), item.getEvent().getId(), item.getTitle(), item.getDescription(), item.getReferenceLink(), item.isActive(), item.getCreatedAt(), item.getUpdatedAt());
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
