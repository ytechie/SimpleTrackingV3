import * as request from 'request';
import { TrackingData } from '../TrackingData';
import { ITracker } from '../ITracker';

export class FedexTracker implements ITracker {
    FEDEX_REQUEST_TEMPLATE = "<TrackRequest xmlns='http://fedex.com/ws/track/v3'><WebAuthenticationDetail><UserCredential><Key>{key}</Key>"
        + "<Password>{password}</Password></UserCredential></WebAuthenticationDetail><ClientDetail>"
        + "<AccountNumber>{accountNumber}</AccountNumber><MeterNumber>{meterNumber}</MeterNumber></ClientDetail>"
        + "<TransactionDetail><CustomerTransactionId>ActiveShipping</CustomerTransactionId></TransactionDetail>"
        + "<Version><ServiceId>trck</ServiceId><Major>3</Major><Intermediate>0</Intermediate><Minor>0</Minor></Version>"
        + "<PackageIdentifier><Value>{trackingNumber}</Value><Type>TRACKING_NUMBER_OR_DOORTAG</Type></PackageIdentifier>"
        + "<IncludeDetailedScans>1</IncludeDetailedScans></TrackRequest>";

    FEDEX_API_URL = "https://gatewaybeta.fedex.com:443/xml";

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
        return new Promise<TrackingData>((resolve) => {
            let req = this.buildRequest(trackingNumber);

            request.post(this.FEDEX_API_URL, {body:req}, (error, response, body) => {
                resolve(new TrackingData());
            });
        });
    }
}