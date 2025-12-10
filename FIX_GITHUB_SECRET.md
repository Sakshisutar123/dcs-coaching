# Fix GitHub Secret Detection Error

## Problem
GitHub detected a Brevo API key in your `.env` file and blocked the push to protect your secrets.

## Solution: Remove Secret from Git History

### Option 1: Remove .env from Last Commit (Recommended)

If you just committed `.env` and haven't pushed yet:

```bash
# Remove .env from git tracking
git rm --cached .env

# Amend the last commit
git commit --amend --no-edit

# Force push (if you have permission)
git push --force-with-lease origin main
```

### Option 2: Remove Secret from Specific Commit

Since GitHub detected it in commit `73f5cfb`:

```bash
# Remove .env from that commit
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch .env" \
  --prune-empty --tag-name-filter cat -- --all

# Force push
git push --force-with-lease origin main
```

### Option 3: Use BFG Repo-Cleaner (Easier)

1. Download BFG: https://rtyley.github.io/bfg-repo-cleaner/
2. Run:
```bash
java -jar bfg.jar --delete-files .env
git reflog expire --expire=now --all
git gc --prune=now --aggressive
git push --force
```

### Option 4: Reset and Recommit (Simplest if Recent)

If the commit with the secret is recent:

```bash
# Reset to before the commit with secret
git reset --hard 500afc7

# Remove .env from staging
git rm --cached .env

# Make sure .env is in .gitignore (already done)
# Re-commit your changes WITHOUT .env
git add .
git commit -m "Update to use Brevo, remove .env from git"

# Push
git push origin main
```

## Steps to Fix

### Step 1: Ensure .env is in .gitignore

✅ Already done - `.gitignore` file created with `.env` listed

### Step 2: Remove .env from Git Tracking

```bash
git rm --cached .env
```

### Step 3: Remove from Git History

Choose one of the options above. **Option 4 is simplest** if you can reset.

### Step 4: Create .env.example (Template)

✅ Already done - `.env.example` file created

### Step 5: Update Your .env File

Make sure your local `.env` file has the actual secrets (this stays local, never committed):

```env
BREVO_API_KEY=your-actual-api-key
MAIL_FROM=noreply@yourdomain.com
MAIL_FROM_NAME=DCS Coaching
```

### Step 6: Commit and Push

```bash
git add .gitignore .env.example
git commit -m "Add .gitignore and .env.example, remove .env from git"
git push origin main
```

## Important: Rotate Your API Key

Since the API key was exposed in git history:

1. **Go to Brevo Dashboard**
2. **Delete the exposed API key**
3. **Create a new API key**
4. **Update in:**
   - Your local `.env` file
   - Render environment variables

## Quick Fix (Recommended)

If you want the simplest solution:

```bash
# 1. Remove .env from git
git rm --cached .env

# 2. Reset to before the bad commit
git reset --hard 500afc7

# 3. Add .gitignore and .env.example
git add .gitignore .env.example

# 4. Re-commit your code changes (without .env)
git add src/ package.json
git commit -m "Switch to Brevo email service"

# 5. Push
git push origin main
```

## After Fixing

1. ✅ `.env` is in `.gitignore` (won't be committed again)
2. ✅ `.env.example` shows what variables are needed
3. ✅ Secrets removed from git history
4. ✅ New API key created (old one was exposed)
5. ✅ Updated in Render environment variables

## Prevent Future Issues

- ✅ Always check `.gitignore` before committing
- ✅ Use `.env.example` as a template
- ✅ Never commit `.env` files
- ✅ Use GitHub Secrets for CI/CD if needed

