//=======================================================//
import { proto } from "../../WAProto/index.js";
import { platform, release } from "os";
//=======================================================//
const PLATFORM_MAP = {
    'Chrome': '49',
    'Edge': '50',
    'Firefox': '51',
    'Opera': '53',
    'Safari': '54'
};
//=======================================================//
export const Browsers = {
    iOS: (browser) => ["ios", browser, "18.2"], 
    ubuntu: (browser) => ['Ubuntu', browser, '22.04.4'],
    macOS: (browser) => ['Mac OS', browser, '14.4.1'],
    baileys: (browser) => ['Baileys', browser, '6.5.0'],
    windows: (browser) => ['Windows', browser, '10.0.22631']
};
//=======================================================//
export const getPlatformId = (browser) => {
  const platformType = proto.DeviceProps.PlatformType[browser.toUpperCase()];
  return platformType ? platformType.toString() : "1";
};
//=======================================================//