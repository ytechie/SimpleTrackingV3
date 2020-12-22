import { TrackingData } from '../providers/TrackingData';
import { TrackingDataRecord } from './TrackingDataRecord';

import { Container, CosmosClient } from '@azure/cosmos';

export class Cosmos {
    private container:Container;

    constructor(connectionString:string) {
        const client = new CosmosClient(connectionString);
        
        const database = client.database('packages');
        this.container = database.container('main');
    }

    async SaveTrackingData(td:TrackingData) {
        let tdClone:TrackingDataRecord = JSON.parse(JSON.stringify(td));

        //Add an ID so upserts work
        tdClone.id = td.trackingNumber;

        //Don't need to keep storing usage requirements
        tdClone.usageRequirements = null;

        if(tdClone.activity && tdClone.activity.length > 0) {
            tdClone.newestActivity = tdClone.activity[0];

            tdClone.delivered = tdClone.activity[0].shortDescription.indexOf("Delivered") >= 0;
        }

        await this.container.items.upsert(tdClone);
    }

    async LoadTrackingData(trackingNumber:string): Promise<TrackingDataRecord> {
        let qr = await this.container.items.query<TrackingDataRecord>(" \
            SELECT * FROM c \
            where c.id = '" + trackingNumber + "' \
            and ( \
                (c.delivered = true and c.lastHardFetch > DateTimeAdd('hh', -24, GetCurrentDateTime())) \
                or (c.lastHardFetch > DateTimeAdd('mi', -15, GetCurrentDateTime())) \
            ) \
        ");

        if(qr.hasMoreResults) {
            let rec = await qr.fetchNext();
            return rec.resources[0];
        }

        return null;
    }

    async GetTrackingNumberCount() {
        return await this.container.items.query("select count(1) from c");
    }

    async GetCurrentPackageLocations():Promise<any[]> {
        let results = await this.container.items.query(' \
            SELECT c.newestActivity.location.lat, c.newestActivity.location.long \
            FROM c \
            Where IS_DEFINED(c.newestActivity.location.lat) \
        ');

        let fetched = await results.fetchAll();

        return fetched.resources;
    }
}