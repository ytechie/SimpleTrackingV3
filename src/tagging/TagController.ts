import * as express from 'express';
import { Cosmos } from '../db/Cosmos';
import { TagData, TagTypes } from './TagData';

export class TagController {
    res:express.Response;
    cosmos:Cosmos;

    model = {
        tagName: '',
        tagData: null
    }

    constructor(req:express.Request, res:express.Response, cosmos:Cosmos) {
        this.res = res;
        this.cosmos = cosmos;
    }

    async render(view:string, tagName:string) {
        this.model.tagName = tagName;

        let tag = await this.cosmos.GetTag(tagName);
        this.model.tagData = JSON.stringify(tag);

        if(tag) {
            console.log('Found %i tracking numbers for the tag.', tag.trackingNumbers.length);

            //const trackingData = await this.cosmos.LoadMultipleTrackingData(tag.trackingNumbers);
            
        }
        /*
        let tag = new TagData();
        tag.name = "tag2";
        tag.trackingNumbers = ['123', 'sim2'];
        tag.type = TagTypes.Basic;

        this.cosmos.SaveTag(tag);*/

        this.res.render('./tag.hbs', this.model);
    }
}