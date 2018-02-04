import { TrackingData } from "./TrackingData";
import { UpsTracker } from "./ups/upstracker";

export class Tracker {
    public static Track(trackingNumber:string):TrackingData {
        let td = UpsTracker.GetSampleTrackingData();

        return td;
    }
}