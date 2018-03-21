"use strict";
const chai = require("chai");
const Location = require("./Location").Location;
const fs = require("fs");
const path = require("path");

chai.should();

describe('Location', function () {
    it('Distance between Seattle and Olympia', async () => {
        let seattle = new Location();
        seattle.lat = 47.60357;
        seattle.long = -122.3295;

        let olympia = new Location();
        olympia.lat = 47.03923;
        olympia.long = -122.8914;

        let dist = seattle.kilometersToLocation(olympia);
        dist.should.be.approximately(75.7, 1)
    });
    it('Distance between Seattle and Orlando', async () => {
        let seattle = new Location();
        seattle.lat = 47.60357;
        seattle.long = -122.3295;

        let orlando = new Location();
        orlando.lat = 28.53823;
        orlando.long = -81.37739;

        let dist = seattle.kilometersToLocation(orlando);
        dist.should.be.approximately(4106, 25)
    });
});