#!/bin/bash

set -e

# Check the SITE_URL is set
if [ -z "$SITE_URL" ]; then
  echo "SITE_URL is not set. Exiting."
  exit 1
fi

if [ -z "$DATADOG_CLIENT_TOKEN" ]; then
  echo "Datadog client token is not set"
  DATADOG_CLIENT_TOKEN="null"
fi

# Volume mapping for the build /android/apps/rwt/app/build/outputs/apk/

# Build the docker image
DOCKER_BUILDKIT=1 docker build --platform linux/amd64 -f ./.devops/rwt/Dockerfile.android -t rwtapk .

mkdir -p dist/android/{build,test_results}

# Run the docker image
docker run --rm \
  -v ./dist/android/build/:/workspace/app/build/outputs/apk/ \
  -v ./dist/android/test_results/:/workspace/app/build/test-results/ \
  -e SITE_URL=$SITE_URL \
  -e DATADOG_CLIENT_TOKEN=$DATADOG_CLIENT_TOKEN \
  rwtapk
