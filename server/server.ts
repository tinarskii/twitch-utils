import { Elysia } from "elysia";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";
import { db } from "../helpers/database";
import { commands, logger } from "../client/client";
import { createServer } from "node:http";
import { Server, Socket } from "socket.io";
import express from "express";
import cors from "cors";

const expressApp = express();
expressApp.use(cors());

const server = createServer(expressApp);
export const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

server.listen(3001, () => {
  logger.info("[Socket.IO] Running on http://localhost:3001");
});

io.on("connection", (socket: Socket) => {
  logger.info(`[Socket] ${socket.id} connected`);
  socket.on("disconnect", () => {
    logger.info(`[Socket] ${socket.id} disconnected`);
  });
});

const __dirname = dirname(fileURLToPath(import.meta.url));
export const app = new Elysia();

app.get("/", () => {
  return new Response("Hello World!");
});
app.get("/api/nickname", ({ query }) => {
  let userID = query.id;
  let stmt = db.prepare("SELECT nickname FROM users WHERE user = ?");
  return stmt.get(userID) || { nickname: null };
});
app.get("/api/nickname/all", () => {
  let stmt = db.prepare("SELECT user, nickname FROM users");
  return stmt.all();
});
app.get("/api/commands", () => {
  let commandList = [];
  for (let command of commands.values()) {
    commandList.push({
      name: command.name,
      description: command.description,
      alias: command.alias,
      args: command.args,
    });
  }
  return commandList;
});
app.get("/feed", () => {
  return Bun.file(__dirname + "/app/feed.html");
});
app.get("/chat", () => {
  return Bun.file(__dirname + "/app/chat.html");
});

app.get("/socket.io/socket.io.js", () => {
  return Bun.file("./node_modules/socket.io/client-dist/socket.io.js");
});

app.listen(
  {
    port: process.env.PORT ?? 3000,
    tls: {
      cert: Bun.file("./server/server.crt"),
      key: Bun.file("./server/server.key"),
    },
  },
  ({ hostname, port }) => {
    logger.info(`[Elysia] Running on http://${hostname}:${port}`);
  },
);
