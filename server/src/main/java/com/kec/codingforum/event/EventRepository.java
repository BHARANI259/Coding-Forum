package com.kec.codingforum.event;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface EventRepository extends JpaRepository<Event, Long>, JpaSpecificationExecutor<Event> {

    List<Event> findByInchargesIdOrderByStartDatetimeDesc(Long facultyId);

    Optional<Event> findByIdAndInchargesId(Long id, Long facultyId);

    List<Event> findByStatusInOrderByStartDatetimeAsc(List<String> statuses);

    List<Event> findByStartDatetimeGreaterThanEqualAndStartDatetimeLessThanOrderByStartDatetimeAsc(LocalDateTime start, LocalDateTime end);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("""
            update Event event
               set event.registrationOpen = false,
                   event.updatedAt = :now
             where event.registrationOpen = true
               and (
                    event.resultsPublished = true
                    or event.status in ('COMPLETED', 'CANCELLED')
                    or (event.registrationEnd is not null and event.registrationEnd < :now)
                    or (event.endDatetime is not null and event.endDatetime < :now)
               )
            """)
    int closeExpiredRegistrations(LocalDateTime now);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("""
            update Event event
               set event.registrationOpen = true,
                   event.updatedAt = :now
             where event.status = 'PUBLISHED'
               and event.resultsPublished = false
               and event.registrationOpen = false
               and (event.registrationStart is null or event.registrationStart <= :now)
               and (event.registrationEnd is null or event.registrationEnd >= :now)
               and (event.startDatetime is null or event.startDatetime > :now)
            """)
    int openCurrentRegistrationWindows(LocalDateTime now);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("""
            update Event event
               set event.status = 'ONGOING',
                   event.registrationOpen = false,
                   event.updatedAt = :now
             where event.status = 'PUBLISHED'
               and event.resultsPublished = false
               and event.startDatetime is not null
               and event.startDatetime <= :now
            """)
    int markStartedEventsOngoing(LocalDateTime now);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("""
            update Event event
               set event.status = 'COMPLETED',
                   event.registrationOpen = false,
                   event.updatedAt = :now
             where event.status in ('PUBLISHED', 'ONGOING')
               and event.endDatetime is not null
               and event.endDatetime <= :now
            """)
    int markEndedEventsCompleted(LocalDateTime now);
}
