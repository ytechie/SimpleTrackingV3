import { ITracker } from "./ITracker";
import { TrackingData } from "./TrackingData";

export class MultiTracker implements ITracker {
    trackers:ITracker[];
    
    constructor(trackers:ITracker[]) {
        this.trackers = trackers;
    }

    async Track(trackingNumber: string): Promise<TrackingData> {
        return this.trackers[0].Track(trackingNumber);
    }
}