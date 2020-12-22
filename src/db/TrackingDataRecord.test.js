"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai = require("chai");
const ActivityData_1 = require("../providers/ActivityData");
const TrackingDataRecord_1 = require("./TrackingDataRecord");
const Location_1 = require("../Location");
chai.should();
describe('TrackingDataRecord', () => {
    it('Deserialize', () => {
        let tdIn = new TrackingDataRecord_1.TrackingDataRecord();
        tdIn.trackingNumber = '123';
        tdIn.activity = [];
        tdIn.activity.push(new ActivityData_1.ActivityData());
        tdIn.activity[0].shortDescription = 'shortdesc';
        tdIn.activity[0].location = new Location_1.Location();
        tdIn.activity[0].location.city = 'mycity';
        let clone = JSON.parse(JSON.stringify(tdIn));
        let tdOut = TrackingDataRecord_1.TrackingDataRecord.Deserialize(clone);
        tdOut.trackingNumber.should.equal('123');
        tdOut.activity[0].shortDescription.should.equal('shortdesc');
        tdOut.activity[0].location.city.should.equal('mycity');
    });
    it('Activity type is correct', () => {
        let tdIn = new TrackingDataRecord_1.TrackingDataRecord();
        tdIn.trackingNumber = '123';
        tdIn.activity = [];
        tdIn.activity.push(new ActivityData_1.ActivityData());
        tdIn.activity[0].shortDescription = 'shortdesc';
        tdIn.activity[0].location = new Location_1.Location();
        tdIn.activity[0].location.city = 'mycity';
        let clone = JSON.parse(JSON.stringify(tdIn));
        let tdOut = TrackingDataRecord_1.TrackingDataRecord.Deserialize(clone);
        (tdOut.activity[0] instanceof ActivityData_1.ActivityData).should.be.true;
    });
    it('Newest activity cloned', () => {
        let tdIn = new TrackingDataRecord_1.TrackingDataRecord();
        tdIn.newestActivity = new ActivityData_1.ActivityData();
        tdIn.newestActivity.shortDescription = 'desc3';
        let clone = JSON.parse(JSON.stringify(tdIn));
        let tdOut = TrackingDataRecord_1.TrackingDataRecord.Deserialize(clone);
        tdOut.newestActivity.shortDescription.should.equal('desc3');
    });
});
//# sourceMappingURL=TrackingDataRecord.test.js.map