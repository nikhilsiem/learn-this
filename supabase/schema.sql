-- Run this in Supabase SQL editor
-- Then create a storage bucket named "course-uploads" in the Supabase Dashboard > Storage

create extension if not exists "uuid-ossp";

create table users (
  id uuid primary key default uuid_generate_v4(),
  email text unique not null,
  name text,
  image text,
  created_at timestamptz default now()
);

create table courses (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references users(id) on delete cascade,
  title text not null,
  topic text not null,
  skill_level text not null,
  goal text not null,
  time_budget text not null,
  modules jsonb not null default '[]',
  capstone jsonb,
  created_at timestamptz default now()
);

create table module_content (
  id uuid primary key default uuid_generate_v4(),
  course_id uuid references courses(id) on delete cascade,
  module_index integer not null,
  lesson_markdown text,
  quiz_json jsonb,
  generated_at timestamptz,
  unique(course_id, module_index)
);

create table progress (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references users(id) on delete cascade,
  course_id uuid references courses(id) on delete cascade,
  module_index integer not null,
  completed boolean default false,
  quiz_score integer,
  completed_at timestamptz,
  unique(user_id, course_id, module_index)
);

alter table courses enable row level security;
alter table module_content enable row level security;
alter table progress enable row level security;

create policy "Users see own courses" on courses
  for all using (auth.uid()::text = user_id::text);

create policy "Users see content for own courses" on module_content
  for all using (
    course_id in (select id from courses where user_id::text = auth.uid()::text)
  );

create policy "Users see own progress" on progress
  for all using (auth.uid()::text = user_id::text);
