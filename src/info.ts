import { Cosmos } from "./db/Cosmos";

export class Info {
    cosmos:Cosmos;

    numberOfPackages:number;

    constructor() {
        this.cosmos = new Cosmos(process.env.COSMOS_CONNECTION_STRING);
    }
    
    async Collect() {
        let result = await this.cosmos.GetTrackingNumberCount();
        let r = await result.fetchNext();
        console.log('Query cost ' + r.requestCharge.valueOf() + ' RUs');
        this.numberOfPackages = r.resources[0].$1 as number;
    }
}