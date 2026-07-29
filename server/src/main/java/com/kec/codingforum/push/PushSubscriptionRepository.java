package com.kec.codingforum.push;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PushSubscriptionRepository extends JpaRepository<PushSubscription, Long> {

    Optional<PushSubscription> findByEndpointHash(String endpointHash);

    Optional<PushSubscription> findByIdAndUserId(Long id, Long userId);

    List<PushSubscription> findByUserIdAndActiveTrueOrderByLastSeenAtDescCreatedAtDesc(Long userId);

    List<PushSubscription> findByUserIdAndActiveTrue(Long userId);
}
