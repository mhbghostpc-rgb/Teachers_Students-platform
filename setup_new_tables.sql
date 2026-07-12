-- 1. Create Platform Ads table
CREATE TABLE IF NOT EXISTS public.platform_ads (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    image_url TEXT NOT NULL,
    target_url TEXT,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    start_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
    end_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS for platform_ads
ALTER TABLE public.platform_ads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view active ads" ON public.platform_ads FOR SELECT USING (status = 'active');
CREATE POLICY "Service role can manage ads" ON public.platform_ads USING (true);

-- 2. Create Discount Codes table
CREATE TABLE IF NOT EXISTS public.discount_codes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    code TEXT UNIQUE NOT NULL,
    discount_percentage NUMERIC NOT NULL CHECK (discount_percentage > 0 AND discount_percentage <= 100),
    max_uses INTEGER,
    current_uses INTEGER DEFAULT 0,
    valid_until TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS for discount_codes
ALTER TABLE public.discount_codes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view active discount codes" ON public.discount_codes FOR SELECT USING (is_active = true);
CREATE POLICY "Service role can manage discount codes" ON public.discount_codes USING (true);

-- 3. Create Bookings table
CREATE TABLE IF NOT EXISTS public.bookings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    teacher_id UUID NOT NULL REFERENCES public.teachers(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
    session_date TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS for bookings
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Students can view and insert their own bookings" ON public.bookings FOR SELECT USING (student_id IN (SELECT id FROM students WHERE user_id = auth.uid()));
CREATE POLICY "Students can insert their own bookings" ON public.bookings FOR INSERT WITH CHECK (student_id IN (SELECT id FROM students WHERE user_id = auth.uid()));
CREATE POLICY "Teachers can view their own bookings" ON public.bookings FOR SELECT USING (teacher_id IN (SELECT id FROM teachers WHERE user_id = auth.uid()));
CREATE POLICY "Teachers can update their own bookings" ON public.bookings FOR UPDATE USING (teacher_id IN (SELECT id FROM teachers WHERE user_id = auth.uid()));
CREATE POLICY "Service role can manage bookings" ON public.bookings USING (true);
