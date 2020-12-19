import { TrackingData } from '../providers/TrackingData';
import { Container, CosmosClient } from '@azure/cosmos';

export class Cosmos {
    private container:Container;

    constructor(connectionString:string) {
        const client = new CosmosClient(connectionString);
        
        const database = client.database('packages');
        this.container = database.container('main');
    }

    async SaveTrackingData(td:TrackingData) {
        //Add an ID so upserts work
        let tagged:any = td;
        tagged.id = td.trackingNumber;

        await this.container.items.upsert(tagged);
    }
}