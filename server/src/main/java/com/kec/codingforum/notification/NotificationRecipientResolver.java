package com.kec.codingforum.notification;

import com.kec.codingforum.event.Event;
import com.kec.codingforum.event.EventEligibilityService;
import com.kec.codingforum.event.EventRepository;
import com.kec.codingforum.registration.RegistrationRepository;
import com.kec.codingforum.team.TeamMemberRepository;
import com.kec.codingforum.team.TeamRepository;
import com.kec.codingforum.user.StudentRepository;
import com.kec.codingforum.user.User;
import com.kec.codingforum.user.UserRepository;
import org.springframework.stereotype.Service;

import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

@Service
public class NotificationRecipientResolver {

    private final UserRepository users;
    private final StudentRepository students;
    private final EventRepository events;
    private final RegistrationRepository registrations;
    private final TeamRepository teams;
    private final TeamMemberRepository teamMembers;
    private final EventEligibilityService eligibilityService;

    public NotificationRecipientResolver(
            UserRepository users,
            StudentRepository students,
            EventRepository events,
            RegistrationRepository registrations,
            TeamRepository teams,
            TeamMemberRepository teamMembers,
            EventEligibilityService eligibilityService
    ) {
        this.users = users;
        this.students = students;
        this.events = events;
        this.registrations = registrations;
        this.teams = teams;
        this.teamMembers = teamMembers;
        this.eligibilityService = eligibilityService;
    }

    public Set<Long> getEligibleStudentUserIds(Long eventId) {
        Event event = events.findById(eventId).orElseThrow(() -> new IllegalArgumentException("Event not found."));
        Set<Long> ids = new LinkedHashSet<>();
        students.findAll().stream()
                .filter(student -> student.isActive() && eligibilityService.isEligible(event, student))
                .forEach(student -> users.findByStudentId(student.getId())
                        .filter(User::isActive)
                        .ifPresent(user -> ids.add(user.getId())));
        return ids;
    }

    public Set<Long> getRegisteredStudentUserIds(Long eventId) {
        Set<Long> ids = new LinkedHashSet<>();
        registrations.findByEventIdOrderByRegisteredAtDesc(eventId).stream()
                .filter(registration -> "REGISTERED".equals(registration.getStatus()))
                .forEach(registration -> users.findByStudentId(registration.getStudent().getId())
                        .filter(User::isActive)
                        .ifPresent(user -> ids.add(user.getId())));
        return ids;
    }

    public Set<Long> getTeamMemberUserIds(Long teamId) {
        Set<Long> ids = new LinkedHashSet<>();
        teamMembers.findByTeamIdOrderByJoinedAtAsc(teamId)
                .forEach(member -> users.findByStudentId(member.getStudent().getId())
                        .filter(User::isActive)
                        .ifPresent(user -> ids.add(user.getId())));
        return ids;
    }

    public Set<Long> getTeamLeaderUserId(Long teamId) {
        return teams.findById(teamId)
                .flatMap(team -> users.findByStudentId(team.getLeaderStudent().getId()))
                .filter(User::isActive)
                .map(user -> Set.of(user.getId()))
                .orElse(Set.of());
    }

    public Set<Long> getStudentUserId(Long studentId) {
        return users.findByStudentId(studentId)
                .filter(User::isActive)
                .map(user -> Set.of(user.getId()))
                .orElse(Set.of());
    }

    public Set<Long> getAssignedFacultyUserIds(Long eventId) {
        Event event = events.findById(eventId).orElseThrow(() -> new IllegalArgumentException("Event not found."));
        Set<Long> ids = new LinkedHashSet<>();
        event.getIncharges().forEach(faculty -> users.findByFacultyId(faculty.getId())
                .filter(User::isActive)
                .ifPresent(user -> ids.add(user.getId())));
        return ids;
    }

    public Set<Long> getSuperAdminUserIds() {
        Set<Long> ids = new LinkedHashSet<>();
        users.findAll().stream()
                .filter(user -> user.isActive() && "SUPER_ADMIN".equals(user.getRole()))
                .map(User::getId)
                .forEach(ids::add);
        return ids;
    }

    public Set<Long> combine(Set<Long> first, Set<Long> second) {
        Set<Long> ids = new LinkedHashSet<>(first);
        ids.addAll(second);
        return ids;
    }

    public Set<Long> combine(Set<Long> first, Set<Long> second, Set<Long> third) {
        Set<Long> ids = combine(first, second);
        ids.addAll(third);
        return ids;
    }
}
