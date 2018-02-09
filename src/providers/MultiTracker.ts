import { ITracker } from "./ITracker";
import { TrackingData } from "./TrackingData";

export class MultiTracker implements ITracker {
    trackers:ITracker[];
    
    constructor(trackers:ITracker[]) {
        this.trackers = trackers;
    }

    async Track(trackingNumber: string): Promise<TrackingData> {
        return new Promise<TrackingData>((resolve, reject) => {
            var foundMatch = false;
            var resolveCount = 0;
            //Return the results from the first tracker that responds with data
            this.trackers.forEach((tracker) => {
                let remainingTrackers = this.trackers;
                tracker.Track(trackingNumber).then((trackingData) => {
                    console.log('Tracker ' + tracker.constructor.name + ' responded');
                    resolveCount++;
                    if(!foundMatch && trackingData) {
                        foundMatch = true;
                        console.log('Found a tracker with data');
                        resolve(trackingData);
                    }
                    if(resolveCount === this.trackers.length) {
                        resolve(null);
                    }
                }).catch((error) => {
                    console.error('Tracker ' + tracker.constructor.name + ' responded with error ' + error);
                    resolveCount++;

                    //If the last tracker errors, we still need to respond upstream
                    if(resolveCount === this.trackers.length) {
                        resolve(null);
                    }
                });
            });
        });
    }
}