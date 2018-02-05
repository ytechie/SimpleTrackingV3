import { TrackingData } from "./TrackingData";

export interface ITracker {
    Track(trackingNumber:string):Promise<TrackingData>;
}