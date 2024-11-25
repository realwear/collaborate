set -x

docker build -f .devops/rwt/Dockerfile.web -t rwtlocaldev .

# Build the Cypress image with all of the included dependencies
docker build -f .devops/rwt/Dockerfile.cypress -t rwtcypress .

ACS_FAKE_STRING="endpoint=https://fake-acs.communication.azure.com/;accesskey=fake"

rm -rf cypresstestresults
mkdir cypresstestresults

rm -rf cypressscreenshots
mkdir cypressscreenshots

DOCKER_PS=$(docker run -d --rm -e AZURE_CLIENT_ID="12345" -e AZURE_CLIENT_SECRET="123456" -e ACS_CONNECTION_STRING="$ACS_FAKE_STRING" --net="host" rwtlocaldev)

trap "docker kill $DOCKER_PS" EXIT

# Run the Cypress tests (volume mount the test results directory, will publish later)
# Fix it to 2 cores as that is the limitation of the Azure DevOps agent
docker run --rm --cpus="2" -v $(pwd)/cypresstestresults/:/app/testresults/ -v $(pwd)/cypressscreenshots/:/app/dist/cypress/ --net="host" -e CYPRESS_BASE_URL=http://localhost:3333 rwtcypress
CYPRESS_EXIT_CODE=$?