import * as moment from 'moment'

export class ActivityData {
    shortDescription: string;
    timestamp: Date;
    latLong: [number, number];
    location: {
        city:string,
        state:string,
        zip:string,
        countryCode:string
    }

    constructor() {
        //Initialize for safety
        this.location = {
            city:'',
            state:'',
            zip:'',
            countryCode:''
        }
    }

    get locationDislpay() {
        let parts = new Array<string>();
        if(this.location.city) parts.push(this.location.city);
        if(this.location.state) parts.push(this.location.state);
        if(this.location.zip) parts.push(this.location.zip);
        if(this.location.countryCode) parts.push(this.location.countryCode);

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