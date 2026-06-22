create table conversations (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references users(id) on delete cascade,
  course_id uuid not null references courses(id) on delete cascade,
  module_index integer not null,
  title text not null default '',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table messages (
  id uuid primary key default uuid_generate_v4(),
  conversation_id uuid not null references conversations(id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  created_at timestamptz default now()
);

create index idx_conversations_user_course on conversations(user_id, course_id, module_index);
create index idx_messages_conversation on messages(conversation_id);

alter table conversations enable row level security;
alter table messages enable row level security;

create policy "Users manage own conversations" on conversations
  for all using (auth.uid()::text = user_id::text);

create policy "Users manage messages in their conversations" on messages
  for all using (
    conversation_id in (
      select id from conversations where user_id::text = auth.uid()::text
    )
  );
