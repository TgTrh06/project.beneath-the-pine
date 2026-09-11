package com.itsumori.beneaththepine.core.task.infrastructure;

import com.itsumori.beneaththepine.core.task.application.ArchiveTask;
import com.itsumori.beneaththepine.core.task.application.CreateNextAction;
import com.itsumori.beneaththepine.core.task.application.GetTask;
import com.itsumori.beneaththepine.core.task.application.ListTasks;
import com.itsumori.beneaththepine.core.task.application.TaskRepository;
import com.itsumori.beneaththepine.core.task.application.UpdateTask;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.time.Clock;

@Configuration(proxyBeanMethods = false)
class TaskConfiguration {
    @Bean
    Clock taskClock() {
        return Clock.systemUTC();
    }

    @Bean
    CreateNextAction createNextAction(TaskRepository repository, Clock taskClock) {
        return new CreateNextAction(repository, taskClock);
    }

    @Bean
    GetTask getTask(TaskRepository repository) {
        return new GetTask(repository);
    }

    @Bean
    ListTasks listTasks(TaskRepository repository) {
        return new ListTasks(repository);
    }

    @Bean
    UpdateTask updateTask(TaskRepository repository, Clock taskClock) {
        return new UpdateTask(repository, taskClock);
    }

    @Bean
    ArchiveTask archiveTask(TaskRepository repository, Clock taskClock) {
        return new ArchiveTask(repository, taskClock);
    }
}
