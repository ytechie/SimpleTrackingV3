import * as fs from 'fs';
import * as path from 'path';
import * as request from 'request-promise';
import * as xml2js from 'xml2js-es6-promise';
import { TrackingData } from '../TrackingData';
import { ITracker } from '../ITracker';
import { ActivityData } from '../ActivityData';

export class FedexTracker implements ITracker {
    FEDEX_API_URL = "https://wsbeta.fedex.com:443/web-services/track";

    trackRequestTemplate:string = '';

    key:string;
    password:string;
    accountNumber:string;
    meterNumber:string;

    constructor(key:string, password:string, accountNumber:string, meterNumber:string) {
        this.key = key;
        this.password = password;
        this.accountNumber = accountNumber;
        this.meterNumber = meterNumber;
    }

    private buildRequest(trackingNumber:string) {
        if(this.trackRequestTemplate.length === 0) {
            let templatePath = path.join(__dirname, 'RequestTemplate.xml');
            this.trackRequestTemplate = fs.readFileSync(templatePath).toString();
        }

        return this.trackRequestTemplate 
            .replace('{key}', this.key)
            .replace('{password}', this.password)
            .replace('{accountNumber}', this.accountNumber)
            .replace('{meterNumber}', this.meterNumber)
            .replace('{trackingNumber}', trackingNumber);
    }

    async Track(trackingNumber:string) {
        if(!FedexTracker.IsValidTrackingNumber(trackingNumber)) {
            console.log('Not a FedEx Tracking Number');
            return null;
        }

        let req = this.buildRequest(trackingNumber);

        let options = {
                body:req,
                headers:
                    {
                        //'Host': 'wsbeta.fedex.com:443',
                    }
        };

        let body = await request.post(this.FEDEX_API_URL, options);
        let json = await xml2js(body, {explicitArray: false});

        //Unwrap the SOAP envelope
        json = json['SOAP-ENV:Envelope']['SOAP-ENV:Body'];

        let td = FedexTracker.ConvertJsonToStandardFormat(json);
        return td;
    }

    public static IsValidTrackingNumber(trackingNumber:string) {
        return trackingNumber.length === 12
            || trackingNumber.length === 15
            || trackingNumber.length === 22;
    }

    public static ConvertJsonToStandardFormat(results:any):TrackingData {
        if(results["v3:TrackReply"] && results["v3:TrackReply"]["v3:HighestSeverity"] === "ERROR") {
            console.error('Got a non-expected error from fedex');
            return null;
        }

        //Check for invalid tracking number code
        if(results.TrackReply.CompletedTrackDetails.TrackDetails.Notification.Code === "9040") {
            console.log('Fedex says they have no data for the package');
            return null;
        }

        let td = new TrackingData();
        td.activity = new Array<ActivityData>();
        let a = results.TrackReply.CompletedTrackDetails.TrackDetails;
        let trackDetail = results.TrackReply.CompletedTrackDetails.TrackDetails;

        td.trackingNumber = trackDetail.TrackingNumber;
        if(trackDetail.PackageWeight) {
            td.weight = trackDetail.PackageWeight.Value + trackDetail.PackageWeight.Units;
        }
        if(trackDetail.ActualDeliveryTimestamp) {
            td.estimatedDelivery = new Date(Date.parse(trackDetail.ActualDeliveryTimestamp));
        }
        if(trackDetail.Events instanceof Array) {
            trackDetail.Events.forEach((event) => {
                var ad = new ActivityData();
                ad.timestamp = new Date(Date.parse(event.Timestamp));

                ad.location.city = event.Address.City;
                ad.location.state = event.Address.StateOrProvinceCode;
                ad.location.zip = event.Address.PostalCode;
                ad.location.countryCode = event.Address.CountryCode;

                ad.shortDescription = event.EventDescription;
                td.activity.push(ad);
            });
        } else {
            var ad = new ActivityData();
            ad.timestamp = new Date(Date.parse(trackDetail.Events.Timestamp));
            ad.location.city = trackDetail.Events.Address.City;
            ad.location.state = trackDetail.Events.Address.StateOrProvinceCode;
            ad.location.zip = trackDetail.Events.Address.PostalCode;
            ad.location.countryCode = trackDetail.Events.Address.CountryCode;

            td.activity.push(ad);
        }

        td.usageRequirements = "NOTICE: FedEx authorizes you to use FedEx tracking"
            + " systems solely to track shipments tendered by"
            + " or for you to FedEx for delivery and for no other"
            + " purpose. Any other use of FedEx tracking systems and"
            + " information is strictly prohibited.";

        return td;
    }
}