#!/bin/bash

set -e

# Call the helpers script
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
. $DIR/helpers.sh

printTitle "Initialising"

# Check that the teamsapp cli is installed
if ! command -v teamsapp &> /dev/null; then
  echo "Teamsapp CLI is not installed. Please install Teamsapp CLI before running this script."
  exit 1
fi

# Verify the FQDN domain name
if [ -z "${FQDN}" ]; then
  echo "FQDN is not set."
  exit 1
fi

# Verify AZURE_CLIENT_ID
if [ -z "${AZURE_CLIENT_ID}" ]; then
  echo "AZURE_CLIENT_ID is not set."
  exit 1
fi

# Check the TEAMS_APP_ID, set it to a new guid if one doesn't exist
if [ -z "${TEAMS_APP_ID}" ]; then
  export TEAMS_APP_ID=$(uuidgen)
fi

if [ -z "${APP_NAME_SUFFIX}" ]; then
  export APP_NAME_SUFFIX=$(echo $FQDN | sha1sum | cut -c1-5)
fi

# If the app name suffix = "prod" then set it to "blank"
if [ "$APP_NAME_SUFFIX" == "prod" ]; then
  export APP_NAME_SUFFIX=""
fi

export BOT_DOMAIN=$FQDN
export WEB_APP_ID=$AZURE_CLIENT_ID

# Create the environment variables file in a temporary filename
export ENV_FILE=$(mktemp)
trap "rm -f $ENV_FILE" EXIT

# Write the environment variables to the file (APP_NAME_SUFFIX, WEB_APP_ID, TEAMS_APP_ID, BOT_DOMAIN)
echo "APP_NAME_SUFFIX=$APP_NAME_SUFFIX" >> $ENV_FILE
echo "WEB_APP_ID=$WEB_APP_ID" >> $ENV_FILE
echo "TEAMS_APP_ID=$TEAMS_APP_ID" >> $ENV_FILE
echo "BOT_DOMAIN=$BOT_DOMAIN" >> $ENV_FILE

echo "==========================="
echo "Packaging Teams App"
echo "APP_NAME_SUFFIX: $APP_NAME_SUFFIX"
echo "AZURE_CLIENT_ID: $WEB_APP_ID"
echo "TEAMS_APP_ID: $TEAMS_APP_ID"
echo "FQDN: $FQDN"
echo "==========================="

teamsapp package --env-file=$ENV_FILE


ZIPFILE=appPackage/build/appPackage.zip
TEMP_DIR=$(mktemp -d)
OUTPUT_ZIP="output.zip"

# Decompress the zip file
unzip "$ZIPFILE" -d "$TEMP_DIR"

# List of JSON files to process
FILES=("es.json" "fr.json" "jp.json" "de.json")
# Perform variable substitutions
for FILE in "${FILES[@]}"; do
  JSON_FILE="$TEMP_DIR/$FILE"
  if [ -f "$JSON_FILE" ]; then
    # Escape $schema to prevent replacement
    sed -i 's/\$schema/__DOLLAR__schema/g' "$JSON_FILE"

    # Use envsubst for variable substitution
    envsubst < "$JSON_FILE" > "$JSON_FILE.tmp" && mv "$JSON_FILE.tmp" "$JSON_FILE"

    # Restore $schema
    sed -i 's/__DOLLAR__schema/\$schema/g' "$JSON_FILE"
  fi
done

# Recompress the files into a new zip file
cd "$TEMP_DIR"
zip -r "$OUTPUT_ZIP" .
mv "$OUTPUT_ZIP" $DIR/../../appPackage/build/appPackage.zip -f
cd ..
rm -rf "$TEMP_DIR"

echo "Recompressed to $OUTPUT_ZIP"
