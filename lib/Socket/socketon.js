//=======================================================//
import makeWASocket from "./index.js";
import { useMultiFileAuthState } from "../Utils/use-multi-file-auth-state.js";
import { Browsers } from "../Utils/browser-utils.js";
import { DisconnectReason } from "../Types/index.js";
import { downloadContentFromMessage } from "../Utils/messages-media.js";
import { jidDecode, jidEncode } from "../WABinary/index.js";
import { proto } from "../../WAProto/index.js";
import pino from "pino";
import fs from "fs/promises";
import path from "path";
//=======================================================//

const DEFAULT_CONFIG = {
  connectTimeoutMs: 30000,
  keepAliveIntervalMs: 30000,
  maxMsgRetryCount: 5,
  enableAutoReconnect: true,
  enableMetadataCache: true,
  syncFullHistory: false,
  browser: Browsers.ubuntu("Chrome")
};

const MAX_RECONNECT_ATTEMPTS = 10;
const BASE_RECONNECT_DELAY = 5000;

let reconnectAttempts = 0;
let reconnectScheduled = false;
let groupMetadataCache = new Map();

export const makeWASocketon = async (config = {}) => {
  const { sessionDir, pairingNumber, pairingCode, onMessage, onConnection, onGroupJoin, onGroupLeave, onError } = config;

  // Validasi config
  if (!sessionDir) {
    throw new Error("sessionDir is required");
  }
  if (!pairingNumber) {
    throw new Error("pairingNumber is required");
  }
  if (!onMessage || typeof onMessage !== "function") {
    throw new Error("onMessage callback is required and must be a function");
  }
  if (pairingCode && pairingCode.length !== 8) {
    throw new Error("pairingCode must be 8 characters long");
  }

  // Create session directory if not exists
  await fs.mkdir(sessionDir, { recursive: true });

  // Initialize auth state
  const { state, saveCreds } = await useMultiFileAuthState(sessionDir);

  // Setup logger
  const logger = config.logger || pino({ level: "silent" }).child({ service: "socketon" });

  // Initialize socket
  const sock = makeWASocket({
    ...DEFAULT_CONFIG,
    ...config,
    auth: state,
    logger,
    printQRInTerminal: false,
    defaultQueryTimeoutMs: 60000
  });

  // Enhanced helpers
  sock.sessionDir = sessionDir;
  sock.sessionId = path.basename(sessionDir);
  sock.socketonConfig = { sessionDir, pairingNumber, pairingCode };

  // Message serializer
  sock.serialize = (msg) => {
    const { key, message, pushName, participant } = msg;
    const m = {
      id: key.id,
      remoteJid: key.remoteJid,
      fromMe: key.fromMe,
      timestamp: msg.messageTimestamp,
      pushName: pushName || "",
      text: message?.conversation || 
            message?.extendedTextMessage?.text || 
            message?.imageMessage?.caption ||
            message?.videoMessage?.caption || "",
      quoted: null,
      mentionedJids: [],
      isGroup: key.remoteJid?.endsWith("@g.us"),
      isNewsletter: key.remoteJid?.endsWith("@newsletter"),
      author: participant || key.remoteJid?.split(":")[0]
    };

    // Parse quoted message
    if (message?.extendedTextMessage?.contextInfo) {
      const { quotedMessage, participant: quotedParticipant } = message.extendedTextMessage.contextInfo;
      if (quotedMessage) {
        m.quoted = {
          id: key.remoteJid,
          participant: quotedParticipant,
          text: quotedMessage?.conversation || quotedMessage?.extendedTextMessage?.text || ""
        };
      }
    }

    // Parse mentions
    if (message?.extendedTextMessage?.contextInfo?.mentionedJid) {
      m.mentionedJids = message.extendedTextMessage.contextInfo.mentionedJid;
    } else if (message?.extendedTextMessage?.contextInfo?.mentionedJid) {
      m.mentionedJids = message.extendedTextMessage.contextInfo.mentionedJid;
    }

    return m;
  };

  // Group metadata cache
  sock.groupMetadataCache = groupMetadataCache;
  sock.getGroupMetadata = async (jid) => {
    if (!jid || !jid.endsWith("@g.us")) {
      return null;
    }
    
    if (config.enableMetadataCache !== false && groupMetadataCache.has(jid)) {
      return groupMetadataCache.get(jid);
    }
    
    try {
      const metadata = await sock.groupMetadata(jid);
      if (config.enableMetadataCache !== false) {
        groupMetadataCache.set(jid, metadata);
      }
      return metadata;
    } catch (error) {
      logger.error({ jid, error: error.message }, "Failed to fetch group metadata");
      return null;
    }
  };

  sock.clearGroupCache = (jid) => {
    if (jid) {
      groupMetadataCache.delete(jid);
    } else {
      groupMetadataCache.clear();
    }
  };

  // Download media helper
  sock.downloadMedia = async (msg, type, filename) => {
    if (!msg || !msg.url) {
      return Buffer.alloc(0);
    }
    
    try {
      const stream = await downloadContentFromMessage(msg, type || "image");
      let buffer = Buffer.from([]);
      for await (const chunk of stream) {
        buffer = Buffer.concat([buffer, chunk]);
      }
      
      if (filename) {
        const filePath = path.join(sessionDir, filename);
        await fs.writeFile(filePath, buffer);
        return filePath;
      }
      
      return buffer;
    } catch (error) {
      logger.error({ error: error.message }, "Failed to download media");
      return Buffer.alloc(0);
    }
  };

  // Decode JID helper
  sock.decodeJid = (jid) => {
    if (!jid) return jid;
    
    if (/:\\d+@/gi.test(jid)) {
      const decoded = jidDecode(jid);
      if (decoded?.user && decoded?.server) {
        return jidEncode(decoded.user, decoded.server, decoded.device);
      }
    }
    
    return jid;
  };

  // Enhanced send message
  sock.send = async (jid, content) => {
    return await sock.sendMessage(jid, content);
  };

  // Reply helper
  sock.reply = async (msg, text, options = {}) => {
    const jid = msg.remoteJid || msg.chat;
    return await sock.sendMessage(jid, {
      text,
      ...options
    }, {
      quoted: msg
    });
  };

  // Forward helper
  sock.forward = async (jid, msg) => {
    return await sock.sendMessage(jid, {
      forward: { key: msg.key, message: msg.message }
    });
  };

  // Presence helper
  sock.setPresence = async (status, jid) => {
    return await sock.sendPresenceUpdate(status, jid);
  };

  // Connection status tracking
  const updateConnectionStatus = (status, data = {}) => {
    const connectionData = { status, ...data, timestamp: Date.now() };
    
    if (onConnection && typeof onConnection === "function") {
      onConnection(status, connectionData);
    }
  };

  // Exponential backoff reconnect
  const scheduleReconnect = async () => {
    if (reconnectScheduled) {
      return;
    }
    
    if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
      logger.error("Max reconnect attempts reached. Giving up.");
      updateConnectionStatus("failed", { attempts: reconnectAttempts });
      reconnectAttempts = 0;
      reconnectScheduled = false;
      return;
    }
    
    reconnectScheduled = true;
    const backoffMs = Math.min(
      BASE_RECONNECT_DELAY * Math.pow(2, reconnectAttempts),
      60000
    );
    
    logger.info(`Reconnecting in ${backoffMs}ms (attempt ${reconnectAttempts + 1}/${MAX_RECONNECT_ATTEMPTS})`);
    updateConnectionStatus("reconnecting", { attempt: reconnectAttempts + 1, delay: backoffMs });
    
    await new Promise(resolve => setTimeout(resolve, backoffMs));
    
    reconnectAttempts++;
    reconnectScheduled = false;
    
    try {
      logger.info("Attempting to reconnect...");
      await sock.ws.connect();
    } catch (error) {
      logger.error({ error: error.message }, "Reconnect failed");
      scheduleReconnect();
    }
  };

  // Auto-save credentials
  sock.ev.on("creds.update", saveCreds);

  // Handle messages
  sock.ev.on("messages.upsert", async ({ messages, type }) => {
    for (const msg of messages) {
      if (!msg.message) continue;
      
      const serialized = sock.serialize(msg);
      
      try {
        await onMessage(serialized, msg);
      } catch (error) {
        logger.error({ error: error.message, messageId: msg.key.id }, "Error in onMessage handler");
        
        if (onError && typeof onError === "function") {
          onError(error, { messageId: msg.key.id, type: "message_handler" });
        }
      }
    }
  });

  // Handle connection updates
  sock.ev.on("connection.update", async (update) => {
    const { connection, lastDisconnect } = update;
    
    if (connection === "open") {
      logger.info("Connection opened successfully");
      reconnectAttempts = 0;
      reconnectScheduled = false;
      updateConnectionStatus("open");
    } 
    else if (connection === "close") {
      const reason = lastDisconnect?.error?.output?.statusCode;
      logger.info({ reason, error: lastDisconnect?.error?.message }, "Connection closed");
      
      if (reason === DisconnectReason.loggedOut) {
        logger.error("Session logged out. Delete session directory and restart.");
        updateConnectionStatus("loggedOut", { reason });
        reconnectAttempts = 0;
      } 
      else if (config.enableAutoReconnect !== false) {
        logger.info("Auto-reconnect enabled. Scheduling reconnect...");
        updateConnectionStatus("close", { reason, autoReconnect: true });
        await scheduleReconnect();
      } 
      else {
        updateConnectionStatus("close", { reason, autoReconnect: false });
      }
    }
    else if (connection === "connecting") {
      updateConnectionStatus("connecting");
    }
  });

  // Handle group participants update
  sock.ev.on("group-participants.update", async (update) => {
    const { id, participants, action, author } = update;
    
    try {
      const metadata = await sock.getGroupMetadata(id);
      if (metadata) {
        groupMetadataCache.set(id, metadata);
      }
      
      if (action === "add") {
        for (const participant of participants) {
          const msg = {
            remoteJid: id,
            participant,
            author,
            action: "add"
          };
          
          if (onGroupJoin && typeof onGroupJoin === "function") {
            await onGroupJoin(msg, update);
          }
        }
      } 
      else if (action === "remove") {
        for (const participant of participants) {
          const msg = {
            remoteJid: id,
            participant,
            author,
            action: "remove"
          };
          
          if (onGroupLeave && typeof onGroupLeave === "function") {
            await onGroupLeave(msg, update);
          }
        }
      }
    } catch (error) {
      logger.error({ error: error.message }, "Error in group-participants handler");
      
      if (onError && typeof onError === "function") {
        onError(error, { groupId: id, action, type: "group_handler" });
      }
    }
  });

  // Request pairing code
  if (!sock.authState?.creds?.registered) {
    logger.info("Device not registered. Requesting pairing code...");
    updateConnectionStatus("requesting_pairing_code");
    
    setTimeout(async () => {
      try {
        const code = pairingCode && pairingCode.length === 8 
          ? await sock.requestPairingCode(pairingNumber.trim(), pairingCode)
          : await sock.requestPairingCode(pairingNumber.trim());
        
        logger.info({ pairingNumber, code }, "Pairing code generated");
        updateConnectionStatus("pairing_code_ready", { code, pairingNumber });
        
        console.log(`\n═════════════════════════════════════`);
        console.log(`  📱 Pairing Code: ${code}`);
        console.log(`  📞 Number: ${pairingNumber.trim()}`);
        console.log(`═════════════════════════════════════\n`);
      } catch (error) {
        logger.error({ error: error.message }, "Failed to request pairing code");
        
        if (onError && typeof onError === "function") {
          onError(error, { type: "pairing_code" });
        }
      }
    }, 3000);
  }

  // Graceful shutdown
  sock.shutdown = async () => {
    logger.info("Shutting down Socketon...");
    await sock.end();
    reconnectAttempts = 0;
    reconnectScheduled = false;
    groupMetadataCache.clear();
    updateConnectionStatus("shutdown");
  };

  // Return enhanced socket
  return sock;
};
//=======================================================//
