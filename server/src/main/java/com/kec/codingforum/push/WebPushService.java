package com.kec.codingforum.push;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import nl.martijndwars.webpush.Notification;
import nl.martijndwars.webpush.PushService;
import nl.martijndwars.webpush.Subscription;
import org.apache.http.HttpResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class WebPushService {

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
            return;
        }
        String body = payloadBody(payload);
        for (PushSubscription subscription : activeSubscriptions) {
            send(pushService, subscription, body);
        }
    }

    public void sendToSubscription(PushSubscription subscription, WebPushPayload payload) {
        if (!isConfigured() || subscription == null || !subscription.isActive()) {
            return;
        }
        try {
            send(new PushService(publicKey, privateKey, subject), subscription, payloadBody(payload));
        } catch (Exception exception) {
            subscriptionService.markFailure(subscription, false);
        }
    }

    private void send(PushService pushService, PushSubscription subscription, String body) {
        try {
            Subscription webPushSubscription = new Subscription(
                    subscription.getEndpoint(),
                    new Subscription.Keys(subscription.getP256dhKey(), subscription.getAuthKey())
            );
            HttpResponse response = pushService.send(new Notification(webPushSubscription, body));
            int statusCode = response.getStatusLine().getStatusCode();
            if (statusCode >= 200 && statusCode < 300) {
                subscriptionService.markSuccess(subscription);
            } else {
                subscriptionService.markFailure(subscription, statusCode == 404 || statusCode == 410);
            }
        } catch (Exception exception) {
            subscriptionService.markFailure(subscription, false);
        }
    }

    private String payloadBody(WebPushPayload payload) {
        try {
            return objectMapper.writeValueAsString(payload);
        } catch (JsonProcessingException exception) {
            return "{\"title\":\"KEC Coding Forum\",\"body\":\"You have a new notification.\",\"url\":\"/notifications\"}";
        }
    }
}
