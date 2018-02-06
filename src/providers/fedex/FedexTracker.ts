import * as request from 'request';
import { TrackingData } from '../TrackingData';
import { ITracker } from '../ITracker';

export class FedexTracker implements ITracker {
    FEDEX_REQUEST_TEMPLATE = '<TrackRequest xmlns=\'http://fedex.com/ws/track/v3\'><WebAuthenticationDetail><UserCredential><Key>{key}</Key>'
        + '<Password>{password}</Password></UserCredential></WebAuthenticationDetail><ClientDetail>'
        + '<AccountNumber>{accountNumber}</AccountNumber><MeterNumber>{meterNumber}</MeterNumber></ClientDetail>'
        + '<TransactionDetail><CustomerTransactionId>ActiveShipping</CustomerTransactionId></TransactionDetail>'
        + '<Version><ServiceId>trck</ServiceId><Major>3</Major><Intermediate>0</Intermediate><Minor>0</Minor></Version>'
        + '<PackageIdentifier><Value>{trackingNumber}</Value><Type>TRACKING_NUMBER_OR_DOORTAG</Type></PackageIdentifier>'
        + '<IncludeDetailedScans>1</IncludeDetailedScans></TrackRequest>';

    FEDEX_API_URL = "https://gatewaybeta.fedex.com/xml";
    //FEDEX_API_URL = "https://requestb.in/1oijy051";

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

    Track(trackingNumber:string) {
        return new Promise<TrackingData>((resolve, reject) => {
            //resolve(null); //Don't return results until implemented

            let req = this.buildRequest(trackingNumber);

            let options = {
                    json:false,
                    strictSSL: false,
                    body:req,
                    headers:
                        {
                          'Content-Type': 'text/xml',
                            'User-Agent': 'SimpleTracking/3.0.0',
                            'Accept': '*/*',
                            'Host': 'gatewaybeta.fedex.com:443', //<--- this was the problem!!!
                            'Cache-Control': 'no-cache',
                            'Cookie': '__cfduid=d8d6b4b20c6f3eaa49fb13f829000c1921517882609',
                            'Connection': 'close'
                        }
            }

            console.log(req);
            request.post(this.FEDEX_API_URL, options, (error, response, body) => {
                if(error) {
                    console.log("Error in Fedex tracker request: " + error);
                    reject("Error in Fedex tracker request: " + error);
                }

                let td = FedexTracker.ConvertResponseToStandardFormat(body);
                resolve(td);
            });
        });
    }

    private static ConvertResponseToStandardFormat(response:string):TrackingData {
        let td = new TrackingData();

        console.log(response);

        return td;
    }
}