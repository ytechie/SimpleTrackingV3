import * as request from 'request';
import * as xml2js from 'xml2js';
import { TrackingData } from '../TrackingData';
import { ITracker } from '../ITracker';
import { ActivityData } from '../ActivityData';
import { Location } from '../../Location';

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
        //valid: Number types: https://tools.usps.com/go/TrackConfirmAction_input

        return trackingNumber.length === 26
            || trackingNumber.length === 22
            || trackingNumber.length === 20
            || trackingNumber.length === 13
            || trackingNumber.length === 10;
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

            let parsed = this.ParseUspsTrackDetail(event);
            if(parsed) {
                ad.location = parsed.location;
                ad.shortDescription = parsed.description;
                ad.timestamp = parsed.timestamp;

                td.activity.push(ad);
            }
        });

        td.usageRequirements = 'NOTICE: U.S.P.S. authorizes you to use U.S.P.S. tracking systems'
            + ' solely to track shipments tendered by or for you to U.S.P.S. for delivery and'
            + ' for no other purpose. Any other use of U.S.P.S. tracking systems and information'
            + ' is strictly prohibited.';

        return td;
    }

    public static ParseUspsTrackDetail(input:string) {
        //Don't look for the I because of casing
        if(input.indexOf('ransit to') > -1) {
            return null;
        }

        let data = {
            description:'',
            timestamp:new Date(),
            location:new Location()
        };
        let parts = input.split(', ');

        //The position of the month/day/time is critical to parsing

        var monthPattern = new RegExp(/(January|February|March|April|May|June|July|August|September|October|November|December) \d{1,2}/g);
        //Determine the position of the month day
        let monthPosition = parts.findIndex((text) => {
            return !!monthPattern.exec(text);
        });

        data.timestamp = new Date(Date.parse(parts[monthPosition] + ', ' + parts[monthPosition+1] + ', ' + parts[monthPosition+2]));

        //the parts before the date are the description
        let descParts = parts.slice(0, monthPosition);
        data.description = descParts.join(', ');

        let locParts = parts.slice(monthPosition+3);
        let locationStr = locParts.join(', ');
        data.location = UspsTracker.ParseLocation(locationStr);

        return data;
    }

    public static ParseLocation(location:string):Location {
        let ret = new Location();

        //This is the fallback
        ret.rawLocationString = location;

        //MIAMI, UNITED STATES
        let r = RegExp(/([^,]+), UNITED STATES/g);
        let a = r.exec(location);
        if(a) {
            ret.city = a[1];
            ret.countryCode = 'US'
            return ret;
        }

        //REXFORD, NY 12148
        r = RegExp(/(.*), ([A-Z]{2}) ([\d-]+)/g);
        a = r.exec(location);
        if(a) {
            ret.city = a[1];
            ret.state = a[2];
            ret.zip = a[3];
            return ret;
        }

        //FORT WORTH TX
        r = RegExp(/^([A-Z ]+) ([A-Z]{2})$/);
        a = r.exec(location);
        if(a) {
            ret.city = a[1];
            ret.state = a[2];
            return ret;
        }

        //Distribution center
        //SEATTLE WA NETWORK DISTRIBUTION CENTER
        r = RegExp(/([A-Z ]+) ([A-Z]{2})(?: NETWORK)* DISTRIBUTION CENTER/);
        a = r.exec(location);
        if(a) {
            ret.city = a[1];
            ret.state = a[2];
            return ret;
        }

        //ISRAEL
        r = RegExp(/^([A-Z ]+)$/);
        a = r.exec(location);
        if(a) {
            ret.countryCode = a[1];
            return ret;
        }

        return ret;
    }
}