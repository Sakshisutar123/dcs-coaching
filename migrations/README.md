# Database Migrations

This folder contains database migration files for the My School Hub backend.

## Migration Files

### Sequelize Migrations (JavaScript)
- `20240101000000-create-users-table.js` - Creates the initial users table
- `20240101000001-update-users-table-remove-role.js` - Removes role column and adds new columns

### SQL Migrations (for pgAdmin)
- `update-users-table.sql` - SQL script to update existing table
- `verify-users-table.sql` - SQL script to verify table structure

## Running Migrations

### Option 1: Using Sequelize CLI (Recommended)
```bash
npx sequelize-cli db:migrate
```

### Option 2: Manual SQL (pgAdmin)
1. Open pgAdmin
2. Connect to your database
3. Open Query Tool
4. Run `migrations/update-users-table.sql`

## Migration Status

Check which migrations have been executed:
```bash
npx sequelize-cli db:migrate:status
```

## Rollback Migrations

To rollback the last migration:
```bash
npx sequelize-cli db:migrate:undo
```

To rollback all migrations:
```bash
npx sequelize-cli db:migrate:undo:all
```

## Table Structure

The users table should have these columns:
- `id` (uuid, primary key)
- `uniqueId` (string, unique, not null)
- `fullName` (string, not null)
- `email` (string)
- `phone` (string)
- `passwordHash` (string)
- `otp` (string)
- `otpExpiry` (timestamp)
- `isRegistered` (boolean, default false)
- `registration_type` (string)
- `qualification` (string)
- `college_name` (string)
- `createdAt` (timestamp)
- `updatedAt` (timestamp)

## Notes

- Migrations are executed in alphabetical order
- Each migration file should export `up` and `down` functions
- The `SequelizeMeta` table tracks executed migrations
- Always backup your database before running migrations in production

## Troubleshooting

### Error: "Error reading database.js"
- Make sure `src/config/database.config.js` exists
- Check that `.sequelizerc` points to the correct config file

### Error: "Cannot find module"
- Make sure you're running migrations from the project root
- Check that `node_modules` is installed (`npm install`)

