package com.kec.codingforum.push;

import com.kec.codingforum.user.User;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "push_subscriptions")
public class PushSubscription {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id")
    private User user;

    @Column(nullable = false)
    private String endpoint;

    @Column(name = "endpoint_hash", nullable = false, unique = true, length = 64)
    private String endpointHash;

    @Column(name = "p256dh_key", nullable = false)
    private String p256dhKey;

    @Column(name = "auth_key", nullable = false)
    private String authKey;

    @Column(name = "user_agent", length = 500)
    private String userAgent;

    @Column(name = "device_name")
    private String deviceName;

    @Column(length = 100)
    private String platform;

    @Column(length = 100)
    private String browser;

    @Column(nullable = false)
    private boolean active = true;

    @Column(name = "permission_status", nullable = false, length = 50)
    private String permissionStatus = "granted";

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt = LocalDateTime.now();

    @Column(name = "last_seen_at")
    private LocalDateTime lastSeenAt;

    @Column(name = "last_success_at")
    private LocalDateTime lastSuccessAt;

    @Column(name = "failure_count", nullable = false)
    private int failureCount = 0;

    @Column(name = "revoked_at")
    private LocalDateTime revokedAt;
}
