"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai = require("chai");
const UpsTracker = require("./UpsTracker");
const fs = require("fs");
const path = require("path");

chai.should();

describe('UPS Tracker', function () {
    it('Sample Results 1', function () {
        let sample = loadSample('1Z6Y09Y00383605008');
        let td = UpsTracker.UpsTracker.StandardizeTrackingData(sample);
        td.should.be.not.null;
        td.activity.length.should.be.equal(7);
    });
    it('Sample Results 2', function () {
        let sample = loadSample('1ZR8Y7710355363026');
        let td = UpsTracker.UpsTracker.StandardizeTrackingData(sample);
        td.should.be.not.null;
        td.activity.length.should.be.equal(5);
    });
    it('Verify activity address', function() {
        let sample = loadSample('1Z6Y09Y00383605008');
        let td = UpsTracker.UpsTracker.StandardizeTrackingData(sample);
        
        td.activity[0].location.city.should.equal('BOTHELL');
        td.activity[0].location.state.should.equal('WA');
        td.activity[0].location.zip.should.equal('98012');
        td.activity[0].location.countryCode.should.equal('US');

        td.activity.length.should.be.equal(7);
    });
    it('Verify activity address without postal code', function() {
        let sample = loadSample('1Z6Y09Y00383605008');
        let td = UpsTracker.UpsTracker.StandardizeTrackingData(sample);

        td.activity[1].location.city.should.equal('REDMOND');
        td.activity[1].location.state.should.equal('WA');
        td.activity[1].location.countryCode.should.equal('US');
        
        td.activity.length.should.be.equal(7);
    });
    it('Verify activity address with only country', function() {
        let sample = loadSample('1Z6Y09Y00383605008');
        let td = UpsTracker.UpsTracker.StandardizeTrackingData(sample);
        
        td.activity[6].location.countryCode.should.equal('US');
    });
});

describe('Package Attributes', () => {
    it('Should have estimated delivery date', () => {
        let sample = loadSample('1ZR8Y7710355363026');
        let td = UpsTracker.UpsTracker.StandardizeTrackingData(sample);

        td.estimatedDelivery.should.be.eql(new Date(Date.parse('2018-02-07')));
        //20180207
    });
    it('Should handle activity not being an array', () => {
        let sample = loadSample('activity-is-not-an-array');
        let td = UpsTracker.UpsTracker.StandardizeTrackingData(sample);

        td.estimatedDelivery.should.be.eql(new Date(Date.parse('2020-12-23 18:00')));
    });
});

describe('Multi-package shipment', () => {
    it('Should return correct package', () => {
        let sample = loadSample('1Z7586X30315192479');
        let td = UpsTracker.UpsTracker.StandardizeTrackingData(sample);

        td.trackingNumber.should.equal('1Z7586X30315192479')
    });
});

function loadSample(name) {
    let contents = fs.readFileSync(path.resolve(__dirname, 'sampleResponses/' + name + '.txt'));
    let jsonObj = JSON.parse(contents.toString());
    return jsonObj;
}