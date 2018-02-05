import { UpsTracker } from "./providers/ups/UpsTracker";
import fs = require('fs');
import path = require('path');

//Load configuration
if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config({path: path.resolve(__dirname, '..', '.env')});
}

if(!process.env.UPS_KEY) {
    console.error('Settings not loaded, check your environment');
}

let ups = new UpsTracker(
    process.env.UPS_USERNAME, process.env.UPS_PASSWORD, process.env.UPS_KEY);
//ups.Track('1Z12345E1512345676');

var buf = fs.readFileSync('../src/providers/ups/sample-response.txt');
var utd = JSON.parse(buf.toString());
let td = UpsTracker.StandardizeTrackingData(utd);

console.log(JSON.stringify(td));