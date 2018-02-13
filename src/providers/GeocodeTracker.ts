import { ITracker } from "./ITracker";
import { TrackingData } from "./TrackingData";
import { Geocoder } from "../geocoder";

export class GeocodeTracker implements ITracker {
    private upstreamTracker:ITracker;
    private geocoder:Geocoder;

    constructor(upstreamTracker:ITracker) {
        this.upstreamTracker = upstreamTracker;
        this.geocoder = new Geocoder();
    }

    async Track(trackingNumber: string) {
        let td = await this.upstreamTracker.Track(trackingNumber);

        if(td) {
            await td.Geocode(this.geocoder);
            return td;
        } else {
            return td;
        }
    }
}