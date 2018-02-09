"use strict";
const chai = require("chai");
const UspsTracker = require("./UspsTracker");
const fs = require("fs");
const path = require("path");

chai.should();

describe('USPS Sample Responses', function () {
    it('Real Data 9400110200883692641453', async () => {
        let sample = loadSample('9400110200883692641453');
        let td = await UspsTracker.UspsTracker.ConvertResponseToTrackData(sample);
        
        td.should.not.be.null;
    });
    it('Sample Response 9 Activities', async () => {
        let sample = loadSample('9400110200883692641453');
        let td = await UspsTracker.UspsTracker.ConvertResponseToTrackData(sample);
        
        td.activity.length.should.equal(9);
    });
    it('Activity Details Correct', async () => {
        let sample = loadSample('9400110200883692641453');
        let td = await UspsTracker.UspsTracker.ConvertResponseToTrackData(sample);
        
        td.activity[0].shortDescription.should.equal('Out for Delivery');
    //td.activity[0].timestamp.should.equal(new Date(Date.parse('January 22, 2018, 10:00 am')));
        td.activity[0].locationDescription.should.equal('BOTHELL, WA 98012');
    });
});

function loadSample(name) {
    let contents = fs.readFileSync(path.resolve(__dirname, 'sampleResponses/' + name + '.xml'));

    return contents;
}