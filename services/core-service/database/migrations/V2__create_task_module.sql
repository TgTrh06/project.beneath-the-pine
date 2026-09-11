create table core.tasks (
    id uuid primary key,
    user_id uuid not null,
    title varchar(280) not null,
    minutes integer not null,
    status varchar(20) not null,
    source_brain_dump_id uuid,
    created_at timestamp with time zone not null,
    updated_at timestamp with time zone not null,
    constraint tasks_title_length check (char_length(btrim(title)) between 2 and 280),
    constraint tasks_minutes_range check (minutes between 1 and 10),
    constraint tasks_status_allowed check (status in ('ready', 'done', 'deferred', 'archived'))
);

create index tasks_user_created_at_idx
    on core.tasks (user_id, created_at desc);

create index tasks_user_status_created_at_idx
    on core.tasks (user_id, status, created_at desc);

create table core.next_actions (
    id uuid primary key,
    task_id uuid not null unique,
    title varchar(280) not null,
    minutes integer not null,
    confirmed_at timestamp with time zone not null,
    constraint next_actions_task_fk
        foreign key (task_id) references core.tasks (id) on delete cascade,
    constraint next_actions_title_length check (char_length(btrim(title)) between 2 and 280),
    constraint next_actions_minutes_range check (minutes between 1 and 10)
);

