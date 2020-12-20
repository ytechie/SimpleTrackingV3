import { ActivityData } from "../providers/ActivityData";
import { TrackingData } from "../providers/TrackingData";

export class TrackingDataRecord extends TrackingData {
    id:string;
    newestActivity:ActivityData;
    delivered:boolean;
}