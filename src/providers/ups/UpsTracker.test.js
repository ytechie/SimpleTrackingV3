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
        
        td.activity[0].locationDescription.should.equal('BOTHELL, WA, 98012, US');
        td.activity.length.should.be.equal(7);
    });
    it('Verify activity address without postal code', function() {
        let sample = loadSample('1Z6Y09Y00383605008');
        let td = UpsTracker.UpsTracker.StandardizeTrackingData(sample);
        
        td.activity[1].locationDescription.should.equal('REDMOND, WA, US');
        td.activity.length.should.be.equal(7);
    });
    it('Verify activity address with only country', function() {
        let sample = loadSample('1Z6Y09Y00383605008');
        let td = UpsTracker.UpsTracker.StandardizeTrackingData(sample);
        
        td.activity[6].locationDescription.should.equal('US');
    });
});

function loadSample(name) {
    let contents = fs.readFileSync(path.resolve(__dirname, 'sampleResponses/' + name + '.txt'));
    let jsonObj = JSON.parse(contents.toString());
    return jsonObj;
}