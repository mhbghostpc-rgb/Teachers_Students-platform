-- schema_v2.sql
-- This script completely resets the database to V2 architecture.
-- WARNING: This will drop existing data in these tables.

create extension if not exists "uuid-ossp";

-- Drop existing tables to rebuild (Dev Mode)
drop table if exists public.reviews cascade;
drop table if exists public.teacher_stages cascade;
drop table if exists public.teacher_subjects cascade;
drop table if exists public.educational_stages cascade;
drop table if exists public.subjects cascade;
drop table if exists public.students cascade;
drop table if exists public.teachers cascade;
drop table if exists public.role_permissions cascade;
drop table if exists public.permissions cascade;
drop table if exists public.roles cascade;
drop table if exists public.users cascade;
drop table if exists public.ads cascade;
drop table if exists public.promo_codes cascade;
drop table if exists public.activity_logs cascade;
drop table if exists public.settings cascade;

-- 1. Roles & Permissions
create table public.roles (
  id uuid default uuid_generate_v4() primary key,
  name text unique not null,
  description text
);

create table public.permissions (
  id uuid default uuid_generate_v4() primary key,
  name text unique not null,
  description text
);

create table public.role_permissions (
  role_id uuid references public.roles on delete cascade,
  permission_id uuid references public.permissions on delete cascade,
  primary key (role_id, permission_id)
);

-- 2. Users Table
create table public.users (
  id uuid references auth.users on delete cascade primary key,
  email text unique not null,
  role_id uuid references public.roles(id) on delete set null,
  role_name text default 'student', -- fallback/simple check ('student', 'teacher', 'admin', 'super_admin')
  status text check (status in ('active', 'suspended', 'banned')) default 'active' not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Lookups: Subjects & Stages
create table public.subjects (
  id uuid default uuid_generate_v4() primary key,
  name text unique not null,
  is_active boolean default true
);

create table public.educational_stages (
  id uuid default uuid_generate_v4() primary key,
  name text unique not null,
  is_active boolean default true
);

-- 4. Teachers Profile
create table public.teachers (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users on delete cascade unique not null,
  display_name text not null,
  phone text,
  whatsapp text,
  city text,
  area text,
  teaching_type text check (teaching_type in ('online', 'offline', 'both')),
  system_types text[] default '{}',
  is_approved boolean default false,
  status text default 'pending' check (status in ('pending', 'approved', 'rejected', 'suspended', 'banned', 'hidden', 'deleted')),
  qualification text,
  university text,
  school_name text,
  website_url text,
  video_url text,
  gallery_images text[] default '{}',
  price_per_session numeric(10,2),
  session_duration integer, -- in minutes
  profile_image text,
  about text,
  experience_years integer default 0,
  is_trial_available boolean default false,
  
  -- Stats & Ranking
  average_rating numeric(3, 2) default 0 not null,
  reviews_count integer default 0 not null,
  profile_completion_score integer default 0,
  priority_score integer default 0, -- manual admin override
  is_featured boolean default false not null,
  is_sponsored boolean default false not null,
  
  -- Status
  status text check (status in ('pending', 'approved', 'rejected', 'suspended', 'banned', 'hidden')) default 'pending' not null,
  
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Many-to-Many: Teacher Stages
create table public.teacher_stages (
  teacher_id uuid references public.teachers on delete cascade,
  stage_id uuid references public.educational_stages on delete cascade,
  primary key (teacher_id, stage_id)
);

-- Many-to-Many: Teacher Subjects
create table public.teacher_subjects (
  teacher_id uuid references public.teachers on delete cascade,
  subject_id uuid references public.subjects on delete cascade,
  primary key (teacher_id, subject_id)
);

-- 5. Students Profile
create table public.students (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users on delete cascade unique not null,
  display_name text not null,
  phone text,
  parent_phone text,
  city text,
  stage_id uuid references public.educational_stages on delete set null,
  grade text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 6. Reviews
create table public.reviews (
  id uuid default uuid_generate_v4() primary key,
  teacher_id uuid references public.teachers on delete cascade not null,
  student_id uuid references public.students on delete cascade not null,
  rating integer check (rating >= 1 and rating <= 5) not null,
  comment text,
  status text check (status in ('pending', 'published', 'hidden', 'rejected', 'deleted', 'flagged')) default 'pending' not null,
  rejection_reason text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(teacher_id, student_id)
);

-- Function to update teacher rating when a review is published/deleted
create or replace function public.update_teacher_rating()
returns trigger as $$
begin
  if (TG_OP = 'INSERT' and NEW.status = 'published') or 
     (TG_OP = 'UPDATE' and NEW.status = 'published' and OLD.status != 'published') then
    
    update public.teachers
    set 
      reviews_count = reviews_count + 1,
      average_rating = (
        select avg(rating)::numeric(3,2) 
        from public.reviews 
        where teacher_id = NEW.teacher_id and status = 'published'
      )
    where id = NEW.teacher_id;
    
  elsif (TG_OP = 'UPDATE' and OLD.status = 'published' and NEW.status != 'published') or
        (TG_OP = 'DELETE' and OLD.status = 'published') then
        
    update public.teachers
    set 
      reviews_count = greatest(reviews_count - 1, 0),
      average_rating = coalesce((
        select avg(rating)::numeric(3,2) 
        from public.reviews 
        where teacher_id = coalesce(NEW.teacher_id, OLD.teacher_id) and status = 'published'
      ), 0)
    where id = coalesce(NEW.teacher_id, OLD.teacher_id);
    
  end if;
  
  return coalesce(NEW, OLD);
end;
$$ language plpgsql security definer;

-- Trigger for updating teacher ratings
drop trigger if exists on_review_status_change on public.reviews;
create trigger on_review_status_change
  after insert or update or delete on public.reviews
  for each row execute function public.update_teacher_rating();

-- 7. Ads / Sponsored Profiles
create table public.ads (
  id uuid default uuid_generate_v4() primary key,
  teacher_id uuid references public.teachers on delete cascade not null,
  start_date timestamp with time zone not null,
  end_date timestamp with time zone not null,
  placement text check (placement in ('homepage', 'search', 'subject_page', 'city_page', 'featured')),
  budget numeric(10,2),
  status text check (status in ('active', 'paused', 'completed', 'cancelled')) default 'active',
  views integer default 0,
  clicks integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 8. Promo Codes
create table public.promo_codes (
  id uuid default uuid_generate_v4() primary key,
  code text unique not null,
  type text check (type in ('discount', 'invite', 'free')),
  discount_percentage numeric(5,2),
  max_usage integer,
  used_count integer default 0,
  valid_from timestamp with time zone,
  valid_to timestamp with time zone,
  status text check (status in ('active', 'expired', 'disabled')) default 'active',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 9. Activity Logs (Audit)
create table public.activity_logs (
  id uuid default uuid_generate_v4() primary key,
  admin_id uuid references public.users on delete set null,
  action text not null,
  entity_type text not null, -- 'teacher', 'student', 'review', etc.
  entity_id uuid,
  details jsonb,
  ip_address text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 10. Platform Settings
create table public.settings (
  id uuid default uuid_generate_v4() primary key,
  key text unique not null,
  value jsonb not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Insert Default Data
insert into public.roles (name, description) values
('Super Admin', 'Full control'),
('Admin', 'Manage users and content'),
('Moderator', 'Review moderation only'),
('Support', 'View only access');

insert into public.educational_stages (name) values
('ابتدائي'), ('إعدادي'), ('ثانوي'), ('جامعي'), ('لغات'), ('أزهري'), ('دولي');

insert into public.subjects (name) values
('اللغة العربية'), ('اللغة الإنجليزية'), ('الرياضيات'), ('العلوم'), ('الدراسات الاجتماعية'), ('الفيزياء'), ('الكيمياء'), ('الأحياء');

-- RLS Enable (Example for users)
alter table public.users enable row level security;
alter table public.teachers enable row level security;
alter table public.students enable row level security;
alter table public.reviews enable row level security;
alter table public.subjects enable row level security;
alter table public.educational_stages enable row level security;
alter table public.teacher_stages enable row level security;
alter table public.teacher_subjects enable row level security;
alter table public.ads enable row level security;
alter table public.promo_codes enable row level security;
alter table public.activity_logs enable row level security;
alter table public.roles enable row level security;

-- Disable RLS temporarily or setup permissive for dev
create policy "Enable all for users" on public.users for all using (true);
create policy "Enable all for teachers" on public.teachers for all using (true);
create policy "Enable all for students" on public.students for all using (true);
create policy "Enable all for reviews" on public.reviews for all using (true);
create policy "Enable all for subjects" on public.subjects for all using (true);
create policy "Enable all for stages" on public.educational_stages for all using (true);
create policy "Enable all for teacher_stages" on public.teacher_stages for all using (true);
create policy "Enable all for teacher_subjects" on public.teacher_subjects for all using (true);
create policy "Enable all for ads" on public.ads for all using (true);
create policy "Enable all for promo_codes" on public.promo_codes for all using (true);
create policy "Enable all for activity_logs" on public.activity_logs for all using (true);
create policy "Enable all for roles" on public.roles for all using (true);
