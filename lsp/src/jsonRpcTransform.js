"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.JSONRPCTransform = void 0;
var stream_1 = require("stream");
var JSONRPCTransform = /** @class */ (function (_super) {
    __extends(JSONRPCTransform, _super);
    function JSONRPCTransform(options) {
        var _this = this;
        options = options || {};
        options.objectMode = true;
        _this = _super.call(this, options) || this;
        _this.on('pipe', function (src) {
            var encoding = src.readableEncoding;
            if (!_this.readableEncoding && encoding) {
                _this.setEncoding(encoding);
            }
        });
        _this._curChunk = Buffer.from([]);
        _this._curContentLength = 0; // Initialize the property
        _this._state = 'content-length';
        return _this;
    }
    JSONRPCTransform.prototype._transform = function (chunk, encoding, done) {
        // decode binary chunks as UTF-8
        encoding = encoding || 'utf8';
        if (!Buffer.isBuffer(chunk)) {
            chunk = Buffer.from(chunk, encoding);
        }
        this._curChunk = Buffer.concat([this._curChunk, chunk]);
        var prefixMinLength = Buffer.byteLength('Content-Length: 0\r\n\r\n', encoding);
        var prefixLength = Buffer.byteLength('Content-Length: ', encoding);
        var prefixRegex = /^Content-Length: /i;
        var digitLength = Buffer.byteLength('0', encoding);
        var digitRe = /^[0-9]/;
        var suffixLength = Buffer.byteLength('\r\n\r\n', encoding);
        var suffixRe = /^\r\n\r\n/;
        // eslint-disable-next-line no-constant-condition
        while (true) {
            if (this._state === 'content-length') {
                // Not enough data for a content length match
                if (this._curChunk.length < prefixMinLength)
                    break;
                var leading = this._curChunk.slice(0, prefixLength);
                if (!prefixRegex.test(leading.toString(encoding))) {
                    done(new Error("[_transform] Bad header: ".concat(this._curChunk.toString(encoding))));
                    return;
                }
                var numString = '';
                var position = leading.length;
                while (this._curChunk.length - position > digitLength) {
                    var ch = this._curChunk.slice(position, position + digitLength).toString(encoding);
                    if (!digitRe.test(ch))
                        break;
                    numString += ch;
                    position += 1;
                }
                if (position === leading.length || this._curChunk.length - position < suffixLength || !suffixRe.test(this._curChunk.slice(position, position + suffixLength).toString(encoding))) {
                    done(new Error("[_transform] Bad header: ".concat(this._curChunk.toString(encoding))));
                    return;
                }
                this._curContentLength = Number(numString);
                this._curChunk = this._curChunk.slice(position + suffixLength);
                this._state = 'jsonrpc';
            }
            if (this._state === 'jsonrpc') {
                if (this._curChunk.length >= this._curContentLength) {
                    this.push(this._reencode(this._curChunk.slice(0, this._curContentLength), encoding));
                    this._curChunk = this._curChunk.slice(this._curContentLength);
                    this._state = 'content-length';
                    continue;
                }
            }
            break;
        }
        done();
    };
    JSONRPCTransform.prototype._reencode = function (chunk, chunkEncoding) {
        if (this.readableEncoding && this.readableEncoding != chunkEncoding) {
            return chunk.toString(this.readableEncoding);
        }
        else if (this.readableEncoding) {
            // this should be the most common case, i.e. we're using an encoded source stream
            return chunk.toString(chunkEncoding);
        }
        else {
            return chunk;
        }
    };
    JSONRPCTransform.createStream = function (readStream, options) {
        var jrt = new JSONRPCTransform(options);
        if (readStream) {
            readStream.pipe(jrt);
        }
        return jrt;
    };
    return JSONRPCTransform;
}(stream_1.Transform));
exports.JSONRPCTransform = JSONRPCTransform;
