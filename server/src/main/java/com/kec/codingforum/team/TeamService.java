package com.kec.codingforum.team;

import com.kec.codingforum.event.Event;
import com.kec.codingforum.event.EventEligibilityService;
import com.kec.codingforum.event.EventRepository;
import com.kec.codingforum.notification.NotificationRecipientResolver;
import com.kec.codingforum.notification.NotificationService;
import com.kec.codingforum.registration.EventCapacityService;
import com.kec.codingforum.registration.RegistrationRepository;
import com.kec.codingforum.team.dto.TeamDetailDto;
import com.kec.codingforum.team.dto.TeamEventSummaryDto;
import com.kec.codingforum.team.dto.TeamListItemDto;
import com.kec.codingforum.team.dto.TeamMemberDto;
import com.kec.codingforum.user.Student;
import com.kec.codingforum.user.StudentRepository;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.util.List;

@Service
public class TeamService {

    private static final SecureRandom RANDOM = new SecureRandom();
    private static final String CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

    private final TeamRepository teams;
    private final TeamMemberRepository teamMembers;
    private final EventRepository events;
    private final StudentRepository students;
    private final RegistrationRepository registrations;
    private final EventEligibilityService eligibilityService;
    private final EventCapacityService capacityService;
    private final NotificationService notificationService;
    private final NotificationRecipientResolver recipientResolver;

    public TeamService(
            TeamRepository teams,
            TeamMemberRepository teamMembers,
            EventRepository events,
            StudentRepository students,
            RegistrationRepository registrations,
            EventEligibilityService eligibilityService,
            EventCapacityService capacityService,
            NotificationService notificationService,
            NotificationRecipientResolver recipientResolver
    ) {
        this.teams = teams;
        this.teamMembers = teamMembers;
        this.events = events;
        this.students = students;
        this.registrations = registrations;
        this.eligibilityService = eligibilityService;
        this.capacityService = capacityService;
        this.notificationService = notificationService;
        this.recipientResolver = recipientResolver;
    }

    @Transactional
    public TeamDetailDto createTeam(Long eventId, Long studentId, String teamName) {
        Event event = eventForTeam(eventId);
        Student student = findStudent(studentId);
        assertPublishedOrOngoing(event);
        capacityService.assertRegistrationOpen(event);
        eligibilityService.assertEligible(event, student);
        assertNotRegistered(event.getId(), studentId);
        assertNotInTeamForEvent(event.getId(), studentId);

        Team team = new Team();
        team.setEvent(event);
        team.setTeamName(required(teamName, "Team name is required."));
        team.setTeamCode(generateTeamCode());
        team.setLeaderStudent(student);
        team.setLockedAfterRegistration(false);
        Team savedTeam = teams.save(team);

        TeamMember leader = new TeamMember();
        leader.setTeam(savedTeam);
        leader.setStudent(student);
        teamMembers.save(leader);

        return toDetail(savedTeam);
    }

    @Transactional
    public TeamDetailDto joinTeamByCode(Long studentId, String teamCode) {
        Team team = teams.findByTeamCodeIgnoreCase(required(teamCode, "Team code is required."))
                .orElseThrow(() -> new IllegalArgumentException("Team not found."));
        Event event = team.getEvent();
        Student student = findStudent(studentId);
        if (team.isLockedAfterRegistration()) {
            throw new IllegalArgumentException("Team is locked after registration.");
        }
        eventForTeam(event.getId());
        capacityService.assertRegistrationOpen(event);
        eligibilityService.assertEligible(event, student);
        assertNotRegistered(event.getId(), studentId);
        assertNotInTeamForEvent(event.getId(), studentId);
        if (event.getMaxTeamSize() != null && teamMembers.countByTeamId(team.getId()) >= event.getMaxTeamSize()) {
            throw new IllegalArgumentException("Team is full.");
        }

        TeamMember member = new TeamMember();
        member.setTeam(team);
        member.setStudent(student);
        teamMembers.save(member);
        notificationService.notifyUsers(
                recipientResolver.combine(recipientResolver.getTeamLeaderUserId(team.getId()), recipientResolver.getTeamMemberUserIds(team.getId())),
                "Team member joined",
                student.getName() + " joined team " + team.getTeamName() + " for " + event.getTitle() + ".",
                "TEAM_JOINED",
                "TEAM",
                team.getId()
        );
        return toDetail(team);
    }

    @Transactional(readOnly = true)
    public List<TeamListItemDto> getMyTeams(Long studentId) {
        return teamMembers.findByStudentIdOrderByJoinedAtDesc(studentId).stream()
                .map(member -> toListItem(member.getTeam()))
                .toList();
    }

    @Transactional(readOnly = true)
    public TeamDetailDto getTeamDetail(Long teamId, Long studentId) {
        Team team = findTeam(teamId);
        requireMember(teamId, studentId);
        return toDetail(team);
    }

    @Transactional
    public void leaveTeam(Long teamId, Long studentId) {
        Team team = findTeam(teamId);
        TeamMember member = requireMember(teamId, studentId);
        if (team.isLockedAfterRegistration()) {
            throw new IllegalArgumentException("No one can leave a locked team.");
        }
        boolean leader = team.getLeaderStudent().getId().equals(studentId);
        long memberCount = teamMembers.countByTeamId(teamId);
        if (leader && memberCount > 1) {
            throw new IllegalArgumentException("Team leader cannot leave while other members are present.");
        }
        if (leader) {
            teamMembers.deleteByTeamId(teamId);
            teams.delete(team);
        } else {
            teamMembers.delete(member);
        }
    }

    @Transactional
    public void lockTeamAfterRegistration(Long teamId) {
        Team team = findTeam(teamId);
        team.setLockedAfterRegistration(true);
    }

    public Team findTeam(Long teamId) {
        return teams.findById(teamId).orElseThrow(() -> new IllegalArgumentException("Team not found."));
    }

    public TeamDetailDto toDetail(Team team) {
        List<TeamMemberDto> members = members(team);
        return new TeamDetailDto(
                team.getId(),
                team.getEvent().getId(),
                eventSummary(team.getEvent()),
                team.getTeamName(),
                team.getTeamCode(),
                team.getLeaderStudent().getId(),
                team.isLockedAfterRegistration(),
                team.isLockedAfterRegistration() ? "REGISTERED" : "NOT_REGISTERED",
                team.getProblemStatement() == null ? null : team.getProblemStatement().getId(),
                team.getProblemStatement() == null ? null : team.getProblemStatement().getTitle(),
                members
        );
    }

    private TeamListItemDto toListItem(Team team) {
        return new TeamListItemDto(
                team.getId(),
                eventSummary(team.getEvent()),
                team.getTeamName(),
                team.getTeamCode(),
                team.getLeaderStudent().getId(),
                team.isLockedAfterRegistration(),
                team.isLockedAfterRegistration() ? "REGISTERED" : "NOT_REGISTERED",
                team.getProblemStatement() == null ? null : team.getProblemStatement().getId(),
                team.getProblemStatement() == null ? null : team.getProblemStatement().getTitle(),
                members(team)
        );
    }

    private List<TeamMemberDto> members(Team team) {
        return teamMembers.findByTeamIdOrderByJoinedAtAsc(team.getId()).stream()
                .map(member -> {
                    Student student = member.getStudent();
                    return new TeamMemberDto(
                            student.getId(),
                            student.getRegisterNumber(),
                            student.getName(),
                            student.getEmail(),
                            student.getDepartment() == null ? null : student.getDepartment().getCode(),
                            student.getYear(),
                            student.getSection(),
                            team.getLeaderStudent().getId().equals(student.getId()),
                            member.getJoinedAt()
                    );
                })
                .toList();
    }

    private TeamEventSummaryDto eventSummary(Event event) {
        return new TeamEventSummaryDto(event.getId(), event.getTitle(), event.getEventType(), event.getStatus(), event.isRegistrationOpen(), event.getMinTeamSize(), event.getMaxTeamSize());
    }

    private Event eventForTeam(Long eventId) {
        Event event = events.findById(eventId).orElseThrow(() -> new IllegalArgumentException("Event not found."));
        if (!"TEAM".equals(event.getEventType())) {
            throw new IllegalArgumentException("Team operation is allowed only for team events.");
        }
        return event;
    }

    private void assertPublishedOrOngoing(Event event) {
        if (!List.of("PUBLISHED", "ONGOING").contains(event.getStatus())) {
            throw new IllegalArgumentException("Event is not open for registration.");
        }
        if (event.isResultsPublished() || "COMPLETED".equals(event.getStatus())) {
            throw new IllegalArgumentException("Event is completed and no longer accepts teams.");
        }
    }

    private void assertNotRegistered(Long eventId, Long studentId) {
        if (registrations.existsByEventIdAndStudentIdAndStatus(eventId, studentId, "REGISTERED")) {
            throw new IllegalArgumentException("Student is already registered for this event.");
        }
    }

    private void assertNotInTeamForEvent(Long eventId, Long studentId) {
        if (teamMembers.existsByTeamEventIdAndStudentId(eventId, studentId)) {
            throw new IllegalArgumentException("Student is already in a team for this event.");
        }
    }

    private TeamMember requireMember(Long teamId, Long studentId) {
        return teamMembers.findByTeamIdAndStudentId(teamId, studentId)
                .orElseThrow(() -> new AccessDeniedException("You are not a member of this team."));
    }

    private Student findStudent(Long studentId) {
        return students.findById(studentId).orElseThrow(() -> new IllegalArgumentException("Student profile not found."));
    }

    private String generateTeamCode() {
        String code;
        do {
            StringBuilder builder = new StringBuilder("KEC");
            for (int i = 0; i < 6; i++) {
                builder.append(CODE_CHARS.charAt(RANDOM.nextInt(CODE_CHARS.length())));
            }
            code = builder.toString();
        } while (teams.existsByTeamCodeIgnoreCase(code));
        return code;
    }

    private String required(String value, String message) {
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException(message);
        }
        return value.trim();
    }
}
