package com.kec.codingforum.event;

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
@RequestMapping("/api/admin/events/{eventId}/media")
@PreAuthorize("hasRole('SUPER_ADMIN')")
public class AdminEventMediaController {

    private final EventMediaService service;

    public AdminEventMediaController(EventMediaService service) {
        this.service = service;
    }

    @GetMapping
    public List<EventMediaDto> list(@PathVariable Long eventId, @RequestParam(defaultValue = "false") boolean includeDeleted) {
        return service.adminList(eventId, includeDeleted);
    }

    @PostMapping
    public List<EventMediaDto> upload(
            @PathVariable Long eventId,
            @RequestParam("files") List<MultipartFile> files,
            @RequestParam(required = false) String mediaType,
            @RequestParam(required = false) String caption
    ) {
        return service.adminUpload(eventId, SecurityUtils.getCurrentUserId(), files, mediaType, caption);
    }

    @PatchMapping("/{mediaId}")
    public EventMediaDto update(@PathVariable Long eventId, @PathVariable Long mediaId, @RequestBody UpdateEventMediaRequest request) {
        return service.adminUpdate(eventId, mediaId, request);
    }

    @DeleteMapping("/{mediaId}")
    public ResponseEntity<Void> delete(@PathVariable Long eventId, @PathVariable Long mediaId) {
        service.adminDelete(eventId, mediaId, SecurityUtils.getCurrentUserId());
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{mediaId}/file")
    public ResponseEntity<Resource> file(@PathVariable Long eventId, @PathVariable Long mediaId) {
        EventMediaService.MediaResource file = service.adminLoad(eventId, mediaId);
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(file.contentType()))
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + file.originalFileName() + "\"")
                .body(file.resource());
    }
}
