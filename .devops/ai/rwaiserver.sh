#!/bin/bash

# Stop executing on error
set -e

# Initialize default values for variables
debug=0
push=0
project="ai"
tag=""

# Parse command line arguments
while [[ "$#" -gt 0 ]]; do
    case $1 in
        --debug) debug=1 ;;
        --push) push=1 ;;
        --project=*|--project)
            if [[ "$1" == "--project="* ]]; then
                project="${1#*=}"
            else
                shift
                project="$1"
            fi
            ;;
        -p=*|-p)
            if [[ "$1" == "-p="* ]]; then
                project="${1#*=}"
            else
                shift
                project="$1"
            fi
            ;;
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

echo "RealWear Conductor Build"
echo "Debug: $debug"
echo "Project: $project"
echo "Tag: $tag"
echo "Push: $push"

# Generate a build tag from the current timestamp in minutes
DATE_TAG=$(date +%s)

docker build --platform linux/amd64 -f .devops/ai/Dockerfile.web --build-arg="FRONTEND_PROJECT=${project}" -t rwtai .

# If the script contains a --debug flag then build with foo tag and just run...
if [[ "$debug" -eq 1 ]]; then
  docker run --init -it -p 3330:3333 --env-file .localConfigs rwtai
  exit 0
fi

REPO=realwearai.azurecr.io/${project}

# If the script conatins a --push flag then ...
if [[ "$push" -eq 1 ]]; then
  # ... push the dev image to the Azure Container Registry
  docker tag rwtai $REPO:$DATE_TAG
  docker push $REPO:$DATE_TAG

  # If there is a BUILD_ID environment variable then tag the build with the build id
  if [ ! -z "$BUILD_ID" ]; then
    echo "Tagging as $REPO:$BUILD_ID"
    docker tag rwtai $REPO:$BUILD_ID
    docker push $REPO:$BUILD_ID
  fi
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
