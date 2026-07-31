import * as request from 'request-promise';
import { TrackingData } from '../TrackingData';
import { ITracker } from '../ITracker';
import { ActivityData } from '../ActivityData';
import { OAuthTokenProvider } from '../OAuthTokenProvider';

// USPS Tracking API v3 (REST/JSON + OAuth 2.0).
// Docs: https://developer.usps.com/trackingv3
// Replaces the retired Web Tools XML API (ShippingAPI.dll).
export class UspsTracker implements ITracker {
    USPS_BASE_URL = 'https://apis.usps.com';

    tokenProvider: OAuthTokenProvider;

    constructor(clientId: string, clientSecret: string, baseUrl?: string) {
        if (baseUrl) {
            this.USPS_BASE_URL = baseUrl;
        }
        this.tokenProvider = new OAuthTokenProvider(
            this.USPS_BASE_URL + '/oauth2/v3/token',
            clientId,
            clientSecret,
            { json: true, extraParams: { scope: 'tracking' } }
        );
    }

    async Track(trackingNumber: string) {
        if (!UspsTracker.IsValidTrackingNumber(trackingNumber)) {
            console.log('Not a USPS Tracking Number');
            return null;
        }

        const token = await this.tokenProvider.getToken();

        let body;
        try {
            body = await request.get(
                this.USPS_BASE_URL + '/tracking/v3/tracking/' + encodeURIComponent(trackingNumber),
                {
                    headers: {
                        'Authorization': 'Bearer ' + token,
                        'Accept': 'application/json'
                    },
                    qs: { expand: 'DETAIL' },
                    json: true
                }
            );
        } catch (err) {
            // USPS returns a 404 when it has no data for the package.
            if (err && err.statusCode === 404) {
                console.log('USPS says they have no data for the package');
                return null;
            }
            throw err;
        }

        const td = await UspsTracker.ConvertResponseToTrackData(body);
        if (td) {
            td.lastHardFetch = new Date();
        }
        return td;
    }

    public static IsValidTrackingNumber(trackingNumber: string) {
        //valid: Number types: https://tools.usps.com/go/TrackConfirmAction_input

        return trackingNumber.length === 30
            || trackingNumber.length === 26
            || trackingNumber.length === 22
            || trackingNumber.length === 20
            || trackingNumber.length === 13
            || trackingNumber.length === 10;
    }

    // Accepts either a parsed response object or a JSON string.
    public static async ConvertResponseToTrackData(response: any) {
        const json = (typeof response === 'string') ? JSON.parse(response) : response;
        return UspsTracker.ParseJsonToTrackData(json);
    }

    static ParseJsonToTrackData(json: any): TrackingData {
        const td = new TrackingData();
        td.trackerName = 'USPS';
        td.activity = new Array<ActivityData>();

        if (!json) {
            return null;
        }

        td.trackingNumber = json.trackingNumber;

        if (json.mailClass) {
            td.serviceType = json.mailClass;
        }

        if (json.expectedDeliveryTimeStamp) {
            td.estimatedDelivery = new Date(Date.parse(json.expectedDeliveryTimeStamp));
        }

        // trackingEvents are returned in reverse chronological order (most recent first).
        const events = (json.trackingEvents instanceof Array) ? json.trackingEvents : [];
        for (const event of events) {
            const ad = new ActivityData();

            const cleanLoc = UspsTracker.cleanCityName(event.eventCity);
            if (cleanLoc) {
                ad.location.city = cleanLoc.city;
                ad.location.state = cleanLoc.state;
            } else {
                ad.location.city = event.eventCity;
                ad.location.state = event.eventState;
            }

            ad.location.zip = event.eventZIP;
            ad.location.countryCode = event.eventCountry;

            // Prefer the explicit GMT timestamp when present; it is timezone-unambiguous.
            const timestamp = event.GMTTimestamp || event.eventTimestamp;
            if (timestamp) {
                ad.timestamp = new Date(Date.parse(timestamp));
            }

            ad.shortDescription = event.eventType;

            td.activity.push(ad);
        }

        td.usageRequirements = 'NOTICE: U.S.P.S. authorizes you to use U.S.P.S. tracking systems'
            + ' solely to track shipments tendered by or for you to U.S.P.S. for delivery and'
            + ' for no other purpose. Any other use of U.S.P.S. tracking systems and information'
            + ' is strictly prohibited.';

        return td;
    }

    static cleanCityName(cityStr: string) {
        if (!cityStr) {
            return null;
        }

        //City names can sometimes have a description in them like:
        // OAK CREEK WI DISTRIBUTION CENTER
        let dcIndex = cityStr.indexOf('NETWORK DISTRIBUTION');
        if (dcIndex === -1) {
            dcIndex = cityStr.indexOf('DISTRIBUTION');
        }
        if (dcIndex === -1) {
            dcIndex = cityStr.indexOf('PROCESSING CENTER');
        }

        if (dcIndex > 0) {
            return {
                state: cityStr.substr(dcIndex - 3, 2),
                city: cityStr.substring(0, dcIndex - 4)
            };
        } else {
            return null;
        }
    }
}
