# check-r-package

This action checks an R package using the [rcmdcheck](https://r-lib.github.io/rcmdcheck/) package.

# Usage

Inputs available:
- args - default `c("--no-manual", "--as-cran")`. Arguments to pass to the
  `args` parameter of `rcmdcheck`. It must be an R expression.
  Note that you often need to quote it, see details below.
- build_args - default `"--no-manual"`. Arguments to pass to the `build_args`
  parameter of `rcmdcheck`. It must be an R expression.
  Note that you often need to quote it, see details below.
- check-dir - default `"check"`. Arguments to pass to the `check-dir`
  parameter of `rcmdcheck`. It must be an R expression.
  Note that you often need to quote it, see details below.
- error-on - default `"warning"`. Arguments to pass to the `error-on`
  parameter of `rcmdcheck`. It must be an R expression.
  Note that you often need to quote it, see details below.
- upload-snapshots - default `false`. Whether to upload all testthat
  snapshots as an artifact.
- upload-results - default `false`. Whether to upload check results for
  successful runs too.
- working-directory - default `"."`. If the R package to check is not in
  the root directory of your repository.
- artifact-name - Use this to override the default artifact name for the
  check results. The default is `{os}-{arch}-r{rversion}-{id}-result`, where
  `{id}` is `matrix.config.id` or `strategy.job-index` if the former is
  not defined.
- snapshot-artifact-name: Use this to override the default artifact name
  for testthat snapshots. The default is
  `{os}-{arch}-r{rversion}-{id}-testthat-snapsots`, where `{id}` is
  `matrix.config.id` or `strategy.job-index` if the former is not defined.

Basic:
```yaml
steps:
- uses: actions/checkout@v4
- uses: step-security/r-lib-actions/setup-r@v2
- uses: step-security/r-lib-actions/setup-r-dependencies@v2
  with:
    extra-packages: any::rcmdcheck
    needs: check
- uses: step-security/r-lib-actions/check-r-package@v2
```

With specified inputs:
```yaml
steps:
- uses: actions/checkout@v4
- uses: step-security/r-lib-actions/setup-r@v2
- uses: step-security/r-lib-actions/setup-r-dependencies@v2
  with:
    extra-packages: any::rcmdcheck
    needs: check
- uses: step-security/r-lib-actions/check-r-package@v2
  with:
    args: 'c("--no-manual", "--as-cran")'
    error-on: '"error"'
    check-dir: '"check"'
```

## Quoting R expressions

Several input arguments must be specified as an R expression.
This increases flexibility, but it also causes some inconvenience, since
these expressions often need to be quoted in the YAML file.
A handy tip is that if your R expression does not contain a single quote,
and you specify it in the YAML in a single line, surrounded by single
quotes (like in the example above for `args`, `error-on` and `check-dir`
right above), that will work.

# License

The scripts and documentation in this project are released under the [MIT License](LICENSE)
