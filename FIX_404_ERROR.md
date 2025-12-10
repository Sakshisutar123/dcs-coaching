# Fix "User not found" 404 Error

## Problem
All API endpoints return `{"message": "User not found"}` 404 error.

## Root Cause
The `users` table either:
1. Doesn't exist in production database, OR
2. Exists but has no user with `uniqueId: "STU001"`

## Solution: Create Table and Add Test User

### Step 1: Connect to Render PostgreSQL

**Option A: Render Shell (Easiest)**
1. Go to Render Dashboard
2. Click on your **PostgreSQL Database** service
3. Click **"Shell"** tab
4. You'll be connected automatically

**Option B: pgAdmin**
1. Get connection string from Render Dashboard → PostgreSQL → Connection String
2. Connect using pgAdmin

### Step 2: Run SQL Script

Copy and paste this entire SQL script:

```sql
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

-- Create index
CREATE INDEX IF NOT EXISTS idx_users_uniqueId ON users("uniqueId");

-- Add test user
INSERT INTO users ("uniqueId", "fullName", email, phone, "isRegistered")
VALUES ('STU001', 'Test User', 'test@example.com', '+1234567890', false)
ON CONFLICT ("uniqueId") DO NOTHING;

-- Verify
SELECT "uniqueId", "fullName", email FROM users WHERE "uniqueId" = 'STU001';
```

### Step 3: Verify Table Exists

Run this query:
```sql
SELECT * FROM users;
```

Should show at least one row with `uniqueId = 'STU001'`

### Step 4: Test API

After creating the table and user, test:

```bash
POST https://dcs-coaching.onrender.com/api/auth/check-user
Content-Type: application/json

{
  "uniqueId": "STU001"
}
```

**Expected Response:**
```json
{
  "message": "User found",
  "email": "test@example.com"
}
```

## Quick Fix Checklist

- [ ] Connect to Render PostgreSQL (Shell or pgAdmin)
- [ ] Run CREATE TABLE SQL script
- [ ] Run INSERT to add test user (STU001)
- [ ] Verify with SELECT query
- [ ] Test API endpoint in Postman
- [ ] Should get "User found" instead of "User not found"

## Troubleshooting

### Still Getting "User not found"?

1. **Check if table exists:**
   ```sql
   SELECT EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_name = 'users'
   );
   ```
   Should return `true`

2. **Check if user exists:**
   ```sql
   SELECT * FROM users WHERE "uniqueId" = 'STU001';
   ```
   Should return one row

3. **Check table structure:**
   ```sql
   \d users
   ```
   (In psql) or
   ```sql
   SELECT column_name FROM information_schema.columns 
   WHERE table_name = 'users';
   ```

### Getting Database Error Instead?

If you get `"relation \"users\" does not exist"` error:
- Table definitely doesn't exist
- Run the CREATE TABLE script above

### API Working But No Users?

If API works but returns "User not found":
- Table exists ✅
- But no user with that uniqueId
- Add user using INSERT statement

## Add More Users

To add more test users:

```sql
INSERT INTO users ("uniqueId", "fullName", email, phone, "isRegistered")
VALUES 
  ('STU002', 'John Doe', 'john@example.com', '+1234567891', false),
  ('STU003', 'Jane Smith', 'jane@example.com', '+1234567892', false)
ON CONFLICT ("uniqueId") DO NOTHING;
```

## Full SQL Script

See `migrations/check-and-fix-production.sql` for complete script with all checks and fixes.

