package com.kec.codingforum.event;

import com.kec.codingforum.event.dto.EventDetailDto;
import com.kec.codingforum.event.dto.EventListItemDto;
import com.kec.codingforum.security.SecurityUtils;
import com.kec.codingforum.user.Student;
import com.kec.codingforum.user.StudentRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class StudentEventService {

    private static final List<String> STUDENT_VISIBLE_STATUSES = List.of("PUBLISHED", "ONGOING", "COMPLETED");

    private final EventRepository events;
    private final StudentRepository students;
    private final EventEligibilityService eligibilityService;
    private final EventRoundRepository rounds;
    private final EventProblemStatementRepository problemStatements;

    public StudentEventService(EventRepository events, StudentRepository students, EventEligibilityService eligibilityService, EventRoundRepository rounds, EventProblemStatementRepository problemStatements) {
        this.events = events;
        this.students = students;
        this.eligibilityService = eligibilityService;
        this.rounds = rounds;
        this.problemStatements = problemStatements;
    }

    @Transactional(readOnly = true)
    public List<EventListItemDto> listEligible() {
        Student student = currentStudent();
        return events.findByStatusInOrderByStartDatetimeAsc(STUDENT_VISIBLE_STATUSES).stream()
                .filter(event -> eligibilityService.isEligible(event, student))
                .map(event -> EventMapper.listItem(event, rounds.countByEventId(event.getId()), problemStatements.countByEventIdAndActiveTrue(event.getId())))
                .toList();
    }

    @Transactional(readOnly = true)
    public EventDetailDto getEligible(Long id) {
        Student student = currentStudent();
        Event event = events.findById(id).orElseThrow(() -> new IllegalArgumentException("Event not found."));
        if (!STUDENT_VISIBLE_STATUSES.contains(event.getStatus())) {
            throw new IllegalArgumentException("Event not found.");
        }
        eligibilityService.assertEligible(event, student);
        return EventMapper.detail(event, rounds.countByEventId(event.getId()), problemStatements.countByEventIdAndActiveTrue(event.getId()));
    }

    private Student currentStudent() {
        return students.findById(SecurityUtils.getCurrentStudentId())
                .orElseThrow(() -> new IllegalArgumentException("Student profile not found."));
    }
}
