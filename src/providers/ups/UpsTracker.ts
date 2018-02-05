import * as request from 'request';

import fs = require('fs');
import path = require('path');

import { TrackingData } from "../TrackingData";
import { ActivityData } from "../ActivityData";
import { ITracker } from '../ITracker';

export class UpsTracker implements ITracker {
    UPS_DEV_URL = 'https://onlinetools.ups.com/rest/Track';

    username: string;
    password: string;
    apikey: string;

    constructor(username:string, password:string, apiKey:string) {
        this.username = username;
        this.password = password;
        this.apikey = apiKey;
    }

    async Track(trackingNumber:string) {
        return new Promise<TrackingData>((resolve) => {
            let req = this.buildRequest(trackingNumber);

            request.post(this.UPS_DEV_URL, {body: req}, (error, response, body) => {
                let td = UpsTracker.StandardizeTrackingData(JSON.parse(body));
                resolve(td);
            });
        });
    }

    private buildRequest(trackingNumber:string) {
        return {
            "UPSSecurity": {
                "UsernameToken": {
                    "Username": this.username,
                    "Password": this.password
                },
                "ServiceAccessToken": {
                    "AccessLicenseNumber": this.apikey
                }
            },
            "TrackRequest": {
                "Request": {
                    "RequestOption": "1", "TransactionReference": {
                        "CustomerContext": "Your Test Case Summary Description"
                    }
                },
                "InquiryNumber": trackingNumber
            }
        }
    }

    public static StandardizeTrackingData(upsNativeTrackingData:any) {
        let td = new TrackingData();

        //td.soureData = upsNativeTrackingData;
        td.trackerName = "UPS";
        td.usageRequirements = 'NOTICE: The UPS package tracking systems accessed via this service (the \"Tracking Systems\") and tracking information' +
        ' obtained through this service (the "Information") are the private property of UPS. UPS authorizes you to use the Tracking Systems solely to track shipments' +
        ' tendered by or for you to UPS for delivery and for no other purpose. Without limitation, you are not authorized to make the Information available on any web' +
        ' site or otherwise reproduce, distribute, copy, store, use or sell the Information for commercial gain without the express written consent of UPS. This is a' +
        ' personal service, thus your right to use the Tracking Systems or Information is non-assignable. Any access or use that is inconsistent with these terms is' +
        ' unauthorized and strictly prohibited.';

        let p = upsNativeTrackingData.TrackResponse.Shipment.Package;

        td.trackingNumber = p.TrackingNumber;
        //td.estimatedDelivery =
        td.serviceType = upsNativeTrackingData.TrackResponse.Shipment.Service.Description;
        td.weight = p.PackageWeight.Weight + p.PackageWeight.UnitOfMeasurement.Code;

        let activity = upsNativeTrackingData.TrackResponse.Shipment.Package.Activity;
        td.activity = new Array<ActivityData>();
        if(activity) {
            activity.forEach(a => {
                let newActivity = new ActivityData();
                newActivity.locationDescription =
                    a.ActivityLocation && a.ActivityLocation.Address && a.ActivityLocation.Address.City;
                newActivity.shortDescription = a.Status && a.Status.Description;
                if(a.Time && a.Date) {
                    //Date format: "20171214"
                    //Time format: "151000"
                    let year = parseInt(a.Date.substring(0,4));
                    let month = parseInt(a.Date.substring(4,6)) - 1; //month is zero based
                    let day = parseInt(a.Date.substring(6,8));
                    let hour = parseInt(a.Time.substring(0,2));
                    let minute = parseInt(a.Time.substring(2,4));
                    let second = parseInt(a.Time.substring(4,6));

                    newActivity.timestamp = new Date(year, month, day, hour, minute, second);
                }

                td.activity.push(newActivity);
            });
        }

        return td;
    }
}