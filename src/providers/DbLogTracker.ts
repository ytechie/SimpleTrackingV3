import * as mongo from 'mongodb';
import { ITracker } from './ITracker';
import { TrackingData } from './TrackingData';

export class DbLogTracker implements ITracker {
    upstream:ITracker;
    connectionString:string;
    client:mongo.MongoClient;

    constructor(connectionString:string, upstreamTracker:ITracker) {
        this.connectionString = connectionString;
        this.upstream = upstreamTracker;
    }

    async Track(trackingNumber: string): Promise<TrackingData> {
        let td = await this.upstream.Track(trackingNumber);

        //Fire and forget
        if(this.connectionString) {
            this.saveTrackingData(trackingNumber, td);
        }

        return td;
    }

    async saveTrackingData(trackingNumber:string, td:TrackingData) {
        let client = await mongo.MongoClient.connect(this.connectionString);
        let db = client.db('track');
        let collection = db.collection('trackActivity');

        let rec = await collection.findOne({trackingNumber:trackingNumber});

        if(rec) {
            rec.data = td;
            rec.updated = Date.now();

            await collection.replaceOne({trackingNumber:trackingNumber}, rec);
        } else {
            let newRec = {
                trackingNumber: trackingNumber,
                added: Date.now(),
                updated: Date.now(),
                data:td
            }
    
            await collection.insertOne(newRec);
        }
        
        await client.close();
    }
}