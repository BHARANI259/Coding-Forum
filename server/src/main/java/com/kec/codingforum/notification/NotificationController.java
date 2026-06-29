package com.kec.codingforum.notification;

import com.kec.codingforum.notification.dto.NotificationDto;
import com.kec.codingforum.notification.dto.UnreadCountResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    @GetMapping
    public Page<NotificationDto> list(
            @PageableDefault(size = 20) Pageable pageable,
            @RequestParam(required = false) Boolean unreadOnly,
            @RequestParam(required = false) String type
    ) {
        return notificationService.listCurrentUser(pageable, unreadOnly, type);
    }

    @GetMapping("/recent")
    public List<NotificationDto> recent() {
        return notificationService.recentCurrentUser();
    }

    @GetMapping("/unread-count")
    public UnreadCountResponse unreadCount() {
        return notificationService.unreadCount();
    }

    @PatchMapping("/{id}/read")
    public NotificationDto markRead(@PathVariable Long id) {
        return notificationService.markRead(id);
    }

    @PatchMapping("/read-all")
    public void markAllRead() {
        notificationService.markAllRead();
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        notificationService.delete(id);
    }
}
