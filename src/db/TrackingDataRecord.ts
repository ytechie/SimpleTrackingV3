import { Location } from "../Location";
import { ActivityData } from "../providers/ActivityData";
import { TrackingData } from "../providers/TrackingData";

export class TrackingDataRecord extends TrackingData {
    id:string;
    newestActivity:ActivityData;
    delivered:boolean;

    public static Deserialize(obj:any): TrackingDataRecord {
        let tdIn = obj as TrackingDataRecord;
        let tdOut = new TrackingDataRecord();

        Object.assign(tdOut, tdIn)

        tdOut.activity = new Array<ActivityData>();
        tdIn.activity.forEach((ad) => {
            let newAd = new ActivityData();
            Object.assign(newAd, ad);
            newAd.location = new Location();
            Object.assign(newAd.location, ad.location);

            tdOut.activity.push(newAd);
        })

        if('newestActivity' in tdIn) {
            Object.assign(tdOut.newestActivity, tdIn.newestActivity);
            if('location' in tdIn.newestActivity.location) {
                Object.assign(tdOut.newestActivity.location, tdIn.newestActivity.location);
            }
        }

        return tdOut;
    }
}