"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Logger = exports.LoggerLevel = void 0;
var pino_1 = require("pino");
var pino_pretty_1 = require("pino-pretty");
var LoggerLevel;
(function (LoggerLevel) {
    LoggerLevel["TRACE"] = "10";
    LoggerLevel["DEBUG"] = "20";
    LoggerLevel["INFO"] = "30";
    LoggerLevel["WARN"] = "40";
    LoggerLevel["ERROR"] = "50";
    LoggerLevel["FATAL"] = "60";
})(LoggerLevel || (exports.LoggerLevel = LoggerLevel = {}));
var Logger = /** @class */ (function () {
    function Logger() {
    }
    Logger.setLogLevel = function (logLevel, isJsonFormatEnabled) {
        logLevel = logLevel.toLowerCase();
        this.isJsonFormatEnabled = isJsonFormatEnabled;
        if (!isJsonFormatEnabled) {
            var prettyStream = (0, pino_pretty_1.default)({
                colorize: true,
                levelFirst: true,
                translateTime: true,
                ignore: 'pid,hostname'
            });
            this.logger = (0, pino_1.default)({
                name: 'ts-lsp-client',
                level: logLevel,
            }, prettyStream);
        }
        else {
            this.logger = (0, pino_1.default)({
                name: 'ts-lsp-client',
                level: logLevel,
            });
        }
    };
    Logger.log = function (message, logLevel) {
        if (!this.logger || this.isJsonFormatEnabled)
            return;
        switch (logLevel) {
            case LoggerLevel.TRACE:
                this.logger.trace(message);
                break;
            case LoggerLevel.DEBUG:
                this.logger.debug(message);
                break;
            case LoggerLevel.INFO:
                this.logger.info(message);
                break;
            case LoggerLevel.WARN:
                this.logger.warn(message);
                break;
            case LoggerLevel.ERROR:
                this.logger.error(message);
                break;
            case LoggerLevel.FATAL:
                this.logger.fatal(message);
                break;
        }
    };
    return Logger;
}());
exports.Logger = Logger;
