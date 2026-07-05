package com.kec.codingforum.event;

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

    public AdminEventPosterController(EventPosterService posterService) {
        this.posterService = posterService;
    }

    @PostMapping
    public EventPosterDto upload(@PathVariable Long eventId, @RequestParam("file") MultipartFile file) {
        return posterService.upload(eventId, file);
    }

    @DeleteMapping
    public EventPosterDto remove(@PathVariable Long eventId) {
        return posterService.remove(eventId);
    }
}
