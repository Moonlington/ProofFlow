import pino from 'pino';
import pinoPretty from 'pino-pretty';

export enum LoggerLevel {
    TRACE = "10",
    DEBUG = "20",
    INFO = "30",
    WARN = "40",
    ERROR = "50",
    FATAL = "60"
}

export class Logger {
    private static logger: pino.Logger;
    private static isJsonFormatEnabled: boolean;

    public static setLogLevel(logLevel: string, isJsonFormatEnabled: boolean): void {
        logLevel = logLevel.toLowerCase();
        this.isJsonFormatEnabled = isJsonFormatEnabled;

        if (!isJsonFormatEnabled) {
            const prettyStream = pinoPretty({
                colorize: true,
                levelFirst: true,
                translateTime: true,
                ignore: 'pid,hostname'
            });
            this.logger = pino({
                name: 'ts-lsp-client',
                level: logLevel,
            }, prettyStream);
        } else {
            this.logger = pino({
                name: 'ts-lsp-client',
                level: logLevel,
            });
        }
    }

    public static log(message: string, logLevel: LoggerLevel): void {
        if (!this.logger || this.isJsonFormatEnabled) return;
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
    }
}
