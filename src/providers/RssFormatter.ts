import { TrackingData } from './TrackingData'

import * as rss from 'rss';

export class RssFormatter {
    public static ConvertTrackingDataToRss(trackingData:TrackingData) {
        var feed = new rss({
            title: 'Package Tracking for ' + trackingData.trackingNumber,
            description: '',
            feed_url: 'http://simpletracking.com/track/' + trackingData.trackingNumber + '.rss',
            site_url: 'http://simpletracking.com',
            language: 'en',
            pubDate: (new Date()).toString()
        });
        
        if(trackingData.activity) {
            trackingData.activity.forEach((a) => {
                feed.item({
                    title:  a.locationDislpay,
                    description: a.shortDescription,
                    guid: a.timestamp.toString(),
                    date: a.timestamp.toString()
                    //lat: 33.417974, //optional latitude field for GeoRSS 
                    //long: -111.933231, //optional longitude field for GeoRSS 
                });
            });
        }
        
        return feed.xml();
    }
}