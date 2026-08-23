var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_express = __toESM(require("express"), 1);
var import_cors = __toESM(require("cors"), 1);
var import_dotenv = __toESM(require("dotenv"), 1);
var import_path = __toESM(require("path"), 1);
var import_crypto = __toESM(require("crypto"), 1);
var import_vite = require("vite");
var import_genai = require("@google/genai");
var import_axios = __toESM(require("axios"), 1);
var import_fs = __toESM(require("fs"), 1);
var import_child_process = require("child_process");
var import_util = __toESM(require("util"), 1);
import_dotenv.default.config();
var app = (0, import_express.default)();
var PORT = 3e3;
app.use((0, import_cors.default)());
app.use(import_express.default.json());
var ai = new import_genai.GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build"
    }
  }
});
var qobuzAppId = process.env.QOBUZ_APP_ID || "";
var qobuzSecret = process.env.QOBUZ_SECRET || "";
var qobuzToken = "";
try {
  const tokens = JSON.parse(process.env.QOBUZ_AUTH_TOKENS || "[]");
  if (tokens.length > 0) qobuzToken = tokens[0];
} catch (e) {
  console.error("Failed to parse QOBUZ_AUTH_TOKENS");
}
var qobuzApiBase = "https://www.qobuz.com/api.json/0.2/";
async function qobuzSearch(query, limit = 10, offset = 0) {
  if (!qobuzAppId) return { error: "QOBUZ_APP_ID not configured." };
  try {
    const url = `${qobuzApiBase}catalog/search`;
    const response = await import_axios.default.get(url, {
      params: { query, limit, offset },
      headers: {
        "x-app-id": qobuzAppId,
        "x-user-auth-token": qobuzToken || void 0
      }
    });
    return response.data;
  } catch (error) {
    console.error("Qobuz search error:", error?.response?.data || error.message);
    return { error: "Failed to search Qobuz" };
  }
}
app.get("/api/search", async (req, res) => {
  const { q } = req.query;
  if (!q) {
    return res.status(400).json({ error: "Query is required" });
  }
  const results = await qobuzSearch(q);
  res.json(results);
});
app.get("/api/stream", async (req, res) => {
  const { track_id } = req.query;
  if (!track_id) return res.status(400).json({ error: "track_id is required" });
  if (!qobuzAppId || !qobuzSecret) return res.status(400).json({ error: "Qobuz credentials not configured" });
  try {
    const quality = "27";
    const timestamp = Math.floor(Date.now() / 1e3);
    const r_sig = `trackgetFileUrlformat_id${5}intentstreamtrack_id${track_id}${timestamp}${qobuzSecret}`;
    const r_sig_hashed = import_crypto.default.createHash("md5").update(r_sig).digest("hex");
    const response = await import_axios.default.get(`${qobuzApiBase}track/getFileUrl`, {
      params: {
        format_id: 5,
        intent: "stream",
        track_id,
        request_ts: timestamp,
        request_sig: r_sig_hashed
      },
      headers: {
        "x-app-id": qobuzAppId,
        "x-user-auth-token": qobuzToken || void 0
      }
    });
    res.json(response.data);
  } catch (error) {
    console.error("Qobuz stream error:", error?.response?.data || error.message);
    res.status(500).json({ error: "Failed to get stream URL" });
  }
});
app.get("/api/album", async (req, res) => {
  const { album_id } = req.query;
  if (!album_id) return res.status(400).json({ error: "album_id is required" });
  if (!qobuzAppId) return res.status(400).json({ error: "Qobuz credentials not configured" });
  try {
    const response = await import_axios.default.get(`${qobuzApiBase}album/get`, {
      params: { album_id },
      headers: {
        "x-app-id": qobuzAppId,
        "x-user-auth-token": qobuzToken || void 0
      }
    });
    res.json(response.data);
  } catch (error) {
    console.error("Qobuz album error:", error?.response?.data || error.message);
    res.status(500).json({ error: "Failed to get album details" });
  }
});
app.get("/api/downloadUrl", async (req, res) => {
  const { track_id, format_id } = req.query;
  if (!track_id || !format_id) return res.status(400).json({ error: "track_id and format_id are required" });
  if (!qobuzAppId || !qobuzSecret) return res.status(400).json({ error: "Qobuz credentials not configured" });
  try {
    const timestamp = Math.floor(Date.now() / 1e3);
    const r_sig = `trackgetFileUrlformat_id${format_id}intentstreamtrack_id${track_id}${timestamp}${qobuzSecret}`;
    const r_sig_hashed = import_crypto.default.createHash("md5").update(r_sig).digest("hex");
    const response = await import_axios.default.get(`${qobuzApiBase}track/getFileUrl`, {
      params: {
        format_id,
        intent: "stream",
        track_id,
        request_ts: timestamp,
        request_sig: r_sig_hashed
      },
      headers: {
        "x-app-id": qobuzAppId,
        "x-user-auth-token": qobuzToken || void 0
      }
    });
    res.json(response.data);
  } catch (error) {
    console.error("Qobuz download error:", error?.response?.data || error.message);
    res.status(500).json({ error: "Failed to get download URL" });
  }
});
var execPromise = import_util.default.promisify(import_child_process.exec);
app.get("/api/downloadWithMetadata", async (req, res) => {
  const { track_id, format_id } = req.query;
  if (!track_id || !format_id) return res.status(400).json({ error: "track_id and format_id are required" });
  if (!qobuzAppId || !qobuzSecret) return res.status(400).json({ error: "Qobuz credentials not configured" });
  const ext = format_id === "5" ? "mp3" : "flac";
  const rawPath = import_path.default.join("/tmp", `${track_id}_raw.${ext}`);
  const coverPath = import_path.default.join("/tmp", `${track_id}_cover.jpg`);
  const finalPath = import_path.default.join("/tmp", `${track_id}_final.${ext}`);
  const cleanup = () => {
    if (import_fs.default.existsSync(rawPath)) import_fs.default.unlinkSync(rawPath);
    if (import_fs.default.existsSync(coverPath)) import_fs.default.unlinkSync(coverPath);
    if (import_fs.default.existsSync(finalPath)) import_fs.default.unlinkSync(finalPath);
  };
  try {
    const trackInfo = await import_axios.default.get(`${qobuzApiBase}track/get`, {
      params: { track_id },
      headers: { "x-app-id": qobuzAppId, "x-user-auth-token": qobuzToken || void 0 }
    });
    const t = trackInfo.data;
    const title = t.title || "Unknown Title";
    const artist = t.performer?.name || t.artist?.name || "Unknown Artist";
    const album = t.album?.title || "Unknown Album";
    const trackNum = t.track_number || "1";
    let coverUrl = t.album?.image?.large || t.album?.image?.small || t.image?.large || t.image?.small;
    const timestamp = Math.floor(Date.now() / 1e3);
    const r_sig = `trackgetFileUrlformat_id${format_id}intentstreamtrack_id${track_id}${timestamp}${qobuzSecret}`;
    const r_sig_hashed = import_crypto.default.createHash("md5").update(r_sig).digest("hex");
    const downloadUrlRes = await import_axios.default.get(`${qobuzApiBase}track/getFileUrl`, {
      params: { format_id, intent: "stream", track_id, request_ts: timestamp, request_sig: r_sig_hashed },
      headers: { "x-app-id": qobuzAppId, "x-user-auth-token": qobuzToken || void 0 }
    });
    const streamUrl = downloadUrlRes.data.url;
    if (!streamUrl) throw new Error("No stream URL returned from Qobuz");
    const audioRes = await (0, import_axios.default)({ method: "get", url: streamUrl, responseType: "stream" });
    const audioWriter = import_fs.default.createWriteStream(rawPath);
    audioRes.data.pipe(audioWriter);
    await new Promise((resolve, reject) => {
      audioWriter.on("finish", () => resolve());
      audioWriter.on("error", reject);
    });
    let hasCover = false;
    if (coverUrl) {
      try {
        const coverRes = await (0, import_axios.default)({ method: "get", url: coverUrl, responseType: "stream" });
        const coverWriter = import_fs.default.createWriteStream(coverPath);
        coverRes.data.pipe(coverWriter);
        await new Promise((resolve, reject) => {
          coverWriter.on("finish", () => resolve());
          coverWriter.on("error", reject);
        });
        hasCover = true;
      } catch (err) {
        console.warn("Failed to download cover art", err);
      }
    }
    const safeTitle = title.replace(/"/g, '\\"');
    const safeArtist = artist.replace(/"/g, '\\"');
    const safeAlbum = album.replace(/"/g, '\\"');
    let ffmpegCmd = "";
    if (ext === "mp3") {
      if (hasCover) {
        ffmpegCmd = `ffmpeg -y -i "${rawPath}" -i "${coverPath}" -map 0:a -map 1:v -c copy -id3v2_version 3 -metadata title="${safeTitle}" -metadata artist="${safeArtist}" -metadata album="${safeAlbum}" -metadata track="${trackNum}" "${finalPath}"`;
      } else {
        ffmpegCmd = `ffmpeg -y -i "${rawPath}" -c copy -id3v2_version 3 -metadata title="${safeTitle}" -metadata artist="${safeArtist}" -metadata album="${safeAlbum}" -metadata track="${trackNum}" "${finalPath}"`;
      }
    } else {
      if (hasCover) {
        ffmpegCmd = `ffmpeg -y -i "${rawPath}" -i "${coverPath}" -map 0:a -map 1:v -c copy -disposition:v attached_pic -metadata title="${safeTitle}" -metadata artist="${safeArtist}" -metadata album="${safeAlbum}" -metadata track="${trackNum}" "${finalPath}"`;
      } else {
        ffmpegCmd = `ffmpeg -y -i "${rawPath}" -c copy -metadata title="${safeTitle}" -metadata artist="${safeArtist}" -metadata album="${safeAlbum}" -metadata track="${trackNum}" "${finalPath}"`;
      }
    }
    await execPromise(ffmpegCmd);
    res.download(finalPath, `${artist} - ${title}.${ext}`, (err) => {
      if (err) console.error("Error sending file to client:", err);
      cleanup();
    });
  } catch (error) {
    cleanup();
    console.error("Metadata download error:", error?.response?.data || error.message);
    if (!res.headersSent) {
      res.status(500).json({ error: "Failed to process download with metadata" });
    }
  }
});
app.post("/api/chat", async (req, res) => {
  const { message } = req.body;
  if (!message) return res.status(400).json({ error: "Message is required" });
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.1-pro-preview",
      contents: message,
      config: {
        thinkingConfig: { thinkingLevel: import_genai.ThinkingLevel.HIGH },
        systemInstruction: `You are an intelligent music assistant inside an iOS-style high-resolution music app. 
You answer complex queries about music, artists, and albums.
Keep responses concise, well-formatted, and helpful. 
Recommend real albums and tracks that the user could search for.`
      }
    });
    res.json({ text: response.text });
  } catch (error) {
    console.error("Gemini error:", error);
    res.status(500).json({ error: "Failed to generate response" });
  }
});
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await (0, import_vite.createServer)({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = import_path.default.join(process.cwd(), "dist");
    app.use(import_express.default.static(distPath));
    app.get("*all", (req, res) => {
      res.sendFile(import_path.default.join(distPath, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}
startServer();
//# sourceMappingURL=server.cjs.map
