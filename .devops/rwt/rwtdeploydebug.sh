#!/bin/bash

set -e

##################################################
## rwtdeploydebug.sh - Deploys the RWT Helm chart into a debug namespace (can be run on AKS or Minikube)
## James Woodall - 24th July 2024
## Updated to set use-forwarded-for config on minikube ingress and NAMESPACE variable - 26th July 2024
## Added AZURE_TENANT_ID variable - 30th July 2024
##
## You must have a working Helm installation to use this script
##
## This script will deploy the RWT Helm chart into a debug namespace
## - Install the Redis Helm chart
## - Install the RWT Helm chart
## - Test the RWT Helm chart
##
## Suggested Variables:
## - KUBE_CONTEXT - The context of the AKS cluster to install cert-manager into (defaults to minikube)
## - AZURE_CLIENT_ID - The Azure client id for the RWT application
## - AZURE_CLIENT_SECRET - The Azure client secret for the RWT application
## - VALUES_FILE - The path to a values file to override the default values (optional, will be appended to the helm install)
## - NAMESPACE - The namespace to install the RWT Helm chart into (defaults to debug)
##
##################################################

# Call the helpers script
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
. $DIR/helpers.sh

# Variables
RELEASE_NAME=rwtdebug
CHART_NAME=charts/rwt
EXPOSED_PORT=4200
REDIS_RELEASE_NAME=redis
NAMESPACE=${NAMESPACE:-debug}
KUBE_CONTEXT=${KUBE_CONTEXT:-minikube}
AZURE_TENANT_ID=${AZURE_TENANT_ID:-"organizations"}

# Ingest the .localconfigs file into environment variables
source .localConfigs

printTitle "Deploying RWT Helm Chart"
echo "Namespace: $NAMESPACE"
echo "Kube Context: $KUBE_CONTEXT"
echo "Azure Tenant ID: $AZURE_TENANT_ID"
echo "Azure Client ID: $AZURE_CLIENT_ID"

# Check that helm is installed
if ! command -v helm &> /dev/null; then
  echo "Helm is not installed. Please install Helm before running this script."
  exit 1
fi

# Check that the current KUBE_CONTEXT is set within the $KUBECONFIG
if ! kubectl config get-contexts --no-headers | grep -q $KUBE_CONTEXT; then
  echo "KUBE_CONTEXT '$KUBE_CONTEXT' not found in $KUBECONFIG."
  return
fi

#If the KUBE_CONTEXT is set to minikube, set the docker environment variables
if [ "$KUBE_CONTEXT" == "minikube" ]; then
  eval $(minikube -p minikube docker-env)

  printTitle "Checking for Minikube Ingress Addon"

  # Make sure the ingress is installed, if it doesn't exist, fail gracefully
  if kubectl get namespace ingress-nginx --context $KUBE_CONTEXT &> /dev/null; then
    echo "Minikube addon 'ingress' is installed."

    value=$(kubectl get configmap ingress-nginx-controller --context $KUBE_CONTEXT -n ingress-nginx -o jsonpath="{.data.use-forwarded-headers}")

    if [ "$value" == "true" ]; then
      echo "Ingress controller is already patched to use forwarded headers."
    else

      echo "Patching the ingress controller to use forwarded headers..."

      # Patch the ingress controller to use forwarded headers
      kubectl patch configmap ingress-nginx-controller --context $KUBE_CONTEXT -n ingress-nginx --patch '{"data":{"use-forwarded-headers":"true"}}'

      # Restart the ingress controller to apply the changes
      kubectl rollout restart deployment ingress-nginx-controller --context $KUBE_CONTEXT -n ingress-nginx
      kubectl rollout status deployment ingress-nginx-controller --context $KUBE_CONTEXT -n ingress-nginx
    fi
  else
    echo "Minikube addon 'ingress' is not installed."
    exit 1
  fi
fi

printTitle "Installing Redis"

# Install the Redis Helm chart (it will fail gracefully if it already exists)
if helm status "$REDIS_RELEASE_NAME" --kube-context "$KUBE_CONTEXT" --namespace "$NAMESPACE" &> /dev/null; then
  echo "Helm release '$REDIS_RELEASE_NAME' is already installed."
else
  echo "Helm release '$REDIS_RELEASE_NAME' is not installed. Installing now..."
  helm install "$REDIS_RELEASE_NAME" oci://registry-1.docker.io/bitnamicharts/redis --kube-context "$KUBE_CONTEXT" --create-namespace --namespace "$NAMESPACE" --wait
  if [ $? -eq 0 ]; then
    echo "Helm release '$REDIS_RELEASE_NAME' installed successfully."
  else
    echo "Failed to install Helm release '$REDIS_RELEASE_NAME'."
    exit 1
  fi
fi

REDIS_PASSWORD=$(kubectl get secret --context $KUBE_CONTEXT --namespace $NAMESPACE $REDIS_RELEASE_NAME -o jsonpath="{.data.redis-password}" | base64 -d)
REDIS_CONNECTIONSTRING="redis://:${REDIS_PASSWORD}@$REDIS_RELEASE_NAME-master.$NAMESPACE.svc.cluster.local:6379"
REDIS_READONLY_CONNECTIONSTRING="redis://:${REDIS_PASSWORD}@$REDIS_RELEASE_NAME-replicas.$NAMESPACE.svc.cluster.local:6379"

# Define the temporary override file
OVERRIDE_FILE=$(mktemp)
trap 'rm -f $OVERRIDE_FILE' EXIT

# Write overrides to the temporary file
cat <<EOF > $OVERRIDE_FILE
image:
  repository: rwt
  tag: debug
  pullPolicy: Never
redis:
  connectionString: $REDIS_CONNECTIONSTRING
  connectionStringRO: $REDIS_READONLY_CONNECTIONSTRING
azure:
  clientId: $AZURE_CLIENT_ID
  clientSecret: $AZURE_CLIENT_SECRET
  tenantId: $AZURE_TENANT_ID
acs:
  connectionString: $ACS_CONNECTION_STRING
service:
  port: 8080
ingress:
  enabled: true
  hosts:
    - paths:
        - path: /
          pathType: ImplementationSpecific
podAnnotations:
  redeploy-timestamp: "$(date +%s)"
  app.realwear.com/git-commit: "$(git rev-parse HEAD)"
autoscaling:
  enabled: true
  minReplicas: 2
  maxReplicas: 4
  targetCPUUtilizationPercentage: 80
  targetMemoryUtilizationPercentage: 80
resources:
  limits:
    cpu: 500m
    memory: 512Mi
  requests:
    cpu: 250m
    memory: 256Mi
EOF

OVERRIDE_FILES="--values ${OVERRIDE_FILE}"

# If INGRESS_OVERRIDE exists, and it's a file, and the file exists, add it to the override files
if [ -n "$VALUES_FILE" ] && [ -f "$VALUES_FILE" ]; then
  OVERRIDE_FILES="$OVERRIDE_FILES --values $VALUES_FILE"
fi

printTitle "Installing Helm Chart"

# Install the Helm chart
helm upgrade $RELEASE_NAME $CHART_NAME --namespace $NAMESPACE --create-namespace --install \
  $OVERRIDE_FILES \
  --kube-context="$KUBE_CONTEXT" \
  --wait

printTitle "Testing Helm Chart"

helm test $RELEASE_NAME -n $NAMESPACE --kube-context $KUBE_CONTEXT

if [ $? -eq 0 ]; then
  echo "Helm release '$RELEASE_NAME' installed successfully."
else
  echo "Failed to install Helm release '$RELEASE_NAME'."
  exit 1
fi

# If the KUBE_CONTEXT is minikube, print the minikube IP and port
if [ "$KUBE_CONTEXT" == "minikube" ]; then
  printTitle "All Complete - Port Forwarding"

  kubectl port-forward --context $KUBE_CONTEXT --namespace ingress-nginx service/ingress-nginx-controller $EXPOSED_PORT:80
else
  printTitle "All Complete"
fi