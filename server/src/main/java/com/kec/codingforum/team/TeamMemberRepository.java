package com.kec.codingforum.team;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface TeamMemberRepository extends JpaRepository<TeamMember, Long> {

    List<TeamMember> findByStudentIdOrderByJoinedAtDesc(Long studentId);

    List<TeamMember> findByTeamIdOrderByJoinedAtAsc(Long teamId);

    Optional<TeamMember> findByTeamIdAndStudentId(Long teamId, Long studentId);

    boolean existsByTeamIdAndStudentId(Long teamId, Long studentId);

    boolean existsByTeamEventIdAndStudentId(Long eventId, Long studentId);

    long countByTeamId(Long teamId);

    void deleteByTeamId(Long teamId);
}
