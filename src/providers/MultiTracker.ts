import { ITracker } from "./ITracker";
import { TrackingData } from "./TrackingData";

export class MultiTracker implements ITracker {
    trackers:ITracker[];
    
    constructor(trackers:ITracker[]) {
        this.trackers = trackers;
    }

    async Track(trackingNumber: string): Promise<TrackingData> {
        return new Promise<TrackingData>((resolve) => {
            var foundMatch = false;
            var resolveCount = 0;
            //Return the results from the first tracker that responds with data
            this.trackers.forEach((tracker) => {
                tracker.Track(trackingNumber).then((trackingData) => {
                    resolveCount++;
                    if(!foundMatch && trackingData) {
                        foundMatch = true;
                        resolve(trackingData);
                    }
                    if(resolveCount === this.trackers.length) {
                        resolve(null);
                    }
                }).catch((error) => {
                    resolveCount++;
                    console.error(error);
                });;
            });
        });
    }
}