import { TrackingData } from '../providers/TrackingData';
import { TrackingDataRecord } from './TrackingDataRecord';

import { Container, CosmosClient } from '@azure/cosmos';
import { TagData } from '../tagging/TagData';
import { resourceUsage } from 'process';

export class Cosmos {
    private itemsContainer:Container;
    private tagsContainer:Container;

    constructor(connectionString:string) {
        const client = new CosmosClient(connectionString);
        
        const database = client.database('packages');
        this.itemsContainer = database.container('main');
        this.tagsContainer = database.container('tags');
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

        await this.itemsContainer.items.upsert(tdClone);
    }

    //todo: have this call the function below it, but the caching tracker will need to
    //skip using stale data.
    async LoadTrackingData(trackingNumber:string): Promise<TrackingDataRecord> {
        let qr = await this.itemsContainer.items.query<TrackingDataRecord>(" \
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

    async LoadMultipleTrackingData(trackingNumbers:string[]): Promise<TrackingDataRecord[]> {
        let qr = await this.itemsContainer.items.query<TrackingDataRecord>({
            query: " \
            SELECT * \
            FROM t \
            Where ARRAY_CONTAINS(@trackingNumbers, t.id) = true",
            parameters: [{ name: '@trackingNumbers', value: trackingNumbers }]
        });

        const results = await qr.fetchAll();
        let recs = new Array<TrackingDataRecord>();
        if(results.resources.length > 0) {
            for(let i = 0; i < results.resources.length; i++) {
                recs.push(TrackingDataRecord.Deserialize(results.resources[i]));
            }
        }

        console.log('Got %i recs using %f RUs', recs.length, results.requestCharge.valueOf());

        return recs;
    }

    async GetTrackingNumberCount() {
        return await this.itemsContainer.items.query("select count(1) from c");
    }

    async GetCurrentPackageLocations():Promise<any[]> {
        let results = await this.itemsContainer.items.query(' \
            SELECT c.newestActivity.location.lat, c.newestActivity.location.long \
            FROM c \
            Where IS_DEFINED(c.newestActivity.location.lat) \
        ');

        /*
            Alternate:

            SELECT c.activity[0].location.lat, c.activity[0].location.long 
            FROM c 
            Where IS_DEFINED(c.activity[0].location.lat)
        */

        let fetched = await results.fetchAll();

        console.log('Got %i package locations using %f RUs', fetched.resources.length, fetched.requestCharge.valueOf())

        return fetched.resources;
    }

    async SaveTag(tag:TagData) {
        this.tagsContainer.items.upsert(tag);
    }

    async GetTag(tagName:string):Promise<TagData> {
        let results = this.tagsContainer.items.query<TagData>({
            query: "Select * From t Where t.name = @tagName",
            parameters: [
                { name: '@tagName', value: tagName }
            ]
        });

        const data = await results.fetchNext();
        if(data.resources.length > 0) {
            return data.resources[0];
        } else {
            return null;
        }
    }

    async GetTagsByTrackingNumber(trackingNumber:string):Promise<TagData[]> {
        let results = this.tagsContainer.items.query<TagData>( " \
            select t \
            from t \
            Join (select value tn from tn in t.trackingNumbers where tn = '" + trackingNumber + "') as tns \
            ");

        let fetched = await results.fetchAll();
        if(fetched.resources.length > 0) {
            return fetched.resources;
        } else {
            return null;
        }

        /*

            SELECT c
            FROM c
            join (select value activity from activity in c.activity where activity.timestamp = '2020-12-03T03:09:00.000Z')

        */
    }
}