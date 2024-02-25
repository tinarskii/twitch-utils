import "dotenv/config";
import { StaticAuthProvider } from "@twurple/auth";
import { ChatClient } from "@twurple/chat";
import { ApiClient } from "@twurple/api";
import Database from "better-sqlite3";
import express from "express";
import { Server } from "socket.io";
import pino from "pino";
import { readdirSync } from "fs";
import { createServer } from "http";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

export const db = new Database("user.db");
db.pragma("journal_mode = WAL");

const __dirname = dirname(fileURLToPath(import.meta.url));
const logger = pino({
  transport: {
    target: "pino-pretty",
    options: {
      colorize: true,
    },
  },
});

let commands = new Map();
let prefix = "!";

// Express Web Server
const app = express();
const server = createServer(app);
const io = new Server(server);

app.get("/", (req, res) => {
  res.send("Hello World!");
});
app.get("/api/nickname", (req, res) => {
  let userID = req.query.userID;
  let stmt = db.prepare("SELECT nickname FROM bot WHERE user = ?");
  let nickname = stmt.get(userID);
  res.send(nickname);
});
app.get("/api/nickname/all", (req, res) => {
  let stmt = db.prepare("SELECT user, nickname FROM bot");
  let nicknames = stmt.all();
  res.send(nicknames);
});
app.get("/api/commands", (req, res) => {
  let commandList = [];
  for (let command of commands.values()) {
    commandList.push({
      name: command.name,
      description: command.description,
      alias: command.alias,
      args: command.args,
    });
  }
  res.send(commandList);
});
app.get("/feed", (req, res) => {
  res.sendFile(join(__dirname, "/app/feed.html"));
});
app.get("/s", (req, res) => {
  res.sendFile(join(__dirname, "/app/s.html"));
});
app.get("/socket.io/socket.io.js", (req, res) => {
  res.sendFile(__dirname + "/node_modules/socket.io/client-dist/socket.io.js");
});
server.listen(process.env.PORT ?? 8080, () => {
  logger.info(
    `[WebServer] Listening http://localhost:${process.env.PORT ?? 8080}`,
  );
});
io.on("connection", (socket) => {
  logger.info(`[Socket.IO] User connected`);
  socket.on("connect_error", (err) => {
    logger.error(`[Socket.IO] ${err.message}`);
  });
});

async function refreshToken() {
  logger.info(`[Tx] Renewing Access Token`);
  let headers = new Headers();
  headers.append(`Content-Type`, `application/json`);
  let body = {
    client_id: process.env.CLIENT_ID,
    client_secret: process.env.CLIENT_SECRET,
    grant_type: "refresh_token",
    refresh_token: encodeURIComponent(process.env.REFRESH_TOKEN),
  };

  const request = new Request("https://id.twitch.tv/oauth2/token", {
    method: "POST",
    headers: headers,
    body: JSON.stringify(body),
  });
  const response = await fetch(request);

  const responseData = await response.json();

  let newAccessToken = responseData.access_token;
  let newRefreshToken = responseData.refresh_token;
  if (!newAccessToken || !newRefreshToken) {
    throw new Error();
  } else {
    process.env.USER_ACCESS_TOKEN = newAccessToken;
    process.env.REFRESH_TOKEN = newRefreshToken;
  }
}

async function isTwitchTokenValid(token) {
  let headers = new Headers();
  headers.append(`Authorization`, `OAuth ${token}`);
  const response = await fetch(`https://id.twitch.tv/oauth2/validate`, {
    method: "GET",
    headers: headers,
    redirect: "follow",
  });
  let valid = response.status === 200;
  logger.info(`[Tx-ValidatedToken] ${valid}`);
  return valid;
}

async function initializeSequence() {
  await refreshToken();
  if (await isTwitchTokenValid(process.env.USER_ACCESS_TOKEN)) {
    try {
      await createListener();
    } catch (error) {
      logger.error(`[Tx] Critical Error!`);
      logger.error(error);
    }
  } else {
    logger.error(`[Tx] Initializing Failed`);
    throw new Error();
  }
}

async function createListener() {
  const authProvider = new StaticAuthProvider(
    process.env.CLIENT_ID,
    process.env.USER_ACCESS_TOKEN,
    [
      "user:edit",
      "user:read:email",
      "chat:read",
      "chat:edit",
      "channel:moderate",
      "moderation:read",
      "moderator:manage:shoutouts",
      "channel:manage:moderators",
      "channel:manage:broadcast"
    ]
  );
  const apiClient = new ApiClient({ authProvider });
  const chatClient = new ChatClient({ authProvider, channels: ["tinarskii"] });
  chatClient.connect();

  chatClient.onConnect(async () => {
    // Load commands from /command
    let commandFiles = readdirSync("./commands").filter((file) =>
      file.endsWith(".js"),
    );
    for (let file of commandFiles) {
      let command = (await import(`./commands/${file}`)).default;
      commands.set(command.name, command);
      logger.info(`[Tx] Loaded command: ${command.name}`);
    }
    logger.info("[Tx] Connected to chat");
  });

  chatClient.onMessage(async (channel, user, message) => {
    let userID = (await apiClient.users.getUserByName(user)).id;
    let args = message.split(" ").splice(1);

    if (message.startsWith(prefix)) {
      let commandName = message.split(" ")[0].slice(1);
      for (let command of commands.values()) {
        if (command.alias.includes(commandName)) {
          commandName = command.name;
          break;
        }
      }
      let command = commands.get(commandName);
      if (command?.modsOnly) {
        let channelID = (await apiClient.users.getUserByName(channel)).id;
        let mods = await apiClient.moderation.checkUserMod(channelID, userID);
        if (!mods && userID !== channelID) {
          await chatClient.say(channel, `แกไม่มีสิทธิ!!!!!!!!!!!!`);
          return;
        }
      }
      if (command.args.length > args.length) {
        let requiredArgs = command.args.filter((arg) => arg.required);
        if (requiredArgs.length) {
          let requiredArgsString = requiredArgs.map((arg) => arg.name).join(", ");
          await chatClient.say(
            channel,
            `ใส่อาร์กิวเมนต์ให้ครบ ต้องการ: ${requiredArgsString}`,
          );
          return;
        }
      }
      if (command) {
        try {
          command.execute(
            { chat: chatClient, api: apiClient, io },
            { channel, user, userID, commands },
            message,
            args,
          );
        } catch (error) {
          await chatClient.say(channel, "มึงทำบอตพัง");
        }
      }
    }
  });
}

export function initBank(userID) {
  let stmt = db.prepare("SELECT money FROM bot WHERE user = ?");
  if (!stmt.get(userID)) {
    stmt = db.prepare("INSERT INTO bot (user, money) VALUES (?, ?)");
    stmt.run(userID, 0);
  }
}

// Init twitch bot
await initializeSequence();
