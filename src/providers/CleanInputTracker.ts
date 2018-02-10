import { ITracker } from "./ITracker";
import { TrackingData } from "./TrackingData";

export class CleanInputTracker implements ITracker {
    baseTracker:ITracker;

    constructor(baseTracker:ITracker) {
        this.baseTracker = baseTracker;
    }

    async Track(trackingNumber: string): Promise<TrackingData> {
        let tn = CleanInputTracker.CleanTrackingNumber(trackingNumber);

        return await this.baseTracker.Track(tn);
    }

    public static CleanTrackingNumber(trackingNumber:string) {
        //The regex is needed to replace ALL instances
        //instead of just the first
        return trackingNumber.replace(/ /g, '');
    }
}