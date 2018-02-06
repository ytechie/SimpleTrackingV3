import * as request from 'request';
import * as xml2js from 'xml2js';
import { TrackingData } from '../TrackingData';
import { ITracker } from '../ITracker';
import { ActivityData } from '../ActivityData';

export class FedexTracker implements ITracker {
    FEDEX_REQUEST_TEMPLATE = '<TrackRequest xmlns=\'http://fedex.com/ws/track/v3\'><WebAuthenticationDetail><UserCredential><Key>{key}</Key>'
        + '<Password>{password}</Password></UserCredential></WebAuthenticationDetail><ClientDetail>'
        + '<AccountNumber>{accountNumber}</AccountNumber><MeterNumber>{meterNumber}</MeterNumber></ClientDetail>'
        + '<TransactionDetail><CustomerTransactionId>ActiveShipping</CustomerTransactionId></TransactionDetail>'
        + '<Version><ServiceId>trck</ServiceId><Major>3</Major><Intermediate>0</Intermediate><Minor>0</Minor></Version>'
        + '<PackageIdentifier><Value>{trackingNumber}</Value><Type>TRACKING_NUMBER_OR_DOORTAG</Type></PackageIdentifier>'
        + '<IncludeDetailedScans>1</IncludeDetailedScans></TrackRequest>';

    FEDEX_API_URL = "https://gatewaybeta.fedex.com/xml";
    //FEDEX_API_URL = "https://ws.fedex.com/web-services";

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
        return this.FEDEX_REQUEST_TEMPLATE
            .replace('{key}', this.key)
            .replace('{password}', this.password)
            .replace('{accountNumber}', this.accountNumber)
            .replace('{meterNumber}', this.meterNumber)
            .replace('{trackingNumber}', trackingNumber);
    }

    async Track(trackingNumber:string):Promise<TrackingData> {
        return new Promise<TrackingData>((resolve, reject) => {
            let req = this.buildRequest(trackingNumber);

            let options = {
                    //json:false,
                    //strictSSL: false,
                    body:req,
                    headers:
                        {
                            'Host': 'gatewaybeta.fedex.com:443',
                        }
            };

            console.log('requesting fedex data');
            request.post(this.FEDEX_API_URL, options, (error, response, body) => {
                if(error) {
                    console.log("Error in Fedex tracker request: " + error);
                    reject("Error in Fedex tracker request: " + error);
                    return;
                }

                console.log('got fedex data');
                let parser = new xml2js.Parser({explicitArray: false});
                parser.parseString(body, (err, result) => {
                    if(err) {
                        reject(err);
                    } else {
                        resolve(this.ConvertJsonToStandardFormat(result));
                    }
                });
            });
        });
    }

    private ConvertJsonToStandardFormat(results:any):TrackingData {
        //Check for invalid tracking number code
        if(results.TrackReply.Notifications && results.TrackReply.Notifications.Code === "6035") {
            console.log('Fedex says they have no data for the package');
            return null;
        }

        let td = new TrackingData();
        td.activity = new Array<ActivityData>();
        let trackDetail = results.TrackReply.TrackDetails;
        td.trackingNumber = trackDetail.TrackingNumber;
        td.weight = trackDetail.PackageWeight.Value + trackDetail.PackageWeight.Units;
        if(trackDetail.ActualDeliveryTimestamp) {
            td.estimatedDelivery = new Date(Date.parse(trackDetail.ActualDeliveryTimestamp));
        }
        trackDetail.Events.forEach((event) => {
            var ad = new ActivityData();
            ad.timestamp = new Date(Date.parse(event.Timestamp));
            ad.locationDescription = event.Address.City;
            ad.shortDescription = event.EventDescription;
            td.activity.push(ad)
        });

        td.usageRequirements = "NOTICE: FedEx authorizes you to use FedEx tracking"
            + " systems solely to track shipments tendered by"
            + " or for you to FedEx for delivery and for no other"
            + " purpose. Any other use of FedEx tracking systems and"
            + " information is strictly prohibited.";

        return td;
    }
}