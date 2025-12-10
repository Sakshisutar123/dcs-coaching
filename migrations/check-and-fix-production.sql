-- Complete Production Database Setup Script
-- Run this in Render PostgreSQL Shell or pgAdmin

-- Step 1: Check if users table exists
SELECT EXISTS (
   SELECT FROM information_schema.tables 
   WHERE table_name = 'users'
);

-- Step 2: Create users table if it doesn't exist
CREATE TABLE IF NOT EXISTS users (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    "uniqueId" character varying NOT NULL UNIQUE,
    "fullName" character varying NOT NULL,
    email character varying,
    phone character varying,
    "passwordHash" character varying,
    otp character varying,
    "otpExpiry" timestamp with time zone,
    "isRegistered" boolean DEFAULT false,
    registration_type character varying,
    qualification character varying,
    college_name character varying,
    "createdAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);

-- Step 3: Create index on uniqueId
CREATE INDEX IF NOT EXISTS idx_users_uniqueId ON users("uniqueId");

-- Step 4: Check current users
SELECT "uniqueId", "fullName", email, "isRegistered" FROM users;

-- Step 5: Add test user (only if doesn't exist)
INSERT INTO users ("uniqueId", "fullName", email, phone, "isRegistered")
VALUES ('STU001', 'Test User', 'test@example.com', '+1234567890', false)
ON CONFLICT ("uniqueId") DO NOTHING;

-- Step 6: Verify user was added
SELECT "uniqueId", "fullName", email, "isRegistered" FROM users WHERE "uniqueId" = 'STU001';

-- Step 7: Verify table structure
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'users' 
ORDER BY ordinal_position;

