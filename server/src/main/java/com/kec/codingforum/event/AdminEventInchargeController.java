package com.kec.codingforum.event;

import com.kec.codingforum.event.dto.AssignEventInchargeRequest;
import com.kec.codingforum.event.dto.BulkUpdateEventInchargesRequest;
import com.kec.codingforum.event.dto.EventInchargeDto;
import com.kec.codingforum.event.dto.FacultyOptionDto;
import com.kec.codingforum.event.dto.UpdateEventInchargeRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
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

import java.util.List;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('SUPER_ADMIN')")
@RequiredArgsConstructor
public class AdminEventInchargeController {

    private final EventInchargeService eventInchargeService;

    @GetMapping("/event-incharges")
    public Page<EventInchargeDto> list(
            @PageableDefault(size = 20) Pageable pageable,
            @RequestParam(required = false) Long eventId,
            @RequestParam(required = false) Long facultyId,
            @RequestParam(required = false) Long departmentId,
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) String eventStatus,
            @RequestParam(required = false) String search
    ) {
        return eventInchargeService.list(pageable, eventId, facultyId, departmentId, categoryId, eventStatus, search);
    }

    @GetMapping("/event-incharges/faculty-options")
    public List<FacultyOptionDto> facultyOptions(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Long departmentId
    ) {
        return eventInchargeService.facultyOptions(search, departmentId);
    }

    @GetMapping("/events/{eventId}/incharges")
    public List<EventInchargeDto> eventIncharges(@PathVariable Long eventId) {
        return eventInchargeService.eventIncharges(eventId);
    }

    @PostMapping("/events/{eventId}/incharges")
    public EventInchargeDto assign(@PathVariable Long eventId, @Valid @RequestBody AssignEventInchargeRequest request) {
        return eventInchargeService.assign(eventId, request);
    }

    @PutMapping("/events/{eventId}/incharges")
    public List<EventInchargeDto> replace(@PathVariable Long eventId, @Valid @RequestBody BulkUpdateEventInchargesRequest request) {
        return eventInchargeService.replace(eventId, request);
    }

    @PatchMapping("/event-incharges/{assignmentId}")
    public EventInchargeDto update(@PathVariable Long assignmentId, @RequestBody UpdateEventInchargeRequest request) {
        return eventInchargeService.update(assignmentId, request);
    }

    @DeleteMapping("/event-incharges/{assignmentId}")
    public void remove(@PathVariable Long assignmentId) {
        eventInchargeService.remove(assignmentId);
    }
}
