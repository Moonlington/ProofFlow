"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LspClient = void 0;
var events_1 = require("events");
var LspClient = /** @class */ (function () {
    function LspClient(endpoint) {
        this.endpoint = endpoint;
    }
    LspClient.prototype.initialize = function (params) {
        return this.endpoint.send('initialize', params);
    };
    LspClient.prototype.initialized = function () {
        this.endpoint.notify('initialized');
    };
    LspClient.prototype.shutdown = function () {
        return this.endpoint.send('shutdown');
    };
    LspClient.prototype.exit = function () {
        this.endpoint.notify('exit');
    };
    LspClient.prototype.didOpen = function (params) {
        this.endpoint.notify('textDocument/didOpen', params);
    };
    LspClient.prototype.didClose = function (params) {
        this.endpoint.notify('textDocument/didClose', params);
    };
    LspClient.prototype.documentSymbol = function (params) {
        return this.endpoint.send('textDocument/documentSymbol', params);
    };
    LspClient.prototype.references = function (params) {
        return this.endpoint.send('textDocument/references', params);
    };
    LspClient.prototype.definition = function (params) {
        return this.endpoint.send('textDocument/definition', params);
    };
    LspClient.prototype.typeDefinition = function (params) {
        return this.endpoint.send('textDocument/typeDefinition', params);
    };
    LspClient.prototype.signatureHelp = function (params) {
        return this.endpoint.send('textDocument/signatureHelp', params);
    };
    LspClient.prototype.once = function (method) {
        return (0, events_1.once)(this.endpoint, method);
    };
    LspClient.prototype.hover = function (params) {
        return this.endpoint.send('textDocument/hover', params);
    };
    LspClient.prototype.gotoDeclaration = function (params) {
        return this.endpoint.send('textDocument/declaration', params);
    };
    return LspClient;
}());
exports.LspClient = LspClient;
