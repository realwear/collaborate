#!/bin/bash

set -e

# Variables
RELEASE_NAME=rwtdebug
CHART_NAME=charts/rwt
EXPOSED_PORT=4200
REDIS_RELEASE_NAME=redis
NAMESPACE=${NAMESPACE:-debug}
KUBE_CONTEXT=${KUBE_CONTEXT:-minikube}
AZURE_TENANT_ID=${AZURE_TENANT_ID:-"organizations"}

# Perform Helm upgrade using the --reuse-values flag
helm upgrade $RELEASE_NAME $CHART_NAME --namespace $NAMESPACE --reuse-values --kube-context="$KUBE_CONTEXT" --wait

helm test $RELEASE_NAME --namespace $NAMESPACE --kube-context="$KUBE_CONTEXT"