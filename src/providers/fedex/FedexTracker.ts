import * as request from 'request-promise';
import { TrackingData } from '../TrackingData';
import { ITracker } from '../ITracker';
import { ActivityData } from '../ActivityData';
import { OAuthTokenProvider } from '../OAuthTokenProvider';

// FedEx Track API v1 (REST/JSON + OAuth 2.0).
// Docs: https://developer.fedex.com/api/en-us/catalog/track/v1/docs.html
export class FedexTracker implements ITracker {
    // Production host. The sandbox host is https://apissandbox.fedex.com
    FEDEX_BASE_URL = 'https://apis.fedex.com';

    tokenProvider: OAuthTokenProvider;

    constructor(clientId: string, clientSecret: string, baseUrl?: string) {
        if (baseUrl) {
            this.FEDEX_BASE_URL = baseUrl;
        }
        this.tokenProvider = new OAuthTokenProvider(
            this.FEDEX_BASE_URL + '/oauth/token',
            clientId,
            clientSecret
        );
    }

    async Track(trackingNumber: string) {
        if (!FedexTracker.IsValidTrackingNumber(trackingNumber)) {
            console.log('Not a FedEx Tracking Number');
            return null;
        }

        const token = await this.tokenProvider.getToken();

        const body = await request.post(this.FEDEX_BASE_URL + '/track/v1/trackingnumbers', {
            headers: {
                'Authorization': 'Bearer ' + token,
                'X-locale': 'en_US',
                'Content-Type': 'application/json'
            },
            body: {
                includeDetailedScans: true,
                trackingInfo: [
                    {
                        trackingNumberInfo: {
                            trackingNumber: trackingNumber
                        }
                    }
                ]
            },
            json: true
        });

        const td = FedexTracker.ConvertJsonToStandardFormat(body && body.output);
        if (td) {
            td.lastHardFetch = new Date();
        }
        return td;
    }

    public static IsValidTrackingNumber(trackingNumber: string) {
        return trackingNumber.length === 12
            || trackingNumber.length === 15
            || trackingNumber.length === 22;
    }

    // Accepts the `output` object from the Track API response.
    public static ConvertJsonToStandardFormat(output: any): TrackingData {
        if (!output || !(output.completeTrackResults instanceof Array) || output.completeTrackResults.length === 0) {
            console.error('Got a non-expected response from FedEx');
            return null;
        }

        const completeResult = output.completeTrackResults[0];
        if (!completeResult || !(completeResult.trackResults instanceof Array) || completeResult.trackResults.length === 0) {
            return null;
        }

        const result = completeResult.trackResults[0];

        // No data / invalid tracking number is reported as an error object on the result.
        if (!result || result.error) {
            console.log('Fedex says they have no data for the package');
            return null;
        }

        const td = new TrackingData();
        td.trackerName = 'FedEx';
        td.activity = new Array<ActivityData>();

        td.trackingNumber = result.trackingNumberInfo && result.trackingNumberInfo.trackingNumber;

        if (result.serviceDetail && result.serviceDetail.description) {
            td.serviceType = result.serviceDetail.description;
        }

        const weightAndDimensions = result.packageDetails && result.packageDetails.weightAndDimensions;
        if (weightAndDimensions && weightAndDimensions.weight instanceof Array && weightAndDimensions.weight.length > 0) {
            const w = weightAndDimensions.weight[0];
            td.weight = w.value + w.unit;
        }

        if (result.dateAndTimes instanceof Array) {
            const delivery = result.dateAndTimes.find((d) =>
                d.type === 'ACTUAL_DELIVERY' || d.type === 'ESTIMATED_DELIVERY');
            if (delivery && delivery.dateTime) {
                td.estimatedDelivery = new Date(Date.parse(delivery.dateTime));
            }
        }

        if (result.scanEvents instanceof Array) {
            result.scanEvents.forEach((event) => {
                const ad = new ActivityData();

                if (event.date) {
                    ad.timestamp = new Date(Date.parse(event.date));
                }

                const loc = event.scanLocation;
                if (loc) {
                    ad.location.city = loc.city;
                    ad.location.state = loc.stateOrProvinceCode;
                    ad.location.zip = loc.postalCode;
                    ad.location.countryCode = loc.countryCode;
                }

                ad.shortDescription = event.eventDescription;
                td.activity.push(ad);
            });
        }

        td.usageRequirements = "NOTICE: FedEx authorizes you to use FedEx tracking"
            + " systems solely to track shipments tendered by"
            + " or for you to FedEx for delivery and for no other"
            + " purpose. Any other use of FedEx tracking systems and"
            + " information is strictly prohibited.";

        return td;
    }
}
