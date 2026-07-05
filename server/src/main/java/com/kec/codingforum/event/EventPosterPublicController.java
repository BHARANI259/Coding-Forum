package com.kec.codingforum.event;

import org.springframework.core.io.Resource;
import org.springframework.http.CacheControl;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Duration;

@RestController
@RequestMapping("/api/public/event-posters")
public class EventPosterPublicController {

    private final EventPosterService posterService;

    public EventPosterPublicController(EventPosterService posterService) {
        this.posterService = posterService;
    }

    @GetMapping("/{fileName}")
    public ResponseEntity<Resource> get(@PathVariable String fileName) {
        EventPosterService.PosterResource poster = posterService.load(fileName);
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(poster.contentType()))
                .cacheControl(CacheControl.maxAge(Duration.ofHours(6)).cachePublic())
                .body(poster.resource());
    }
}
