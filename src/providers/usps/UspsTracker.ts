import * as request from 'request-promise';
import * as xml2js from 'xml2js-es6-promise';
import { TrackingData } from '../TrackingData';
import { ITracker } from '../ITracker';
import { ActivityData } from '../ActivityData';
import { Location } from '../../Location';

export class UspsTracker implements ITracker {
    requestUrl:string = 'https://secure.shippingapis.com/ShippingAPI.dll?'
        + 'API=TrackV2&XML=<TrackFieldRequest PASSWORD="{password}" USERID="{userId}">'
        + '<Revision>1</Revision><ClientIp>127.0.0.1</ClientIp><SourceId>XYZCasdfasdf</SourceId>'
        + '<TrackID ID="{trackingNumber}" /></TrackFieldRequest>';

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

    async Track(trackingNumber:string) {
            if(!UspsTracker.IsValidTrackingNumber(trackingNumber)) {
                console.log('Not a USPS Tracking Number');
                return null;
            }

            let reqUrl = this.buildRequest(trackingNumber);

            let body = await request.get(reqUrl);
            let td = await UspsTracker.ConvertResponseToTrackData(body);
            td.lastHardFetch = new Date();
            return td;
    }

    public static IsValidTrackingNumber(trackingNumber:string) {
        //valid: Number types: https://tools.usps.com/go/TrackConfirmAction_input

        return trackingNumber.length === 30
            || trackingNumber.length === 26
            || trackingNumber.length === 22
            || trackingNumber.length === 20
            || trackingNumber.length === 13
            || trackingNumber.length === 10;
    }

    public static async ConvertResponseToTrackData(response:any) {
        let json = await xml2js(response, {explicitArray: false});
        let td = UspsTracker.ParseJsonToTrackData(json)
        return td;
    }

    static ParseJsonToTrackData(json:any):TrackingData {
        let td = new TrackingData();
        td.trackerName = "USPS";
        td.activity = new Array<ActivityData>();

        td.trackingNumber = json.TrackResponse.TrackInfo['$'].ID;

        let detail = json.TrackResponse.TrackInfo.TrackDetail;

        if(!(detail instanceof Array)) {
            detail = [];
            detail.push(json.TrackResponse.TrackInfo.TrackDetail);
        }

        detail.unshift(json.TrackResponse.TrackInfo.TrackSummary);
        for (var event of detail) {
            let ad = new ActivityData();

            const cleanLoc = UspsTracker.cleanCityName(event.EventCity as string);
            if(cleanLoc) {
                ad.location.city = cleanLoc.city;
                ad.location.state = cleanLoc.state;
            } else {
                ad.location.city = event.EventCity;
                ad.location.state = event.EventState;
            }

            ad.location.zip = event.EventZIPCode;
            ad.location.countryCode = event.EventCountry;

            ad.timestamp = new Date(event.EventDate + ' ' + event.EventTime);

            ad.shortDescription = event.Event;

            td.activity.push(ad);
        };

        td.usageRequirements = 'NOTICE: U.S.P.S. authorizes you to use U.S.P.S. tracking systems'
            + ' solely to track shipments tendered by or for you to U.S.P.S. for delivery and'
            + ' for no other purpose. Any other use of U.S.P.S. tracking systems and information'
            + ' is strictly prohibited.';

        return td;
    }

    static cleanCityName(cityStr:string) {
        //City names can sometimes have a description in them like:
        // OAK CREEK WI DISTRIBUTION CENTER
        let dcIndex = cityStr.indexOf('NETWORK DISTRIBUTION');
        if(dcIndex === -1) {
            dcIndex = cityStr.indexOf('DISTRIBUTION');
        }
        if(dcIndex === -1) {
            dcIndex = cityStr.indexOf('PROCESSING CENTER');
        }

        if(dcIndex > 0) {
            return {
                state: cityStr.substr(dcIndex - 3, 2),
                city: cityStr.substring(0, dcIndex - 4)
            };
        } else {
            return null;
        }
    }
}