# setup-renv

This action installs dependencies for the current R environment based on the renv lockfile in the repository by:

- Installing [renv](https://rstudio.github.io/renv/articles/renv.html)
- Setting up a dependency cache using [actions/cache](https://github.com/actions/cache).

# Usage

Inputs available

- `profile` - default `NULL`. The renv profile that should be activated.
Forwarded to
[`renv::activate()`](https://rstudio.github.io/renv/reference/activate.html). It
must be an R expression. Note that you often need to quote it, see details
below.
- `cache-version` - default `1`. If you need to invalidate the existing cache pass any other number and a new cache will be used.
- `bypass-cache` - default `false`. Whether attempts to cache should be
completely skipped (for non GitHub testing). Set to `true` to skip. If
`"never"` is provided, the package cache will be saved even if the workflow
fails. (For historical reasons the `"always"` value is equivalent to
`"never"`.)
- `working-directory` - default `'.'`. If the `renv.lock` file is not in the root directory of your repository.

Example:

```yaml
steps:
- uses: actions/checkout@v4
- uses: step-security/r-lib-actions/setup-r@v2
- uses: step-security/r-lib-actions/setup-renv@v2
  with:
    profile: '"shiny"'
```

## Quoting R expressions

The `profile` input parameter must be specified as an R expression.
This increases flexibility, but it also causes some inconvenience, since
these expressions often need to be quoted in the YAML file.
A handy tip is that if your R expression does not contain a single quote,
and you specify it in the YAML in a single line, surrounded by single
quotes (like in the example above for `profile`), that will work.

# License

The scripts and documentation in this project are released under the [MIT License](LICENSE)
