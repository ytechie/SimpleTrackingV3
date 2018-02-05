import { TrackingData } from "./TrackingData";
import { UpsTracker } from "./ups/UpsTracker";
import { ITracker } from "./ITracker";
import { FedexTracker } from "./fedex/FedexTracker";
import { MultiTracker } from "./MultiTracker";
import { SimTracker } from "./sim/SimTracker";

export class Tracker implements ITracker {
    rootTracker:ITracker;

    constructor() {
        
    }

    public LoadTrackers() {
        let trackers = new Array<ITracker>();

        let simTracker = new SimTracker();
        trackers.push(simTracker);

        let upsTracker = new UpsTracker(
            process.env.UPS_USERNAME,
            process.env.UPS_PASSWORD,
            process.env.UPS_KEY
        );
        trackers.push(upsTracker);

        let fedexTracker = new FedexTracker(
            process.env.FEDEX_KEY,
            process.env.FEDEX_PASSWORD,
            process.env.FEDEX_ACCOUNT_NUMBER,
            process.env.FEDEX_METER_NUMBER
        );
        trackers.push(fedexTracker);

        this.rootTracker = new MultiTracker(trackers);
    }

    public async Track(trackingNumber:string):Promise<TrackingData> {
        return this.rootTracker.Track(trackingNumber);
    }
}