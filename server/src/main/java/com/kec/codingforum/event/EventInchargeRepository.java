package com.kec.codingforum.event;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.List;
import java.util.Optional;

public interface EventInchargeRepository extends JpaRepository<EventIncharge, Long>, JpaSpecificationExecutor<EventIncharge> {

    List<EventIncharge> findByEventIdOrderByPrimaryInchargeDescAssignedAtAsc(Long eventId);

    Optional<EventIncharge> findByEventIdAndFacultyId(Long eventId, Long facultyId);

    boolean existsByEventIdAndFacultyId(Long eventId, Long facultyId);

    List<EventIncharge> findByEventId(Long eventId);

    void deleteByEventId(Long eventId);
}
