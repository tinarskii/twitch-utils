import { ApiClient } from "@twurple/api";
import { ChatClient } from "@twurple/chat";
import { CommandList } from "../client";

export default {
  name: "shoutout",
  description: "Shoutout to someone!",
  alias: ["so"],
  args: [
    {
      name: "user",
      description: "The user you want to shoutout",
      required: true,
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
    let userID = (await client.api.users.getUserByName(args[0]))?.id;
    let channelID = (await client.api.users.getUserByName(meta.channel))!.id;

    if (!userID) {
      await client.chat.say(meta.channel, `ไม่พบผู้ใช้ ${args[0]}`);
      return;
    }

    try {
      await client.api.chat.shoutoutUser(channelID, userID);
    } catch (e) {
      await client.chat.say(meta.channel, `ไม่สามารถ shoutout ได้`);
      return;
    }
    await client.chat.say(meta.channel, `ทุกคนมากดฟอลให้ @${args[0]} กันนะ!`);
  },
};
