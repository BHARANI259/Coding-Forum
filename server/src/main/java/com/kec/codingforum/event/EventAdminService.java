package com.kec.codingforum.event;

import com.kec.codingforum.department.Department;
import com.kec.codingforum.department.DepartmentRepository;
import com.kec.codingforum.event.dto.CreateEventRequest;
import com.kec.codingforum.event.dto.EventDetailDto;
import com.kec.codingforum.event.dto.EventListItemDto;
import com.kec.codingforum.event.dto.UpdateEventRequest;
import com.kec.codingforum.event.dto.UpdateEventStatusRequest;
import com.kec.codingforum.event.dto.UpdateRegistrationStatusRequest;
import com.kec.codingforum.notification.NotificationRecipientResolver;
import com.kec.codingforum.notification.NotificationService;
import com.kec.codingforum.points.StudentPointRepository;
import com.kec.codingforum.result.ResultRepository;
import com.kec.codingforum.security.SecurityUtils;
import com.kec.codingforum.user.Faculty;
import com.kec.codingforum.user.FacultyRepository;
import com.kec.codingforum.user.User;
import com.kec.codingforum.user.UserRepository;
import jakarta.persistence.criteria.JoinType;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;

@Service
public class EventAdminService {

    private static final Set<String> EVENT_TYPES = Set.of("TEAM", "INDIVIDUAL");
    private static final Set<String> STATUSES = Set.of("DRAFT", "PUBLISHED", "ONGOING", "COMPLETED", "CANCELLED");

    private final EventRepository events;
    private final EventCategoryRepository categories;
    private final DepartmentRepository departments;
    private final FacultyRepository faculties;
    private final UserRepository users;
    private final EventRoundRepository rounds;
    private final EventProblemStatementRepository problemStatements;
    private final ResultRepository results;
    private final StudentPointRepository studentPoints;
    private final NotificationService notificationService;
    private final NotificationRecipientResolver recipientResolver;
    private final EventLifecycleService lifecycleService;

    public EventAdminService(
            EventRepository events,
            EventCategoryRepository categories,
            DepartmentRepository departments,
            FacultyRepository faculties,
            UserRepository users,
            EventRoundRepository rounds,
            EventProblemStatementRepository problemStatements,
            ResultRepository results,
            StudentPointRepository studentPoints,
            NotificationService notificationService,
            NotificationRecipientResolver recipientResolver,
            EventLifecycleService lifecycleService
    ) {
        this.events = events;
        this.categories = categories;
        this.departments = departments;
        this.faculties = faculties;
        this.users = users;
        this.rounds = rounds;
        this.problemStatements = problemStatements;
        this.results = results;
        this.studentPoints = studentPoints;
        this.notificationService = notificationService;
        this.recipientResolver = recipientResolver;
        this.lifecycleService = lifecycleService;
    }

    @Transactional
    public Page<EventListItemDto> list(
            Pageable pageable,
            String search,
            Long categoryId,
            String eventType,
            String status,
            Boolean registrationOpen,
            Long departmentId,
            Integer year
    ) {
        lifecycleService.syncCurrentLifecycle();
        return events.findAll(spec(search, categoryId, eventType, status, registrationOpen, departmentId, year), pageable)
                .map(event -> EventMapper.listItem(event, rounds.countByEventId(event.getId()), problemStatements.countByEventIdAndActiveTrue(event.getId())));
    }

    @Transactional
    public EventDetailDto get(Long id) {
        lifecycleService.syncCurrentLifecycle();
        Event event = findEvent(id);
        return EventMapper.detail(event, rounds.countByEventId(event.getId()), problemStatements.countByEventIdAndActiveTrue(event.getId()));
    }

    @Transactional
    public EventDetailDto create(CreateEventRequest request) {
        Event event = new Event();
        User currentUser = users.findById(SecurityUtils.getCurrentUserId())
                .orElseThrow(() -> new IllegalArgumentException("Current user not found."));
        event.setCreatedBy(currentUser);
        apply(event, request);
        if (!"DRAFT".equals(event.getStatus())) {
            throw new IllegalArgumentException("Create the event as Draft, configure its incharges and rounds, then publish it.");
        }
        Event saved = events.save(event);
        return EventMapper.detail(saved, rounds.countByEventId(saved.getId()), problemStatements.countByEventIdAndActiveTrue(saved.getId()));
    }

    @Transactional
    public EventDetailDto update(Long id, UpdateEventRequest request) {
        lifecycleService.syncCurrentLifecycle();
        Event event = findEvent(id);
        assertEventEditable(event);
        String oldStatus = event.getStatus();
        boolean oldRegistrationOpen = event.isRegistrationOpen();
        apply(event, request);
        notifyStateChanges(event, oldStatus, oldRegistrationOpen);
        return EventMapper.detail(event, rounds.countByEventId(event.getId()), problemStatements.countByEventIdAndActiveTrue(event.getId()));
    }

    @Transactional
    public EventDetailDto updateStatus(Long id, UpdateEventStatusRequest request) {
        lifecycleService.syncCurrentLifecycle();
        Event event = findEvent(id);
        assertEventEditable(event);
        String oldStatus = event.getStatus();
        boolean oldRegistrationOpen = event.isRegistrationOpen();
        String newStatus = validStatus(request.status(), false);
        if ("COMPLETED".equals(newStatus)) {
            throw new IllegalArgumentException("An event is completed automatically when the final round result is published.");
        }
        if ("CANCELLED".equals(newStatus)) {
            return cancel(id);
        }
        validateStatusTransition(event, newStatus);
        if ("PUBLISHED".equals(newStatus)) {
            validatePublishReadiness(event);
        }
        event.setStatus(newStatus);
        if ("ONGOING".equals(newStatus)) {
            event.setRegistrationOpen(false);
        }
        event.setUpdatedAt(LocalDateTime.now());
        if (!"PUBLISHED".equals(oldStatus) && "PUBLISHED".equals(event.getStatus())) {
            notifyEventPublished(event);
        }
        if (oldRegistrationOpen && !event.isRegistrationOpen()) {
            notifyRegistrationClosed(event);
        }
        return EventMapper.detail(event, rounds.countByEventId(event.getId()), problemStatements.countByEventIdAndActiveTrue(event.getId()));
    }

    @Transactional
    public EventDetailDto updateRegistration(Long id, UpdateRegistrationStatusRequest request) {
        lifecycleService.syncCurrentLifecycle();
        Event event = findEvent(id);
        assertEventEditable(event);
        boolean oldRegistrationOpen = event.isRegistrationOpen();
        if (request.registrationOpen()) {
            lifecycleService.assertCanOpenRegistration(event);
        }
        event.setRegistrationOpen(request.registrationOpen());
        event.setUpdatedAt(LocalDateTime.now());
        if (oldRegistrationOpen && !event.isRegistrationOpen()) {
            notifyRegistrationClosed(event);
        }
        return EventMapper.detail(event, rounds.countByEventId(event.getId()), problemStatements.countByEventIdAndActiveTrue(event.getId()));
    }

    @Transactional
    public EventDetailDto cancel(Long id) {
        Event event = findEvent(id);
        if ("CANCELLED".equals(event.getStatus())) {
            return EventMapper.detail(event, rounds.countByEventId(event.getId()), problemStatements.countByEventIdAndActiveTrue(event.getId()));
        }
        if (event.isResultsPublished() || "COMPLETED".equals(event.getStatus())
                || results.existsByEventId(id) || studentPoints.existsByEventId(id)) {
            throw new IllegalArgumentException("An event with declared results or awarded points cannot be cancelled.");
        }
        event.setStatus("CANCELLED");
        event.setRegistrationOpen(false);
        event.setUpdatedAt(LocalDateTime.now());
        return EventMapper.detail(event, rounds.countByEventId(event.getId()), problemStatements.countByEventIdAndActiveTrue(event.getId()));
    }

    private void apply(Event event, CreateEventRequest request) {
        applyShared(
                event,
                request.title(),
                request.description(),
                request.categoryId(),
                request.eventType(),
                request.venue(),
                request.startDatetime(),
                request.endDatetime(),
                request.registrationOpen(),
                request.registrationStart(),
                request.registrationEnd(),
                request.minTeamSize(),
                request.maxTeamSize(),
                request.maxParticipants(),
                request.maxTeams(),
                request.placementWillingOnly(),
                request.mandatoryEvent(),
                request.status(),
                request.allowedDepartmentIds(),
                request.allowedYears(),
                request.allowedSections(),
                request.allowedTechnicalAreas(),
                request.inchargeFacultyIds()
        );
    }

    private void apply(Event event, UpdateEventRequest request) {
        applyShared(
                event,
                request.title(),
                request.description(),
                request.categoryId(),
                request.eventType(),
                request.venue(),
                request.startDatetime(),
                request.endDatetime(),
                request.registrationOpen(),
                request.registrationStart(),
                request.registrationEnd(),
                request.minTeamSize(),
                request.maxTeamSize(),
                request.maxParticipants(),
                request.maxTeams(),
                request.placementWillingOnly(),
                request.mandatoryEvent(),
                request.status(),
                request.allowedDepartmentIds(),
                request.allowedYears(),
                request.allowedSections(),
                request.allowedTechnicalAreas(),
                request.inchargeFacultyIds()
        );
    }

    private void applyShared(
            Event event,
            String title,
            String description,
            Long categoryId,
            String eventType,
            String venue,
            LocalDateTime startDatetime,
            LocalDateTime endDatetime,
            boolean registrationOpen,
            LocalDateTime registrationStart,
            LocalDateTime registrationEnd,
            Integer minTeamSize,
            Integer maxTeamSize,
            Integer maxParticipants,
            Integer maxTeams,
            boolean placementWillingOnly,
            boolean mandatoryEvent,
            String status,
            List<Long> allowedDepartmentIds,
            List<Integer> allowedYears,
            List<String> allowedSections,
            List<String> allowedTechnicalAreas,
            List<Long> inchargeFacultyIds
    ) {
        String normalizedEventType = validEventType(eventType);
        validateDates(startDatetime, endDatetime, registrationStart, registrationEnd);

        event.setTitle(required(title, "Title is required."));
        event.setDescription(blankToNull(description));
        event.setCategory(categories.findById(categoryId)
                .filter(EventCategory::isActive)
                .orElseThrow(() -> new IllegalArgumentException("Active event category not found.")));
        event.setEventType(normalizedEventType);
        event.setVenue(blankToNull(venue));
        event.setStartDatetime(startDatetime);
        event.setEndDatetime(endDatetime);
        event.setRegistrationOpen(registrationOpen);
        event.setRegistrationStart(registrationStart);
        event.setRegistrationEnd(registrationEnd);
        event.setMaxParticipants(maxParticipants);
        event.setPlacementWillingOnly(placementWillingOnly);
        event.setMandatoryEvent(mandatoryEvent && "CONTEST".equals(event.getCategory().getCategoryType()));
        String normalizedStatus = validStatus(status, true);
        if (event.getId() != null && !event.getStatus().equals(normalizedStatus)) {
            if ("COMPLETED".equals(normalizedStatus) || "CANCELLED".equals(normalizedStatus)) {
                throw new IllegalArgumentException("Use the event lifecycle actions instead of changing to a terminal status in the edit form.");
            }
            validateStatusTransition(event, normalizedStatus);
            if ("PUBLISHED".equals(normalizedStatus)) {
                validatePublishReadiness(event);
            }
        }
        if (registrationOpen && !"PUBLISHED".equals(normalizedStatus)) {
            throw new IllegalArgumentException("Registration can be open only while an event is published.");
        }
        event.setStatus(normalizedStatus);
        if (registrationOpen) {
            lifecycleService.assertCanOpenRegistration(event);
        }
        event.setUpdatedAt(LocalDateTime.now());

        if ("TEAM".equals(normalizedEventType)) {
            if (minTeamSize == null || maxTeamSize == null) {
                throw new IllegalArgumentException("Team events require min and max team size.");
            }
            if (minTeamSize < 1 || maxTeamSize < minTeamSize) {
                throw new IllegalArgumentException("Team size values are invalid.");
            }
            event.setMinTeamSize(minTeamSize);
            event.setMaxTeamSize(maxTeamSize);
            event.setMaxTeams(maxTeams);
        } else {
            event.setMinTeamSize(null);
            event.setMaxTeamSize(null);
            event.setMaxTeams(null);
        }

        event.getAllowedDepartments().clear();
        event.getAllowedDepartments().addAll(loadDepartments(allowedDepartmentIds));
        event.getAllowedYears().clear();
        event.getAllowedYears().addAll(validYears(allowedYears));
        event.getAllowedSections().clear();
        event.getAllowedSections().addAll(validSections(allowedSections));
        event.getAllowedTechnicalAreas().clear();
        event.getAllowedTechnicalAreas().addAll(validTechnicalAreas(allowedTechnicalAreas));
        event.getIncharges().clear();
        event.getIncharges().addAll(loadFaculties(inchargeFacultyIds));
    }

    private Event findEvent(Long id) {
        return events.findById(id).orElseThrow(() -> new IllegalArgumentException("Event not found."));
    }

    private void notifyStateChanges(Event event, String oldStatus, boolean oldRegistrationOpen) {
        if (!"PUBLISHED".equals(oldStatus) && "PUBLISHED".equals(event.getStatus())) {
            notifyEventPublished(event);
        }
        if (oldRegistrationOpen && !event.isRegistrationOpen()) {
            notifyRegistrationClosed(event);
        }
    }

    private void closeRegistrationIfTerminal(Event event) {
        if (isTerminalStatus(event.getStatus())) {
            event.setRegistrationOpen(false);
        }
    }

    private boolean isTerminalStatus(String status) {
        return "COMPLETED".equals(status) || "CANCELLED".equals(status);
    }

    private void assertEventEditable(Event event) {
        if (isTerminalStatus(event.getStatus()) || event.isResultsPublished()) {
            throw new IllegalArgumentException("Completed and cancelled events are read-only.");
        }
    }

    private void validateStatusTransition(Event event, String newStatus) {
        String current = event.getStatus();
        if (current.equals(newStatus)) {
            return;
        }
        boolean valid = ("DRAFT".equals(current) && "PUBLISHED".equals(newStatus))
                || ("PUBLISHED".equals(current) && "ONGOING".equals(newStatus));
        if (!valid) {
            throw new IllegalArgumentException("Invalid event status transition from " + current + " to " + newStatus + ".");
        }
    }

    private void validatePublishReadiness(Event event) {
        List<EventRound> configuredRounds = rounds.findByEventIdOrderByRoundOrderAsc(event.getId());
        if (event.getIncharges().isEmpty()) {
            throw new IllegalArgumentException("Assign at least one faculty incharge before publishing the event.");
        }
        if (configuredRounds.isEmpty()) {
            throw new IllegalArgumentException("Configure the event rounds before publishing the event.");
        }
        List<EventRound> finalRounds = configuredRounds.stream().filter(EventRound::isFinalRound).toList();
        if (finalRounds.size() != 1) {
            throw new IllegalArgumentException("Exactly one final round is required before publishing the event.");
        }
        int highestOrder = configuredRounds.stream().mapToInt(EventRound::getRoundOrder).max().orElse(0);
        if (finalRounds.get(0).getRoundOrder() != highestOrder) {
            throw new IllegalArgumentException("The final round must be the last configured round.");
        }
        if (event.getStartDatetime() == null || event.getEndDatetime() == null) {
            throw new IllegalArgumentException("Event start and end date/time are required before publishing.");
        }
    }

    private void notifyEventPublished(Event event) {
        notificationService.notifyUsers(
                recipientResolver.combine(recipientResolver.getEligibleStudentUserIds(event.getId()), recipientResolver.getAssignedFacultyUserIds(event.getId())),
                "New event published",
                event.getTitle() + " is now available in the Coding Forum portal.",
                "EVENT_PUBLISHED",
                "EVENT",
                event.getId()
        );
    }

    private void notifyRegistrationClosed(Event event) {
        notificationService.notifyUsers(
                recipientResolver.combine(recipientResolver.getRegisteredStudentUserIds(event.getId()), recipientResolver.getAssignedFacultyUserIds(event.getId())),
                "Registration closed",
                "Registration has been closed for " + event.getTitle() + ".",
                "REGISTRATION_CLOSED",
                "EVENT",
                event.getId()
        );
    }

    private Set<Department> loadDepartments(List<Long> ids) {
        if (ids == null || ids.isEmpty()) {
            return Set.of();
        }
        List<Department> loaded = departments.findAllById(ids);
        if (loaded.size() != new HashSet<>(ids).size()) {
            throw new IllegalArgumentException("One or more allowed departments were not found.");
        }
        return new HashSet<>(loaded);
    }

    private Set<Faculty> loadFaculties(List<Long> ids) {
        if (ids == null || ids.isEmpty()) {
            return Set.of();
        }
        List<Faculty> loaded = faculties.findAllById(ids);
        if (loaded.size() != new HashSet<>(ids).size()) {
            throw new IllegalArgumentException("One or more incharge faculty records were not found.");
        }
        return new HashSet<>(loaded);
    }

    private Set<Integer> validYears(List<Integer> years) {
        if (years == null) {
            return Set.of();
        }
        Set<Integer> result = new HashSet<>();
        for (Integer year : years) {
            if (year == null || year < 1 || year > 5) {
                throw new IllegalArgumentException("Allowed years must be between 1 and 5.");
            }
            result.add(year);
        }
        return result;
    }

    private Set<String> validSections(List<String> sections) {
        if (sections == null) {
            return Set.of();
        }
        Set<String> result = new HashSet<>();
        for (String section : sections) {
            if (section != null && !section.isBlank()) {
                result.add(section.trim().toUpperCase(Locale.ROOT));
            }
        }
        return result;
    }

    private Set<String> validTechnicalAreas(List<String> areas) {
        if (areas == null) {
            return Set.of();
        }
        Set<String> result = new HashSet<>();
        for (String area : areas) {
            if (area == null || area.isBlank()) {
                continue;
            }
            String normalized = area.trim().toUpperCase(Locale.ROOT);
            if (!Set.of("SOFTWARE", "HARDWARE").contains(normalized)) {
                throw new IllegalArgumentException("Allowed technical area must be SOFTWARE or HARDWARE.");
            }
            result.add(normalized);
        }
        return result;
    }

    private Specification<Event> spec(String search, Long categoryId, String eventType, String status, Boolean registrationOpen, Long departmentId, Integer year) {
        return (root, query, builder) -> {
            query.distinct(true);
            List<Predicate> predicates = new ArrayList<>();
            if (search != null && !search.isBlank()) {
                String like = "%" + search.toLowerCase(Locale.ROOT).trim() + "%";
                predicates.add(builder.or(builder.like(builder.lower(root.get("title")), like), builder.like(builder.lower(root.get("venue")), like)));
            }
            if (categoryId != null) {
                predicates.add(builder.equal(root.get("category").get("id"), categoryId));
            }
            if (eventType != null && !eventType.isBlank()) {
                predicates.add(builder.equal(root.get("eventType"), eventType.toUpperCase(Locale.ROOT)));
            }
            if (status != null && !status.isBlank()) {
                predicates.add(builder.equal(root.get("status"), status.toUpperCase(Locale.ROOT)));
            }
            if (registrationOpen != null) {
                predicates.add(builder.equal(root.get("registrationOpen"), registrationOpen));
            }
            if (departmentId != null) {
                predicates.add(builder.equal(root.joinSet("allowedDepartments", JoinType.LEFT).get("id"), departmentId));
            }
            if (year != null) {
                predicates.add(builder.equal(root.joinSet("allowedYears", JoinType.LEFT), year));
            }
            return builder.and(predicates.toArray(Predicate[]::new));
        };
    }

    private void validateDates(LocalDateTime start, LocalDateTime end, LocalDateTime registrationStart, LocalDateTime registrationEnd) {
        if (start != null && end != null && !start.isBefore(end)) {
            throw new IllegalArgumentException("Event start must be before event end.");
        }
        if (registrationStart != null && registrationEnd != null && !registrationStart.isBefore(registrationEnd)) {
            throw new IllegalArgumentException("Registration start must be before registration end.");
        }
        if (registrationEnd != null && end != null && registrationEnd.isAfter(end)) {
            throw new IllegalArgumentException("Registration end cannot be after event end.");
        }
    }

    private String validEventType(String value) {
        String normalized = required(value, "Event type is required.").toUpperCase(Locale.ROOT);
        if (!EVENT_TYPES.contains(normalized)) {
            throw new IllegalArgumentException("Invalid event type.");
        }
        return normalized;
    }

    private String validStatus(String value, boolean defaultDraft) {
        String normalized = value == null || value.isBlank() ? (defaultDraft ? "DRAFT" : "") : value.trim().toUpperCase(Locale.ROOT);
        if (!STATUSES.contains(normalized)) {
            throw new IllegalArgumentException("Invalid event status.");
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
