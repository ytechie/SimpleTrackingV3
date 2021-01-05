import * as express from 'express';
import { Cosmos } from '../db/Cosmos';
import { ITracker } from '../providers/ITracker';
import { TagController } from './TagController';
import { TagData } from './TagData';

export class TagRouting {
    cosmos:Cosmos;

    constructor(app:express.Application, tracker:ITracker) {
        console.log('Setting up tag routing');
        
        app.get('/echo2', function (req, res) {
            res.send('hello world');
        });

        app.get('/t/track/trackingNumber.json', async (req, res) => {
            tracker.Track(req.params.trackingNumber).then((trackData) => {
                delete trackData.usageRequirements;
                res.json(trackData);
            }).catch((err) => {
                res.send(err);
            });
        });

        app.get('/t/:tagName.json', async (req, res) => {
            let tag = await this.cosmos.GetTag(req.params.tagName);
            if(tag) {
                res.json(JSON.stringify(tag.trackingNumbers));
            } else {
                res.json(new TagData());
            }
        });

        app.get('/t/:tagName', (req, res) => {
            this.cosmos = new Cosmos(process.env.COSMOS_CONNECTION_STRING);
            const controller = new TagController(req, res, this.cosmos);
            controller.render('tag.hbs', req.params.tagName);
        });
    }
}