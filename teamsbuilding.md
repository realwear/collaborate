# Building RealWear For Teams

## Docker Image

Script Name: `.devops/rwt/rwtpackage.sh`

Options:
- `--push` - Pushes the image to *realweart.azurecr.io*
  - You must be signed in to az cli with push permission for *realweart*
- `--debug` - Retags the image locally to rwt:debug
- `--tag` - Tags the build to *realweart.azurecr.io:TAG_NAME*

*If you don't specify any flags, the code will build and will be tagged with current date

```shell
.devops/rwtpackage.sh
```

## Source Code

To *build* manually, open in VS Code and activate the Dev Container.

```shell

# Run yarn to make sure all dependancies are installed
yarn

# Run yarn build to build all projects inside the repo
yarn build
```