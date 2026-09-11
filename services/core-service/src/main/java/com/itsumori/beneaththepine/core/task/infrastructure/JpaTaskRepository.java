package com.itsumori.beneaththepine.core.task.infrastructure;

import com.itsumori.beneaththepine.core.task.application.TaskRepository;
import com.itsumori.beneaththepine.core.task.domain.NextAction;
import com.itsumori.beneaththepine.core.task.domain.Task;
import com.itsumori.beneaththepine.core.task.domain.TaskStatus;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
class JpaTaskRepository implements TaskRepository {
    private final SpringDataTaskRepository tasks;
    private final SpringDataNextActionRepository nextActions;

    JpaTaskRepository(
            SpringDataTaskRepository tasks,
            SpringDataNextActionRepository nextActions
    ) {
        this.tasks = tasks;
        this.nextActions = nextActions;
    }

    @Override
    @Transactional
    public void createConfirmedAction(Task task, NextAction nextAction) {
        tasks.save(TaskEntity.fromDomain(task));
        nextActions.save(NextActionEntity.fromDomain(nextAction));
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<Task> findByIdForUser(UUID taskId, UUID userId) {
        return tasks.findByIdAndUserId(taskId, userId).map(TaskEntity::toDomain);
    }

    @Override
    @Transactional(readOnly = true)
    public List<Task> listForUser(UUID userId, Optional<TaskStatus> status, int limit) {
        PageRequest page = PageRequest.of(0, limit);
        List<TaskEntity> entities = status
                .map(value -> tasks.findByUserIdAndStatusOrderByCreatedAtDesc(userId, value.value(), page))
                .orElseGet(() -> tasks.findByUserIdOrderByCreatedAtDesc(userId, page));
        return entities.stream().map(TaskEntity::toDomain).toList();
    }

    @Override
    @Transactional
    public Task update(Task task) {
        TaskEntity entity = tasks.findByIdAndUserId(task.id(), task.userId())
                .orElseThrow(() -> new IllegalStateException("Task disappeared during update"));
        entity.apply(task);
        return tasks.save(entity).toDomain();
    }
}

