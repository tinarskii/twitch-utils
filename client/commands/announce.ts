import { ApiClient } from "@twurple/api";
import { ChatClient } from "@twurple/chat";
import { CommandList } from "../client";

export default {
  name: "announce",
  description: "Announce something!",
  alias: ["a"],
  args: [
    {
      name: "message",
      description: "The message you want to announce",
      required: true,
    },
  ],
  execute: async (
    client: { api: ApiClient; chat: ChatClient; io: any },
    meta: {
      user: string;
      channel: string;
      channelID: string;
      userID: string;
      commands: CommandList;
    },
    args: Array<string>,
  ) => {
    try {
      await client.api.chat.sendAnnouncement(meta.channelID, {
        message: args.join(" "),
      });
    } catch (e) {
      await client.chat.say(meta.channel, `ไม่สามารถ announce ได้`);
      return;
    }
  },
};
