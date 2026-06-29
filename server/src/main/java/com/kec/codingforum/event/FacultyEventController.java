package com.kec.codingforum.event;

import com.kec.codingforum.event.dto.EventDetailDto;
import com.kec.codingforum.event.dto.EventListItemDto;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/faculty/events")
@PreAuthorize("hasRole('FACULTY')")
public class FacultyEventController {

    private final FacultyEventService facultyEventService;

    public FacultyEventController(FacultyEventService facultyEventService) {
        this.facultyEventService = facultyEventService;
    }

    @GetMapping
    public List<EventListItemDto> list() {
        return facultyEventService.listAssigned();
    }

    @GetMapping("/{id}")
    public EventDetailDto get(@PathVariable Long id) {
        return facultyEventService.getAssigned(id);
    }
}
