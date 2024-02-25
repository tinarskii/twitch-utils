import "dotenv/config";
import { StaticAuthProvider } from "@twurple/auth";
import { ChatClient } from "@twurple/chat";
import { ApiClient } from "@twurple/api";
import { readdirSync } from "fs";
import pino from "pino";
import { io } from "../server/server";
import { join } from "node:path";
import { isTwitchTokenValid, refreshToken } from "../helpers/twitch";

if (
  !process.env.REFRESH_TOKEN ||
  !process.env.CLIENT_ID ||
  !process.env.CLIENT_SECRET ||
  !process.env.USER_ACCESS_TOKEN
) {
  throw new Error("Missing environment variables");
}

export const logger = pino({
  transport: {
    target: "pino-pretty",
    options: {
      colorize: true,
    },
  },
});

export interface CommandList
  extends Map<
    string,
    {
      name: string;
      description: string;
      alias?: Array<string>;
      args?: Array<{ name: string; description: string; required: boolean }>;
      modsOnly?: boolean;
      execute: (
        client: {
          chat: ChatClient;
          io: any;
          api: ApiClient;
        },
        meta: {
          user: string;
          channel: string;
          userID: string;
          commands: CommandList;
        },
        message: string,
        args: Array<string>,
      ) => void;
    }
  > {}

export const commands: CommandList = new Map();
const prefix = "!";

export async function createListener() {
  const authProvider = new StaticAuthProvider(
    process.env.CLIENT_ID!,
    process.env.USER_ACCESS_TOKEN!,
    [
      "user:edit",
      "user:read:email",
      "chat:read",
      "chat:edit",
      "channel:moderate",
      "moderation:read",
      "moderator:manage:shoutouts",
      "channel:manage:moderators",
      "channel:manage:broadcast",
    ],
  );

  const apiClient = new ApiClient({ authProvider });
  const chatClient = new ChatClient({ authProvider, channels: ["tinarskii"] });
  chatClient.connect();

  // On Bot Connect
  chatClient.onConnect(async () => {
    // Load commands from /command
    let commandFiles = readdirSync(join(__dirname, "/commands")).filter(
      (file) => file.endsWith(".ts"),
    );
    for (let file of commandFiles) {
      let command = (await import(`./commands/${file}`)).default;
      commands.set(command.name, command);
      logger.info(`[Tx] Loaded command: ${command.name}`);
    }
    logger.info("[Tx] Connected to chat");
  });

  // On Message Receive
  chatClient.onMessage(async (channel, user, message) => {
    let userID = (await apiClient.users.getUserByName(user))!.id;
    let args = message.split(" ").splice(1);

    // Check if message is a command
    if (message.startsWith(prefix)) {
      // Get command name
      let commandName = message.split(" ")[0].slice(1);
      for (let command of commands.values()) {
        if ((command.alias || []).includes(commandName)) {
          commandName = command.name;
          break;
        }
      }
      // Check if command is only for mods
      let command = commands.get(commandName)!;
      if (command?.modsOnly) {
        let channelID = (await apiClient.users.getUserByName(channel))!.id;
        let mods = await apiClient.moderation.checkUserMod(channelID, userID);
        if (!mods && userID !== channelID) {
          await chatClient.say(channel, `แกไม่มีสิทธิ!!!!!!!!!!!!`);
          return;
        }
      }
      // Check if user entered enough arguments
      if ((command.args?.length || 0) > args.length && command.args) {
        let requiredArgs = command.args.filter(
          (arg: { required?: boolean }) => arg.required,
        );
        if (requiredArgs.length) {
          let requiredArgsString = requiredArgs
            .map((arg: { name: string }) => arg.name)
            .join(", ");
          await chatClient.say(
            channel,
            `ใส่อาร์กิวเมนต์ให้ครบ ต้องการ: ${requiredArgsString}`,
          );
          return;
        }
      }
      // Execute command
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
    } else {
      // Emit message to socket.io
      io.emit("message", {
        user,
        message,
      });
    }
  });
}

await refreshToken();
if (await isTwitchTokenValid(process.env.USER_ACCESS_TOKEN!)) {
  await createListener();
} else {
  throw new Error("[Tx] Invalid token");
}
