package com.kec.codingforum.audit;

import com.kec.codingforum.security.CustomUserPrincipal;
import com.kec.codingforum.user.User;
import com.kec.codingforum.user.UserRepository;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

@Service
public class AuditService {

    public static final String SUCCESS = "SUCCESS";
    public static final String FAILURE = "FAILURE";
    public static final String DENIED = "DENIED";

    private final AuditLogRepository auditLogs;
    private final UserRepository users;

    public AuditService(AuditLogRepository auditLogs, UserRepository users) {
        this.auditLogs = auditLogs;
        this.users = users;
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void record(String action, String resourceType, Object resourceId, String outcome, String message) {
        try {
            AuditLog log = new AuditLog();
            Actor actor = currentActor();
            if (actor.userId() != null) {
                users.findById(actor.userId()).ifPresent(log::setActor);
            }
            log.setActorEmail(limit(actor.email(), 255));
            log.setActorRole(limit(actor.role(), 50));
            log.setAction(limit(action, 100));
            log.setResourceType(limit(resourceType, 100));
            log.setResourceId(resourceId == null ? null : limit(String.valueOf(resourceId), 100));
            log.setOutcome(limit(outcome, 30));
            log.setMessage(limit(message, 500));

            HttpServletRequest request = currentRequest();
            if (request != null) {
                log.setIpAddress(limit(clientIp(request), 100));
                log.setUserAgent(limit(request.getHeader("User-Agent"), 500));
            }
            auditLogs.save(log);
        } catch (Exception ignored) {
            // Security audit failures must never break the main business flow.
        }
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void recordForUser(User user, String action, String resourceType, Object resourceId, String outcome, String message) {
        try {
            AuditLog log = new AuditLog();
            log.setActor(user);
            log.setActorEmail(limit(user == null ? null : user.getEmail(), 255));
            log.setActorRole(limit(user == null ? null : user.getRole(), 50));
            log.setAction(limit(action, 100));
            log.setResourceType(limit(resourceType, 100));
            log.setResourceId(resourceId == null ? null : limit(String.valueOf(resourceId), 100));
            log.setOutcome(limit(outcome, 30));
            log.setMessage(limit(message, 500));
            HttpServletRequest request = currentRequest();
            if (request != null) {
                log.setIpAddress(limit(clientIp(request), 100));
                log.setUserAgent(limit(request.getHeader("User-Agent"), 500));
            }
            auditLogs.save(log);
        } catch (Exception ignored) {
            // Security audit failures must never break the main business flow.
        }
    }

    private Actor currentActor() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.getPrincipal() instanceof CustomUserPrincipal principal) {
            return new Actor(principal.getUserId(), principal.getEmail(), principal.getRole());
        }
        return new Actor(null, null, null);
    }

    private HttpServletRequest currentRequest() {
        if (RequestContextHolder.getRequestAttributes() instanceof ServletRequestAttributes attributes) {
            return attributes.getRequest();
        }
        return null;
    }

    private String clientIp(HttpServletRequest request) {
        String forwardedFor = request.getHeader("X-Forwarded-For");
        if (forwardedFor != null && !forwardedFor.isBlank()) {
            return forwardedFor.split(",")[0].trim();
        }
        String realIp = request.getHeader("X-Real-IP");
        if (realIp != null && !realIp.isBlank()) {
            return realIp.trim();
        }
        return request.getRemoteAddr();
    }

    private String limit(String value, int maxLength) {
        if (value == null) {
            return null;
        }
        String cleaned = value.replaceAll("[\\r\\n]", " ").trim();
        return cleaned.length() <= maxLength ? cleaned : cleaned.substring(0, maxLength);
    }

    private record Actor(Long userId, String email, String role) {
    }
}
