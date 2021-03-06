import { TrackingData } from "./TrackingData";
import { UpsTracker } from "./ups/UpsTracker";
import { ITracker } from "./ITracker";
import { FedexTracker } from "./fedex/FedexTracker";
import { MultiTracker } from "./MultiTracker";
import { SimTracker } from "./sim/SimTracker";
import { CleanInputTracker } from "./CleanInputTracker";
import { UspsTracker } from "./usps/UspsTracker";
import { DbLogTracker } from "./DbLogTracker";
import { GeocodeTracker } from "./GeocodeTracker";
import { Cosmos } from "../db/Cosmos";
import { CachingTracker } from "./CachingTracker";

export class Tracker implements ITracker {
    rootTracker:ITracker;

    constructor() {
        
    }

    public LoadTrackers() {
        let trackers = new Array<ITracker>();

        let simTracker = new SimTracker();
        trackers.push(simTracker);

        if(process.env.UPS_USERNAME
            && process.env.UPS_PASSWORD
            && process.env.UPS_KEY) {
            let upsTracker = new UpsTracker(
                process.env.UPS_USERNAME,
                process.env.UPS_PASSWORD,
                process.env.UPS_KEY
            );
            trackers.push(upsTracker);
        } else {
            console.error('UPS Tracker not loaded due to missing environment variables');
        }

        if(process.env.FEDEX_KEY
            && process.env.FEDEX_PASSWORD
            && process.env.FEDEX_ACCOUNT_NUMBER
            && process.env.FEDEX_METER_NUMBER) {
            let fedexTracker = new FedexTracker(
                process.env.FEDEX_KEY,
                process.env.FEDEX_PASSWORD,
                process.env.FEDEX_ACCOUNT_NUMBER,
                process.env.FEDEX_METER_NUMBER
            );
            trackers.push(fedexTracker);
        } else {
            console.error('Fedex Tracker not loaded due to missing environment variables');
        }

        if(process.env.USPS_USERNAME
            && process.env.USPS_PASSWORD) {
            let uspsTracker = new UspsTracker(
                process.env.USPS_USERNAME,
                process.env.USPS_PASSWORD
            );
            trackers.push(uspsTracker);
        } else {
            console.error('USPS Tracker not loaded due to missing environment variables');
        }

        let multiTracker = new MultiTracker(trackers);
        let geocodeTracker = new GeocodeTracker(multiTracker);
        

        if(process.env.COSMOS_CONNECTION_STRING) {
            let cosmos = new Cosmos(process.env.COSMOS_CONNECTION_STRING);

            //Clean input -> db log -> caching -> geocode

            let cachingTracer = new CachingTracker(cosmos, geocodeTracker)
            let dbLogTracker = new DbLogTracker(cosmos, cachingTracer);
            let cleanInputTracker = new CleanInputTracker(dbLogTracker);
    
            this.rootTracker = cleanInputTracker;
        } else {
            let cleanInputTracker = new CleanInputTracker(geocodeTracker);
            this.rootTracker = cleanInputTracker;
        }        
    }

    public async Track(trackingNumber:string):Promise<TrackingData> {
        return this.rootTracker.Track(trackingNumber);
    }
}