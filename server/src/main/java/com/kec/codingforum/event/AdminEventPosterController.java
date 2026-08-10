package com.kec.codingforum.event;

import com.kec.codingforum.audit.AuditService;
import com.kec.codingforum.event.dto.EventPosterDto;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/admin/events/{eventId}/poster")
@PreAuthorize("hasRole('SUPER_ADMIN')")
public class AdminEventPosterController {

    private final EventPosterService posterService;
    private final AuditService auditService;

    public AdminEventPosterController(EventPosterService posterService, AuditService auditService) {
        this.posterService = posterService;
        this.auditService = auditService;
    }

    @PostMapping
    public EventPosterDto upload(@PathVariable Long eventId, @RequestParam("file") MultipartFile file) {
        EventPosterDto poster = posterService.upload(eventId, file);
        auditService.record("EVENT_POSTER_UPLOADED", "EVENT", eventId, AuditService.SUCCESS, "Admin uploaded or replaced event poster.");
        return poster;
    }

    @DeleteMapping
    public EventPosterDto remove(@PathVariable Long eventId) {
        EventPosterDto poster = posterService.remove(eventId);
        auditService.record("EVENT_POSTER_REMOVED", "EVENT", eventId, AuditService.SUCCESS, "Admin removed event poster.");
        return poster;
    }
}
