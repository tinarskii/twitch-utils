import { ApiClient } from "@twurple/api";
import { ChatClient } from "@twurple/chat";
import { CommandList } from "../client";

export default {
  name: "stream",
  description: "Change the stream's name",
  alias: ["s"],
  args: [
    {
      name: "name",
      description: "The name you want to change to",
      required: true,
    },
  ],
  modsOnly: true,
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
    // Get channel ID
    let channelID = (await client.api.users.getUserByName(meta.channel))!.id;
    await client.api.channels.updateChannelInfo(channelID, {
      title: args.join(" "),
    });

    await client.chat.say(
      meta.channel,
      `เปลี่ยนชื่อเป็น ${args.join(" ")} แล้ว!`,
    );
  },
};
