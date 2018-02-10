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
    it('Sample Response 7 Activities', async () => {
        let sample = loadSample('9400110200883692641453');
        let td = await UspsTracker.UspsTracker.ConvertResponseToTrackData(sample);
        
        td.activity.length.should.equal(7);
    });
    it('Activity Details Correct', async () => {
        let sample = loadSample('9400110200883692641453');
        let td = await UspsTracker.UspsTracker.ConvertResponseToTrackData(sample);
        
        td.activity[0].shortDescription.should.equal('Out for Delivery');
    //td.activity[0].timestamp.should.equal(new Date(Date.parse('January 22, 2018, 10:00 am')));
        td.activity[0].locationDescription.should.equal('BOTHELL, WA 98012');
    });
    it('Parse Distribution Center Location', async () => {
        let sample = loadSample('9405511899560863442597');
        let td = await UspsTracker.UspsTracker.ConvertResponseToTrackData(sample);
        
        td.activity[6].shortDescription.should.equal('Arrived at USPS Regional Origin Facility');
    //td.activity[0].timestamp.should.equal(new Date(Date.parse('January 22, 2018, 10:00 am')));
        td.activity[6].locationDescription.should.equal('FORT WORTH TX');
    });
});

describe('Valid Tracking Numbers', function () {
    it('Dont track wrong length tracking numbers', () => {
        UspsTracker.UspsTracker.IsValidTrackingNumber("123").should.be.false;
    });
    it('Validate correct tracking number', () => {
        UspsTracker.UspsTracker.IsValidTrackingNumber("9400110200883692641453").should.be.true;
    });
});

describe('USPS Requirements', function () {
    it('Valid disclaimer', async () => {
        let sample = loadSample('9405511899560863442597');
        let td = await UspsTracker.UspsTracker.ConvertResponseToTrackData(sample);
        td.usageRequirements.should.not.be.null;
        td.usageRequirements.should.not.be.empty;
    });
});

function loadSample(name) {
    let contents = fs.readFileSync(path.resolve(__dirname, 'sampleResponses/' + name + '.xml'));

    return contents;
}