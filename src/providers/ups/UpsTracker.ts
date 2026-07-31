import * as request from 'request-promise';
import * as _ from 'lodash';
import * as moment from 'moment';

import { TrackingData } from '../TrackingData';
import { ActivityData } from '../ActivityData';
import { ITracker } from '../ITracker';
import { OAuthTokenProvider } from '../OAuthTokenProvider';

// UPS Tracking API (REST/JSON + OAuth 2.0).
// Docs: https://developer.ups.com/api/reference?loc=en_US#tag/Tracking
export class UpsTracker implements ITracker {
    UPS_BASE_URL = 'https://onlinetools.ups.com';

    tokenProvider: OAuthTokenProvider;

    constructor(clientId: string, clientSecret: string, baseUrl?: string) {
        if (baseUrl) {
            this.UPS_BASE_URL = baseUrl;
        }
        // UPS expects the client credentials as an HTTP Basic auth header.
        this.tokenProvider = new OAuthTokenProvider(
            this.UPS_BASE_URL + '/security/v1/oauth/token',
            clientId,
            clientSecret,
            { useBasicAuth: true }
        );
    }

    async Track(trackingNumber: string) {
        if (!UpsTracker.IsValidTrackingNumber(trackingNumber)) {
            console.log('Not a UPS Tracking Number');
            return null;
        }

        const token = await this.tokenProvider.getToken();

        let body;
        try {
            body = await request.get(
                this.UPS_BASE_URL + '/api/track/v1/details/' + encodeURIComponent(trackingNumber),
                {
                    headers: {
                        'Authorization': 'Bearer ' + token,
                        'transId': Date.now().toString(),
                        'transactionSrc': 'simpletracking',
                        'Content-Type': 'application/json'
                    },
                    qs: { locale: 'en_US' },
                    json: true
                }
            );
        } catch (err) {
            // UPS returns a 404 with an errors payload when it has no data for the package.
            if (err && err.statusCode === 404) {
                console.log('UPS says they have no data for the package');
                return null;
            }
            throw err;
        }

        const td = UpsTracker.StandardizeTrackingData(body, trackingNumber);
        if (td) {
            td.lastHardFetch = new Date();
        }
        return td;
    }

    public static IsValidTrackingNumber(trackingNumber: string) {
        return trackingNumber.length === 18
            && trackingNumber.startsWith('1Z');
    }

    public static StandardizeTrackingData(upsNativeTrackingData: any, inquiryNumber?: string) {
        if (!upsNativeTrackingData || !upsNativeTrackingData.trackResponse) {
            console.log('UPS says they have no data for the package');
            return null;
        }

        // An error response carries a `response.errors` array instead of trackResponse.
        if (upsNativeTrackingData.response && upsNativeTrackingData.response.errors) {
            console.log('UPS says they have no data for the package');
            return null;
        }

        let shipment = upsNativeTrackingData.trackResponse.shipment;
        if (!(shipment instanceof Array)) {
            shipment = [shipment];
        }
        if (shipment.length === 0 || !shipment[0]) {
            return null;
        }

        let packages = shipment[0].package;
        if (!(packages instanceof Array)) {
            packages = [packages];
        }
        if (packages.length === 0 || !packages[0]) {
            return null;
        }

        // For multi-package shipments, select the package matching the inquiry number.
        let p = packages[0];
        if (inquiryNumber && packages.length > 1) {
            const match = _.find(packages, (x: any) => x.trackingNumber === inquiryNumber);
            if (match) {
                p = match;
            }
        }

        const td = new TrackingData();
        td.trackerName = 'UPS';
        td.usageRequirements = 'NOTICE: The UPS package tracking systems accessed via this service (the \"Tracking Systems\") and tracking information' +
            ' obtained through this service (the "Information") are the private property of UPS. UPS authorizes you to use the Tracking Systems solely to track shipments' +
            ' tendered by or for you to UPS for delivery and for no other purpose. Without limitation, you are not authorized to make the Information available on any web' +
            ' site or otherwise reproduce, distribute, copy, store, use or sell the Information for commercial gain without the express written consent of UPS. This is a' +
            ' personal service, thus your right to use the Tracking Systems or Information is non-assignable. Any access or use that is inconsistent with these terms is' +
            ' unauthorized and strictly prohibited.';

        td.trackingNumber = p.trackingNumber;

        if (p.service && p.service.description) {
            td.serviceType = p.service.description;
        }

        if (p.weight && p.weight.weight) {
            td.weight = p.weight.weight + (p.weight.unitOfMeasurement || '');
        }

        // deliveryDate is an array of typed dates (DEL = delivered, RDD = rescheduled, etc.)
        let deliveryDates = p.deliveryDate;
        if (deliveryDates && !(deliveryDates instanceof Array)) {
            deliveryDates = [deliveryDates];
        }
        if (deliveryDates instanceof Array && deliveryDates.length > 0) {
            const delivery = _.find(deliveryDates, (d: any) => d.type === 'DEL') || deliveryDates[0];
            if (delivery && delivery.date) {
                // Date format: "20171214"
                const year = parseInt(delivery.date.substring(0, 4), 10);
                const month = parseInt(delivery.date.substring(4, 6), 10);
                const day = parseInt(delivery.date.substring(6, 8), 10);

                td.estimatedDelivery = new Date(Date.UTC(year, month - 1, day));
                td.estimatedDeliveryFriendly = moment(td.estimatedDelivery).calendar();
            }
        }

        td.activity = new Array<ActivityData>();
        let activity = p.activity;
        if (activity) {
            if (!(activity instanceof Array)) {
                activity = [activity];
            }

            activity.forEach((a) => {
                const newActivity = new ActivityData();
                if (a.location && a.location.address) {
                    const address = a.location.address;

                    newActivity.location.city = address.city;
                    newActivity.location.state = address.stateProvince;
                    newActivity.location.zip = address.postalCode;
                    newActivity.location.countryCode = address.country;
                }

                newActivity.shortDescription = a.status && a.status.description;
                if (a.time && a.date) {
                    // Date format: "20171214", Time format: "151000"
                    const year = parseInt(a.date.substring(0, 4), 10);
                    const month = parseInt(a.date.substring(4, 6), 10) - 1; //month is zero based
                    const day = parseInt(a.date.substring(6, 8), 10);
                    const hour = parseInt(a.time.substring(0, 2), 10);
                    const minute = parseInt(a.time.substring(2, 4), 10);
                    const second = parseInt(a.time.substring(4, 6), 10);

                    newActivity.timestamp = new Date(year, month, day, hour, minute, second);
                }

                td.activity.push(newActivity);
            });
        }

        return td;
    }
}
