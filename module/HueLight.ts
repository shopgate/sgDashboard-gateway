/// <reference path='../typings/node/node.d.ts' />
/// <reference path='../typings/winston/winston.d.ts' />
/// <reference path='../typings/request/request.d.ts' />
/// <reference path='../typings/cron/cron.d.ts' />

import http = require('http');
import fs = require('fs');
import querystring = require('querystring');
import request = require('request');
import winston = require('winston');
import _ = require('underscore');
import LightState = require('./Objects/LightState');
import colorConverter = require('./hue-color-converter/colorconverter');
import config = require('./config');


class HueLight {

	private bridgeURL:string = null;
	private bridgeUsername:string = null;

	constructor(private lightId:number) {

		var _this = this;
		_.each(config.hues, function name(hue) {
			if(lightId >= hue.startId && lightId <= hue.endId) {
				_this.bridgeURL = hue.bridgeURL;
				_this.bridgeUsername = hue.bridgeUsername;
				_this.lightId = _this.lightId - hue.startId + 1;
				
			}
		});



	}


	_convertLightColorIntoRGB(lightColor:LightState.LightColor) {
		var colorMapping = {};
		colorMapping[LightState.LightColor.RED] = "FF0000";
		colorMapping[LightState.LightColor.GREEN] = "00FF00";
		colorMapping[LightState.LightColor.BLUE] = "0000FF";
		colorMapping[LightState.LightColor.ORANGE] = "FFAA00";

		return colorMapping[lightColor];
	}

	turnOn() {
		this.sendRequest({
			"on": true
		});
	}

	turnOff() {
		this.sendRequest({
			"on": false
		});
	}

	turnSuccess(brightness?:number) {

		if (typeof brightness == "undefined") {
			brightness = 255;
		}

		this.sendRequest({
			"on": true,
			"sat": 255,
			"bri": brightness,
			"hue": 25653
		});
	}

	turnWarning(brightness?:number) {

		if (typeof brightness == "undefined") {
			brightness = 255;
		}

		this.sendRequest({
			"on": true,
			"alert": true,
			"sat": 255,
			"bri": brightness,
			"hue": 46920
		});
	}

	turnError(brightness?:number) {

		if (typeof brightness == "undefined") {
			brightness = 255;
		}

		this.sendRequest({
			"on": true,
			"sat": 255,
			"bri": brightness,
			"hue": 0
		});
	}

	turnErrorAlert() {
		this.sendRequest({
			"on": true,
			"alert": "lselect",
			"sat": 255,
			"bri": 255,
			"hue": 0
		});
	}

	/**
	 * Turn the the light on as alert
	 * with the given rgb hex value
	 *
	 * For example: "FF0000" for red
	 *
	 * @param string rgb
	 */
	turnAlertToColor(rgb:string, brightness:number) {

		var xy = colorConverter.hexStringToXyBri(rgb);
		this.sendRequest({
			"on": true,
			"alert": "lselect",
			"xy": [xy.x, xy.y],
			"bri": brightness
		});

		var _this = this;
		setTimeout(function () {
			_this.turnOff();
		}, 10000);

	}

	/**
	 * Turn the the light on as alert
	 * with the given LightColor ENUM
	 *
	 * @param lightColor
	 */
	turnAlertToLightColor(lightColor:LightState.LightColor, brightness:number) {
		var rgb = this._convertLightColorIntoRGB(lightColor);
		this.turnAlertToColor(rgb, brightness);
	}

	/**
	 * Turn the the light on
	 * with the given rgb hex value
	 *
	 * For example: "FF0000" for red
	 *
	 * @param string rgb
	 */
	turnOnWithColor(rgb:string, brightnessPercent:number) {
		var xy = colorConverter.hexStringToXyBri(rgb);
		var brightness = Math.round((brightnessPercent / 100) * 255);
		this.sendRequest({
			"on": true,
			"xy": [xy.x, xy.y],
			"bri": brightness
		});
	}

	/**
	 * Turn the the light on as alert
	 * with the given LightColor ENUM
	 *
	 * @param lightColor
	 */
	turnOnToLightColor(lightColor:LightState.LightColor, brightness:number) {
		var rgb = this._convertLightColorIntoRGB(lightColor);
		this.turnOnWithColor(rgb, brightness);
	}

	/**
	 * Set the light to the given light state
	 * @param lightState
	 */
	setLightToLightState(lightState:LightState.LightState) {

		if (lightState.lightStatus == LightState.LightStatus.BLINKING) {
			this.turnAlertToLightColor(lightState.color, lightState.brightness);
		}

		if (lightState.lightStatus == LightState.LightStatus.ON) {
			this.turnOnToLightColor(lightState.color, lightState.brightness);
		}


	}

	private sendRequest(postData:Object) {

		if(!this.bridgeURL && this.bridgeUsername) {
			winston.error("No bridge settings found");
			return;
		}
		var url = "http://" + this.bridgeURL + "/api/" + this.bridgeUsername + "/lights/" + this.lightId + "/state";

		request({url: url, method: 'PUT', json: postData}, function (err, request, body) {
			winston.debug("Answer from Light" + body);
		})

	}

}


export = HueLight;

