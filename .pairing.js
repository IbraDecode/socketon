"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPairingCode = void 0;

const getPairingCode = () => {
    const reversed = "NOTTEKCOS";
    const encoded = Buffer.from(reversed, 'utf8').toString('base64');
    const decoded = Buffer.from(encoded, 'base64').toString().split('').reverse().join('');
    return decoded;
};

exports.getPairingCode = getPairingCode;
