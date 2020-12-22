"use strict";
const chai = require("chai");
const Geocoder = require("./geocoder").Geocoder;
const fs = require("fs");
const path = require("path");

chai.should();

describe('Geocoder', function () {
    it('Simple Lookup - Seattle, WA', async () => {
        let g = new Geocoder();
        console.time('Geocode Timing');
        let rec = await g.Geocode('Seattle', 'WA');
        console.timeEnd('Geocode Timing');
    });
});