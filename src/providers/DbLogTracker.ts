import { Cosmos } from '../db/Cosmos';
import { ITracker } from './ITracker';
import { TrackingData } from './TrackingData';

export class DbLogTracker implements ITracker {
    upstream:ITracker;
    connectionString:string;

    cosmos:Cosmos;

    constructor(cosmos:Cosmos, upstreamTracker:ITracker) {
        this.upstream = upstreamTracker;
        this.cosmos = cosmos;
    }

    async Track(trackingNumber: string): Promise<TrackingData> {
        let td = await this.upstream.Track(trackingNumber);

        if(td) {
            this.cosmos.SaveTrackingData(td);
        }

        return td;
    }
}