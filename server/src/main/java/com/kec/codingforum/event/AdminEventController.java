package com.kec.codingforum.event;

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

    public AdminEventController(EventAdminService eventAdminService) {
        this.eventAdminService = eventAdminService;
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
        return eventAdminService.create(request);
    }

    @PutMapping("/{id}")
    public EventDetailDto update(@PathVariable Long id, @Valid @RequestBody UpdateEventRequest request) {
        return eventAdminService.update(id, request);
    }

    @PatchMapping("/{id}/status")
    public EventDetailDto updateStatus(@PathVariable Long id, @Valid @RequestBody UpdateEventStatusRequest request) {
        return eventAdminService.updateStatus(id, request);
    }

    @PatchMapping("/{id}/registration")
    public EventDetailDto updateRegistration(@PathVariable Long id, @RequestBody UpdateRegistrationStatusRequest request) {
        return eventAdminService.updateRegistration(id, request);
    }

    @DeleteMapping("/{id}")
    public EventDetailDto cancel(@PathVariable Long id) {
        return eventAdminService.cancel(id);
    }
}
