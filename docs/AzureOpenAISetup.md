# Setting up Azure OpenAI Service

For the RealWear AI Demos, a valid [Azure OpenAI Service](https://azure.microsoft.com/en-us/products/ai-services/openai-service) is required. This is setup in your Microsoft Azure account and is used by the NodeJS application to handle GPT3.5 and GPT4.0 requests.

## Using the Azure CLI

You can use the Azure CLI to automate the deployment. Here is a bash script for the deployment. Make sure:

1. You are signed in to Azure CLI (using `az login`) to a valid Microsoft Azure subscription
2. You replace the variables at the top of the script with suitable values for your deployment

This script will:
- Create a new Resource Group in the scoped Azure subscription
- Deploy a new Azure OpenAI Service
- Deploy 2 models, GPT 3.5 and GPT 4o
- Print out the values required for the `.localConfigs` file:
  - `AZURE_OPENAI_ENDPOINT`
  - `AZURE_OPENAI_KEY`

Copy these values when the script completes in your `.localConfigs` file.

```bash

export RESOURCE_GROUP_NAME="[REPLACE WITH RESOURCE NAME]"
export OPENAI_DEPLOYMENT_NAME="[REPLACE WITH DEPLOYMENT NAME]"
export LOCATION="[REPLACE WITH REGION]"

az group create \
--name $RESOURCE_GROUP_NAME \
--location $LOCATION

az cognitiveservices account create \
--name $OPENAI_DEPLOYMENT_NAME \
--resource-group $RESOURCE_GROUP_NAME \
--location $LOCATION \
--kind OpenAI \
--sku s0

# Fetch the endpoint where the service is deployed (usually https://[region].api.cognitive.microsoft.com)
export OPENAI_ENDPOINT=$(az cognitiveservices account show \
--name $OPENAI_DEPLOYMENT_NAME \
--resource-group $RESOURCE_GROUP_NAME \
-o tsv --query properties.endpoint)

# Fetch the primary key for the deployment (key1)
export OPENAI_PRIMARY_KEY=$(az cognitiveservices account keys list \
--name $OPENAI_DEPLOYMENT_NAME \
--resource-group $RESOURCE_GROUP_NAME \
-o tsv --query key1)

# Deploy the GPT3.5 model
az cognitiveservices account deployment create \
--name $OPENAI_DEPLOYMENT_NAME \
--resource-group $RESOURCE_GROUP_NAME \
--deployment-name 35 \
--model-name gpt-35-turbo \
--model-version "0125" \
--model-format OpenAI \
--sku-capacity "1" \
--sku-name "Standard"

# Deploy the GPT4o model
az cognitiveservices account deployment create \
--name $OPENAI_DEPLOYMENT_NAME \
--resource-group $RESOURCE_GROUP_NAME \
--deployment-name 4o \
--model-name gpt-4o \
--model-version 2024-08-06 \
--model-format OpenAI \
--sku-capacity "1" \
--sku-name "Standard"

echo "======================"
echo "DEPLOYMENT COMPLETE"
echo "For .localConfigs, set AZURE_OPENAI_ENDPOINT to ${OPENAI_ENDPOINT} and set AZURE_OPENAI_KEY to \"${OPENAI_PRIMARY_KEY}\""
echo "======================"

```