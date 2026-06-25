#!/usr/bin/env bash
# Vercel Ignored Build Step — exit 0 skips the build, exit 1 proceeds.
# Production deploys run from GitHub Actions after semantic-release.
# Preview deployments (PRs and non-production) still build on Vercel.

set -euo pipefail

if [ "${VERCEL_ENV:-}" != "production" ]; then
  exit 1
fi

echo "Skipping git-triggered production build — production is deployed from GitHub Actions."
exit 0
