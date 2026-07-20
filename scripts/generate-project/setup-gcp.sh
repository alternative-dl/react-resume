#!/usr/bin/env bash
#
# One-time GCP setup for the Monthly Project workflow.
# Creates a service account, grants the roles needed to deploy to Cloud Run
# from source, and wires GitHub Actions -> GCP via Workload Identity Federation
# (so no service-account keys are stored in GitHub).
#
# Run it locally, authenticated as an owner/editor of the project:
#   gcloud auth login
#   REPO="alternative-dl/react-resume" ./setup-gcp.sh
#
set -euo pipefail

PROJECT="${GCP_PROJECT:-leebot-dev}"
REPO="${REPO:?Set REPO to your GitHub owner/repo, e.g. alternative-dl/react-resume}"
SA_NAME="monthly-project"
POOL="github-pool"
PROVIDER="github-provider"

echo "Project: $PROJECT   Repo: $REPO"
PROJECT_NUMBER="$(gcloud projects describe "$PROJECT" --format='value(projectNumber)')"
SA_EMAIL="${SA_NAME}@${PROJECT}.iam.gserviceaccount.com"

echo "==> Enabling APIs"
gcloud services enable \
  run.googleapis.com \
  cloudbuild.googleapis.com \
  artifactregistry.googleapis.com \
  iamcredentials.googleapis.com \
  --project "$PROJECT"

echo "==> Creating service account (idempotent)"
gcloud iam service-accounts create "$SA_NAME" \
  --project "$PROJECT" \
  --display-name "Monthly portfolio project deployer" 2>/dev/null || echo "    already exists"

echo "==> Granting deploy roles"
for ROLE in \
  roles/run.admin \
  roles/iam.serviceAccountUser \
  roles/cloudbuild.builds.editor \
  roles/artifactregistry.admin \
  roles/storage.admin; do
  gcloud projects add-iam-policy-binding "$PROJECT" \
    --member "serviceAccount:${SA_EMAIL}" \
    --role "$ROLE" \
    --condition=None --quiet >/dev/null
  echo "    + $ROLE"
done

echo "==> Creating Workload Identity pool + provider (idempotent)"
gcloud iam workload-identity-pools create "$POOL" \
  --project "$PROJECT" --location global \
  --display-name "GitHub Actions" 2>/dev/null || echo "    pool already exists"

gcloud iam workload-identity-pools providers create-oidc "$PROVIDER" \
  --project "$PROJECT" --location global --workload-identity-pool "$POOL" \
  --display-name "GitHub OIDC" \
  --issuer-uri "https://token.actions.githubusercontent.com" \
  --attribute-mapping "google.subject=assertion.sub,attribute.repository=assertion.repository" \
  --attribute-condition "assertion.repository=='${REPO}'" 2>/dev/null || echo "    provider already exists"

echo "==> Allowing the repo to impersonate the service account"
gcloud iam service-accounts add-iam-policy-binding "$SA_EMAIL" \
  --project "$PROJECT" \
  --role roles/iam.workloadIdentityUser \
  --member "principalSet://iam.googleapis.com/projects/${PROJECT_NUMBER}/locations/global/workloadIdentityPools/${POOL}/attribute.repository/${REPO}" \
  --quiet >/dev/null

PROVIDER_RESOURCE="projects/${PROJECT_NUMBER}/locations/global/workloadIdentityPools/${POOL}/providers/${PROVIDER}"

cat <<EOF

✅ Done. Add these to your GitHub repo (Settings → Secrets and variables → Actions):

  Secret  GCP_WORKLOAD_IDENTITY_PROVIDER = ${PROVIDER_RESOURCE}
  Secret  GCP_SERVICE_ACCOUNT           = ${SA_EMAIL}
  Secret  ANTHROPIC_API_KEY             = <your Anthropic API key>

  (optional) Variable GCP_PROJECT = ${PROJECT}
  (optional) Variable GCP_REGION  = europe-west2
EOF
