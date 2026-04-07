const SOURCE_CHANNEL_ID = process.env.SOURCE_CHANNEL_ID;
const DEST_CHANNEL_ID = process.env.DEST_CHANNEL_ID;

const KEYWORDS = [
  "app",
  "manager app",
  "business manager app",
  "App",
  "Mobile App",
  "Business Manager App",
  "bma",
];

function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Match keyword as whole words only (e.g. "app" matches "the app" but not "appreciate"). */
function textMatchesKeyword(text, keyLower) {
  const parts = keyLower.split(/\s+/).filter(Boolean).map(escapeRegExp);
  if (parts.length === 0) return false;
  const pattern = `\\b${parts.join("\\s+")}\\b`;
  return new RegExp(pattern, "i").test(text);
}

/** Plain text from message + Block Kit + legacy attachments (apps often omit top-level `text`). */
function getMessageSearchText(event) {
  const parts = [];

  if (event.text) parts.push(event.text);

  function pushBlockText(b) {
    if (!b || typeof b !== "object") return;
    if (typeof b.text === "string") parts.push(b.text);
    else if (b.text && typeof b.text.text === "string") parts.push(b.text.text);
    if (b.type === "rich_text" && Array.isArray(b.elements)) {
      for (const el of b.elements) {
        if (el.type === "rich_text_section" && Array.isArray(el.elements)) {
          for (const inner of el.elements) {
            if (inner.type === "text" && inner.text) parts.push(inner.text);
          }
        }
      }
    }
    if (Array.isArray(b.elements)) for (const el of b.elements) pushBlockText(el);
    if (Array.isArray(b.fields)) {
      for (const f of b.fields) {
        if (typeof f === "string") parts.push(f);
        else if (f?.text) {
          if (typeof f.text === "string") parts.push(f.text);
          else if (f.text?.text) parts.push(f.text.text);
        }
      }
    }
  }

  if (Array.isArray(event.blocks)) for (const b of event.blocks) pushBlockText(b);

  if (Array.isArray(event.attachments)) {
    for (const a of event.attachments) {
      if (a?.pretext) parts.push(a.pretext);
      if (a?.fallback) parts.push(a.fallback);
      if (a?.title) parts.push(a.title);
      if (a?.text) parts.push(a.text);
      if (Array.isArray(a.fields)) {
        for (const f of a.fields) {
          if (f?.title) parts.push(f.title);
          if (f?.value) parts.push(f.value);
        }
      }
    }
  }

  return parts.filter(Boolean).join("\n");
}

const SKIP_SUBTYPES = new Set(["message_changed", "message_deleted"]);

function registerMessageEvent(slackApp) {
  slackApp.event("message", async ({ event, client, logger }) => {
    try {
      if (event.subtype && SKIP_SUBTYPES.has(event.subtype)) return;
      if (event.channel !== SOURCE_CHANNEL_ID) return;

      const haystack = getMessageSearchText(event).toLowerCase();
      const seen = new Set();
      const matched = [];
      for (const k of KEYWORDS) {
        const keyLower = k.toLowerCase();
        if (textMatchesKeyword(haystack, keyLower) && !seen.has(keyLower)) {
          seen.add(keyLower);
          matched.push(k);
        }
      }

      if (matched.length === 0) return;

      const preview =
        (event.text && event.text.trim()) ||
        getMessageSearchText(event).trim() ||
        "(no text body)";
      const from =
        event.user != null
          ? `<@${event.user}>`
          : event.bot_profile?.name
            ? `${event.bot_profile.name} (app)`
            : "An app";

      await client.chat.postMessage({
        channel: DEST_CHANNEL_ID,
        text:
          `New merchant feedback from ${from} in <#${SOURCE_CHANNEL_ID}>.\n` +
          `Matched keywords: ${matched.join(", ")}\n\n` +
          `${preview}`,
      });
    } catch (err) {
      logger.error(err);
    }
  });
}

module.exports = { registerMessageEvent };
