import { Cosmos } from '../db/Cosmos';
import { TrackingDataRecord } from '../db/TrackingDataRecord';
import { ITracker } from './ITracker';
import { TrackingData } from './TrackingData';

export class CachingTracker implements ITracker {
    upstream:ITracker;
    cosmos:Cosmos;

    constructor(cosmos:Cosmos, upstream:ITracker) {
        this.cosmos = cosmos;
        this.upstream = upstream;
    }

    async Track(trackingNumber: string): Promise<TrackingData> {
        let cached = await this.cosmos.LoadTrackingData(trackingNumber);

        if(cached) {
            const trackDetails = TrackingDataRecord.Deserialize(cached);
            console.log('Loaded package details from cache');
            return trackDetails;
        }

        return this.upstream.Track(trackingNumber);
    }
}