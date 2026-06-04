# CI/CD Setup Guide

## What Gets Deployed Automatically

```
You push to main
       │
       ├─► backend/** changed?
       │         │
       │    Lint (Ruff) → Build Docker → Push to GHCR → Deploy to Render
       │
       └─► frontend/** changed?
                 │
            Build check → Build Docker → Push to GHCR → Deploy to Vercel
```

Pull Request flow:
```
You open a PR → Vercel preview URL posted as a comment automatically
```

---

## Step 1 — Add GitHub Secrets

Go to your repo → Settings → Secrets and variables → Actions → New repository secret

Add these secrets:

| Secret Name | Where to get it |
|---|---|
| `GROQ_API_KEY` | console.groq.com |
| `RENDER_DEPLOY_HOOK_URL` | Render dashboard → your service → Settings → Deploy Hook |
| `RENDER_BACKEND_URL` | Your Render service URL e.g. `https://code-review-api.onrender.com` |
| `VERCEL_TOKEN` | vercel.com → Settings → Tokens → Create |
| `REACT_APP_API_URL` | Your Render backend URL (same as above) |

---

## Step 2 — Connect Vercel to GitHub

```bash
# Install Vercel CLI locally once
npm install -g vercel

# Link your frontend folder to Vercel
cd frontend
vercel link
# Follow the prompts — this creates .vercel/project.json
```

Commit the `.vercel/project.json` file — the CI pipeline needs it.

---

## Step 3 — Set up Render with Docker

1. Go to render.com → New → Web Service
2. Connect your GitHub repo
3. Render will auto-detect `render.yaml` at the root
4. Set environment variables in the Render dashboard:
   - `GROQ_API_KEY`
   - `GITHUB_TOKEN` (optional)
5. Copy the **Deploy Hook URL** from Settings → paste it as `RENDER_DEPLOY_HOOK_URL` in GitHub Secrets

---

## Step 4 — Copy files into your project

```
your-repo/
├── .github/
│   └── workflows/
│       ├── backend.yml       ← copy here
│       ├── frontend.yml      ← copy here
│       └── pr-preview.yml    ← copy here
├── backend/
│   └── Dockerfile            ← copy here
├── frontend/
│   ├── Dockerfile            ← copy here
│   └── nginx.conf            ← copy here
├── docker-compose.yml        ← copy here (for local dev)
└── render.yaml               ← copy here (replaces old one)
```

---

## Step 5 — Test locally with Docker

```bash
# Copy your .env values first
cp backend/.env.example .env

# Build and run everything
docker compose up --build

# Backend: http://localhost:8000
# Frontend: http://localhost:3000
```

---

## How Deployments Trigger

| Action | What happens |
|---|---|
| Push to `main` (backend files) | Lint → Docker build → Push to GHCR → Render deploys |
| Push to `main` (frontend files) | Build check → Docker build → Push to GHCR → Vercel deploys |
| Open/update a PR | Vercel preview URL posted as PR comment |
| Push to other branches | Only lint/build check runs (no deploy) |

---

## Checking Deployments

- **GitHub Actions**: github.com/your-repo/actions
- **Render logs**: render.com → your service → Logs
- **Vercel deployments**: vercel.com → your project → Deployments
- **Docker images**: github.com/your-repo/pkgs/container/backend
