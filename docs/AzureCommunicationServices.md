# Setting up Azure Communication Services

In order to join Microsoft Teams meetings, RealWear Collaborate requires a token that is issued by
[Azure Communication Services (ACS)](https://azure.microsoft.com/en-us/products/communication-services).

In our current architecture, the NodeJS server application connects to ACS and when requested, an
anonymous ACS token is generated.

**Note: We are currently not using authenticated tokens, but that may change**

## Using the Azure CLI

To create an ACS instance, you can use the Azure CLI.

1. Make sure you are signed in to the Azure CLI (using `az login`) and are scoped to a valid Azure
   Subscription
2. Replace any variables at the top of the script with suitable values for your deployment

This script will:

- Create a new Resource Group
- Deploy an ACS service to the location of your choice
- Extract the connection string to place in the `ACS_CONNECTION_STRING` environment variable within
  your `.localConfigs` file

```bash

export REALWEAR_RESOURCE_GROUP_NAME="[REPLACE WITH RESOURCE NAME]"
export REALWEAR_ACS_DEPLOYMENT_NAME="[REPLACE WITH DEPLOYMENT NAME]"
export REALWEAR_LOCATION="[REPLACE WITH REGION]"
export REALWEAR_ACS_LOCATION="unitedstates"

az group create \
--name $REALWEAR_RESOURCE_GROUP_NAME \
--location $REALWEAR_LOCATION

az communication create \
--name $REALWEAR_ACS_DEPLOYMENT_NAME \
--resource-group $REALWEAR_RESOURCE_GROUP_NAME \
--data-location $REALWEAR_ACS_LOCATION --location 'global'

export REALWEAR_ACS_CONNECTIONSTRING=$(az communication list-key \
-n $REALWEAR_ACS_DEPLOYMENT_NAME \
-g $REALWEAR_RESOURCE_GROUP_NAME \
--query primaryConnectionString -o tsv)

echo "======================"
echo "DEPLOYMENT COMPLETE"
echo "For .localConfigs, set ACS_CONNECTION_STRING to \"${REALWEAR_ACS_CONNECTIONSTRING}\""
echo "======================"

```

## Cleanup

To cleanup, simply remove the resource group that was created.

> [!WARNING] This action is irreversible

```bash
az group delete --name $REALWEAR_RESOURCE_GROUP_NAME
```
