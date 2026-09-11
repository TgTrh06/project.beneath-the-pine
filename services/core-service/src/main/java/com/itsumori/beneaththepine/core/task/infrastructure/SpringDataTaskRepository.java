package com.itsumori.beneaththepine.core.task.infrastructure;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

interface SpringDataTaskRepository extends JpaRepository<TaskEntity, UUID> {
    Optional<TaskEntity> findByIdAndUserId(UUID id, UUID userId);

    List<TaskEntity> findByUserIdOrderByCreatedAtDesc(UUID userId, Pageable pageable);

    List<TaskEntity> findByUserIdAndStatusOrderByCreatedAtDesc(UUID userId, String status, Pageable pageable);
}

