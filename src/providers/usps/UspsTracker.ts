import * as request from 'request';
import * as xml2js from 'xml2js';
import { TrackingData } from '../TrackingData';
import { ITracker } from '../ITracker';
import { ActivityData } from '../ActivityData';

export class UspsTracker implements ITracker {
    requestUrl:string = 'http://production.shippingapis.com/ShippingAPI.dll?'
        + 'API=TrackV2&XML=<TrackRequest PASSWORD="{password}" USERID="{userId}">'
        + '<TrackID ID="{trackingNumber}" /></TrackRequest>'
        
    userId: string;
    password:string;

    constructor(userId:string, password:string) {
        this.userId = userId;
        this.password = password;
    }

    private buildRequest(trackingNumber:string) {
        return this.requestUrl
            .replace('{userId}', this.userId)
            .replace('{password}', this.password)
            .replace('{trackingNumber}', trackingNumber);
    }

    async Track(trackingNumber:string):Promise<TrackingData> {
        return new Promise<TrackingData>((resolve, reject) => {
            if(!UspsTracker.IsValidTrackingNumber(trackingNumber)) {
                console.log('Not a USPS Tracking Number');
                resolve(null);
                return;
            }

            let req = this.buildRequest(trackingNumber);

            request.post(req, async (error, response, body) => {
                try { //Try catch is needed inside the request
                    if(error) {
                        console.log("Error in USPS tracker request: " + error);
                        reject("Error in USPS tracker request: " + error);
                        return;
                    }

                    let td = await UspsTracker.ConvertResponseToTrackData(body);
                    resolve(td);
                } catch(err) {
                    reject(err);
                }
            });
        });
    }

    public static IsValidTrackingNumber(trackingNumber:string) {
        return trackingNumber.length === 20
            || trackingNumber.length === 22;
    }

    public static async ConvertResponseToTrackData(response:any):Promise<TrackingData> {
        return new Promise<TrackingData>((resolve, reject) => {
            let parser = new xml2js.Parser({explicitArray: false});
            parser.parseString(response, (err, result) => {
                try {
                    if(err) {
                        reject(err);
                    } else {
                        let td = UspsTracker.ParseJsonToTrackData(result)
                        resolve(td);
                    }
                } catch(error) {
                    reject(error);
                }
            });
        });
    }

    static ParseJsonToTrackData(json:any):TrackingData {
        let td = new TrackingData();
        td.activity = new Array<ActivityData>();

        td.trackingNumber = json.TrackResponse.TrackInfo['$'].ID;

        json.TrackResponse.TrackInfo.TrackDetail.forEach((event) => {
            let ad = new ActivityData();
            
            let parts = event.split(', ');

            //Ignore useless update
            if(parts[0] !== 'In Transit to Destination') {
                ad.shortDescription = parts.shift();
                if(parts.length === 7) {
                    ad.shortDescription += ', ' + parts.shift();
                }
                ad.timestamp = new Date(Date.parse(parts.shift() + ', ' + parts.shift() + ', ' + parts.shift()));

                //Arrived at USPS Regional Origin Facility, November 17, 2017, 8:38 pm, FORT WORTH TX DISTRIBUTION CENTER
                if(parts.length === 1) {
                    let loc = parts.shift();
                    loc = loc.replace(' DISTRIBUTION CENTER', '')
                    ad.locationDescription = loc;
                } else {
                    ad.locationDescription = parts.shift() + ', ' + parts.shift();
                }
                
                td.activity.push(ad);
            }
        });

        return td;
    }
}