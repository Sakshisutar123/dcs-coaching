# Deployment Guide - Render.com

## Issue: "relation 'users' does not exist"

This error means the database tables haven't been created in production.

## Solution Options

### Option 1: Run SQL Script (Quickest - Recommended)

1. **Get your Render PostgreSQL connection string:**
   - Go to Render Dashboard → Your PostgreSQL Database
   - Copy the "Internal Database URL" or "External Connection String"

2. **Connect to your database:**
   - Option A: Use Render Shell
     - Go to Render Dashboard → Your PostgreSQL Service
     - Click "Shell" tab
     - Run: `psql $DATABASE_URL`
   
   - Option B: Use pgAdmin
     - Add new server with your Render database credentials
     - Connect to the database

3. **Run the SQL script:**
   ```sql
   -- Copy and paste the entire content of:
   -- migrations/create-users-table-production.sql
   ```

4. **Verify:**
   ```sql
   SELECT * FROM users LIMIT 1;
   ```

### Option 2: Run Migrations via Render Shell

1. **Connect to Render Shell:**
   - Go to Render Dashboard → Your Web Service
   - Click "Shell" tab

2. **Run migrations:**
   ```bash
   npx sequelize-cli db:migrate --env production
   ```

   **Note:** Make sure `DATABASE_URL` is set in your Render environment variables.

### Option 3: Auto-Create Tables on Startup (Development Only)

**⚠️ Warning: Only use this for development/testing, not production!**

1. **Add environment variable in Render:**
   - Key: `SYNC_DB`
   - Value: `true`

2. **Restart your service**

This will automatically create tables when the app starts, but it's not recommended for production.

### Option 4: Add Migration to Build Script

Add to your `package.json`:

```json
{
  "scripts": {
    "build": "npm install",
    "start": "npx sequelize-cli db:migrate && node src/server.js"
  }
}
```

Then in Render, set:
- **Build Command:** `npm run build`
- **Start Command:** `npm start`

## Recommended Approach for Production

**Use Option 1 (SQL Script)** - It's the safest and most reliable:

1. Run the SQL script once to create tables
2. Never use `sequelize.sync()` in production
3. Always use migrations for schema changes

## Environment Variables in Render

Make sure these are set in your Render Web Service:

- `DATABASE_URL` - Your PostgreSQL connection string
- `JWT_SECRET` - Your JWT secret key
- `MAIL_USER` - Your Gmail address
- `MAIL_PASS` - Your Gmail App Password
- `PORT` - Usually set automatically by Render
- `NODE_ENV` - Set to `production`

## Verify Database Connection

After creating tables, test your API:

```bash
POST https://dcs-coaching.onrender.com/api/auth/check-user
{
  "uniqueId": "STU001"
}
```

Should return either:
- `{"message": "User not found"}` - Table exists, user doesn't
- `{"message": "Server error", "error": "relation \"users\" does not exist"}` - Table still missing

## Troubleshooting

### Error: "relation 'users' does not exist"
- **Cause:** Tables not created in production database
- **Fix:** Run the SQL script (Option 1)

### Error: "Cannot connect to database"
- **Cause:** Wrong DATABASE_URL or network issue
- **Fix:** Check Render database connection string

### Error: "Migration failed"
- **Cause:** Migration already run or connection issue
- **Fix:** Check migration status: `npx sequelize-cli db:migrate:status`

