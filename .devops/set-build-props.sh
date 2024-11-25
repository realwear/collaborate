#!/bin/bash

# Stop executing on error
set -e

# Enable globstar for the current shell session
shopt -s globstar

PROJECT="ng"

# Parse command line arguments for -p or --project
for arg in "$@"; do
    case $arg in
        -p=*|--project=*) PROJECT="${arg#*=}" ;;
        -p|--project)
            PROJECT="$2"
            shift # Move past the argument value
            ;;
    esac
    shift # Move to next argument
done

echo $PROJECT

# Get the git commit hash
GIT_COMMIT="$(git rev-parse --short HEAD)"

# Get the git tag or branch name
GIT_TAG="$(git describe --tags --exact-match 2>/dev/null || git rev-parse --abbrev-ref HEAD)"

# Get the current date in UTC
DATE="$(date -u +"%Y-%m-%dT%H:%M:%SZ")"

echo $GIT_COMMIT
echo $GIT_TAG
echo $DATE

# Find and replace in the main.*.js file within /dist/apps/real365/ the word "Development Build"
# And output in this format: Commit: ${BUILD_COMMIT}, Branch: ${BUILD_BRANCH}, Date: ${BUILD_DATE}
# sed -i "s|Development Build|${GIT_TAG}@${GIT_COMMIT} - ${DATE}|g" dist/apps/${PROJECT}/**/main.*.js
find dist/apps/${PROJECT} -type f -name "main.*.js" -exec sed -i "s|Development Build|${GIT_TAG}@${GIT_COMMIT} - ${DATE}|g" {} +

# For each js, css, html, and svg file in /dist/apps/real365/ pre-create a gzip file
for f in dist/apps/${PROJECT}/**/*.{js,css,html,svg}; do

    # If the file exists
    if [ -f $f ]; then

        echo "Creating gzip file for ${f}"

        # Create a gzip file
        cat $f | gzip > "${f}.gz"

    fi

done;