package com.kec.codingforum.registration;

import com.kec.codingforum.event.Event;
import com.kec.codingforum.event.EventLifecycleService;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
public class EventCapacityService {

    private final RegistrationRepository registrations;
    private final EventLifecycleService lifecycleService;

    public EventCapacityService(RegistrationRepository registrations, EventLifecycleService lifecycleService) {
        this.registrations = registrations;
        this.lifecycleService = lifecycleService;
    }

    public void assertRegistrationOpen(Event event) {
        LocalDateTime now = LocalDateTime.now();
        if (event.isResultsPublished() || "COMPLETED".equals(event.getStatus())) {
            throw new IllegalArgumentException("Event has been completed. Registration is closed.");
        }
        if ("CANCELLED".equals(event.getStatus())) {
            throw new IllegalArgumentException("Event has been cancelled. Registration is closed.");
        }
        if (!"PUBLISHED".equals(event.getStatus())) {
            throw new IllegalArgumentException("Registration is open only before the event starts.");
        }
        if (!event.isRegistrationOpen()) {
            throw new IllegalArgumentException("Registration is closed for this event.");
        }
        if (event.getRegistrationStart() != null && now.isBefore(event.getRegistrationStart())) {
            throw new IllegalArgumentException("Registration window has not started.");
        }
        if (event.getRegistrationEnd() != null && now.isAfter(event.getRegistrationEnd())) {
            throw new IllegalArgumentException("Registration window has ended.");
        }
        if (event.getEndDatetime() != null && now.isAfter(event.getEndDatetime())) {
            throw new IllegalArgumentException("Event has ended. Registration is closed.");
        }
        if (!lifecycleService.isRegistrationOpenNow(event)) {
            throw new IllegalArgumentException("Registration is closed for this event.");
        }
    }

    public void assertIndividualCapacityAvailable(Event event) {
        if (event.getMaxParticipants() != null && countRegisteredParticipants(event.getId()) + 1 > event.getMaxParticipants()) {
            throw new IllegalArgumentException("Maximum participants reached.");
        }
    }

    public void assertTeamCapacityAvailable(Event event, int teamMemberCount) {
        if (event.getMaxTeams() != null && countRegisteredTeams(event.getId()) + 1 > event.getMaxTeams()) {
            throw new IllegalArgumentException("Maximum teams reached.");
        }
        if (event.getMaxParticipants() != null && countRegisteredParticipants(event.getId()) + teamMemberCount > event.getMaxParticipants()) {
            throw new IllegalArgumentException("Maximum participants reached.");
        }
    }

    public long countRegisteredParticipants(Long eventId) {
        return registrations.countByEventIdAndStatus(eventId, "REGISTERED");
    }

    public long countRegisteredTeams(Long eventId) {
        return registrations.countDistinctByEventIdAndTeamIsNotNullAndStatus(eventId, "REGISTERED");
    }
}
