import * as request from 'request-promise';

import * as fs from 'fs';
import * as path from 'path';
import { Location } from './Location';

var parse = require('csv-parse');

export class Geocoder {
    geocodeCache:Array<any>;

    readonly googleGeocodeUrl = 'http://maps.googleapis.com/maps/api/geocode/json?address={address}'

    constructor() {
        console.log("Geocoder ctor - important that this is reused");
        
        this.loadUSCities();
    }

    loadUSCities() {
        console.time('Geocode-load-cities');

        this.geocodeCache = new Array();
        let _this = this;

        const csvPath = path.resolve(__dirname, '.') + '/uscitiesv1.3.csv';

        fs.createReadStream(csvPath)
            .pipe(parse())
            .on('data', function(csvrow) {
                if(csvrow[0] !== 'city') {
                    //key format: city st
                    const key = csvrow[1].toUpperCase() + ' ' + csvrow[2];
                    const lat = parseFloat(csvrow[7]);
                    const long = parseFloat(csvrow[8]);

                    _this.geocodeCache[key] = {lat, long};
                }
            })
        .on('end',function() {
            console.timeEnd('Geocode-load-cities');
            console.log(_this.geocodeCache);
        });
    }

    async Geocode(location:Location) {
        //Not specific enough to locate - this avoid all kinds
        //of stange bugs and makes the distance really high
        if(location.toString().length <= 2
            || location.toString() === 'United States') {
            return;
        }

        console.time('Geocode');
        try {
            if(await this.TryLocalGeocode(location)) {
                console.timeEnd('Geocode');
                return;
            }

            if(await this.TryGeocodeWithGoogle(location)) {
                console.timeEnd('Geocode');
                return;
            }
        } catch(err) {
            console.timeEnd('Geocode');
            console.warn('Could not geocode location');
        }
    }

    async TryLocalGeocode(location:Location) {
        const key = location.city.toUpperCase() + ' ' + location.state.toUpperCase();
        const rec = this.geocodeCache[key]

        if(rec) {
            location.lat = rec.lat;
            location.long = rec.long;

            return true;
        }

        return false;
    }




    async TryGeocodeWithGoogle(location:Location) {
        //http://maps.googleapis.com/maps/api/geocode/json?address=DALLAS/FT. WORTH A/P, TX, US

        let url = this.googleGeocodeUrl.replace('{address}', location.toString());

        console.log('Geocoding ' + location.toString() + ' with Google');

        let body = await request.get(url, {json:true});

        let loc = body.results[0].geometry.location;
        location.lat = parseFloat(body.results[0].geometry.location.lat);
        location.long = parseFloat(body.results[0].geometry.location.lng);

        return true;
    }
}

