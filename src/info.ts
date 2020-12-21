import handlebars = require("handlebars");
import { Cosmos } from "./db/Cosmos";

export class Info {
    cosmos:Cosmos;

    numberOfPackages:number;
    packageLocationJson:handlebars.SafeString;

    constructor() {
        this.cosmos = new Cosmos(process.env.COSMOS_CONNECTION_STRING);
    }
    
    async Collect() {
        let result = await this.cosmos.GetTrackingNumberCount();
        let r = await result.fetchNext();
        console.log('Query cost ' + r.requestCharge.valueOf() + ' RUs');
        this.numberOfPackages = r.resources[0].$1 as number;


        let allPackages = await this.cosmos.GetCurrentPackageLocations();
        let json = JSON.stringify(allPackages);
        this.packageLocationJson = new handlebars.SafeString(JSON.stringify(json))
    }
}