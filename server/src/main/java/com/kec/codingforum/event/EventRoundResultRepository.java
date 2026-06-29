package com.kec.codingforum.event;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface EventRoundResultRepository extends JpaRepository<EventRoundResult, Long> {
    List<EventRoundResult> findByEventIdAndRoundIdOrderByDeclaredAtDesc(Long eventId, Long roundId);
    Optional<EventRoundResult> findByRoundIdAndTeamId(Long roundId, Long teamId);
    Optional<EventRoundResult> findByRoundIdAndStudentId(Long roundId, Long studentId);
}
