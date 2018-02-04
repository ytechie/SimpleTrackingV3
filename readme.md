The source code for [SimpleTracking.com](http://simpletracking.com), a site that makes tracking packages extremely quick and simple.

## Configuration

The site requires a number of environment variables to be set. Look at [.env.example](.env.example) for a complete list.

## Docker

The docker image runs the node.js server behind an nginx proxy.

Static files are served directly from nginx.

## Tips

In VSCode, put the following snippet in your configuration to hide .js files:

    "files.exclude": {
        "**/.DS_Store": true,
        "**/*.js" : {
            "when": "$(basename).ts"
        },
        "**/*.js.map": {
            "when": "$(basename)"
        }