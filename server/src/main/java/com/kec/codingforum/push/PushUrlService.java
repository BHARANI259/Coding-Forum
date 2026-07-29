package com.kec.codingforum.push;

import org.springframework.stereotype.Service;

@Service
public class PushUrlService {

    public String urlFor(String role, String relatedEntityType, Long relatedEntityId) {
        String base = switch (role == null ? "" : role) {
            case "STUDENT" -> "/student";
            case "FACULTY" -> "/faculty";
            case "SUPER_ADMIN" -> "/admin";
            default -> "";
        };
        if (relatedEntityType == null || relatedEntityId == null) {
            return base + "/notifications";
        }
        return switch (relatedEntityType.toUpperCase()) {
            case "EVENT" -> base + "/events/" + relatedEntityId;
            case "TEAM" -> base + "/teams";
            case "RESULT" -> base + "/results";
            default -> base + "/notifications";
        };
    }
}
