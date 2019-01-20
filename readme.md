# Scribe

Scribe is an oppinionated static site generator.

It will:

1. Generate individual HTML posts from markdown.
2. Compile HTML pages from pug templates.
3. Compile css from scss stylesheets.
4. Watch for changes automatically.
5. Render a preview in the browser.

## High Priority TODOs

### adapter/pug

* validation: are the templates correct pug templates?

### adapter/scss

* validation: is the style sheet correct scss?

### post

* validation: is the front matter correct?
* split validation and userPost->domainPost

### fs

* if dist doesn't exist, create
* if dist/css doesn't exist, create

### post

* categories from config

## Low Priority TODOs

### adapters

* adapter interfaces

## High Priority Problems

### config

* `pathToConfig` assumes that config file is JSON.
* `resolvePaths` assumes that properties are strings.

## scribe

* when changing primary keys (title) of post, the old post stays in the post
    context
* watcher for pug layouts doesn't work
* reload doesn't work

## Low Priority Problems

### config

* `resolvePaths` OMG. Seriously. Plx refactor.
* Redo `validate`, its not generic.
* Compose `validateConfig` checks, instead of using `validate`.
* `pathToConfig` should not reach into Validations, i.e. `success.value`.
* Rename `readAndParse`, not very descriptive.

### file

* `writeFiles` is broken; fix it or remove it.

## markdown

* properly remove front matter
