import { db } from "../client.js";

export default {
  name: "gamble",
  description: "For you, gambling addict",
  alias: ["bet"],
  args: [
    {
      name: "amount",
      description: "Amount of money to gamble",
      required: true,
    },
  ],
  execute: async (client, meta, message, args) => {
    let amount = Math.trunc(parseInt(args[0]));

    // Check if amount is valid
    if (isNaN(amount) || amount < 0) {
      await client.chat.say(meta.channel, `ขอใส่จำนวนนับนะครับ`);
      return;
    }

    // Check if user has enough money
    let stmt = db.prepare("SELECT money FROM bot WHERE user = ?");
    let balance = stmt.get(meta.userID);
    if (amount > balance.money) {
      await client.chat.say(
        meta.channel,
        `เองมีตังไม่พอ`,
      );
      return;
    }

    // Win Condition
    let win = Math.random() > 0.75;
    if (win) {
      // Gain amount * 1.75
      stmt = db.prepare("UPDATE bot SET money = money + ? WHERE user = ?");
      stmt.run(amount * 1.75, meta.userID);
      await client.chat.say(
        meta.channel,
        `ชนะ ${amount * 1.75} กีบ เหลือ ${balance.money + amount * 1.75} กีบ`,
      );
      client.io.emit("feed", {
        type: "success",
        icon: "🎰",
        message: meta.user,
        action: `+ ${amount * 1.75} KEEB`,
      });
    } else {
      stmt = db.prepare("UPDATE bot SET money = money - ? WHERE user = ?");
      stmt.run(amount, meta.userID);
      await client.chat.say(
        meta.channel,
        `แพ้ ${amount} กีบ เหลือ ${balance.money - amount} กีบ`,
      );
      client.io.emit("feed", {
        type: "danger",
        icon: "🎰",
        message: meta.user,
        action: `- ${amount * 1.5} KEEB`,
      });
    }
  },
};
