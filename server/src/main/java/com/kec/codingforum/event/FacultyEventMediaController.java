package com.kec.codingforum.event;

import com.kec.codingforum.audit.AuditService;
import com.kec.codingforum.event.dto.EventMediaDto;
import com.kec.codingforum.event.dto.UpdateEventMediaRequest;
import com.kec.codingforum.security.SecurityUtils;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/faculty/events/{eventId}/media")
@PreAuthorize("hasRole('FACULTY')")
public class FacultyEventMediaController {

    private final EventMediaService service;
    private final AuditService auditService;

    public FacultyEventMediaController(EventMediaService service, AuditService auditService) {
        this.service = service;
        this.auditService = auditService;
    }

    @GetMapping
    public List<EventMediaDto> list(@PathVariable Long eventId) {
        return service.facultyList(eventId, SecurityUtils.getCurrentFacultyId());
    }

    @PostMapping
    public List<EventMediaDto> upload(
            @PathVariable Long eventId,
            @RequestParam("files") List<MultipartFile> files,
            @RequestParam(required = false) String mediaType,
            @RequestParam(required = false) String caption
    ) {
        List<EventMediaDto> uploaded = service.facultyUpload(eventId, SecurityUtils.getCurrentFacultyId(), SecurityUtils.getCurrentUserId(), files, mediaType, caption);
        auditService.record("FACULTY_EVENT_MEDIA_UPLOADED", "EVENT", eventId, AuditService.SUCCESS, "Faculty uploaded " + uploaded.size() + " event media file(s).");
        return uploaded;
    }

    @PatchMapping("/{mediaId}")
    public EventMediaDto update(@PathVariable Long eventId, @PathVariable Long mediaId, @RequestBody UpdateEventMediaRequest request) {
        EventMediaDto media = service.facultyUpdate(eventId, SecurityUtils.getCurrentFacultyId(), SecurityUtils.getCurrentUserId(), mediaId, request);
        auditService.record("FACULTY_EVENT_MEDIA_UPDATED", "EVENT_MEDIA", mediaId, AuditService.SUCCESS, "Faculty updated own event media metadata.");
        return media;
    }

    @DeleteMapping("/{mediaId}")
    public ResponseEntity<Void> delete(@PathVariable Long eventId, @PathVariable Long mediaId) {
        service.facultyDelete(eventId, SecurityUtils.getCurrentFacultyId(), SecurityUtils.getCurrentUserId(), mediaId);
        auditService.record("FACULTY_EVENT_MEDIA_DELETED", "EVENT_MEDIA", mediaId, AuditService.SUCCESS, "Faculty deleted own event media.");
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{mediaId}/file")
    public ResponseEntity<Resource> file(@PathVariable Long eventId, @PathVariable Long mediaId) {
        EventMediaService.MediaResource file = service.facultyLoad(eventId, SecurityUtils.getCurrentFacultyId(), mediaId);
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(file.contentType()))
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + file.originalFileName() + "\"")
                .body(file.resource());
    }
}
