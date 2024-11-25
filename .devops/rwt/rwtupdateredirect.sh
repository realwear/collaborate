#!/bin/bash

##################################################
## rwtupdateredirect.sh - Updates the redirect URIs for the RWT application
## James Woodall - 24th July 2024
##
## This script will update the redirect URIs for the RWT EntraID application
## - Add the FQDN to the identifier URIs
## - Add the FQDN to the redirect URIs
##
## Required Variables:
## - WEB_APP_ID - The Azure App Id for the RWT application
## - FQDN - The fully qualified domain name for the RWT application (where the Teams tab will be hosted)
##
##################################################

# If the WEB_APP_ID is not set, exit
if [ -z "${WEB_APP_ID}" ]; then
  echo "WEB_APP_ID is not set. Please set the WEB_APP_ID environment variable."
  exit 1
fi

# If the FQDN is not set, exit
if [ -z "${FQDN}" ]; then
  echo "FQDN is not set. Please set the FQDN environment variable."
  exit 1
fi

AZURE_CLIENT_ID=$(az ad app show --id $WEB_APP_ID --query "appId" -o tsv)

# Get the current identifier uris
IDENTIFIER_URIS=$(az ad app show --id $WEB_APP_ID --query "identifierUris" -o tsv)

# Generate the new identifier uri
NEW_IDENTIFIER_URI="api://${FQDN}/${AZURE_CLIENT_ID}"

# Check if the identifier uri is already set
if [[ $IDENTIFIER_URIS == *"$NEW_IDENTIFIER_URI"* ]]; then
  echo "Identifier URI is already set"
else
  echo "Adding identifier URI - $NEW_IDENTIFIER_URI"

  az ad app update --id $WEB_APP_ID --identifier-uris $IDENTIFIER_URIS $NEW_IDENTIFIER_URI
fi

# Update the redirect URIs
REDIRECT_URIS=$(az ad app show --id $WEB_APP_ID --query "web.redirectUris" -o tsv)

# Generate the new redirect uri
NEW_REDIRECT_URI="https://${FQDN}/tabauth/callback"

# Check if the redirect uri is already set
if [[ $REDIRECT_URIS == *"$NEW_REDIRECT_URI"* ]]; then
  echo "Redirect URI is already set"
else
  echo "Adding redirect URI - $NEW_REDIRECT_URI"

  az ad app update --id $WEB_APP_ID --web-redirect-uris $REDIRECT_URIS $NEW_REDIRECT_URI
fi