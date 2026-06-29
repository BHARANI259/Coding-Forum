package com.kec.codingforum.team;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface TeamRepository extends JpaRepository<Team, Long> {

    Optional<Team> findByTeamCodeIgnoreCase(String teamCode);

    boolean existsByTeamCodeIgnoreCase(String teamCode);

    long countByEventIdAndLockedAfterRegistrationTrue(Long eventId);

    List<Team> findByEventIdOrderByCreatedAtAsc(Long eventId);
}
