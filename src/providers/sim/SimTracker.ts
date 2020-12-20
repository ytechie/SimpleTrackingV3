import * as request from 'request';

import * as fs from 'fs';
import * as path from 'path';

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
        return new Promise<TrackingData>((resolve, reject) => {
            try {
            fs.readFile(path.resolve(__dirname, 'sim1.txt'), (err, data) => {
                var utd = JSON.parse(data.toString());
                let td = UpsTracker.StandardizeTrackingData(utd);
                td.lastHardFetch = new Date();
                resolve(td);
            });
            } catch(err) {
                reject(err);
            }
        });
    }
}