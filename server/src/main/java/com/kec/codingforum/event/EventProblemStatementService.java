package com.kec.codingforum.event;

import com.kec.codingforum.event.dto.CreateProblemStatementRequest;
import com.kec.codingforum.event.dto.ProblemStatementLinkDto;
import com.kec.codingforum.event.dto.ProblemStatementDto;
import com.kec.codingforum.event.dto.UpdateProblemStatementRequest;
import com.kec.codingforum.notification.NotificationRecipientResolver;
import com.kec.codingforum.notification.NotificationService;
import com.kec.codingforum.registration.RegistrationRepository;
import com.kec.codingforum.team.TeamRepository;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.net.URI;
import java.net.URISyntaxException;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
public class EventProblemStatementService {

    private final EventProblemStatementRepository problemStatements;
    private final EventRepository events;
    private final EventEligibilityService eligibilityService;
    private final NotificationService notificationService;
    private final NotificationRecipientResolver recipientResolver;
    private final RegistrationRepository registrations;
    private final TeamRepository teams;

    public EventProblemStatementService(EventProblemStatementRepository problemStatements, EventRepository events, EventEligibilityService eligibilityService, NotificationService notificationService, NotificationRecipientResolver recipientResolver, RegistrationRepository registrations, TeamRepository teams) {
        this.problemStatements = problemStatements;
        this.events = events;
        this.eligibilityService = eligibilityService;
        this.notificationService = notificationService;
        this.recipientResolver = recipientResolver;
        this.registrations = registrations;
        this.teams = teams;
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
        apply(item, request.title(), request.description(), request.referenceLink(), request.active(), request.links());
        EventProblemStatement saved = problemStatements.save(item);
        notifyProblemStatementUpdated(event, saved);
        return toDto(saved);
    }

    @Transactional
    public ProblemStatementDto update(Long eventId, Long problemStatementId, UpdateProblemStatementRequest request) {
        EventProblemStatement item = findForEvent(eventId, problemStatementId);
        apply(item, request.title(), request.description(), request.referenceLink(), request.active(), request.links());
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

    @Transactional
    public ProblemStatementDto delete(Long eventId, Long problemStatementId) {
        EventProblemStatement item = findForEvent(eventId, problemStatementId);
        if (registrations.existsByProblemStatementId(problemStatementId) || teams.existsByProblemStatementId(problemStatementId)) {
            item.setActive(false);
            item.setUpdatedAt(LocalDateTime.now());
            notifyProblemStatementUpdated(item.getEvent(), item);
            return toDto(item);
        }
        problemStatements.delete(item);
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

    private void apply(EventProblemStatement item, String title, String description, String referenceLink, Boolean active, List<ProblemStatementLinkDto> links) {
        item.setTitle(required(title, "Problem statement title is required."));
        item.setDescription(required(description, "Problem statement description is required."));
        item.setReferenceLink(blankToNull(referenceLink));
        item.setActive(active == null || active);
        item.setUpdatedAt(LocalDateTime.now());
        replaceLinks(item, links, referenceLink);
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
        return new ProblemStatementDto(
                item.getId(),
                item.getEvent().getId(),
                item.getTitle(),
                item.getDescription(),
                item.getReferenceLink(),
                item.getLinks().stream()
                        .map(link -> new ProblemStatementLinkDto(link.getId(), link.getLabel(), link.getUrl(), link.getDisplayOrder()))
                        .toList(),
                item.isActive(),
                item.getCreatedAt(),
                item.getUpdatedAt()
        );
    }

    private void replaceLinks(EventProblemStatement item, List<ProblemStatementLinkDto> requestLinks, String legacyReferenceLink) {
        List<ProblemStatementLinkDto> desiredLinks = requestLinks;
        if ((desiredLinks == null || desiredLinks.isEmpty()) && legacyReferenceLink != null && !legacyReferenceLink.isBlank()) {
            desiredLinks = List.of(new ProblemStatementLinkDto(null, "Reference Link", legacyReferenceLink, 1));
        }
        item.getLinks().clear();
        if (desiredLinks == null) {
            return;
        }
        List<ProblemStatementLinkDto> normalizedLinks = new ArrayList<>();
        for (int index = 0; index < desiredLinks.size(); index++) {
            ProblemStatementLinkDto link = desiredLinks.get(index);
            if (link == null || link.url() == null || link.url().isBlank()) {
                continue;
            }
            String url = validUrl(link.url());
            String label = blankToNull(link.label());
            Integer order = link.displayOrder() == null || link.displayOrder() < 1 ? index + 1 : link.displayOrder();
            normalizedLinks.add(new ProblemStatementLinkDto(null, label, url, order));
        }
        normalizedLinks.stream()
                .sorted((left, right) -> Integer.compare(left.displayOrder(), right.displayOrder()))
                .forEach(link -> {
                    EventProblemStatementLink entity = new EventProblemStatementLink();
                    entity.setProblemStatement(item);
                    entity.setLabel(link.label());
                    entity.setUrl(link.url());
                    entity.setDisplayOrder(link.displayOrder());
                    entity.setUpdatedAt(LocalDateTime.now());
                    item.getLinks().add(entity);
                });
        item.setReferenceLink(item.getLinks().isEmpty() ? null : item.getLinks().get(0).getUrl());
    }

    private String validUrl(String value) {
        String trimmed = value.trim();
        try {
            URI uri = new URI(trimmed);
            String scheme = uri.getScheme();
            if (scheme == null || (!scheme.equalsIgnoreCase("http") && !scheme.equalsIgnoreCase("https")) || uri.getHost() == null) {
                throw new IllegalArgumentException("Reference link must be a valid URL.");
            }
            return trimmed;
        } catch (URISyntaxException exception) {
            throw new IllegalArgumentException("Reference link must be a valid URL.");
        }
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
