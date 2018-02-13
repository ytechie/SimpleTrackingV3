import * as sqlite3 from 'sqlite3';
import * as request from 'request';

import * as fs from 'fs';
import * as path from 'path';
import { Location } from './Location';

export class Geocoder {
    db:sqlite3.Database;
    readonly googleGeocodeUrl = 'http://maps.googleapis.com/maps/api/geocode/json?address={address}'

    constructor() {
        let dbPath = path.join(__dirname, 'geocode.db');
        this.db = new sqlite3.Database(dbPath, (err) => {
            if(err) {
                console.error('Error opening geocode database: ' + err);
            }
        });
    }

    async Geocode(location:Location) {
        return new Promise<void>((resolve, reject) => {
            if(location.city && location.state) {
                this.db.all('select * from uscities where city=$city COLLATE NOCASE and state_id=$state;',
                { $city: location.city, $state: location.state },
                (err, rows) => {
                    //If there is more than 1 row, it's ambiguous  
                    if(rows && rows.length === 1) {
                        location.lat = rows[0].lat;
                        location.long = rows[0].lng;
                        resolve();
                    } else if(location.rawLocationString) {
                        this.GeocodeWithGoogle(location.toString()).then((googleLoc) => {
                            if(googleLoc) {
                                location.lat = googleLoc[0];
                                location.long = googleLoc[1];
                            }
                            
                            resolve();
                        });
                    } else {
                        resolve();
                    }
                });
            } else if(location.rawLocationString) {
                this.GeocodeWithGoogle(location.toString()).then((googleLoc) => {
                    if(googleLoc) {
                        location.lat = googleLoc[0];
                        location.long = googleLoc[1];
                    }

                    resolve();
                });
            } else {
                resolve();
            }
        });
    }

    async 

    async GeocodeWithGoogle(address:string) {
        return new Promise<[number,number]>((resolve, reject) => {
            //http://maps.googleapis.com/maps/api/geocode/json?address=DALLAS/FT. WORTH A/P, TX, US

            let url = this.googleGeocodeUrl.replace('{address}', address);

            request.get(url, {json:true}, (error, response, body) => {
                try { //Try catch is needed inside the request
                    if(error) {
                        console.log("Error in Google geocoder: " + error);
                        reject("Error in Google geocoder request: " + error);
                        return;
                    }

                    let loc = body.results[0].geometry.location;
                    resolve([loc.lat, loc.lng]);
                } catch(err) {
                    reject(err);
                }
            });
        });
    }
}

