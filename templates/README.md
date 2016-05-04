# {SLUSH{=name}}({SLUSH{=url}})

> {SLUSH{=description}}

## Setup

```sh
$ brew install vips
$ npm run build && npm start
```

## Useful commands

Start a standalone (non-dev) server:

```shell
$ npm start
```

Prints all available top-level gulp tasks / commands.

```shell
$ gulp
```

Builds, starts watch tasks, and launches the dev server.

```shell
$ gulp develop
```

Builds all files, as for a release

```shell
$ gulp build
```

Simple tests:

```shell
$ npm test
```

Put your website somewhere people can see it!*

```shell
$ gulp deploy
```

> *This requires credentials acceptable to [s3-website](https://github.com/klaemo/s3-website)
  and generally doing things s3 allows (your bucket name must be unique)

> `--deploy-target` flag sets a flag for either `staging` (default) or `production`.
If you provided a `staging_url` in the config file, that will be used in staging
deployments.

## Directory structure within `site` folder

* `_data` yaml files that can store site data available at `site.data.[filename]`

* `_images` static images (backgrounds, etc) that you want optimized.

* `_scripts` client-side JS, to be compiled with Webpack. Code style dictates
  use of ES6 (all files are transpiled using babel).

* `_sprites` place `svg` files you would like automatically compiled into a svg icon
  stack, sub-directories become unique stacks.

* `_styles` all site styles, written in SCSS with BEM code style.
  `bourbon`, and many custom functions and  helpers are available.

* `_templates` supporting template files, written in Nunjucks, divided up by:

  - `layouts` are page layouts, which can be included via the `layout` front-matter
  - `macros` place your macros here
  - `partials` place your code snippets here
  - `tags` place custom tags here. Each tag should export an `install` method, which receives
    the nunjucks `env` as a parameter

