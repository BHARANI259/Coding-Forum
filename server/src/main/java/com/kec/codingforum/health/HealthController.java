package com.kec.codingforum.health;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.Map;

@RestController
public class HealthController {

    @GetMapping("/")
    public Map<String, Object> root() {
        return Map.of(
                "status", "UP",
                "app", "kec-coding-forum",
                "message", "KEC Coding Forum backend is running. Use /api for application endpoints.",
                "health", "/health",
                "timestamp", Instant.now().toString()
        );
    }

    @GetMapping({"/health", "/api/health"})
    public Map<String, Object> health() {
        return Map.of(
                "status", "UP",
                "app", "kec-coding-forum",
                "timestamp", Instant.now().toString()
        );
    }
}
