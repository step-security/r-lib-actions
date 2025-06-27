# setup-manifest

This action sets up a project based on a
[Posit Connect `manifest.json` file](https://docs.posit.co/connect/user/publishing-cli-manifest/).

# Usage

```
name: setup.yaml
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]
  workflow_dispatch:

jobs:
  setup:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: step-security/r-lib-actions/setup-manifest@v2
```

# How it works

This action only works on Linux.

It uses a Docker container to install and run renv to convert the
`manifest.json` file to an `renv.lock` file.

Then it uses [`step-security/r-lib-actions/setup-r`](https://github.com/step-security/r-lib-actions/tree/main/setup-r)
to install the required version of R.

Finally, it uses [`step-security/r-lib-actions/setup-renv`](https://github.com/step-security/r-lib-actions/tree/main/setup-renv)
to install required version of the dependent packages.

# Known issues

This action does not install system dependencies currently. If your
project needs Linux system packages, you'll need to install them before
calling this action.

# License

The scripts and documentation in this project are released under the [MIT License](LICENSE)
