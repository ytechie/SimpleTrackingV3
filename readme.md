The source code for [SimpleTracking.com](http://simpletracking.com), a site that makes tracking packages extremely quick and simple.

## Dev Setup
```bash
# install dependencies
npm install
# run typescript compiler
tsc
```

## Configuration

The site requires a number of environment variables to be set. Look at [.env.example](.env.example) for a complete list.

## Docker

To build, review [Dockerbuild.sh](Dockerbuild.sh)

## Geocode Database

Sqlite is used to load a database of cities and lat/long coordinates.

Generate the database by navigating to the `sqlite` folder in the project and executing:

    sqlite3 ../src/geocode.db ".read commands.sql"

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

## Deploying to Kubernetes

kubectl apply -f https://raw.githubusercontent.com/ytechie/SimpleTrackingV3/master/simpletracking-k8s.yaml

## Requirements

There is currently a bug with sqlite3 and Node 10. You must use node 9.4.