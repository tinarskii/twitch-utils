import { ApiClient } from "@twurple/api";
import { ChatClient } from "@twurple/chat";
import { CommandList } from "../client";

export default {
  name: "help",
  description: "ดูคำสั่งทั้งหมดที่ใช้ได้",
  alias: ["h", "commands", "command"],
  args: [],
  execute: async (
    client: { api: ApiClient; chat: ChatClient; io: any },
    meta: {
      user: string;
      channel: string;
      channelID: string;
      userID: string;
      commands: CommandList;
    },
    message: string,
    args: Array<string>,
  ) => {
    await client.chat.say(
      meta.channel,
      `📚 ดูคำสั่งตรง Panels ข้างล่างเลยนะครับ becbecBetheart`,
    );
  },
};
