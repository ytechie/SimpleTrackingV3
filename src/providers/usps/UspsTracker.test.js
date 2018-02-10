"use strict";
const chai = require("chai");
const UspsTracker = require("./UspsTracker").UspsTracker;
const fs = require("fs");
const path = require("path");

chai.should();

describe('USPS Sample Responses', function () {
    it('Real Data 9400110200883692641453', async () => {
        let sample = loadSample('9400110200883692641453');
        let td = await UspsTracker.ConvertResponseToTrackData(sample);
        
        td.should.not.be.null;
    });
    it('Sample Response 7 Activities', async () => {
        let sample = loadSample('9400110200883692641453');
        let td = await UspsTracker.ConvertResponseToTrackData(sample);
        
        td.activity.length.should.equal(7);
    });
    it('Activity Details Correct', async () => {
        let sample = loadSample('9400110200883692641453');
        let td = await UspsTracker.ConvertResponseToTrackData(sample);
        
        td.activity[0].shortDescription.should.equal('Out for Delivery');
    //td.activity[0].timestamp.should.equal(new Date(Date.parse('January 22, 2018, 10:00 am')));
        td.activity[0].locationDescription.should.equal('BOTHELL, WA 98012');
    });
    it('Parse Distribution Center Location', async () => {
        let sample = loadSample('9405511899560863442597');
        let td = await UspsTracker.ConvertResponseToTrackData(sample);
        
        td.activity[6].shortDescription.should.equal('Arrived at USPS Regional Origin Facility');
    //td.activity[0].timestamp.should.equal(new Date(Date.parse('January 22, 2018, 10:00 am')));
        td.activity[6].locationDescription.should.equal('FORT WORTH TX');
    });
});

describe('Parse USPS Track Detail', function () {
    it('Standard format, 6 parts', () => {
        let text = 'Departed Post Office, May 8, 2017, 6:42 pm, PALM COAST, FL 32137';
        let results = UspsTracker.ParseUspsTrackDetail(text);

        results.description.should.equal('Departed Post Office');
        results.timestamp.toLocaleString().should.eq('2017-5-8 18:42:00');
        results.location.should.equal('PALM COAST, FL 32137');
    });
    it('Description with comma, 6 parts', () => {
        let text = 'Payment of charges - Item being held, addressee being notified, May 16, 2017, 7:28 am, ISRAEL';
        let results = UspsTracker.ParseUspsTrackDetail(text);

        results.description.should.equal('Payment of charges - Item being held, addressee being notified');
        results.timestamp.toLocaleString().should.eq('2017-5-16 07:28:00');
        results.location.should.equal('ISRAEL');
    });
    it('Distribution center, 5 parts', () => {
        let text = 'Arrived at USPS Regional Origin Facility, November 17, 2017, 8:38 pm, FORT WORTH TX DISTRIBUTION CENTER';
        let results = UspsTracker.ParseUspsTrackDetail(text);

        results.description.should.equal('Arrived at USPS Regional Origin Facility');
        results.timestamp.toLocaleString().should.eq('2017-11-17 20:38:00');
        results.location.should.equal('FORT WORTH TX');
    });
    it('5 parts', () => {
        let text = 'Addressee not available - Will attempt delivery on next working day, May 16, 2017, 12:35 pm, ISRAEL';
        let results = UspsTracker.ParseUspsTrackDetail(text);

        results.description.should.equal('Addressee not available - Will attempt delivery on next working day');
        results.timestamp.toLocaleString().should.eq('2017-5-16 12:35:00');
        results.location.should.equal('ISRAEL');
    });
    it('In transit - useless message', () => {
        let text = 'In Transit to Destination, November 18, 2017, 9:26 am, On its way to ZIP Code 54129';
        let results = UspsTracker.ParseUspsTrackDetail(text);

        (results == null).should.be.true;
    });
    it('In transit - useless message. 2nd format', () => {
        let text = 'The item is currently in transit to the destination as of October 23, 2017 at 9:05 am.';
        let results = UspsTracker.ParseUspsTrackDetail(text);

        (results == null).should.be.true;
    });
    it('7 parts', () => {
        let text = 'Shipping Label Created, USPS Awaiting Item, January 18, 2018, 7:12 am, REXFORD, NY 12148';
        let results = UspsTracker.ParseUspsTrackDetail(text);

        results.description.should.equal('Shipping Label Created, USPS Awaiting Item');
        results.timestamp.toLocaleString().should.eq('2018-1-18 07:12:00');
        results.location.should.equal('REXFORD, NY 12148');
    });
    it('Single digit days', () => {
        let text = 'Arrived, May 9, 2017, 2:24 pm, MIAMI, UNITED STATES';
        let results = UspsTracker.ParseUspsTrackDetail(text);

        results.description.should.equal('Arrived');
        results.timestamp.toLocaleString().should.eq('2017-5-9 14:24:00');
        results.location.should.equal('MIAMI, UNITED STATES');
    });
});

describe('Valid Tracking Numbers', function () {
    it('Dont track wrong length tracking numbers', () => {
        UspsTracker.IsValidTrackingNumber("123").should.be.false;
    });
    it('Validate correct tracking number', () => {
        UspsTracker.IsValidTrackingNumber("9400110200883692641453").should.be.true;
    });
});

describe('USPS Requirements', function () {
    it('Valid disclaimer', async () => {
        let sample = loadSample('9405511899560863442597');
        let td = await UspsTracker.ConvertResponseToTrackData(sample);
        td.usageRequirements.should.not.be.null;
        td.usageRequirements.should.not.be.empty;
    });
});

function loadSample(name) {
    let contents = fs.readFileSync(path.resolve(__dirname, 'sampleResponses/' + name + '.xml'));

    return contents;
}