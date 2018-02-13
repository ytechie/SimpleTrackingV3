import * as moment from 'moment'
import { Location } from '../Location';

export class ActivityData {
    shortDescription: string;
    timestamp: Date;
    location: Location;

    constructor() {
        //Initialize for safety
        this.location = new Location();
    }

    get locationDislpay() {
        let parts = new Array<string>();
        if(this.location.city) parts.push(this.location.city);
        if(this.location.state) parts.push(this.location.state);
        if(this.location.zip) parts.push(this.location.zip);
        if(this.location.countryCode) parts.push(this.location.countryCode);

        if(parts.length === 0) {
            return this.location.rawLocationString;
        }

        return parts.join(', '); 
    }
    
    get friendlyTimestamp() {
        if(this.timestamp) {
            return moment(this.timestamp).calendar();
        }
        else {
            return "";
        }
    }
}