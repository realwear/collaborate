#!/bin/bash

# Use JQ to construct a JSON object (all variables are from existing environment vars) using the following format
# { "email": ${email}, "name": ${name}, "joinUrl": ${joinUrl}, "connectCode": ${connectCode} }

# If there's no connect code specified, read it from the command line
if [ -z "$TEST_CONNECTCODE" ]; then
    echo "Enter the connect code: "
    read TEST_CONNECTCODE

    # Strip any whitespace and error if it is NOT 5 characters long
    TEST_CONNECTCODE=$(echo $TEST_CONNECTCODE | tr -d '[:space:]')

    if [ ${#TEST_CONNECTCODE} -ne 5 ]; then
        echo "Connect code must be 5 characters long"
        exit 1
    fi
fi

# Convert the connect code to uppercase first
TEST_CONNECTCODE=$(echo $TEST_CONNECTCODE | tr '[:lower:]' '[:upper:]')

# Construct the JSON object using JQ
output=$(jq -n --arg email "$TEST_EMAIL" --arg name "$TEST_NAME" --arg joinUrl "$TEST_JOINURL" --arg connectCode "$TEST_CONNECTCODE" '{email: $email, name: $name, joinUrl: $joinUrl, connectCode: $connectCode}')

# Curl the request to POST:localhost:3333/api/createmeeting/test and output the status code
curl -X POST -H "Content-Type: application/json" -d "$output" localhost:3333/api/createmeeting/test