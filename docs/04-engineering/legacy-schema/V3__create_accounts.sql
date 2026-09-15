create table core.accounts (
    id uuid primary key,
    email varchar(320) not null,
    password_hash varchar(100) not null,
    enabled boolean not null default true,
    created_at timestamp with time zone not null,
    updated_at timestamp with time zone not null,
    constraint accounts_email_unique unique (email),
    constraint accounts_email_normalized check (email = lower(btrim(email)))
);

alter table core.tasks
    add constraint tasks_user_id_fk
    foreign key (user_id) references core.accounts (id) on delete cascade;
