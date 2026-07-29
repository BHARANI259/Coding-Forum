package com.kec.codingforum.push;

import com.kec.codingforum.push.dto.PushSubscriptionRequest;
import com.kec.codingforum.push.dto.PushSubscriptionResponse;
import com.kec.codingforum.security.SecurityUtils;
import com.kec.codingforum.user.User;
import com.kec.codingforum.user.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.LocalDateTime;
import java.util.HexFormat;
import java.util.List;
import java.util.Optional;

@Service
public class PushSubscriptionService {

    private final PushSubscriptionRepository subscriptions;
    private final UserRepository users;

    public PushSubscriptionService(PushSubscriptionRepository subscriptions, UserRepository users) {
        this.subscriptions = subscriptions;
        this.users = users;
    }

    @Transactional
    public PushSubscriptionResponse upsertCurrentUser(PushSubscriptionRequest request) {
        Long userId = SecurityUtils.getCurrentUserId();
        User user = users.findById(userId).filter(User::isActive)
                .orElseThrow(() -> new IllegalArgumentException("Active user not found."));
        validate(request);

        String endpointHash = hashEndpoint(request.endpoint());
        PushSubscription subscription = subscriptions.findByEndpointHash(endpointHash).orElseGet(PushSubscription::new);
        LocalDateTime now = LocalDateTime.now();
        if (subscription.getId() == null) {
            subscription.setCreatedAt(now);
            subscription.setEndpointHash(endpointHash);
        }

        subscription.setUser(user);
        subscription.setEndpoint(request.endpoint().trim());
        subscription.setP256dhKey(request.keys().p256dh().trim());
        subscription.setAuthKey(request.keys().auth().trim());
        subscription.setUserAgent(limit(request.userAgent(), 500));
        subscription.setDeviceName(limit(blankDefault(request.deviceName(), "Current device"), 255));
        subscription.setPlatform(limit(blankDefault(request.platform(), "Unknown platform"), 100));
        subscription.setBrowser(limit(blankDefault(request.browser(), "Unknown browser"), 100));
        subscription.setPermissionStatus(limit(blankDefault(request.permissionStatus(), "granted"), 50));
        subscription.setActive(true);
        subscription.setRevokedAt(null);
        subscription.setLastSeenAt(now);
        subscription.setUpdatedAt(now);

        return toResponse(subscriptions.save(subscription));
    }

    @Transactional(readOnly = true)
    public List<PushSubscriptionResponse> listCurrentUserDevices() {
        return subscriptions.findByUserIdAndActiveTrueOrderByLastSeenAtDescCreatedAtDesc(SecurityUtils.getCurrentUserId())
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public void deactivateCurrentUserSubscription(Long subscriptionId) {
        PushSubscription subscription = subscriptions.findByIdAndUserId(subscriptionId, SecurityUtils.getCurrentUserId())
                .orElseThrow(() -> new IllegalArgumentException("Push notification device not found."));
        deactivate(subscription);
    }

    @Transactional
    public void deactivateCurrentBrowser(PushSubscriptionRequest request) {
        if (request == null || request.endpoint() == null || request.endpoint().isBlank()) {
            return;
        }
        String endpointHash = hashEndpoint(request.endpoint());
        subscriptions.findByEndpointHash(endpointHash)
                .filter(subscription -> subscription.getUser().getId().equals(SecurityUtils.getCurrentUserId()))
                .ifPresent(this::deactivate);
    }

    @Transactional
    public void markSuccess(PushSubscription subscription) {
        subscription.setFailureCount(0);
        subscription.setLastSuccessAt(LocalDateTime.now());
        subscription.setUpdatedAt(LocalDateTime.now());
    }

    @Transactional
    public void markFailure(PushSubscription subscription, boolean expired) {
        subscription.setFailureCount(subscription.getFailureCount() + 1);
        subscription.setUpdatedAt(LocalDateTime.now());
        if (expired || subscription.getFailureCount() >= 5) {
            deactivate(subscription);
        }
    }

    @Transactional(readOnly = true)
    public List<PushSubscription> activeSubscriptionsForUser(Long userId) {
        return subscriptions.findByUserIdAndActiveTrue(userId);
    }

    @Transactional(readOnly = true)
    public Optional<PushSubscription> activeCurrentUserSubscription(PushSubscriptionRequest request) {
        if (request == null || request.endpoint() == null || request.endpoint().isBlank()) {
            return Optional.empty();
        }
        Long userId = SecurityUtils.getCurrentUserId();
        return subscriptions.findByEndpointHash(hashEndpoint(request.endpoint()))
                .filter(PushSubscription::isActive)
                .filter(subscription -> subscription.getUser().getId().equals(userId));
    }

    public String hashEndpoint(String endpoint) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            return HexFormat.of().formatHex(digest.digest(endpoint.trim().getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException exception) {
            throw new IllegalStateException("SHA-256 is not available.", exception);
        }
    }

    private void validate(PushSubscriptionRequest request) {
        if (!request.endpoint().startsWith("https://")) {
            throw new IllegalArgumentException("Push endpoint must be HTTPS.");
        }
        if (request.keys() == null || request.keys().p256dh().isBlank() || request.keys().auth().isBlank()) {
            throw new IllegalArgumentException("Push subscription keys are required.");
        }
    }

    private void deactivate(PushSubscription subscription) {
        subscription.setActive(false);
        subscription.setPermissionStatus("unsubscribed");
        subscription.setRevokedAt(LocalDateTime.now());
        subscription.setUpdatedAt(LocalDateTime.now());
    }

    private PushSubscriptionResponse toResponse(PushSubscription subscription) {
        return new PushSubscriptionResponse(
                subscription.getId(),
                subscription.isActive(),
                subscription.getDeviceName(),
                subscription.getPlatform(),
                subscription.getBrowser(),
                subscription.getPermissionStatus(),
                subscription.getCreatedAt(),
                subscription.getLastSeenAt()
        );
    }

    private String blankDefault(String value, String fallback) {
        return value == null || value.isBlank() ? fallback : value.trim();
    }

    private String limit(String value, int length) {
        if (value == null) {
            return null;
        }
        return value.length() <= length ? value : value.substring(0, length);
    }
}
