#!/bin/bash

set -e

# Look for a nx.json file in the current directory
# If not there, tell the user to run the command from the root of the project
if [ ! -f nx.json ]; then
  echo "nx.json not found in the current directory. Please run this command from the root of the project."
  exit 1
fi

kubectl config use-context minikube

eval $(minikube docker-env)

.devops/rwt/rwtpackage.sh --debug

.devops/rwt/rwtdeploydebug.sh