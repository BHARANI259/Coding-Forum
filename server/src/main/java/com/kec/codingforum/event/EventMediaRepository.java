package com.kec.codingforum.event;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface EventMediaRepository extends JpaRepository<EventMedia, Long> {
    List<EventMedia> findByEventIdAndDeletedFalseOrderByUploadedAtDesc(Long eventId);

    List<EventMedia> findByEventIdOrderByUploadedAtDesc(Long eventId);

    Optional<EventMedia> findByIdAndEventId(Long id, Long eventId);

    long countByEventIdAndDeletedFalse(Long eventId);
}
