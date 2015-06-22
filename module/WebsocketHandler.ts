/// <reference path='../typings/socket.io-client/socket.io-client.d.ts' />
/// <reference path='../typings/winston/winston.d.ts' />
/// <reference path='../typings/underscore/underscore.d.ts' />
/// <reference path='../typings/moment/moment.d.ts' />
import winston = require('winston');
import _ = require('underscore');
import moment = require('moment');
import ioClient = require('socket.io-client');
import config = require('./config');
import LightState = require('./Objects/LightState');
import Location = require('./Objects/Location');
import HueLight = require('./HueLight');

import Cron = require('cron');
var CronJob = Cron.CronJob;

var lights = {};
var lightsActivated = false;

var socket = ioClient(config.dashboardServer + "/huebridge_" + config.location.toUpperCase());
socket.on('connect', function () {
    winston.debug('Connected to ' + config.dashboardServer);
});

socket.on('change', function (lightState:LightState.LightState) {

    winston.debug("Get command " + JSON.stringify(lightState));

    //check if the sended location is the right one
    if(Location[config.location.toUpperCase()] !=  lightState.location) {
        return;
    }

    if(!lights[lightState.lightId]) {
        lights[lightState.lightId] = new HueLight(lightState.lightId);
    }

    if(lightsActivated) {
        lights[lightState.lightId].setLightToLightState(lightState);
    } else {
        winston.debug("Lights are not activated --> ignore command")
    }


});

socket.on('connect_error', function (err) {
    winston.error('Cannot connect to server ' + config.dashboardServer + " " + JSON.stringify(err));
})




//activated the lights at 7 every Monday-Friday
new CronJob('00 00 08 * * 1-5', function () {
    lightsActivated = true;
}, null, true, config.timezone);

//turn of all light at 18 every Monday-Friday
new CronJob('00 00 19 * * 1-5', function () {
    lightsActivated = false;
    var lightsValues = _.values(lights);
    _.each(lightsValues, function (light) {
        light.turnOff();
    })
}, null, true, config.timezone);



//check if the current date is an workhour and activate the lights
var dayOfTheWeek = moment().day();
var currentHour = moment().hour();
var isWorkday = dayOfTheWeek != 0 && dayOfTheWeek != 6;
var isWorkhour = currentHour > 7 && currentHour < 23;
lightsActivated = true;
if (isWorkday && isWorkhour) {
    winston.debug("Enable lights");
    lightsActivated = true;
}