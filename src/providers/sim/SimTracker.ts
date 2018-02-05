import * as request from 'request';

import * as fs from 'fs';
import path = require('path');

import { TrackingData } from "../TrackingData";
import { ActivityData } from "../ActivityData";
import { ITracker } from '../ITracker';
import { UpsTracker } from '../ups/UpsTracker';

export class SimTracker implements ITracker {
    async Track(trackingNumber:string){
        /*return new Promise<TrackingData>((resolve) => {
            resolve(new TrackingData());
        });*/
        return await this.GetSampleTrackingData();
    }

    GetSampleTrackingData = () => {
        return new Promise<TrackingData>((resolve) => {
            fs.readFile(path.resolve(__dirname, 'sim1.txt'), (err, data) => {
                var utd = JSON.parse(data.toString());
                let td = UpsTracker.StandardizeTrackingData(utd);
                resolve(td);
            });
        });
    }
}