import { ActivityData } from './ActivityData'
import { Geocoder } from '../geocoder';

//A common format to return all tracking data
export class TrackingData {
    trackingNumber: string;
    estimatedDelivery: Date;
    trackerName: string; //Friendly name for a tracker, for example, UPS or FedEx
    usageRequirements: string;
    serviceType: string; //ground, etc.
    weight: number;
    lastUpdated: Date;
    sourceData: string;
    activity: ActivityData[];

    constructor() {
        this.activity = new Array<ActivityData>();
    }

    async Geocode(geo:Geocoder) {
        for(let element of this.activity) {
            let gps = await geo.Geocode(element.location);
        }
        
    }
}