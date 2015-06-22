/// <reference path='../typings/node/node.d.ts' />
import fs = require('fs');

interface Config {
    dashboardServer:string;
    location:string;
    hue: {
        bridgeURL:string;
        bridgeUsername:string;
    };
    timezone:string;
}

//load config
var data:any;
data = fs.readFileSync('./config/config.json', 'UTF-8');
data = <Config> JSON.parse(data);

export = data;