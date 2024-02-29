import { ApiClient } from "@twurple/api";
import { ChatClient } from "@twurple/chat";
import { CommandList } from "../client";
import YouTube from "youtube-sr";
import ytdl from "ytdl-core";

export default {
  name: "song-request",
  description: "Request a song",
  alias: ["sr"],
  args: [
    {
      name: "song",
      description: "The song you want to request",
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
    message: string,
    args: Array<string>,
  ) => {
    const song = args.join(" ");
    const songURL = song.match(
      /^((?:https?:)?\/\/)?((?:www|m)\.)?((?:youtube(-nocookie)?\.com|youtu.be))(\/(?:[\w\-]+\?v=|embed\/|live\/|v\/)?)([\w\-]+)(\S+)?$/,
    )
      ? song
      : (await YouTube.search(song, { limit: 1, type: "video" }))[0].url;

    const songInfo = await ytdl.getInfo(songURL);

    if (!songInfo) {
      await client.chat.say(meta.channel, `ไม่เจอเพลง: ${song}`);
      return;
    }

    client.io.to(meta.channelID).emit("songRequest", {
      user: meta.user,
      song: {
        title: songInfo.videoDetails.title,
        author: songInfo.videoDetails.author.name,
        thumbnail: songInfo.thumbnail_url,
        id: songInfo.videoDetails.videoId,
      },
    });
  },
};
