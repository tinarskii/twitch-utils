import { Elysia } from "elysia";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";
import { db } from "../helpers/database";
import { commands, logger } from "../client/client";
import { createServer } from "node:http";
import { Server, Socket } from "socket.io";

const httpServer = createServer();
export const io = new Server(httpServer, {
  cors: {
    origin: "*",
  },
});
io.on("connection", (socket: Socket) => {
  logger.info(`[Socket] ${socket.id} connected`);
  socket.on("disconnect", () => {
    logger.info(`[Socket] ${socket.id} disconnected`);
  });
});

httpServer.listen(8081, () => {
  logger.info("[Socket.IO] Running on port 8081");
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
app.get("/socket.io/socket.io.js", () => {
  return Bun.file("./node_modules/socket.io/client-dist/socket.io.js");
});

app.listen(3000, () => {
  logger.info("[Elysia] Running on port 3000");
});
