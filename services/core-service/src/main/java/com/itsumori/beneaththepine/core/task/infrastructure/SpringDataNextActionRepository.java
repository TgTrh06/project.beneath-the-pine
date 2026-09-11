package com.itsumori.beneaththepine.core.task.infrastructure;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

interface SpringDataNextActionRepository extends JpaRepository<NextActionEntity, UUID> {
}

