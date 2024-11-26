# RealWear Collaborate and AI

This repository contains the code for
[RealWear Collaborate](https://marketplace.realwear.com/app/com.realwear.acs) and the
[RealWear AI Demos](https://marketplace.realwear.com/app/com.realwear.aidemo). Internally at
RealWear we use the same framework for both applications as the codebase can be used to create
custom solutions utilising both AI and Microsoft Teams. While these are separate apps, you can
create bespoke experiences that utilise functions from either to create compelling hands-free
solutions.

[![RealWear AI - Incident Report Demo](https://img.youtube.com/vi/N_6gYv0QbTk/0.jpg)](https://www.youtube.com/watch?v=N_6gYv0QbTk)

**Note: Windows Users - All of our build scripts are written for bash and not PowerShell. Please use
WSL2 (Windows Subsystem for Linux) or the VSCode Dev Container to build and run any of the server
components**

# RealWear Collaborate

To build and run RealWear Collaborate you need both an Android APK and a Server. We have created
build scripts for both.

**Components:**

- **Android APK** - A device app which hosts the RealWear Collaborate hands-free application
- **Loader** - An Angular "loader" which is compiled into the APK. This checks for the existence of
  the server, and provides basic retry and connectivity logic if required
- **RWT Device** - An Angular front-end web app which displays the UI for signing-in and joining a
  meeting
- **RWT Teams Addon** - An Angular front-end web app which hosts the Microsoft Teams addon for
  joining a call with a 5 digit code
- **RWT Backend** - A NodeJS Express Server used for generating ACS (Azure Communication Services)
  Tokens and facilitating the Teams Addon connect codes

The RealWear Collaborate server builds as a self-contained Docker image with a corresponding Helm
chart. You can choose to host the Docker image manually, or within a Kubernetes cluser using Helm.

**Prerequisites:**

- **Bash** - terminal environment for scripts (ie: NOT Windows)
- **Android Studio** - If you wish to modify the Android APK
- **Docker** - To build the APK and Server components
  - If you are not modifying the APK, you only need Docker and not Android Studio
- **VS Code** - To host the Dev Container - A fully enclosed development environment with all
  required dependencies to build the server components
  - **Redis** - If you opt to develop outside of VSCode Dev Containers, a running Redis server is
    required
- **Azure Tenant** - RealWear Collaborate uses a Microsoft EntraID Application to authenticate the
  user
- **Azure Communication Services** - Used to connect to Microsoft Teams for meetings and calls
- **Minikube** - To host locally the server

## Building the Android APK

We have provided a Docker build script for easily building the APK. This will the following
parameters:

`SITE_URL`: the location where your server UI will be hosted. `DATADOG_CLIENT_TOKEN`: (optional)
client token for Datadog log reporting.

- From your Terminal:
  ```
  SITE_URL="http://localhost:4200" \
    DATADOG_CLIENT_TOKEN="pub1234567890" \
    .devops/rwt/rwtbuildapk.sh
  ```
- The APK will be dropped in `dist/android/build` folder

_Note: The unit tests are run by default, and must succeed for the Docker build to complete_

## Building in Android Studio

Before you open in Android Studio, you must build the loader project. This will automatically copy
the loader app into the assets folder of the Android file structure. Run `yarn rwt:deploy_loader`
from your VSCode Dev Container to start this process.

Open Android Studio at `android/apps/rwt` and build/deploy as usual. The `SITE_URL` defaults to
`http://localhost:4200` which is fine for debugging, however, you can modify the `build.gradle.kts`
file if you wish to use a different `SITE_URL`.

## Preparing your Server Environment Variables

Before you start, you need to make sure that you have identifed and created the following
environment variables:

| Environment Variable    | Description                                                                                                     |
| ----------------------- | --------------------------------------------------------------------------------------------------------------- |
| `AZURE_CLIENT_ID`       | An Azure EntraID Client ID for your application.                                                                |
| `AZURE_CLIENT_SECRET`   | A corresponding secret for the EntraID application. Used for the Teams Addon when joining a meeting.            |
| `AZURE_TENANT_ID`       | _(Optional)_ Used if you wish to restrict the tenant that the users can sign in to.                             |
| `ACS_CONNECTION_STRING` | A fully provisioned Azure Communication Services connection string with the ability to create anonymous tokens. |

Create a copy of the `.localConfigs.template` file and rename to `.localConfigs` and fill in your
values. Many of the scripts assume that a valid `.localConfigs` file exists.

**Double check these values before continuing to Buildings or Debugging**

## Debugging the Server

The easiest thing to do is to use the Built-In DevContainer. Open VSCode and launch the project in
the DevContainer (your must have Docker installed). Then, from your terminal, simply launch:

- `yarn rwt:local`

This will build and run all 3 required projects (backend server, device frontend app and teams
addon).

To test that this works:

- http://localhost:4200 - The Teams addon
- http://localhost:4300 - The Device frontend app

## Exposing Localhost to Android

If your Android device (RealWear Navigator-520) is plugged in via USB to your host computer, you can
expose local ports through ADB (Android Debug Bridge). Simply run: `adb reverse tcp:4300 tcp:4300`
and when your device hits localhost, it will be reverse proxied through to your development machine.

## Building the Server Docker image

From the root directory run: `docker build -f .devops/rwt/Dockerfile.web -t rwt .` (replace rwt with
the desired name).

To host the Docker image, please make sure you have a well-defined `.localConfigs` file and then
start the docker image with:

`TBD - Coming in future revision`

## Hosting in Minikube

For a near-production environment, you can host RealWear Collaborate in a Minikube environment.
Minikube is a development (not for production) Kubernetes environment that you can run locally on
your machine.

**Pre-requisites:**

- A `.localConfigs` file in your project root directory with the following environment variables
  (see above)
- A running Minikube cluster with `KUBE_CONTEXT` set to minikube

Run the script `.devops/rwt/rwtfullminikube.sh` from the root project directory. This script will:

1. Build the RWT Docker image
2. Build the Helm Chart
3. Provision the Minikube cluster (and install Redis if necessary)
4. Deploy and Test the Helm Chart
5. Expose port 4200 on localhost for accessing the service

If successful, you should be able to browse to localhost:4200 from your browser, or, build the
Android APK and point to your dev machine

_Note: be sure to `adb reverse tcp:4200 tcp:4200` to access localhost from your Android device_

# RealWear AI Demos

Similar to RealWear Collaborate, the RealWear AI Demos are hosted as an Angualar front-end app
powered by a NodeJS backend.

The AI Demos do not currently run within a Kubernetes environment (they are much simpler), however
we do provide a Docker image for simple hosting.

**Components:**

- **Android APK** - A device app which hosts the RealWear AI Demos
- **Loader** - An Angular "loader" which is compiled into the APK. This checks for the existence of
  the server, and provides basic retry and connectivity logic if required (this is shared between
  Collaborate and AI Demos)
- **AI** - An Angular front-end web app which displays the UI for signing-in and the basic AI Demos
- **Backend** - A NodeJS Express Server used for connecting to the relevant services

The RealWear Collaborate server builds as a self-contained Docker image with a corresponding Helm
chart. You can choose to host the Docker image manually, or within a Kubernetes cluser using Helm.

**Prerequisites:**

- **Bash** - terminal environment for scripts (ie: NOT Windows)
- **Android Studio** - If you wish to modify the Android APK
- **Docker** - To build the APK and Server components
  - If you are not modifying the APK, you only need Docker and not Android Studio
- **VS Code** - To host the Dev Container - A fully enclosed development environment with all
  required dependencies to build the server components
- **Azure Tenant** - RealWear Collaborate uses a Microsoft EntraID Application to authenticate the
  user for the AI Demos - See [Setting up EntraID](docs/AzureEntraSetup.md)
- **Azure Speech Service** - RealWear AI Demos uses Azure AI Speech for Dictation - See [Setting up Azure Speech](docs/AzureSpeechSetup.md)
- **Azure OpenAI Service** - RealWear AI Demos uses Azure OpenAI for the LLM interactions - See [Setting up Azure OpenAI](docs/AzureOpenAISetup.md)

## Environment Variables

To debug or execute the application, the following environment variables must be present in a
`.localConfigs` file. Copy the existing `.localConfigs.template` and use as a reference:

| Environment Variable    | Description                                                                                          |
| ----------------------- | ---------------------------------------------------------------------------------------------------- |
| `AZURE_CLIENT_ID`       | An Azure EntraID Client ID for your application.                                                     |
| `AZURE_CLIENT_SECRET`   | A corresponding secret for the EntraID application. Used for the Teams Addon when joining a meeting. |
| `AZURE_TENANT_ID`       | _(Optional)_ Used if you wish to restrict the tenant that the users can sign in to.                  |
| `AZURE_OPENAI_ENDPOINT` | An Azure OpenAI Service Endpoint                                                                     |
| `AZURE_OPENAI_KEY`      | _(Optional)_ A secret key used to authenticate with the Azure OpenAI Service                         |
| `AZURE_SPEECH_KEY`      | A secret key for authenticating to Azure Speech Services                                             |
| `AZURE_SPEECH_REGION`   | The region that hosts the Azure Speech Services (ie: eastus2)                                        |

### Using Managed Identity

RealWear AI supports authenticating to the Azure services (AI / Speech) through Environment or
Managed Identity. If you are deploying this service to an Azure PaaS environment which includes
Managed Identity, then you can authenticate automatically to the Azure OpenAI Service without
requiring an authentication key (`AZURE_OPENAI_KEY`).

Alternatively, if you are developing locally and have logged in via the Azure CLI (provided within
the Dev Container) then RealWear AI will attempt to authenticate to the Azure OpenAI Service via
your developer credentials.

See
[DefaultAzureCredential class](https://learn.microsoft.com/en-us/javascript/api/@azure/identity/defaultazurecredential?view=azure-node-latest)
on the Azure SDK for JavaScript documentation.

## Debugging the Server

To launch the server, use `yarn ai:local`. This will run both the front and back end applications
and serve through `http://localhost:4200`.

**Note: Please ensure that you have a valid .localConfigs file setup with the appropriate keys**

To expose your localhost server to a running Android APK, call `adb reverse tcp:4200 tcp:4200`

## Running in Production

RealWear AI is deployed using Docker. You can build the Docker file using the `rwaiserver.sh`. This
will output a docker file with a tag `rwai` which you can run directly or push to a container
registry and run on your cloud provider.

**Note: Be sure to load the appropriate environment variables at runtime**

# License and Usage Guidelines

RealWear Collaborate is licensed under the
[Affero General Public License (AGPL) version 3](./LICENSE.md). This license ensures that any
modifications, derivative works, or use of this software in a hosted service remain open source and
available to the community. The following guidelines clarify what is permissible under this license:

## **Do's:**

- **Do** modify and extend this codebase to suit your needs, as long as you make your changes open
  source under the same AGPL v3 license.
- **Do** use this software as part of a larger open-source project, provided that all integrated
  components comply with the AGPL license.
- **Do** call external APIs or services, as long as the interaction is limited to network
  communication (e.g., REST, GraphQL) and does not involve embedding or linking closed-source SDKs
  or libraries into the codebase.
- **Do** host this software as part of a public or private service, provided you make the source
  code (including modifications) freely available.

## **Don'ts:**

- **Don't** link this software with proprietary libraries or modules (e.g., closed-source SDKs) that
  would create a derivative work unless you open-source those components under the AGPL license.
- **Don't** distribute a modified version of this software without sharing the complete source code
  of your modifications, as required by the AGPL license.
- **Don't** attempt to obfuscate or conceal modifications, derivative works, or the source code of
  any hosted services using this software.

## **Commercial Licensing**

If your use case cannot comply with the terms of the AGPL license—such as linking to proprietary
components or requiring additional support—commercial licenses are available. A commercial license
includes:

- Permission to link and distribute with closed-source components.
- Access to proprietary extensions and tools.
- Dedicated support and consulting.

## **Using External APIs:**

- Calling an external API (e.g., to fetch data or trigger actions) does not violate the AGPL, as
  long as the backend system remains a separate entity.
- However, if your use of an API requires embedding proprietary SDKs, libraries, or client code into
  this software, you must ensure those components are open-source or avoid using them.

## **Further Clarifications:**

For more details about the AGPL license and how it applies to this software, refer to the
[LICENSE.md](./LICENSE.md) file. If you are unsure whether your use case complies with the AGPL
terms, we recommend consulting an open-source licensing expert.
