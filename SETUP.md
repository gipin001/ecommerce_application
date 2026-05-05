# Local DevOps Pipeline — Setup Guide

## What you get
| Tool | URL | Purpose |
|------|-----|---------|
| App (frontend) | http://localhost:3000 | Your Next.js store |
| App (backend)  | http://localhost:5000 | Express API |
| Jenkins | http://localhost:8080 | CI/CD pipelines |
| SonarQube | http://localhost:9000 | Code quality scanner |

---

## Prerequisites (install once)

```bash
# 1. Docker Desktop (or Docker Engine + Compose)
#    https://docs.docker.com/get-docker/

# 2. Git
git --version   # should print 2.x

# 3. GitHub CLI (for repo push)
#    https://cli.github.com/
gh --version
```

---

## Step 1 — Initialize Git and push code

```bash
cd /home/georgegipin/workfolder/ecommerce

# Init git (local scope — won't affect other repos)
git init
git config user.name  "Your Name"
git config user.email "your@email.com"

# Stage everything (secrets are in .gitignore — safe)
git add .
git commit -m "feat: initial commit with full devops pipeline"

# Connect to GitHub repo
git remote add origin https://github.com/gipin001/ecommerce_application.git
git branch -M main
git push -u origin main
```

---

## Step 2 — Start the DevOps infrastructure (Jenkins + SonarQube)

```bash
cd /home/georgegipin/workfolder/ecommerce

# Start Jenkins + SonarQube (runs in background)
docker-compose -f docker-compose.infra.yml up -d

# Wait ~2 minutes for SonarQube to fully start, then check:
docker-compose -f docker-compose.infra.yml ps
```

---

## Step 3 — Unlock Jenkins (first time only)

1. Open http://localhost:8080
2. Get the unlock password:
   ```bash
   docker exec jenkins cat /var/jenkins_home/secrets/initialAdminPassword
   ```
3. Paste it in the browser → click **Install suggested plugins**
4. Create your admin user (remember the username/password)
5. Jenkins URL → keep as `http://localhost:8080` → Save

---

## Step 4 — Install extra Jenkins plugins

In Jenkins → **Manage Jenkins → Plugins → Available**:
Search and install these (then restart):
- `Pipeline`  (usually pre-installed)
- `Git`       (usually pre-installed)
- `Docker Pipeline`
- `Blue Ocean`  (optional — nicer UI)

---

## Step 5 — Configure SonarQube

1. Open http://localhost:9000
2. Login: `admin` / `admin` → it will ask you to change password
3. Go to **My Account → Security → Generate Token**
   - Name: `jenkins-token`
   - Click **Generate** → **copy the token** (shown only once)

---

## Step 6 — Add SonarQube token to Jenkins

1. Jenkins → **Manage Jenkins → Credentials → Global → Add Credentials**
2. Kind: `Secret text`
3. Secret: *(paste the token from Step 5)*
4. ID: `sonar-token`   ← must match exactly what's in Jenkinsfile
5. Save

---

## Step 7 — Create the Jenkins Pipeline job

1. Jenkins → **New Item**
2. Name: `ecommerce-pipeline`
3. Type: **Pipeline** → OK
4. Scroll to **Pipeline** section:
   - Definition: `Pipeline script from SCM`
   - SCM: `Git`
   - Repository URL: `https://github.com/gipin001/ecommerce_application.git`
   - Branch: `*/main`
   - Script Path: `Jenkinsfile`
5. **Save**

---

## Step 8 — Set up GitHub Webhook (auto-trigger Jenkins on push)

1. Go to your GitHub repo → **Settings → Webhooks → Add webhook**
2. Payload URL: `http://<your-local-ip>:8080/github-webhook/`
   ```bash
   # Get your local IP:
   hostname -I | awk '{print $1}'
   ```
3. Content type: `application/json`
4. Events: **Just the push event**
5. Save

> Note: GitHub webhook requires your machine to be reachable from the internet.
> For local-only use, just click **Build Now** in Jenkins manually, or use ngrok:
> `ngrok http 8080` → use the ngrok URL as the webhook payload URL.

---

## Step 9 — Start the app stack

```bash
cd /home/georgegipin/workfolder/ecommerce

# Start PostgreSQL + Backend + Frontend
docker-compose up -d --build

# Run database migrations (first time only)
docker exec ecom_backend node src/config/migrate.js

# Seed sample data (optional)
docker exec ecom_backend node src/config/seed.js
```

Visit http://localhost:3000 — your store is live.

---

## Daily workflow (after setup)

```bash
# Make code changes, then:
git add .
git commit -m "feat: your change"
git push origin main

# Jenkins auto-triggers (if webhook set up), or click Build Now
# Pipeline runs: install → lint → test → sonar → build → deploy
# Watch it at: http://localhost:8080
# Code quality: http://localhost:9000
```

---

## Useful commands

```bash
# See all running containers
docker ps

# View Jenkins logs
docker logs -f jenkins

# View SonarQube logs
docker logs -f sonarqube

# View app logs
docker logs -f ecom_backend
docker logs -f ecom_frontend

# Stop everything
docker-compose down
docker-compose -f docker-compose.infra.yml down

# Full reset (WARNING: deletes all data)
docker-compose down -v
docker-compose -f docker-compose.infra.yml down -v
```
