package com.kec.codingforum.notification;

import com.kec.codingforum.notification.dto.NotificationDto;
import com.kec.codingforum.notification.dto.UnreadCountResponse;
import com.kec.codingforum.push.PushUrlService;
import com.kec.codingforum.push.WebPushPayload;
import com.kec.codingforum.push.WebPushService;
import com.kec.codingforum.security.SecurityUtils;
import com.kec.codingforum.user.User;
import com.kec.codingforum.user.UserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;

@Service
public class NotificationService {

    private final NotificationRepository notifications;
    private final UserRepository users;
    private final NotificationTemplateService templates;
    private final EmailService emailService;
    private final WebSocketNotificationService webSocketNotificationService;
    private final WebPushService webPushService;
    private final PushUrlService pushUrlService;

    public NotificationService(
            NotificationRepository notifications,
            UserRepository users,
            NotificationTemplateService templates,
            EmailService emailService,
            WebSocketNotificationService webSocketNotificationService,
            WebPushService webPushService,
            PushUrlService pushUrlService
    ) {
        this.notifications = notifications;
        this.users = users;
        this.templates = templates;
        this.emailService = emailService;
        this.webSocketNotificationService = webSocketNotificationService;
        this.webPushService = webPushService;
        this.pushUrlService = pushUrlService;
    }

    @Transactional
    public void notifyUsers(Collection<Long> userIds, String title, String message, String type, String relatedEntityType, Long relatedEntityId) {
        userIds.stream().distinct().forEach(userId -> create(userId, title, message, type, relatedEntityType, relatedEntityId));
    }

    @Transactional(readOnly = true)
    public Page<NotificationDto> listCurrentUser(Pageable pageable, Boolean unreadOnly, String type) {
        Long userId = SecurityUtils.getCurrentUserId();
        boolean unread = unreadOnly != null && unreadOnly;
        if (type != null && !type.isBlank() && unread) {
            return notifications.findByUserIdAndReadFalseAndNotificationTypeOrderByCreatedAtDesc(userId, type.trim().toUpperCase(), pageable).map(this::toDto);
        }
        if (type != null && !type.isBlank()) {
            return notifications.findByUserIdAndNotificationTypeOrderByCreatedAtDesc(userId, type.trim().toUpperCase(), pageable).map(this::toDto);
        }
        if (unread) {
            return notifications.findByUserIdAndReadFalseOrderByCreatedAtDesc(userId, pageable).map(this::toDto);
        }
        return notifications.findByUserIdOrderByCreatedAtDesc(userId, pageable).map(this::toDto);
    }

    @Transactional(readOnly = true)
    public List<NotificationDto> recentCurrentUser() {
        return notifications.findTop5ByUserIdOrderByCreatedAtDesc(SecurityUtils.getCurrentUserId()).stream().map(this::toDto).toList();
    }

    @Transactional(readOnly = true)
    public UnreadCountResponse unreadCount() {
        return new UnreadCountResponse(notifications.countByUserIdAndReadFalse(SecurityUtils.getCurrentUserId()));
    }

    @Transactional
    public NotificationDto markRead(Long id) {
        Notification notification = notifications.findByIdAndUserId(id, SecurityUtils.getCurrentUserId())
                .orElseThrow(() -> new IllegalArgumentException("Notification not found."));
        mark(notification);
        return toDto(notification);
    }

    @Transactional
    public void markAllRead() {
        notifications.findByUserIdAndReadFalse(SecurityUtils.getCurrentUserId()).forEach(this::mark);
    }

    @Transactional
    public void delete(Long id) {
        Notification notification = notifications.findByIdAndUserId(id, SecurityUtils.getCurrentUserId())
                .orElseThrow(() -> new IllegalArgumentException("Notification not found."));
        notifications.delete(notification);
    }

    private void create(Long userId, String title, String message, String type, String relatedEntityType, Long relatedEntityId) {
        User user = users.findById(userId).filter(User::isActive).orElse(null);
        if (user == null) {
            return;
        }
        Notification notification = new Notification();
        notification.setUser(user);
        notification.setTitle(title);
        notification.setMessage(message);
        notification.setNotificationType(type);
        notification.setRelatedEntityType(relatedEntityType);
        notification.setRelatedEntityId(relatedEntityId);
        Notification saved = notifications.save(notification);
        if (emailService.isEnabled()) {
            try {
                emailService.sendEmail(user.getEmail(), templates.subject(type, title), templates.htmlBody(title, message));
                saved.setEmailSent(true);
            } catch (Exception exception) {
                saved.setEmailError(exception.getMessage());
            }
        }
        webSocketNotificationService.send(userId, toDto(saved));
        webPushService.sendToUser(
                userId,
                new WebPushPayload(
                        saved.getId(),
                        saved.getNotificationType(),
                        saved.getTitle(),
                        saved.getMessage(),
                        pushUrlService.urlFor(user.getRole(), saved.getRelatedEntityType(), saved.getRelatedEntityId())
                )
        );
    }

    private void mark(Notification notification) {
        if (!notification.isRead()) {
            notification.setRead(true);
            notification.setReadAt(LocalDateTime.now());
        }
    }

    private NotificationDto toDto(Notification notification) {
        return new NotificationDto(
                notification.getId(),
                notification.getTitle(),
                notification.getMessage(),
                notification.getNotificationType(),
                notification.getRelatedEntityType(),
                notification.getRelatedEntityId(),
                notification.isRead(),
                notification.isEmailSent(),
                notification.getEmailError(),
                notification.getCreatedAt(),
                notification.getReadAt()
        );
    }
}
