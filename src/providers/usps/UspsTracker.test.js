"use strict";
const chai = require("chai");
const UspsTracker = require("./UspsTracker").UspsTracker;
const fs = require("fs");
const path = require("path");

chai.should();

describe('USPS Sample Responses', function () {
    it('Real Data 1', async () => {
        let sample = loadSample('detailed1');
        let td = await UspsTracker.ConvertResponseToTrackData(sample);
        
        td.should.not.be.null;
    });
});

describe('Activity Parsing', () => {
    it('Parse Date/time', async () => {
        let sample = loadSample('detailed1');
        let td = await UspsTracker.ConvertResponseToTrackData(sample);
        
        td.activity[0].timestamp.toISOString().should.equal('2020-12-23T19:19:00.000Z');
    });
    it('Parse event description', async () => {
        let sample = loadSample('detailed1');
        let td = await UspsTracker.ConvertResponseToTrackData(sample);
        
        td.activity[0].shortDescription.should.equal('Arrived at Post Office');
    });

    it('Parse DC Annex in city name', async () => {
        let sample = loadSample('dc-in-city');
        let td = await UspsTracker.ConvertResponseToTrackData(sample);
        
        td.activity[4].location.city.should.equal('OAK CREEK');
        td.activity[4].location.state.should.equal('WI');
    });
});

describe('Valid Tracking Numbers', function () {
    it('Dont track wrong length tracking numbers', () => {
        UspsTracker.IsValidTrackingNumber("123").should.be.false;
    });
    it('Validate correct tracking number', () => {
        UspsTracker.IsValidTrackingNumber("9400110200883692641453").should.be.true;
    });
    it('Validate long real tracking number', () => {
        UspsTracker.IsValidTrackingNumber("92055901755477000065372881").should.be.true;
    });
});

describe('USPS Requirements', function () {
    it('Valid disclaimer', async () => {
        let sample = loadSample('detailed1');
        let td = await UspsTracker.ConvertResponseToTrackData(sample);
        td.usageRequirements.should.not.be.null;
        td.usageRequirements.should.not.be.empty;
    });
});

describe('Clean City Name', () => {
    it('PHOENIX AZ DISTRIBUTION CENTER ANNEX', async () => {
       let result = UspsTracker.cleanCityName('PHOENIX AZ DISTRIBUTION CENTER ANNEX');

       result.city.should.equal('PHOENIX');
       result.state.should.equal('AZ');
    });
    it('LOS ANGELES CA NETWORK DISTRIBUTION CENTER', async () => {
        let result = UspsTracker.cleanCityName('LOS ANGELES CA NETWORK DISTRIBUTION CENTER');
 
        result.city.should.equal('LOS ANGELES');
        result.state.should.equal('CA');
     });
     it('MILWAUKEE WI PROCESSING CENTER', async () => {
        let result = UspsTracker.cleanCityName('MILWAUKEE WI PROCESSING CENTER');
 
        result.city.should.equal('MILWAUKEE');
        result.state.should.equal('WI');
     });
});

function loadSample(name) {
    let contents = fs.readFileSync(path.resolve(__dirname, 'sampleResponses/' + name + '.xml'));

    return contents;
}