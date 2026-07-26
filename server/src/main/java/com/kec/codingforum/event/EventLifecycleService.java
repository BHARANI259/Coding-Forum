package com.kec.codingforum.event;

import org.springframework.stereotype.Service;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
public class EventLifecycleService {

    private final EventRepository events;

    public EventLifecycleService(EventRepository events) {
        this.events = events;
    }

    @Transactional
    public void syncCurrentLifecycle() {
        LocalDateTime now = LocalDateTime.now();
        events.closeExpiredRegistrations(now);
        events.markStartedEventsOngoing(now);
    }

    @Scheduled(fixedDelayString = "${app.events.lifecycle-sync-ms:60000}")
    @Transactional
    public void scheduledLifecycleSync() {
        syncCurrentLifecycle();
    }

    public void assertCanOpenRegistration(Event event) {
        LocalDateTime now = LocalDateTime.now();
        if (event.isResultsPublished() || "COMPLETED".equals(event.getStatus()) || "CANCELLED".equals(event.getStatus())) {
            throw new IllegalArgumentException("Registration cannot be opened for completed or cancelled events.");
        }
        if (!"PUBLISHED".equals(event.getStatus())) {
            throw new IllegalArgumentException("Registration can be opened only for a published event.");
        }
        if (event.getRegistrationStart() != null && now.isBefore(event.getRegistrationStart())) {
            throw new IllegalArgumentException("Registration window has not started.");
        }
        if (event.getRegistrationEnd() != null && now.isAfter(event.getRegistrationEnd())) {
            throw new IllegalArgumentException("Registration window has ended.");
        }
        if (event.getEndDatetime() != null && now.isAfter(event.getEndDatetime())) {
            throw new IllegalArgumentException("Event has ended. Registration cannot be opened.");
        }
    }
}
