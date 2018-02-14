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
        console.time('Geocode');
        try {
        if(await this.TryLocalGeocode(location)) {
            return;
        }
        if(await this.TryGeocodeWithGoogle(location)) {
            await this.AddToLocalCache(location);
            return;
        }
        } catch(err) {
            console.warn('Could not geocode location');
        }
        console.timeEnd('Geocode');
    }

    async TryLocalGeocode(location:Location):Promise<boolean> {
        return new Promise<boolean>((resolve, reject) => {
            if((location.city && location.state) || location.rawLocationString) {
                let sql='';
                let sqlParams:any = {};
                if(location.city && location.state) {
                    sql = 'select * from uscities where city=$city COLLATE NOCASE and state_id=$state;';
                    sqlParams.$city = location.city;
                    sqlParams.$state = location.state;
                } else {
                    sql = 'select * from otherlocations where location=$location;';
                    sqlParams.$location = location.rawLocationString;
                }

                this.db.all(sql, sqlParams, (err, rows) => {
                    //If there is more than 1 row, it's ambiguous  
                    if(rows && rows.length === 1) {
                        location.lat = rows[0].lat;
                        location.long = rows[0].lng;
                        resolve(true);
                    } else {
                        resolve(false);
                    }
                });
            } else {
                resolve(false);
            }
        });
    }

    async AddToLocalCache(location:Location):Promise<void> {
        return new Promise<void>((resolve, reject) => {
            if(location.city && location.state) {
                let sqlParams:any = {};
                if(location.state.length > 2) {
                    sqlParams.$state_name = location.state;
                } else {
                    sqlParams.$state_id = location.state;
                }

                sqlParams.$city = location.city;
                sqlParams.$lat = location.lat;
                sqlParams.$lng = location.long;
                sqlParams.$new = 1;
                
                let sql = Geocoder.GetInsertStatement('uscities', sqlParams);

                let result = this.db.run(sql, sqlParams, (err) => {
                    if(err) {
                        console.error(err);
                        reject(err);
                    }
                    resolve();
                });
            } else if(location.rawLocationString) {
                let sqlParams:any = {};
                sqlParams.$location = location.rawLocationString;
                sqlParams.$new = 1;
                sqlParams.$lat = location.lat;
                sqlParams.$lng = location.long;

                let sql = Geocoder.GetInsertStatement('otherlocations', sqlParams);

                let result = this.db.run(sql, sqlParams, (err) => {
                    if(err) {
                        console.error(err);
                        reject(err);
                    }
                    resolve();
                });
            } else {
                resolve();
            }
        });
    }

    static GetInsertStatement(tableName:string, sqlParams:any) {
        let columns = new Array<string>();                
        for(let key of Object.keys(sqlParams)) {
            columns.push(key.replace('$',''));
        }
        let sql = 'insert into ' + tableName + ' ';
        sql += '(' + columns.join(',') + ')';
        sql += ' values($' +  columns.join(',$') + ')';

        return sql;
    }

    async TryGeocodeWithGoogle(location:Location) {
        return new Promise<boolean>((resolve, reject) => {
            //http://maps.googleapis.com/maps/api/geocode/json?address=DALLAS/FT. WORTH A/P, TX, US

            let url = this.googleGeocodeUrl.replace('{address}', location.toString());

            console.log('Geocoding ' + location.toString() + ' with Google');

            request.get(url, {json:true}, (error, response, body) => {
                try { //Try catch is needed inside the request
                    if(error) {
                        console.log("Error in Google geocoder: " + error);
                        reject("Error in Google geocoder request: " + error);
                        resolve(false);
                        return;
                    }

                    let loc = body.results[0].geometry.location;
                    location.lat = body.results[0].geometry.location.lat;
                    location.long = body.results[0].geometry.location.lng;

                    resolve(true);
                } catch(err) {
                    reject(err);
                }
            });
        });
    }
}

