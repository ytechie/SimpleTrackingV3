"use strict";
const chai = require("chai");
const FedexTracker = require("./FedexTracker");
const fs = require("fs");
const path = require("path");

chai.should();

describe('Fedex Sample Test Suite', function () {
    it('Shipment information sent to FedEx', function () {
        let sample = loadSample('449044304137821');
        let td = FedexTracker.FedexTracker.ConvertJsonToStandardFormat(sample);
        td.should.be.not.null;
    });
    it('Tracking number not found', function () {
        let sample = loadSample('notfound');
        let td = FedexTracker.FedexTracker.ConvertJsonToStandardFormat(sample);
        (td == null).should;
    });
});

describe('Fedex', function () {
    it('Location Formatting', function () {
        let sample = loadSample('231300687629630');
        let td = FedexTracker.FedexTracker.ConvertJsonToStandardFormat(sample);

        td.activity[0].location.city.should.equal('MIAMI');
        td.activity[0].location.state.should.equal('FL');
        td.activity[0].location.zip.should.equal('33178');
        td.activity[0].location.countryCode.should.equal('US');
    });
});

function loadSample(name) {
    let contents = fs.readFileSync(path.resolve(__dirname, 'sampleResponses/' + name + '.json'));
    let jsonObj = JSON.parse(contents.toString());
    return jsonObj;
}