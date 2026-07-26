package com.kec.codingforum.event;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface EventRoundRepository extends JpaRepository<EventRound, Long> {
    List<EventRound> findByEventIdOrderByRoundOrderAsc(Long eventId);
    Optional<EventRound> findByIdAndEventId(Long id, Long eventId);
    boolean existsByEventIdAndRoundOrder(Long eventId, Integer roundOrder);
    boolean existsByEventIdAndRoundOrderAndIdNot(Long eventId, Integer roundOrder, Long id);
    boolean existsByEventIdAndFinalRoundTrue(Long eventId);
    boolean existsByEventIdAndFinalRoundTrueAndIdNot(Long eventId, Long id);
    long countByEventIdAndFinalRoundTrue(Long eventId);
    long countByEventId(Long eventId);
}
