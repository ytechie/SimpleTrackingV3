"use strict";
const chai = require("chai");
const CleanInputTracker = require("./CleanInputTracker").CleanInputTracker;
const fs = require("fs");
const path = require("path");

chai.should();

describe('Clean Input Tracker', () => {
    it('Trim Leading & Trailing Spaces', () => {
        let result = CleanInputTracker.CleanTrackingNumber(' sim1 ');
        
        result.should.equal('sim1');
    });
    it('Trim Embedded Spaces', () => {
        let result = CleanInputTracker.CleanTrackingNumber(' si m1 ');
        
        result.should.equal('sim1');
    });
});