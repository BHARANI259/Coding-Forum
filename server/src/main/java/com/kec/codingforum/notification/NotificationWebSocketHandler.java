package com.kec.codingforum.notification;

import com.kec.codingforum.security.JwtService;
import io.jsonwebtoken.Claims;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;
import org.springframework.web.util.UriComponentsBuilder;

@Component
public class NotificationWebSocketHandler extends TextWebSocketHandler {

    private final JwtService jwtService;
    private final WebSocketNotificationService webSocketNotificationService;

    public NotificationWebSocketHandler(JwtService jwtService, WebSocketNotificationService webSocketNotificationService) {
        this.jwtService = jwtService;
        this.webSocketNotificationService = webSocketNotificationService;
    }

    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
        String token = UriComponentsBuilder.fromUri(session.getUri()).build().getQueryParams().getFirst("token");
        if (token == null || token.isBlank()) {
            session.close(CloseStatus.NOT_ACCEPTABLE.withReason("Missing token"));
            return;
        }
        try {
            Claims claims = jwtService.parseClaims(token);
            Long userId = ((Number) claims.get("userId")).longValue();
            session.getAttributes().put("userId", userId);
            webSocketNotificationService.register(userId, session);
        } catch (Exception exception) {
            session.close(new CloseStatus(HttpStatus.UNAUTHORIZED.value(), "Invalid token"));
        }
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
        Object userId = session.getAttributes().get("userId");
        if (userId instanceof Long value) {
            webSocketNotificationService.unregister(value, session);
        }
    }
}
