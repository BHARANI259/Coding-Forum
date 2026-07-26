package com.kec.codingforum.event;

import com.kec.codingforum.event.dto.EventDetailDto;
import com.kec.codingforum.event.dto.EventListItemDto;
import com.kec.codingforum.registration.RegistrationRepository;
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
    private final RegistrationRepository registrations;
    private final EventLifecycleService lifecycleService;

    public StudentEventService(EventRepository events, StudentRepository students, EventEligibilityService eligibilityService,
                               EventRoundRepository rounds, EventProblemStatementRepository problemStatements,
                               RegistrationRepository registrations, EventLifecycleService lifecycleService) {
        this.events = events;
        this.students = students;
        this.eligibilityService = eligibilityService;
        this.rounds = rounds;
        this.problemStatements = problemStatements;
        this.registrations = registrations;
        this.lifecycleService = lifecycleService;
    }

    @Transactional
    public List<EventListItemDto> listEligible() {
        lifecycleService.syncCurrentLifecycle();
        Student student = currentStudent();
        return events.findByStatusInOrderByStartDatetimeAsc(STUDENT_VISIBLE_STATUSES).stream()
                .filter(event -> canView(event, student))
                .map(event -> EventMapper.listItem(event, rounds.countByEventId(event.getId()), problemStatements.countByEventIdAndActiveTrue(event.getId())))
                .toList();
    }

    @Transactional
    public EventDetailDto getEligible(Long id) {
        lifecycleService.syncCurrentLifecycle();
        Student student = currentStudent();
        Event event = events.findById(id).orElseThrow(() -> new IllegalArgumentException("Event not found."));
        if (!STUDENT_VISIBLE_STATUSES.contains(event.getStatus())) {
            throw new IllegalArgumentException("Event not found.");
        }
        if (!canView(event, student)) {
            eligibilityService.assertEligible(event, student);
        }
        return EventMapper.detail(event, rounds.countByEventId(event.getId()), problemStatements.countByEventIdAndActiveTrue(event.getId()));
    }

    private boolean canView(Event event, Student student) {
        if (eligibilityService.isEligible(event, student)) {
            return true;
        }
        return "COMPLETED".equals(event.getStatus())
                && registrations.existsByEventIdAndStudentId(event.getId(), student.getId());
    }

    private Student currentStudent() {
        return students.findById(SecurityUtils.getCurrentStudentId())
                .orElseThrow(() -> new IllegalArgumentException("Student profile not found."));
    }
}
