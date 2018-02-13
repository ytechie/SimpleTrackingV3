export class Location {
    lat:number;
    long:number;

    city:string;
    state:string;
    zip:string;
    countryCode:string;

    //used when we can't parse city/state
    rawLocationString:string;

    toString() {
        let arr = new Array<string>();
        if(this.city) arr.push(this.city);
        if(this.state) arr.push(this.state);
        if(this.zip) arr.push(this.zip);
        if(this.countryCode) arr.push(this.countryCode);

        if(arr.length > 0) {
            return arr.join(', ');
        }
        
        return this.rawLocationString;
    }
}