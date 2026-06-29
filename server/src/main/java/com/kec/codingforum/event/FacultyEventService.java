package com.kec.codingforum.event;

import com.kec.codingforum.event.dto.EventDetailDto;
import com.kec.codingforum.event.dto.EventListItemDto;
import com.kec.codingforum.security.SecurityUtils;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class FacultyEventService {

    private final EventRepository events;
    private final EventRoundRepository rounds;
    private final EventProblemStatementRepository problemStatements;

    public FacultyEventService(EventRepository events, EventRoundRepository rounds, EventProblemStatementRepository problemStatements) {
        this.events = events;
        this.rounds = rounds;
        this.problemStatements = problemStatements;
    }

    @Transactional(readOnly = true)
    public List<EventListItemDto> listAssigned() {
        Long facultyId = SecurityUtils.getCurrentFacultyId();
        return events.findByInchargesIdOrderByStartDatetimeDesc(facultyId).stream()
                .map(event -> EventMapper.listItem(event, rounds.countByEventId(event.getId()), problemStatements.countByEventIdAndActiveTrue(event.getId())))
                .toList();
    }

    @Transactional(readOnly = true)
    public EventDetailDto getAssigned(Long id) {
        Long facultyId = SecurityUtils.getCurrentFacultyId();
        Event event = events.findByIdAndInchargesId(id, facultyId)
                .orElseThrow(() -> new AccessDeniedException("This event is not assigned to you."));
        return EventMapper.detail(event, rounds.countByEventId(event.getId()), problemStatements.countByEventIdAndActiveTrue(event.getId()));
    }
}
