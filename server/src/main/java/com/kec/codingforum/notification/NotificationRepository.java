package com.kec.codingforum.notification;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface NotificationRepository extends JpaRepository<Notification, Long> {

    Page<Notification> findByUserIdOrderByCreatedAtDesc(Long userId, Pageable pageable);

    Page<Notification> findByUserIdAndReadFalseOrderByCreatedAtDesc(Long userId, Pageable pageable);

    Page<Notification> findByUserIdAndNotificationTypeOrderByCreatedAtDesc(Long userId, String notificationType, Pageable pageable);

    Page<Notification> findByUserIdAndReadFalseAndNotificationTypeOrderByCreatedAtDesc(Long userId, String notificationType, Pageable pageable);

    List<Notification> findTop5ByUserIdOrderByCreatedAtDesc(Long userId);

    long countByUserIdAndReadFalse(Long userId);

    Optional<Notification> findByIdAndUserId(Long id, Long userId);

    List<Notification> findByUserIdAndReadFalse(Long userId);
}
