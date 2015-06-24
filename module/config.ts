/// <reference path='../typings/node/node.d.ts' />
import fs = require('fs');

interface Config {
	dashboardServer:string;
	location:string;
	hues: [{
		bridgeURL:string;
		bridgeUsername:string;
		startId: number;
		endId: number;
	}];
	timezone:string;
}

//load config
var data:any;
data = fs.readFileSync('./config/config.json', 'UTF-8');
export = <Config> JSON.parse(data);