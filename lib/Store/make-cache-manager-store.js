//===================================//
import { BufferJSON, initAuthCreds } from "../Utils/index.js";
import { proto } from "../../WAProto/index.js";
import { createCache } from "cache-manager";
import logger from "../Utils/logger.js";
//===================================//
export async function makeCacheManagerAuthState(store, sessionKey) {
  const defaultKey = (file) => `${sessionKey}:${file}`
  const databaseConn = await caching(store);
  const writeData = async (file, data) => {
    let ttl
    if (file === "creds") {
      ttl = 63115200
    }
    await databaseConn.set(defaultKey(file), JSON.stringify(data, BufferJSON.replacer), ttl)
  }
  const readData = async (file) => {
    try {
      const data = await databaseConn.get(defaultKey(file))
      if (data) return JSON.parse(data, BufferJSON.reviver)
      return null
    } catch (error) {
      logger.error(error)
      return null
    }
  }
  const removeData = async (file) => {
    try {
      return await databaseConn.del(defaultKey(file))
    } catch (err) {
      logger.error(`Error removing ${file} from session ${sessionKey}`)
    }
  }
  const clearState = async () => {
    try {
      const keys = await databaseConn.store.keys(`${sessionKey}*`)
      await Promise.all(keys.map((key) => databaseConn.del(key)))
    } catch (err) {}
  }
  const creds = (await readData("creds")) || initAuthCreds()
  return {
    clearState,
    saveCreds: () => writeData("creds", creds),
    state: {
      creds,
      keys: {
        get: async (type, ids) => {
          const data = {}
          await Promise.all(
            ids.map(async (id) => {
              let value = await readData(`${type}-${id}`)
              if (type === "app-state-sync-key" && value) {
                value = proto.Message.AppStateSyncKeyData.fromObject(value)
              }
              data[id] = value
            })
          )
          return data
        },
        set: async (data) => {
          const tasks = []
          for (const category in data) {
            for (const id in data[category]) {
              const value = data[category][id]
              const key = `${category}-${id}`
              tasks.push(value ? writeData(key, value) : removeData(key))
            }
          }
          await Promise.all(tasks)
        }
      }
    }
  }
}
//===================================//