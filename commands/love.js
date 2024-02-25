import { initBank } from "../client.js";

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
  execute: async (client, meta, message, args) => {
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
