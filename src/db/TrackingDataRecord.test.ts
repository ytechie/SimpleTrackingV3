import * as chai from 'chai';
import { ActivityData } from '../providers/ActivityData';
import { TrackingDataRecord } from "./TrackingDataRecord";
import { Location } from "../Location";

chai.should();

describe('TrackingDataRecord', () => {
    it('Deserialize', () => {
        let tdIn = new TrackingDataRecord();
        tdIn.trackingNumber = '123';
        tdIn.activity = [];
        tdIn.activity.push(new ActivityData())
        tdIn.activity[0].shortDescription = 'shortdesc';
        tdIn.activity[0].location = new Location();
        tdIn.activity[0].location.city = 'mycity';

        let clone = JSON.parse(JSON.stringify(tdIn));

        let tdOut = TrackingDataRecord.Deserialize(clone)
        
        tdOut.trackingNumber.should.equal('123');
        tdOut.activity[0].shortDescription.should.equal('shortdesc');
        tdOut.activity[0].location.city.should.equal('mycity');
    });
    
    it('Activity type is correct', () => {
        let tdIn = new TrackingDataRecord();
        tdIn.trackingNumber = '123';
        tdIn.activity = [];
        tdIn.activity.push(new ActivityData())
        tdIn.activity[0].shortDescription = 'shortdesc';
        tdIn.activity[0].location = new Location();
        tdIn.activity[0].location.city = 'mycity';

        let clone = JSON.parse(JSON.stringify(tdIn));

        let tdOut = TrackingDataRecord.Deserialize(clone);
        
        (tdOut.activity[0] instanceof ActivityData).should.be.true;
    });

    it('Newest activity cloned', () => {
        let tdIn = new TrackingDataRecord();
        tdIn.newestActivity = new ActivityData();
        tdIn.newestActivity.shortDescription = 'desc3';

        let clone = JSON.parse(JSON.stringify(tdIn));

        let tdOut = TrackingDataRecord.Deserialize(clone);
        
        tdOut.newestActivity.shortDescription.should.equal('desc3');
    });
});