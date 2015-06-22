/// <reference path='typings/winston/winston.d.ts' />
import winston = require('winston');
winston.remove(winston.transports.Console); //normally does not log debugs
winston.add(winston.transports.Console, {level: 'debug', timestamp: true, colorize: true});

require('./module/WebsocketHandler');