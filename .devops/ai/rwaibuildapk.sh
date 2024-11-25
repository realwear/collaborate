#!/bin/bash

set -e

# Check the SITE_URL is set
if [ -z "$SITE_URL" ]; then
  echo "SITE_URL is not set. Exiting."
  exit 1
fi

# Volume mapping for the build /android/apps/ai/app/build/outputs/apk/

# Build the docker image
DOCKER_BUILDKIT=1 docker build --platform linux/amd64 -f ./.devops/ai/Dockerfile.android -t rwaiapk .

mkdir -p dist/android/{build,test_results}

# Run the docker image
docker run --rm \
  -v ./dist/android/build/:/workspace/app/build/outputs/apk/ \
  -v ./dist/android/test_results/:/workspace/app/build/test-results/ \
  -e SITE_URL=$SITE_URL rwaiapk
