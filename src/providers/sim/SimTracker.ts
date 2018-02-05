import * as request from 'request';

var fs = require('fs');
var path = require('path');

import { TrackingData } from "../TrackingData";
import { ActivityData } from "../ActivityData";
import { ITracker } from '../ITracker';
import { UpsTracker } from '../ups/UpsTracker';

export class SimTracker implements ITracker {
    async Track(trackingNumber:string){
        if(trackingNumber === 'sim1') {
            return await this.GetSampleTrackingData(); 
        }

        return null;
    }

    GetSampleTrackingData() {
        var standardize = UpsTracker.StandardizeTrackingData;
        return new Promise<TrackingData>((resolve) => {
            fs.readFile(path.resolve(__dirname, 'sim1.txt'), (err, data) => {
                var utd = JSON.parse(data.toString());
                let td = standardize(utd);
                resolve(td);
            });
        });
    }
}