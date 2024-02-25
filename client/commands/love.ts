import { ApiClient } from "@twurple/api";
import { ChatClient } from "@twurple/chat";
import { CommandList } from "../client";

export default {
  name: "love",
  description: "How much is your love?",
  alias: ["รัก"],
  args: [
    {
      name: "user",
      description: "The user you love",
      required: false,
    },
  ],
  execute: async (
    client: { api: ApiClient; chat: ChatClient; io: any },
    meta: {
      user: string;
      channel: string;
      userID: string;
      commands: CommandList;
    },
    message: string,
    args: Array<string>,
  ) => {
    let lovePercent = Math.floor(Math.random() * 101);
    client.io.emit("feed", {
      type: "neutral",
      icon: "💘",
      message: `${meta.user} ➡ ${args[0] || meta.user}`,
      action: `${lovePercent}%`,
    });
    await client.chat.say(
      meta.channel,
      `${meta.user} 💘 ${args[0] || meta.user} ${lovePercent}%`,
    );
  },
};
