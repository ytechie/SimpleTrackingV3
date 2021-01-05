export enum TagTypes {
    Basic = "basic",
    Community = "community"
}

export class TagData {
    name:string;
    trackingNumbers:string[];
    type:TagTypes;
}