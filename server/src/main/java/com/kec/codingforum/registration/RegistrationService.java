package com.kec.codingforum.registration;

import com.kec.codingforum.event.Event;
import com.kec.codingforum.event.EventEligibilityService;
import com.kec.codingforum.event.EventLifecycleService;
import com.kec.codingforum.event.EventProblemStatement;
import com.kec.codingforum.event.EventProblemStatementService;
import com.kec.codingforum.event.EventRepository;
import com.kec.codingforum.notification.NotificationRecipientResolver;
import com.kec.codingforum.notification.NotificationService;
import com.kec.codingforum.registration.dto.EventRegistrationDto;
import com.kec.codingforum.registration.dto.MyRegistrationDto;
import com.kec.codingforum.registration.dto.RegistrationDto;
import com.kec.codingforum.team.Team;
import com.kec.codingforum.team.TeamMember;
import com.kec.codingforum.team.TeamMemberRepository;
import com.kec.codingforum.team.TeamService;
import com.kec.codingforum.team.dto.TeamMemberDto;
import com.kec.codingforum.team.dto.TeamRegistrationResponse;
import com.kec.codingforum.user.Student;
import com.kec.codingforum.user.StudentRepository;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class RegistrationService {

    private final RegistrationRepository registrations;
    private final EventRepository events;
    private final StudentRepository students;
    private final TeamMemberRepository teamMembers;
    private final EventEligibilityService eligibilityService;
    private final EventCapacityService capacityService;
    private final TeamService teamService;
    private final EventProblemStatementService problemStatementService;
    private final EventLifecycleService lifecycleService;
    private final NotificationService notificationService;
    private final NotificationRecipientResolver recipientResolver;

    public RegistrationService(
            RegistrationRepository registrations,
            EventRepository events,
            StudentRepository students,
            TeamMemberRepository teamMembers,
            EventEligibilityService eligibilityService,
            EventCapacityService capacityService,
            TeamService teamService,
            EventProblemStatementService problemStatementService,
            EventLifecycleService lifecycleService,
            NotificationService notificationService,
            NotificationRecipientResolver recipientResolver
    ) {
        this.registrations = registrations;
        this.events = events;
        this.students = students;
        this.teamMembers = teamMembers;
        this.eligibilityService = eligibilityService;
        this.capacityService = capacityService;
        this.teamService = teamService;
        this.problemStatementService = problemStatementService;
        this.lifecycleService = lifecycleService;
        this.notificationService = notificationService;
        this.recipientResolver = recipientResolver;
    }

    @Transactional
    public RegistrationDto registerIndividual(Long eventId, Long studentId, Long problemStatementId) {
        lifecycleService.syncCurrentLifecycle();
        Event event = findEvent(eventId);
        Student student = findStudent(studentId);
        if (!"INDIVIDUAL".equals(event.getEventType())) {
            throw new IllegalArgumentException("Individual registration is allowed only for individual events.");
        }
        assertPublishedOrOngoing(event);
        capacityService.assertRegistrationOpen(event);
        eligibilityService.assertEligible(event, student);
        EventProblemStatement problemStatement = problemStatementService.requireForRegistration(event, problemStatementId);
        assertNeverRegistered(eventId, studentId);
        if (teamMembers.existsByTeamEventIdAndStudentId(eventId, studentId)) {
            throw new IllegalArgumentException("Student is already in a team for this event.");
        }
        capacityService.assertIndividualCapacityAvailable(event);

        Registration registration = new Registration();
        registration.setEvent(event);
        registration.setStudent(student);
        registration.setTeam(null);
        registration.setRegistrationType("INDIVIDUAL");
        registration.setStatus("REGISTERED");
        registration.setProblemStatement(problemStatement);
        Registration saved = registrations.save(registration);
        notificationService.notifyUsers(
                recipientResolver.getStudentUserId(student.getId()),
                "Registration confirmed",
                "Your registration for " + event.getTitle() + " is confirmed.",
                "REGISTRATION_COMPLETED",
                "EVENT",
                event.getId()
        );
        return toRegistrationDto(saved);
    }

    @Transactional
    public TeamRegistrationResponse registerTeam(Long teamId, Long leaderStudentId, Long problemStatementId) {
        lifecycleService.syncCurrentLifecycle();
        Team team = teamService.findTeam(teamId);
        Event event = team.getEvent();
        if (!team.getLeaderStudent().getId().equals(leaderStudentId)) {
            throw new AccessDeniedException("Only the team leader can register the team.");
        }
        if (team.isLockedAfterRegistration()) {
            throw new IllegalArgumentException("Team is already registered and locked.");
        }
        if (!"TEAM".equals(event.getEventType())) {
            throw new IllegalArgumentException("Team registration is allowed only for team events.");
        }
        assertPublishedOrOngoing(event);
        capacityService.assertRegistrationOpen(event);
        EventProblemStatement problemStatement = problemStatementService.requireForRegistration(event, problemStatementId);

        List<TeamMember> members = teamMembers.findByTeamIdOrderByJoinedAtAsc(teamId);
        int count = members.size();
        if (event.getMinTeamSize() != null && count < event.getMinTeamSize()) {
            throw new IllegalArgumentException("Team size is below the minimum requirement.");
        }
        if (event.getMaxTeamSize() != null && count > event.getMaxTeamSize()) {
            throw new IllegalArgumentException("Team size exceeds the maximum requirement.");
        }
        for (TeamMember member : members) {
            Student student = member.getStudent();
            eligibilityService.assertEligible(event, student);
            assertNeverRegistered(event.getId(), student.getId());
        }
        capacityService.assertTeamCapacityAvailable(event, count);

        for (TeamMember member : members) {
            Registration registration = new Registration();
            registration.setEvent(event);
            registration.setStudent(member.getStudent());
            registration.setTeam(team);
            registration.setRegistrationType("TEAM");
            registration.setStatus("REGISTERED");
            registration.setProblemStatement(problemStatement);
            registrations.save(registration);
        }
        team.setProblemStatement(problemStatement);
        teamService.lockTeamAfterRegistration(teamId);
        List<TeamMemberDto> registeredMembers = teamService.toDetail(team).members();
        notificationService.notifyUsers(
                recipientResolver.getTeamMemberUserIds(teamId),
                "Team registration confirmed",
                "Team " + team.getTeamName() + " is registered for " + event.getTitle() + ".",
                "REGISTRATION_COMPLETED",
                "TEAM",
                teamId
        );
        return new TeamRegistrationResponse(teamId, event.getId(), "REGISTERED", problemStatement == null ? null : problemStatement.getId(), problemStatement == null ? null : problemStatement.getTitle(), registeredMembers);
    }

    @Transactional(readOnly = true)
    public List<MyRegistrationDto> getMyRegistrations(Long studentId) {
        return registrations.findByStudentIdOrderByRegisteredAtDesc(studentId).stream()
                .map(this::toMyDto)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<EventRegistrationDto> getEventRegistrationsForAdmin(Long eventId) {
        findEvent(eventId);
        return registrations.findByEventIdOrderByRegisteredAtDesc(eventId).stream()
                .map(this::toEventRegistrationDto)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<EventRegistrationDto> getEventRegistrationsForFaculty(Long eventId, Long facultyId) {
        events.findByIdAndInchargesId(eventId, facultyId)
                .orElseThrow(() -> new AccessDeniedException("This event is not assigned to you."));
        return registrations.findByEventIdOrderByRegisteredAtDesc(eventId).stream()
                .map(this::toEventRegistrationDto)
                .toList();
    }

    private void assertNeverRegistered(Long eventId, Long studentId) {
        if (registrations.existsByEventIdAndStudentId(eventId, studentId)) {
            throw new IllegalArgumentException("Student is already registered for this event.");
        }
    }

    private void assertPublishedOrOngoing(Event event) {
        if (!List.of("PUBLISHED", "ONGOING").contains(event.getStatus())) {
            throw new IllegalArgumentException("Event is not open for registration.");
        }
        if (event.isResultsPublished() || "COMPLETED".equals(event.getStatus())) {
            throw new IllegalArgumentException("Event is completed and no longer accepts registration.");
        }
    }

    private Event findEvent(Long eventId) {
        return events.findById(eventId).orElseThrow(() -> new IllegalArgumentException("Event not found."));
    }

    private Student findStudent(Long studentId) {
        return students.findById(studentId).orElseThrow(() -> new IllegalArgumentException("Student profile not found."));
    }

    private RegistrationDto toRegistrationDto(Registration registration) {
        Event event = registration.getEvent();
        Student student = registration.getStudent();
        Team team = registration.getTeam();
        return new RegistrationDto(
                registration.getId(),
                event.getId(),
                event.getTitle(),
                event.getEventType(),
                event.getCategory() == null ? null : event.getCategory().getName(),
                student.getId(),
                student.getName(),
                student.getRegisterNumber(),
                team == null ? null : team.getId(),
                team == null ? null : team.getTeamName(),
                team == null ? null : team.getTeamCode(),
                registration.getRegistrationType(),
                registration.getStatus(),
                registration.getRegisteredAt(),
                registration.getProblemStatement() == null ? null : registration.getProblemStatement().getId(),
                registration.getProblemStatement() == null ? null : registration.getProblemStatement().getTitle()
        );
    }

    private MyRegistrationDto toMyDto(Registration registration) {
        Event event = registration.getEvent();
        Team team = registration.getTeam();
        return new MyRegistrationDto(
                registration.getId(),
                event.getId(),
                event.getTitle(),
                event.getCategory() == null ? null : event.getCategory().getName(),
                event.getEventType(),
                team == null ? null : team.getTeamName(),
                registration.getRegistrationType(),
                registration.getStatus(),
                registration.getRegisteredAt(),
                registration.getProblemStatement() == null ? null : registration.getProblemStatement().getId(),
                registration.getProblemStatement() == null ? null : registration.getProblemStatement().getTitle()
        );
    }

    private EventRegistrationDto toEventRegistrationDto(Registration registration) {
        Student student = registration.getStudent();
        Team team = registration.getTeam();
        return new EventRegistrationDto(
                registration.getId(),
                student.getId(),
                student.getName(),
                student.getRegisterNumber(),
                student.getEmail(),
                student.getDepartment() == null ? null : student.getDepartment().getCode(),
                team == null ? null : team.getId(),
                team == null ? null : team.getTeamName(),
                team == null ? null : team.getTeamCode(),
                registration.getRegistrationType(),
                registration.getStatus(),
                registration.getRegisteredAt(),
                registration.getProblemStatement() == null ? null : registration.getProblemStatement().getId(),
                registration.getProblemStatement() == null ? null : registration.getProblemStatement().getTitle()
        );
    }
}
