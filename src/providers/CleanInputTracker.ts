import { ITracker } from "./ITracker";
import { TrackingData } from "./TrackingData";

export class CleanInputTracker implements ITracker {
    baseTracker:ITracker;

    constructor(baseTracker:ITracker) {
        this.baseTracker = baseTracker;
    }

    async Track(trackingNumber: string): Promise<TrackingData> {
        let tn = trackingNumber.trim();

        return await this.baseTracker.Track(tn);
    }
}