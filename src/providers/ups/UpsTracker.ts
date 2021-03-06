var request = require('request');
var fs = require('fs');
var path = require('path');
import * as _ from "lodash";

import { TrackingData } from "../TrackingData";
import { ActivityData } from "../ActivityData";
import { ITracker } from '../ITracker';

import * as moment from 'moment'

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
        return new Promise<TrackingData>((resolve, reject) => {
            if(!UpsTracker.IsValidTrackingNumber(trackingNumber)) {
                console.log('Not a USPS Tracking Number');
                resolve(null)
                return;
            }

            let req = this.buildRequest(trackingNumber);

            request.post(this.UPS_DEV_URL, {json: true, body: req}, (error, response, body) => {
                try {
                    if(error) {
                        console.log("Error in UPS tracker request: " + error);
                        reject("Error in UPS tracker request: " + error);
                    }
                    let td = UpsTracker.StandardizeTrackingData(body);
                    td.lastHardFetch = new Date();
                    resolve(td);
                } catch(err) {
                    reject(err);
                }
            });
        });
    }

    public static IsValidTrackingNumber(trackingNumber:string) {
        return trackingNumber.length === 18
            && trackingNumber.startsWith("1Z");
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
        if(upsNativeTrackingData.Fault) {
            console.log('UPS says they have no data for the package');
            return null;
        }

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

        td.trackingNumber = upsNativeTrackingData.TrackResponse.Shipment.InquiryNumber.Value;

        //TODO: FIND THE RIGHT PACKAGE!!!
        if(p instanceof Array) {
            p = _.find(p, (x) => { return x.TrackingNumber === td.trackingNumber });
            //p = p[0]; //very bad for multi-package shipment
        }

        

        if(upsNativeTrackingData.TrackResponse.Shipment.DeliveryDetail
            && upsNativeTrackingData.TrackResponse.Shipment.DeliveryDetail.Type.Code === "03") {
                let upsDateString = upsNativeTrackingData.TrackResponse.Shipment.DeliveryDetail.Date;
                let year = parseInt(upsDateString.substring(0,4));
                let month = parseInt(upsDateString.substring(4,6));
                let day = parseInt(upsDateString.substring(6,8));

                td.estimatedDelivery = new Date(Date.UTC(year, month-1, day));
                td.estimatedDeliveryFriendly = moment(td.estimatedDelivery).calendar();
            }

        //td.estimatedDelivery =
        td.serviceType = upsNativeTrackingData.TrackResponse.Shipment.Service.Description;
        td.weight = p.PackageWeight.Weight + p.PackageWeight.UnitOfMeasurement.Code;

        let activity = p.Activity;
        td.activity = new Array<ActivityData>();
        if(activity) {
            if(!(activity instanceof Array)) {
                let activityArr = [];
                activityArr.push(activity);
                activity = activityArr;
            }

            activity.forEach(a => {
                let newActivity = new ActivityData();
                if(a.ActivityLocation && a.ActivityLocation.Address) {
                    let address = a.ActivityLocation.Address;

                    newActivity.location.city = address.City;
                    newActivity.location.state = address.StateProvinceCode;
                    newActivity.location.zip = address.PostalCode;
                    newActivity.location.countryCode = address.CountryCode;
                }
                
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