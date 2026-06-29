package com.kec.codingforum.registration;

import com.kec.codingforum.event.Event;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
public class EventCapacityService {

    private final RegistrationRepository registrations;

    public EventCapacityService(RegistrationRepository registrations) {
        this.registrations = registrations;
    }

    public void assertRegistrationOpen(Event event) {
        if (!event.isRegistrationOpen()) {
            throw new IllegalArgumentException("Registration is closed for this event.");
        }
        LocalDateTime now = LocalDateTime.now();
        if (event.getRegistrationStart() != null && now.isBefore(event.getRegistrationStart())) {
            throw new IllegalArgumentException("Registration window has not started.");
        }
        if (event.getRegistrationEnd() != null && now.isAfter(event.getRegistrationEnd())) {
            throw new IllegalArgumentException("Registration window has ended.");
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
