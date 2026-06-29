package com.kec.codingforum.result;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ResultRepository extends JpaRepository<Result, Long> {

    List<Result> findByEventIdOrderByDeclaredAtDesc(Long eventId);

    Optional<Result> findByEventIdAndStudentId(Long eventId, Long studentId);

    Optional<Result> findByEventIdAndTeamId(Long eventId, Long teamId);

    List<Result> findByStudentIdOrderByDeclaredAtDesc(Long studentId);

    List<Result> findByTeamIdOrderByDeclaredAtDesc(Long teamId);

    boolean existsByEventId(Long eventId);
}
