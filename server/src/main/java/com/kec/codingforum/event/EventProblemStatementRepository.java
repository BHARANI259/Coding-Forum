package com.kec.codingforum.event;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface EventProblemStatementRepository extends JpaRepository<EventProblemStatement, Long> {
    List<EventProblemStatement> findByEventIdOrderByIdAsc(Long eventId);
    List<EventProblemStatement> findByEventIdAndActiveTrueOrderByIdAsc(Long eventId);
    Optional<EventProblemStatement> findByIdAndEventId(Long id, Long eventId);
    long countByEventIdAndActiveTrue(Long eventId);
}
