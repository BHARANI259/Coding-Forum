package com.kec.codingforum.push;

import com.kec.codingforum.push.dto.PushSubscriptionRequest;
import com.kec.codingforum.push.dto.PushSubscriptionResponse;
import com.kec.codingforum.push.dto.VapidPublicKeyResponse;
import com.kec.codingforum.security.SecurityUtils;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/push")
@RequiredArgsConstructor
public class PushSubscriptionController {

    private final PushSubscriptionService subscriptionService;
    private final WebPushService webPushService;

    @GetMapping("/vapid-public-key")
    public VapidPublicKeyResponse publicKey() {
        if (!webPushService.isConfigured()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Push notifications are not configured. Set WEB_PUSH_ENABLED=true and provide WEB_PUSH_VAPID_PUBLIC_KEY and WEB_PUSH_VAPID_PRIVATE_KEY."
            );
        }
        return new VapidPublicKeyResponse(webPushService.publicKey(), true);
    }

    @PostMapping("/subscriptions")
    public PushSubscriptionResponse subscribe(@Valid @RequestBody PushSubscriptionRequest request) {
        return subscriptionService.upsertCurrentUser(request);
    }

    @GetMapping("/subscriptions")
    public List<PushSubscriptionResponse> listCurrentUserDevices() {
        return subscriptionService.listCurrentUserDevices();
    }

    @DeleteMapping("/subscriptions/{subscriptionId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void removeDevice(@PathVariable Long subscriptionId) {
        subscriptionService.deactivateCurrentUserSubscription(subscriptionId);
    }

    @PostMapping("/subscriptions/deactivate-current")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deactivateCurrent(@Valid @RequestBody PushSubscriptionRequest request) {
        subscriptionService.deactivateCurrentBrowser(request);
    }

    @PostMapping("/test")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void sendTestNotification(@Valid @RequestBody PushSubscriptionRequest request) {
        PushSubscription subscription = subscriptionService.activeCurrentUserSubscription(request)
                .orElseThrow(() -> new IllegalArgumentException("Current device is not subscribed to push notifications."));
        webPushService.sendToSubscription(
                subscription,
                new WebPushPayload(
                        null,
                        "PROFILE_OR_ACCOUNT_NOTICE",
                        "KEC Coding Forum",
                        "Push notifications are working on this device.",
                        "/notifications"
                )
        );
    }
}
