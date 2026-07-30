package com.kec.codingforum.push;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import nl.martijndwars.webpush.Notification;
import nl.martijndwars.webpush.PushService;
import nl.martijndwars.webpush.Subscription;
import org.apache.http.HttpResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class WebPushService {

    private static final Logger LOGGER = LoggerFactory.getLogger(WebPushService.class);

    private final PushSubscriptionService subscriptionService;
    private final ObjectMapper objectMapper;
    private final boolean enabled;
    private final String publicKey;
    private final String privateKey;
    private final String subject;

    public WebPushService(
            PushSubscriptionService subscriptionService,
            ObjectMapper objectMapper,
            @Value("${app.web-push.enabled:false}") boolean enabled,
            @Value("${app.web-push.vapid-public-key:}") String publicKey,
            @Value("${app.web-push.vapid-private-key:}") String privateKey,
            @Value("${app.web-push.subject:mailto:admin@example.com}") String subject
    ) {
        this.subscriptionService = subscriptionService;
        this.objectMapper = objectMapper;
        this.enabled = enabled;
        this.publicKey = publicKey;
        this.privateKey = privateKey;
        this.subject = subject;
    }

    public boolean isConfigured() {
        return enabled && !publicKey.isBlank() && !privateKey.isBlank();
    }

    public String publicKey() {
        return publicKey;
    }

    public void sendToUser(Long userId, WebPushPayload payload) {
        if (!isConfigured()) {
            return;
        }
        List<PushSubscription> activeSubscriptions = subscriptionService.activeSubscriptionsForUser(userId);
        if (activeSubscriptions.isEmpty()) {
            return;
        }

        PushService pushService;
        try {
            pushService = new PushService(publicKey, privateKey, subject);
        } catch (Exception exception) {
            LOGGER.warn("Web Push service is configured but VAPID keys could not initialize: {}", exception.getMessage());
            return;
        }
        String body = payloadBody(payload);
        for (PushSubscription subscription : activeSubscriptions) {
            send(pushService, subscription, body);
        }
    }

    public PushSendResult sendToSubscription(PushSubscription subscription, WebPushPayload payload) {
        if (!isConfigured() || subscription == null || !subscription.isActive()) {
            return PushSendResult.failure("Push notifications are not configured or this device is inactive.");
        }
        try {
            return send(new PushService(publicKey, privateKey, subject), subscription, payloadBody(payload));
        } catch (Exception exception) {
            subscriptionService.markFailure(subscription, false);
            LOGGER.warn("Unable to send Web Push test notification: {}", exception.getMessage());
            return PushSendResult.failure("Unable to send push notification. Check the VAPID keys and browser subscription.");
        }
    }

    private PushSendResult send(PushService pushService, PushSubscription subscription, String body) {
        try {
            Subscription webPushSubscription = new Subscription(
                    subscription.getEndpoint(),
                    new Subscription.Keys(subscription.getP256dhKey(), subscription.getAuthKey())
            );
            HttpResponse response = pushService.send(new Notification(webPushSubscription, body));
            int statusCode = response.getStatusLine().getStatusCode();
            if (statusCode >= 200 && statusCode < 300) {
                subscriptionService.markSuccess(subscription);
                return PushSendResult.sent();
            } else {
                subscriptionService.markFailure(subscription, statusCode == 404 || statusCode == 410);
                String message = "Push provider rejected notification with HTTP " + statusCode + ".";
                if (statusCode == 401 || statusCode == 403) {
                    message += " If VAPID keys were changed, remove this device and enable notifications again.";
                }
                LOGGER.warn("Web Push provider rejected subscription {} with status {}", subscription.getId(), statusCode);
                return PushSendResult.failure(message);
            }
        } catch (Exception exception) {
            subscriptionService.markFailure(subscription, false);
            LOGGER.warn("Web Push send failed for subscription {}: {}", subscription.getId(), exception.getMessage());
            return PushSendResult.failure("Unable to send push notification. Remove this device and enable notifications again if the problem continues.");
        }
    }

    private String payloadBody(WebPushPayload payload) {
        try {
            return objectMapper.writeValueAsString(payload);
        } catch (JsonProcessingException exception) {
            return "{\"title\":\"KEC Coding Forum\",\"body\":\"You have a new notification.\",\"url\":\"/notifications\"}";
        }
    }

    public record PushSendResult(boolean success, String message) {
        public static PushSendResult sent() {
            return new PushSendResult(true, "Push notification sent.");
        }

        public static PushSendResult failure(String message) {
            return new PushSendResult(false, message);
        }
    }
}
