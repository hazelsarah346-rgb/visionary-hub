# Fix "Repository not found" and push to GitHub

## Why the push failed

`remote: Repository not found` means either:

1. **The repo doesn’t exist on GitHub yet** — you have to create it first, or  
2. **Wrong URL or no access** — typo in URL, or you’re not logged in / don’t have access to that repo.

---

## Step 1 — Create the repo on GitHub (if it doesn’t exist)

1. Go to **[github.com](https://github.com)** and sign in (as **hazelsarah346-rgb**).
2. Click **+** → **New repository**.
3. **Repository name:** `visionary-hub`
4. Choose **Public** (or Private if you prefer).
5. **Do not** add a README, .gitignore, or license (you already have them locally).
6. Click **Create repository**.

---

## Step 2 — Stop tracking the `.claude` folder (optional but recommended)

The last commit added `.claude/worktrees/recursing-jones`, which is another git repo. To stop tracking it and avoid embedding it:

```bash
cd /Users/sarah/visionary-hub
git rm -r --cached .claude 2>/dev/null || true
git add .gitignore
git commit -m "Ignore .claude worktrees and fix gitignore"
```

---

## Step 3 — Push again

```bash
git push -u origin main
```

If your default branch is **master** instead of **main**:

```bash
git push -u origin master
```

If GitHub asks for a password, use a **Personal Access Token** (Settings → Developer settings → Personal access tokens), not your account password.

---

## If the repo name or username is different

Check your remote and fix it:

```bash
git remote -v
# If you need to change the URL (replace with your real username/repo):
git remote set-url origin https://github.com/YOUR_USERNAME/visionary-hub.git
git push -u origin main
```
