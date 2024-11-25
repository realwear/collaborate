#!/bin/bash

# Stop executing on error
set -e

# Initialize default values for variables
debug=0
push=0
tag=""

# Parse command line arguments
while [[ "$#" -gt 0 ]]; do
    case $1 in
        --debug) debug=1 ;;
        --push) push=1 ;;
        --tag=*)
            tag="${1#*=}"
            ;;
        -t=*)
            tag="${1#*=}"
            ;;
        *) echo "Unknown parameter: $1"; exit 1 ;;
    esac
    shift
done

echo "RealWear For Teams Build"
echo "Debug: $debug"
echo "Tag: $tag"
echo "Push: $push"

# Generate a build tag from the current timestamp in minutes
DATE_TAG=$(date +%s)

REPO=realweart.azurecr.io/rwt

DOCKER_BUILDKIT=1 docker build --platform linux/amd64 -f .devops/rwt/Dockerfile.web -t $REPO:$DATE_TAG .

# If the script contains a --debug flag and exit
if [[ "$debug" -eq 1 ]]; then
  docker tag $REPO:$DATE_TAG rwt:debug
fi

# If the script conatins a --push flag then ...
if [[ "$push" -eq 1 ]]; then
  # ... push the image to the Azure Container Registry
  docker push $REPO:$DATE_TAG
fi

# If the script contains a --tag flag then tag the build
if [ ! -z "$tag" ]; then

  echo "Tagging $REPO:$DATE_TAG as $REPO:$tag"

  docker tag $REPO:$DATE_TAG $REPO:$tag

  # If the script contains a --push flag then ...
  if [[ "$push" -eq 1 ]]; then

    # ... push the dev image to the Azure Container Registry
    docker push $REPO:$tag
  fi
fi
