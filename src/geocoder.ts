import * as sqlite from 'sqlite';
import * as request from 'request-promise';

import * as fs from 'fs';
import * as path from 'path';
import { Location } from './Location';

export class Geocoder {
    db:sqlite.Database;

    readonly googleGeocodeUrl = 'http://maps.googleapis.com/maps/api/geocode/json?address={address}'

    constructor() {
        let dbPath = path.join(__dirname, 'geocode.db');

        sqlite.open(dbPath).then((dbConn) => {
            this.db = dbConn;
        });
    }

    async Geocode(location:Location) {
        //Not specific enough to locate - this avoid all kinds
        //of stange bugs and makes the distance really high
        if(location.toString() === 'US'
            || location.toString() === 'United States') {
            return;
        }

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

    async TryLocalGeocode(location:Location) {
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

            let rows = await this.db.all(sql, sqlParams);
                //If there is more than 1 row, it's ambiguous  
                if(rows && rows.length === 1) {
                    location.lat = rows[0].lat;
                    location.long = rows[0].lng;
                    return true;
                } else {
                    return false;
                }
        } else {
            return false;
        }
    }

    async AddToLocalCache(location:Location) {
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

                await this.db.run(sql, sqlParams);
            } else if(location.rawLocationString) {
                let sqlParams:any = {};
                sqlParams.$location = location.rawLocationString;
                sqlParams.$new = 1;
                sqlParams.$lat = location.lat;
                sqlParams.$lng = location.long;

                let sql = Geocoder.GetInsertStatement('otherlocations', sqlParams);

                await this.db.run(sql, sqlParams);
            }
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
        //http://maps.googleapis.com/maps/api/geocode/json?address=DALLAS/FT. WORTH A/P, TX, US

        let url = this.googleGeocodeUrl.replace('{address}', location.toString());

        console.log('Geocoding ' + location.toString() + ' with Google');

        let body = await request.get(url, {json:true});

        let loc = body.results[0].geometry.location;
        location.lat = body.results[0].geometry.location.lat;
        location.long = body.results[0].geometry.location.lng;
    }
}

