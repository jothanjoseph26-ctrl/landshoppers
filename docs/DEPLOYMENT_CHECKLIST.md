# Deployment checklist (GitHub Actions → AWS ECS)

Use this when **CI** or **Deploy to AWS** fails.

## 1. GitHub repository secrets

| Secret | Required for | Notes |
|--------|----------------|-------|
| `AWS_ACCESS_KEY_ID` | Deploy (recommended) | IAM user with ECR push + ECS deploy policy |
| `AWS_SECRET_ACCESS_KEY` | Deploy (recommended) | Pair with access key above |
| `NEXT_PUBLIC_MAPBOX_TOKEN` | Web Docker build | Optional; Dockerfile defaults to `pk.placeholder` |

If **both** `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` are set, deploy uses static keys.

If they are **empty**, deploy uses **OIDC** and role `github-actions-landshoppers` (see §2).

## 2. OIDC (when not using access keys)

1. In `infra/terraform/terraform.tfvars` set:
   - `github_org = "propertycitycomng-dotcom"`
   - `github_repo = "landshoppers"`
2. Run `terraform apply` in `infra/terraform`.
3. Trust policy must allow `repo:propertycitycomng-dotcom/landshoppers:*` (updated in `iam.tf`).

## 3. Workflows

| Workflow | Trigger | Purpose |
|----------|---------|---------|
| **CI** | Push/PR to `main` | Lint, migrate test DB, build |
| **Deploy to AWS** | Push to `main` or **Run workflow** | Build images, push ECR, ECS rollout |

CI and Deploy run **independently** — a green deploy does not require green CI, but fix CI before relying on app quality.

## 4. Typical failure stages

| Step fails | Likely cause |
|------------|----------------|
| Configure AWS credentials | Missing secrets **and** OIDC role/trust mismatch |
| Verify AWS identity | Credentials invalid or expired |
| Build and push * image | Dockerfile/build error — read log **above** `exit code 1` |
| Run database migrations | ECS task `landshoppers-migrate` or subnets/SG wrong |
| Deploy * / `services-stable` | Task health checks, env vars, or image crash |

## 5. Manual retry

Actions → **Deploy to AWS** → **Run workflow** → branch `main`.

## 6. Rotate exposed keys

If an access key was ever committed to git, **delete it in IAM** and create a new pair, then update GitHub secrets.
