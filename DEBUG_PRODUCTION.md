# Debug Production "User not found" Error

## Step 1: Check Database Status

**Use the new diagnostic endpoint:**

```bash
GET https://dcs-coaching.onrender.com/api/auth/db-status
```

This will tell you:
- ✅ If database is connected
- ✅ If `users` table exists
- ✅ How many users are in the database
- ✅ Sample users (if any)
- ✅ Table structure

**Expected Response if table exists:**
```json
{
  "status": "connected",
  "database": {
    "connected": true,
    "tableExists": true,
    "userCount": 0,
    "sampleUsers": [],
    "tableStructure": [...]
  },
  "recommendations": [
    "Table exists but no users found",
    "Add a user: INSERT INTO users..."
  ]
}
```

**Expected Response if table doesn't exist:**
```json
{
  "status": "connected",
  "database": {
    "connected": true,
    "tableExists": false,
    "userCount": 0
  },
  "recommendations": [
    "Run: CREATE TABLE users (...)",
    "Or set SYNC_DB=true in environment variables"
  ]
}
```

## Step 2: Based on Diagnostic Results

### If Table Doesn't Exist:

**Option A: Enable Auto-Sync (Quickest)**
1. Render Dashboard → Your Web Service → Environment
2. Add: `SYNC_DB=true`
3. Save and redeploy
4. Check logs for: `✅ Database tables synced`

**Option B: Run SQL Script**
1. Render Dashboard → PostgreSQL → Shell
2. Run SQL from `migrations/check-and-fix-production.sql`

### If Table Exists But No Users:

**Add a test user:**
```sql
INSERT INTO users ("uniqueId", "fullName", email, phone, "isRegistered")
VALUES ('STU001', 'Test User', 'test@example.com', '+1234567890', false);
```

### If Table Exists and Has Users:

Check the `sampleUsers` array in the response to see what `uniqueId` values exist.

## Step 3: Verify Fix

After fixing, test again:

```bash
GET https://dcs-coaching.onrender.com/api/auth/db-status
```

Should show:
- `tableExists: true`
- `userCount: 1` (or more)
- `sampleUsers` with at least one user

Then test the API:
```bash
POST https://dcs-coaching.onrender.com/api/auth/check-user
{
  "uniqueId": "STU001"
}
```

## Common Issues

### Issue 1: Table Doesn't Exist
**Symptom:** `tableExists: false` in db-status response
**Fix:** Run CREATE TABLE SQL or enable SYNC_DB

### Issue 2: Table Exists But Empty
**Symptom:** `userCount: 0` in db-status response
**Fix:** Add user with INSERT statement

### Issue 3: Wrong uniqueId
**Symptom:** `userCount > 0` but user not found
**Fix:** Check `sampleUsers` to see what uniqueId values exist

### Issue 4: Database Not Connected
**Symptom:** `connected: false` in db-status response
**Fix:** Check DATABASE_URL in Render environment variables

## Quick SQL to Fix Everything

Run this complete script in Render PostgreSQL Shell:

```sql
-- 1. Create table
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

-- 2. Create index
CREATE INDEX IF NOT EXISTS idx_users_uniqueId ON users("uniqueId");

-- 3. Add test user
INSERT INTO users ("uniqueId", "fullName", email, phone, "isRegistered")
VALUES ('STU001', 'Test User', 'test@example.com', '+1234567890', false)
ON CONFLICT ("uniqueId") DO NOTHING;

-- 4. Verify
SELECT "uniqueId", "fullName", email FROM users;
```

## Next Steps

1. **Run diagnostic:** `GET /api/auth/db-status`
2. **Check the response** to see what's missing
3. **Fix based on recommendations** in the response
4. **Test again** with check-user endpoint

