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

    //https://stackoverflow.com/questions/27928/calculate-distance-between-two-latitude-longitude-points-haversine-formula
    kilometersToLocation(otherLocation:Location) {
        var R = 6371; // Radius of the earth in km
        var dLat = this.deg2rad(otherLocation.lat-this.lat);
        var dLon = this.deg2rad(otherLocation.long-this.long); 
        var a = 
            Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(this.deg2rad(this.lat)) * Math.cos(this.deg2rad(otherLocation.lat)) * 
            Math.sin(dLon/2) * Math.sin(dLon/2); 
        var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
        var d = R * c; // Distance in km
        return d;
    }

    private deg2rad(deg) {
        return deg * (Math.PI/180)
    }
}