import * as moment from 'moment'

export class ActivityData {
    locationDescription: string;
    shortDescription: string;
    timestamp: Date;
    location: [number, number];
    
    get friendlyTimestamp() {
        if(this.timestamp) {
            return moment(this.timestamp).calendar();
        }
        else {
            return "";
        }
    }
}