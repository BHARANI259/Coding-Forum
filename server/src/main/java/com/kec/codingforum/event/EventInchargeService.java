package com.kec.codingforum.event;

import com.kec.codingforum.common.ConflictException;
import com.kec.codingforum.event.dto.AssignEventInchargeRequest;
import com.kec.codingforum.event.dto.BulkUpdateEventInchargesRequest;
import com.kec.codingforum.event.dto.EventInchargeDto;
import com.kec.codingforum.event.dto.FacultyOptionDto;
import com.kec.codingforum.event.dto.UpdateEventInchargeRequest;
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
public class EventInchargeService {

    private final EventInchargeRepository incharges;
    private final EventRepository events;
    private final FacultyRepository faculties;
    private final UserRepository users;

    public EventInchargeService(EventInchargeRepository incharges, EventRepository events, FacultyRepository faculties, UserRepository users) {
        this.incharges = incharges;
        this.events = events;
        this.faculties = faculties;
        this.users = users;
    }

    @Transactional(readOnly = true)
    public Page<EventInchargeDto> list(
            Pageable pageable,
            Long eventId,
            Long facultyId,
            Long departmentId,
            Long categoryId,
            String eventStatus,
            String search
    ) {
        return incharges.findAll(spec(eventId, facultyId, departmentId, categoryId, eventStatus, search), pageable)
                .map(this::toDto);
    }

    @Transactional(readOnly = true)
    public List<EventInchargeDto> eventIncharges(Long eventId) {
        findEvent(eventId);
        return incharges.findByEventIdOrderByPrimaryInchargeDescAssignedAtAsc(eventId).stream().map(this::toDto).toList();
    }

    @Transactional
    public EventInchargeDto assign(Long eventId, AssignEventInchargeRequest request) {
        Event event = findEvent(eventId);
        Faculty faculty = activeFaculty(request.facultyId());
        if (incharges.existsByEventIdAndFacultyId(eventId, faculty.getId())) {
            throw new ConflictException("This faculty member is already assigned to the event.");
        }
        EventIncharge assignment = new EventIncharge();
        assignment.setEvent(event);
        assignment.setFaculty(faculty);
        assignment.setPrimaryIncharge(request.primaryIncharge());
        assignment.setResponsibility(blankToNull(request.responsibility()));
        assignment.setAssignedBy(currentUser());
        assignment.setAssignedAt(LocalDateTime.now());
        if (assignment.isPrimaryIncharge()) {
            clearPrimary(eventId);
        }
        return toDto(incharges.save(assignment));
    }

    @Transactional
    public List<EventInchargeDto> replace(Long eventId, BulkUpdateEventInchargesRequest request) {
        Event event = findEvent(eventId);
        List<AssignEventInchargeRequest> rows = request.incharges() == null ? List.of() : request.incharges();
        Set<Long> facultyIds = new HashSet<>();
        for (AssignEventInchargeRequest row : rows) {
            if (!facultyIds.add(row.facultyId())) {
                throw new ConflictException("Duplicate faculty selected for this event.");
            }
            activeFaculty(row.facultyId());
        }

        incharges.deleteByEventId(eventId);
        boolean primaryAssigned = false;
        User assignedBy = currentUser();
        for (AssignEventInchargeRequest row : rows) {
            EventIncharge assignment = new EventIncharge();
            assignment.setEvent(event);
            assignment.setFaculty(activeFaculty(row.facultyId()));
            assignment.setPrimaryIncharge(row.primaryIncharge() && !primaryAssigned);
            assignment.setResponsibility(blankToNull(row.responsibility()));
            assignment.setAssignedBy(assignedBy);
            assignment.setAssignedAt(LocalDateTime.now());
            primaryAssigned = primaryAssigned || assignment.isPrimaryIncharge();
            incharges.save(assignment);
        }
        return eventIncharges(eventId);
    }

    @Transactional
    public EventInchargeDto update(Long assignmentId, UpdateEventInchargeRequest request) {
        EventIncharge assignment = findAssignment(assignmentId);
        assignment.setResponsibility(blankToNull(request.responsibility()));
        assignment.setPrimaryIncharge(request.primaryIncharge());
        if (assignment.isPrimaryIncharge()) {
            clearPrimaryExcept(assignment.getEvent().getId(), assignment.getId());
        }
        return toDto(assignment);
    }

    @Transactional
    public void remove(Long assignmentId) {
        incharges.delete(findAssignment(assignmentId));
    }

    @Transactional(readOnly = true)
    public List<FacultyOptionDto> facultyOptions(String search, Long departmentId) {
        return faculties.findAll(facultySpec(search, departmentId)).stream()
                .filter(Faculty::isActive)
                .map(faculty -> new FacultyOptionDto(
                        faculty.getId(),
                        faculty.getName(),
                        faculty.getFacultyCode(),
                        faculty.getEmail(),
                        faculty.getDepartment() == null ? null : faculty.getDepartment().getCode(),
                        faculty.getDepartment() == null ? null : faculty.getDepartment().getName()
                ))
                .toList();
    }

    private Specification<EventIncharge> spec(Long eventId, Long facultyId, Long departmentId, Long categoryId, String eventStatus, String search) {
        return (root, query, builder) -> {
            query.distinct(true);
            var event = root.join("event", JoinType.INNER);
            var faculty = root.join("faculty", JoinType.INNER);
            List<Predicate> predicates = new ArrayList<>();
            if (eventId != null) {
                predicates.add(builder.equal(event.get("id"), eventId));
            }
            if (facultyId != null) {
                predicates.add(builder.equal(faculty.get("id"), facultyId));
            }
            if (departmentId != null) {
                predicates.add(builder.equal(faculty.get("department").get("id"), departmentId));
            }
            if (categoryId != null) {
                predicates.add(builder.equal(event.get("category").get("id"), categoryId));
            }
            if (eventStatus != null && !eventStatus.isBlank()) {
                predicates.add(builder.equal(event.get("status"), eventStatus.trim().toUpperCase(Locale.ROOT)));
            }
            if (search != null && !search.isBlank()) {
                String like = "%" + search.trim().toLowerCase(Locale.ROOT) + "%";
                predicates.add(builder.or(
                        builder.like(builder.lower(event.get("title")), like),
                        builder.like(builder.lower(faculty.get("name")), like),
                        builder.like(builder.lower(faculty.get("email")), like),
                        builder.like(builder.lower(faculty.get("facultyCode")), like)
                ));
            }
            return builder.and(predicates.toArray(Predicate[]::new));
        };
    }

    private Specification<Faculty> facultySpec(String search, Long departmentId) {
        return (root, query, builder) -> {
            List<Predicate> predicates = new ArrayList<>();
            predicates.add(builder.isTrue(root.get("active")));
            if (departmentId != null) {
                predicates.add(builder.equal(root.get("department").get("id"), departmentId));
            }
            if (search != null && !search.isBlank()) {
                String like = "%" + search.trim().toLowerCase(Locale.ROOT) + "%";
                predicates.add(builder.or(
                        builder.like(builder.lower(root.get("name")), like),
                        builder.like(builder.lower(root.get("email")), like),
                        builder.like(builder.lower(root.get("facultyCode")), like)
                ));
            }
            return builder.and(predicates.toArray(Predicate[]::new));
        };
    }

    private Event findEvent(Long eventId) {
        return events.findById(eventId).orElseThrow(() -> new IllegalArgumentException("Event not found."));
    }

    private Faculty activeFaculty(Long facultyId) {
        return faculties.findById(facultyId)
                .filter(Faculty::isActive)
                .orElseThrow(() -> new IllegalArgumentException("Active faculty not found."));
    }

    private EventIncharge findAssignment(Long assignmentId) {
        return incharges.findById(assignmentId).orElseThrow(() -> new IllegalArgumentException("Event incharge assignment not found."));
    }

    private User currentUser() {
        return users.findById(SecurityUtils.getCurrentUserId()).orElse(null);
    }

    private void clearPrimary(Long eventId) {
        incharges.findByEventId(eventId).forEach(item -> item.setPrimaryIncharge(false));
    }

    private void clearPrimaryExcept(Long eventId, Long assignmentId) {
        incharges.findByEventId(eventId).stream()
                .filter(item -> !item.getId().equals(assignmentId))
                .forEach(item -> item.setPrimaryIncharge(false));
    }

    private EventInchargeDto toDto(EventIncharge assignment) {
        Event event = assignment.getEvent();
        Faculty faculty = assignment.getFaculty();
        return new EventInchargeDto(
                assignment.getId(),
                event.getId(),
                event.getTitle(),
                event.getCategory() == null ? null : event.getCategory().getName(),
                event.getStatus(),
                faculty.getId(),
                faculty.getName(),
                faculty.getFacultyCode(),
                faculty.getEmail(),
                faculty.getDepartment() == null ? null : faculty.getDepartment().getCode(),
                faculty.getDepartment() == null ? null : faculty.getDepartment().getName(),
                assignment.isPrimaryIncharge(),
                assignment.getResponsibility(),
                assignment.getAssignedAt()
        );
    }

    private String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
