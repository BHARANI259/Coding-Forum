package com.kec.codingforum.health;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.Map;

@RestController
public class HealthController {

    @GetMapping({"/health", "/api/health"})
    public Map<String, Object> health() {
        return Map.of(
                "status", "UP",
                "app", "kec-coding-forum",
                "timestamp", Instant.now().toString()
        );
    }
}
