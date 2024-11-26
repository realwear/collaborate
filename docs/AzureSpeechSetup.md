# Setting up Azure Speech Services

For the RealWear AI Demos, a valid [Azure AI Speech Service](https://azure.microsoft.com/en-us/products/ai-services/ai-speech) is required. This is setup in your Microsoft Azure account and is used by the front end application to handle speech-to-text (dictation) and text-to-speech.

# Using the Azure CLI

```bash

export REALWEAR_RESOURCE_GROUP_NAME="[REPLACE WITH RESOURCE NAME]"
export REALWEAR_SPEECH_DEPLOYMENT_NAME="[REPLACE WITH DEPLOYMENT NAME]"
export REALWEAR_LOCATION="[REPLACE WITH REGION]"

az group create \
--name $REALWEAR_RESOURCE_GROUP_NAME \
--location $REALWEAR_LOCATION

az cognitiveservices account create \
--name $REALWEAR_SPEECH_DEPLOYMENT_NAME \
--resource-group $REALWEAR_RESOURCE_GROUP_NAME \
--location $REALWEAR_LOCATION \
--kind SpeechServices \
--sku s0

export REALWEAR_SPEECH_KEY=$(az cognitiveservices account keys list \
--name $REALWEAR_SPEECH_DEPLOYMENT_NAME \
--resource-group $REALWEAR_RESOURCE_GROUP_NAME \
-o tsv --query key1)

echo "======================"
echo "DEPLOYMENT COMPLETE"
echo "For .localConfigs, set AZURE_SPEECH_KEY to \"${REALWEAR_SPEECH_KEY}\" and set AZURE_SPEECH_REGION to \"${REALWEAR_LOCATION}\""
echo "======================"

```

## Cleanup

To cleanup, simply remove the resource group that was created.

> [!WARNING]
> This action is irreversible

```bash
az group delete --name $REALWEAR_RESOURCE_GROUP_NAME
```