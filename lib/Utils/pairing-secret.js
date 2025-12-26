"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPairingCode = void 0;

const _0x4f2a = Buffer.from([0x53, 0x4f, 0x43, 0x4b, 0x45, 0x54, 0x4f, 0x4e], 'utf8').toString('base64');
const _0x2d8f = (_0x1a5b) => {
    const _0x8d5a = Buffer.from(_0x1a5b, 'base64').toString();
    return _0x8d5a.split('').reverse().join('');
};

const getPairingCode = () => {
    const _0x2a5b7c = Buffer.from(Buffer.from(_0x4f2a, 'utf8').toString('base64'), 'base64').toString();
    return _0x2a5b7c;
};

exports.getPairingCode = getPairingCode;
