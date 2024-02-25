export default {
  name: "game",
  description: "Change the stream's game",
  alias: ["g"],
  args: [{
    name: "game",
    description: "The game you want to change to",
    required: true,
  }],
  modsOnly: true,
  execute: async (client, meta, message, args) => {
    // Get game id
    let game = await client.api.games.getGameByName(args.join(" "));
    if (!game) {
      await client.chat.say(meta.channel, `ไม่พบเกม ${args[0]}`);
      return;
    }

    // Get channel ID
    let channelID = (await client.api.users.getUserByName(meta.channel)).id;
    await client.api.channels.updateChannelInfo(channelID, {
      gameId: game.id,
    })

    await client.chat.say(meta.channel, `เปลี่ยนเกมเป็น ${game.name} แล้ว!`);
  },
};
