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

> `--target` flag sets a flag for either `staging` (default) or `production`.
If you provided a `staging_url` in the config file, that will be used in staging
deployments.


## The `site` folder

Everything in the `site` folder will be handled in some way, unless it is
in a folder that starts with an `_`. Those are all special folders, and are
described in more detail below. In this folder, `html` or `markdown` files will
be placed in templates or layouts only if they contain a pair of three-dash
marks signifying front-matter at the top (this can include actual front-matter):

```
---
---
```

Files that do not have front-matter are handled as plain files, and copied 
directly to the `build_dir` and `destination`.


## Special folders in the `site` folder

* `_data` yaml files that can store site data available at `site.data.[filename]`

* `_drafts` draft posts. These will not be output unless you set `show_drafts` to
  `true`

* `_posts` are your site posts. See the example post for more details.

* `_images` static images (backgrounds, etc) that you want available for the 
  `image_url` tags. You can create on-the-fly image file variants, using 
  [sharp](https://github.com/rizalp/gulp-sharp) features like resize, grayscale,
  and so on.

* `_scripts` client-side JS, to be compiled with Webpack. Code style dictates
  use of ES6 (all files are transpiled using babel).

* `_sprites` place `svg` files you would like automatically compiled into a svg icon
  stack, sub-directories become unique stacks.

* `_styles` all site styles, written in SCSS with BEM code style.
  `bourbon`, and many custom functions and  helpers are available.

* `_plugins` all your local plugins. Mores detail to come.

* `_templates` supporting template files, written in Nunjucks, divided up by:

  - `layouts` are page layouts, which can be included via the `layout` front-matter
  - `macros` place your macros here
  - `partials` place your code snippets here
  - `tags` place custom tags here. Each tag should export an `install` method, which receives
    the nunjucks `env` as a parameter


## Revisioning

* A powerful feature of Velvet is the ability to create and embed revision info 
  into filenames. This can help you optimize your cache headers (which is done 
  automatically for you in the AWS/S3 deploy task). When you reference a plain file
  in the site folder, or an image, style or script in their special folders, 
  you have the option of enabling a revisoned output filename in the 
  `_config.yml` file. This is turned on by default. When doing a `production` 
  build, or whatever `env` you have set in the config, the files are renamed, 
  and the references in your templates updated to point to the correct filenames.
