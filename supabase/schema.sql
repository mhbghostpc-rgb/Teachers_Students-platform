-- Enable necessary extensions
create extension if not exists "uuid-ossp";

-- Users table (Extends Supabase auth.users)
create table public.users (
  id uuid references auth.users on delete cascade primary key,
  email text unique not null,
  role text check (role in ('student', 'teacher', 'admin')) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Teachers profile table
create table public.teachers (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users on delete cascade unique not null,
  display_name text not null,
  profile_image text,
  stage text not null,
  subject text not null,
  city text not null,
  area text not null,
  teaching_type text check (teaching_type in ('online', 'offline', 'both')) not null,
  phone text not null,
  whatsapp text not null,
  about text,
  average_rating numeric(3, 2) default 0 not null,
  reviews_count integer default 0 not null,
  is_featured boolean default false not null,
  is_approved boolean default false not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Students profile table
create table public.students (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users on delete cascade unique not null,
  display_name text not null,
  phone text,
  stage text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Reviews table
create table public.reviews (
  id uuid default uuid_generate_v4() primary key,
  teacher_id uuid references public.teachers on delete cascade not null,
  student_id uuid references public.students on delete cascade not null,
  rating integer check (rating >= 1 and rating <= 5) not null,
  comment text,
  status text check (status in ('pending', 'approved', 'rejected')) default 'pending' not null,
  rejection_reason text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(teacher_id, student_id) -- One review per student per teacher
);

-- Function to update teacher rating when a review is approved/deleted
create or replace function public.update_teacher_rating()
returns trigger as $$
begin
  if (TG_OP = 'INSERT' and NEW.status = 'approved') or 
     (TG_OP = 'UPDATE' and NEW.status = 'approved' and OLD.status != 'approved') then
    
    update public.teachers
    set 
      reviews_count = reviews_count + 1,
      average_rating = (
        select avg(rating)::numeric(3,2) 
        from public.reviews 
        where teacher_id = NEW.teacher_id and status = 'approved'
      )
    where id = NEW.teacher_id;
    
  elsif (TG_OP = 'UPDATE' and OLD.status = 'approved' and NEW.status != 'approved') or
        (TG_OP = 'DELETE' and OLD.status = 'approved') then
        
    update public.teachers
    set 
      reviews_count = greatest(reviews_count - 1, 0),
      average_rating = coalesce((
        select avg(rating)::numeric(3,2) 
        from public.reviews 
        where teacher_id = coalesce(NEW.teacher_id, OLD.teacher_id) and status = 'approved'
      ), 0)
    where id = coalesce(NEW.teacher_id, OLD.teacher_id);
    
  end if;
  
  return coalesce(NEW, OLD);
end;
$$ language plpgsql security definer;

-- Trigger for updating teacher ratings
create trigger on_review_status_change
  after insert or update or delete on public.reviews
  for each row execute function public.update_teacher_rating();

-- Row Level Security (RLS) Policies

alter table public.users enable row level security;
alter table public.teachers enable row level security;
alter table public.students enable row level security;
alter table public.reviews enable row level security;

-- Users policies
create policy "Users can read their own data" on public.users
  for select using (auth.uid() = id);

-- Teachers policies
create policy "Anyone can read approved teachers" on public.teachers
  for select using (is_approved = true);

create policy "Teachers can read and update their own profile" on public.teachers
  for all using (auth.uid() = user_id);

-- Students policies
create policy "Students can read and update their own profile" on public.students
  for all using (auth.uid() = user_id);

-- Reviews policies
create policy "Anyone can read approved reviews" on public.reviews
  for select using (status = 'approved');

create policy "Students can create reviews" on public.reviews
  for insert with check (
    auth.uid() in (select user_id from public.students where id = student_id)
  );

create policy "Students can read their own pending/rejected reviews" on public.reviews
  for select using (
    auth.uid() in (select user_id from public.students where id = student_id)
  );
