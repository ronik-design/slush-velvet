# Velvet

This generator is the starting point for a [Velvet](https://github.com/ronik-design/velvet)-based
website. It contains all the modules, boilerplate, and built-in process to get
you started building and deploying a full website.

> Created by [Ronik Design](http://www.ronikdesign.com) and used to speed up internal development.

## Getting started (*Experienced*) 

To start you will need [slush](http://slushjs.github.io) and this generator 
installed. 

```sh
npm install slush slush-velvet --global
```

If you are on OSX, in order to install it properly you will also need [VIPS](https://en.wikipedia.org/wiki/VIPS_(software)). 
It handles the image processing. 

That is as easy as:

```sh
brew install vips
```

Finally, create a directory for your site, and run the generator:

```sh
slush velvet
```

You will be guided through a series of questions to help you set up your site.


## Getting started (*Novice on OSX*)

You'll want to start by installing [Homebrew](http://brew.sh).

```sh
/usr/bin/ruby -e "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/master/install)"
```

Then you'll need to install [node](https://nodejs.org/), and [VIPS](https://en.wikipedia.org/wiki/VIPS_(software)):

```sh
brew install node vips
```

Finally, you'll want to install the requisite node modules from [npm](https://npmjs.com):

```sh
npm install slush slush-velvet --global
```

Now, create a directory, and start the generator:

```sh
mkdir my-site
cd my-site
slush velvet
```

## Working with my site

You'll find documentation within the newly-created site's README that offers
more detail, but the basics are as follows.

Build your site from source in the `site` folder:

```sh
gulp build
```

That will create an intermediary `.build` folder, and a public output `public`
folder. To create a production-ready build add `--production` to the command, 
and minification and revisioning will be applied.

Develop your site, watching files for changes and updating on the fly:

```sh
gulp develop
```

This launches a Browser Sync local dev server, and keeps track of your files,
reloading the browser when the html, css or js changes.

Deploy your site to S3:

```sh
gulp deploy
```

This will deploy the site to an S3 bucket with a name derived from your `staging_url`
if it exists, otherwise, from your `url`. To deploy to your production `url` bucket
add `--target=production`, and additionally, to optimized the build as above, add
`--production`. So, a standard deployment string for a full site would look like this:

```sh
gulp deploy --production --target=production
```


## Collaborating with git

Create your git repository in Github. Don't add any default files.

```shell
$ git init
$ git remote add origin git@github.com:[repo-name].git
$ git add .
$ git commit -am "Initial commit"
$ git branch --set-upstream-to=origin/master
$ git pull --rebase
$ git push origin master
```


## Getting To Know Slush

Slush is a tool that uses Gulp for project scaffolding.

Slush does not contain anything "out of the box", except the ability to locate installed slush generators and to run them with liftoff.

To find out more about Slush, check out the [documentation](https://github.com/klei/slush).

## Contributing

See the [CONTRIBUTING Guidelines](https://github.com/ronik-design/slush-website/blob/master/CONTRIBUTING.md)

## Support
If you have any problem or suggestion please open an issue [here](https://github.com/ronik-design/slush-website/issues).

