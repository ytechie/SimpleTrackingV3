import * as express from 'express';
import * as path from 'path';
import * as http from 'http';
import * as handlebars from 'handlebars';
import * as expressHandlebars from 'express-handlebars';
import { Tracker } from './providers/Tracker'
import { RssFormatter } from './providers/RssFormatter';

var express = require('express');
var app = express();

//Needed for a form post to work
var bodyParser = require('body-parser');
app.use(bodyParser.urlencoded());

//Only used for local dev. In prod, nginx serves these
app.use(express.static(path.resolve(__dirname, 'static')));

app.engine('hbs', expressHandlebars({
        defaultLayout: path.resolve(__dirname, 'views/layouts/main.hbs'),
        partialsDir: path.resolve(__dirname, 'views/partials'),
        layoutsDir: path.resolve(__dirname, 'views/layouts')
}));
app.set('view engine', 'hbs');
app.set('views', path.resolve(__dirname, 'views'));

console.log(path.resolve(__dirname, 'static'));

//Set up the tracker
let tracker = new Tracker();
tracker.LoadTrackers();

// respond with "hello world" when a GET request is made to the homepage
app.get('/echo', function (req, res) {
    res.send('hello world');
});

app.get('/', function (req, res) {
    res.render('index.hbs');
});
app.post('/', function(req, res) {
    
    console.log(req.body);
    let trackingNumber = req.body.trackingNumber;
    res.redirect('/track/' + trackingNumber);
});
app.get('/track/:trackingNumber.rss', function (req, res) {
    tracker.Track(req.params.trackingNumber).then((trackData) => {
        let rss = RssFormatter.ConvertTrackingDataToRss(trackData);
        res.set('Content-Type', 'application/rss+xml');
        res.send(rss);
    }).catch((err) => {
        res.send(err);
    });
});
app.get('/track/:trackingNumber', function (req, res) {
    tracker.Track(req.params.trackingNumber).then((trackData) => {
        res.render('track.hbs', { trackData: trackData });
    }).catch((err) => {
        console.error('Error getting tracking info: ' + err);
        res.send(err);
    });
});

const port: number = parseInt(process.env.PORT) || 3000;
const server = http.createServer(app);
server.listen(port);
server.on("error", (error) => {
    console.log('Error: ' + error);
});
server.on("listening", () => {
    console.log('Listening on ' + port);
});