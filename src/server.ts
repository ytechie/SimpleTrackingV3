import * as express from 'express';
import * as path from 'path';
import * as http from 'http';
import * as handlebars from 'handlebars';
import * as expressHandlebars from 'express-handlebars';
import { Tracker } from './providers/Tracker'
import { RssFormatter } from './providers/RssFormatter';

var express = require('express');
var app = express();

app.use(express.static(path.resolve(__dirname, 'static')));

app.engine('hbs', expressHandlebars({
        defaultLayout: path.resolve(__dirname, 'views/layouts/main.hbs'),
        partialsDir: path.resolve(__dirname, 'views/partials'),
        layoutsDir: path.resolve(__dirname, 'views/layouts')
}));
app.set('view engine', 'hbs');
app.set('views', path.resolve(__dirname, 'views'));

console.log(path.resolve(__dirname, 'static'));

// respond with "hello world" when a GET request is made to the homepage
app.get('/echo', function (req, res) {
    res.send('hello world');
});

app.get('/', function (req, res) {
    res.render('index.hbs');
});
app.get('/track/:trackingNumber.rss', function (req, res) {
    let trackData = Tracker.Track(req.params.trackingNumber);
    let rss = RssFormatter.ConvertTrackingDataToRss(trackData);
    res.set('Content-Type', 'application/rss+xml');
    res.send(rss);
});
app.get('/track/:trackingNumber', function (req, res) {
    let trackData = Tracker.Track(req.params.trackingNumber);
    res.render('track.hbs', { trackData: trackData });
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