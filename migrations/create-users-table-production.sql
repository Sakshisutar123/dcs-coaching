-- Production SQL Script to Create Users Table
-- Run this in your Render PostgreSQL database (via pgAdmin or Render Shell)

-- Create users table
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

-- Create index on uniqueId
CREATE INDEX IF NOT EXISTS idx_users_uniqueId ON users("uniqueId");

-- Verify table was created
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'users' 
ORDER BY ordinal_position;

