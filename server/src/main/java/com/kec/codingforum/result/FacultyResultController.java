package com.kec.codingforum.result;

import com.kec.codingforum.event.EventRepository;
import com.kec.codingforum.result.dto.EventResultSummaryDto;
import com.kec.codingforum.security.SecurityUtils;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/faculty/events/{eventId}/results")
@PreAuthorize("hasRole('FACULTY')")
public class FacultyResultController {

    private final ResultService resultService;
    private final EventRepository events;

    public FacultyResultController(ResultService resultService, EventRepository events) {
        this.resultService = resultService;
        this.events = events;
    }

    @GetMapping
    public EventResultSummaryDto list(@PathVariable Long eventId) {
        requireAssigned(eventId);
        return resultService.listEventResults(eventId);
    }

    private void requireAssigned(Long eventId) {
        events.findByIdAndInchargesId(eventId, SecurityUtils.getCurrentFacultyId())
                .orElseThrow(() -> new AccessDeniedException("This event is not assigned to you."));
    }
}
