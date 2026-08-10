package com.kec.codingforum.event;

import com.kec.codingforum.audit.AuditService;
import com.kec.codingforum.event.dto.CreateEventRequest;
import com.kec.codingforum.event.dto.EventDetailDto;
import com.kec.codingforum.event.dto.EventListItemDto;
import com.kec.codingforum.event.dto.UpdateEventRequest;
import com.kec.codingforum.event.dto.UpdateEventStatusRequest;
import com.kec.codingforum.event.dto.UpdateRegistrationStatusRequest;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/events")
@PreAuthorize("hasRole('SUPER_ADMIN')")
public class AdminEventController {

    private final EventAdminService eventAdminService;
    private final AuditService auditService;

    public AdminEventController(EventAdminService eventAdminService, AuditService auditService) {
        this.eventAdminService = eventAdminService;
        this.auditService = auditService;
    }

    @GetMapping
    public Page<EventListItemDto> list(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) String eventType,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) Boolean registrationOpen,
            @RequestParam(required = false) Long departmentId,
            @RequestParam(required = false) Integer year
    ) {
        PageRequest pageable = PageRequest.of(Math.max(page, 0), Math.min(Math.max(size, 1), 100), Sort.by("createdAt").descending());
        return eventAdminService.list(pageable, search, categoryId, eventType, status, registrationOpen, departmentId, year);
    }

    @GetMapping("/{id}")
    public EventDetailDto get(@PathVariable Long id) {
        return eventAdminService.get(id);
    }

    @PostMapping
    public EventDetailDto create(@Valid @RequestBody CreateEventRequest request) {
        EventDetailDto event = eventAdminService.create(request);
        auditService.record("EVENT_CREATED", "EVENT", event.id(), AuditService.SUCCESS, "Admin created event.");
        return event;
    }

    @PutMapping("/{id}")
    public EventDetailDto update(@PathVariable Long id, @Valid @RequestBody UpdateEventRequest request) {
        EventDetailDto event = eventAdminService.update(id, request);
        auditService.record("EVENT_UPDATED", "EVENT", id, AuditService.SUCCESS, "Admin updated event.");
        return event;
    }

    @PatchMapping("/{id}/status")
    public EventDetailDto updateStatus(@PathVariable Long id, @Valid @RequestBody UpdateEventStatusRequest request) {
        EventDetailDto event = eventAdminService.updateStatus(id, request);
        auditService.record("EVENT_STATUS_UPDATED", "EVENT", id, AuditService.SUCCESS, "Admin updated event status to " + request.status() + ".");
        return event;
    }

    @PatchMapping("/{id}/registration")
    public EventDetailDto updateRegistration(@PathVariable Long id, @RequestBody UpdateRegistrationStatusRequest request) {
        EventDetailDto event = eventAdminService.updateRegistration(id, request);
        auditService.record("EVENT_REGISTRATION_UPDATED", "EVENT", id, AuditService.SUCCESS, "Admin updated event registration setting.");
        return event;
    }

    @DeleteMapping("/{id}")
    public EventDetailDto cancel(@PathVariable Long id) {
        EventDetailDto event = eventAdminService.cancel(id);
        auditService.record("EVENT_CANCELLED", "EVENT", id, AuditService.SUCCESS, "Admin cancelled event.");
        return event;
    }
}
