package com.kec.codingforum.registration;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface RegistrationRepository extends JpaRepository<Registration, Long> {

    boolean existsByEventIdAndStudentIdAndStatus(Long eventId, Long studentId, String status);

    boolean existsByEventIdAndStudentId(Long eventId, Long studentId);

    long countByEventIdAndStatus(Long eventId, String status);

    long countDistinctByEventIdAndTeamIsNotNullAndStatus(Long eventId, String status);

    List<Registration> findByStudentIdOrderByRegisteredAtDesc(Long studentId);

    List<Registration> findByEventIdOrderByRegisteredAtDesc(Long eventId);

    List<Registration> findByEventIdAndTeamIdAndStatus(Long eventId, Long teamId, String status);

    Optional<Registration> findByIdAndStudentId(Long id, Long studentId);
}
