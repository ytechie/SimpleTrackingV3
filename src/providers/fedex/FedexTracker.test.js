"use strict";
const chai = require("chai");
const FedexTracker = require("./FedexTracker");
const fs = require("fs");
const path = require("path");

chai.should();

describe('Fedex Sample Test Suite', function () {
    it('In transit shipment', function () {
        let sample = loadSample('in-transit');
        let td = FedexTracker.FedexTracker.ConvertJsonToStandardFormat(sample.output);
        td.should.be.not.null;
        td.trackingNumber.should.equal('789536724391');
    });
    it('Delivered', function () {
        let sample = loadSample('delivered');
        let td = FedexTracker.FedexTracker.ConvertJsonToStandardFormat(sample.output);
        td.should.be.not.null;
        td.activity.length.should.equal(3);
    });
    it('Tracking number not found', function () {
        let sample = loadSample('notfound');
        let td = FedexTracker.FedexTracker.ConvertJsonToStandardFormat(sample.output);
        (td === null).should.be.true;
    });
});

describe('Fedex', function () {
    it('Location Formatting', function () {
        let sample = loadSample('delivered');
        let td = FedexTracker.FedexTracker.ConvertJsonToStandardFormat(sample.output);

        td.activity[0].location.city.should.equal('SEATTLE');
        td.activity[0].location.state.should.equal('WA');
        td.activity[0].location.zip.should.equal('98101');
        td.activity[0].location.countryCode.should.equal('US');
    });
    it('Event description', function () {
        let sample = loadSample('delivered');
        let td = FedexTracker.FedexTracker.ConvertJsonToStandardFormat(sample.output);

        td.activity[0].shortDescription.should.equal('Delivered');
    });
    it('Service type and weight', function () {
        let sample = loadSample('delivered');
        let td = FedexTracker.FedexTracker.ConvertJsonToStandardFormat(sample.output);

        td.serviceType.should.equal('FedEx Ground');
        td.weight.should.equal('10.0LB');
    });
    it('Actual delivery date', function () {
        let sample = loadSample('delivered');
        let td = FedexTracker.FedexTracker.ConvertJsonToStandardFormat(sample.output);

        td.estimatedDelivery.toISOString().should.equal('2021-03-15T21:32:00.000Z');
    });
});

describe('Fedex Valid Tracking Numbers', function () {
    it('Accepts a 12 digit number', function () {
        FedexTracker.FedexTracker.IsValidTrackingNumber('462209522802').should.be.true;
    });
    it('Rejects a short number', function () {
        FedexTracker.FedexTracker.IsValidTrackingNumber('123').should.be.false;
    });
});

function loadSample(name) {
    let contents = fs.readFileSync(path.resolve(__dirname, 'sampleResponses/' + name + '.json'));
    let jsonObj = JSON.parse(contents.toString());
    return jsonObj;
}
