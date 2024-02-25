import { db, initBank } from "../client.js";

export default {
  name: "weekly",
  description: "Give weekly money (500 Keeb)",
  alias: [],
  args: [],
  execute: async (client, meta, message, args) => {
    initBank(meta.userID);

    // Find last weekly (Int)
    let stmt = db.prepare("SELECT lastWeekly FROM bot WHERE user = ?");
    let lastWeekly = stmt.get(meta.userID);

    // Check if user has claimed weekly
    if (lastWeekly) {
      let lastWeeklyDate = new Date(lastWeekly.lastWeekly);
      let currentDate = new Date();
      if (
        lastWeeklyDate.getDate() === currentDate.getDate() &&
        lastWeeklyDate.getMonth() === currentDate.getMonth() &&
        lastWeeklyDate.getFullYear() === currentDate.getFullYear()
      ) {
        await client.chat.say(meta.channel, `เองรับเงินไปแล้วสัปดาห์นี้แล้วนะ`);
        return;
      }
    }

    // Claim weekly (Add money, Update lastWeekly)
    stmt = db.prepare("UPDATE bot SET money = money + 500 WHERE user = ?");
    stmt.run(meta.userID);
    stmt = db.prepare("UPDATE bot SET lastWeekly = ? WHERE user = ?");
    stmt.run(Number(new Date()), meta.userID);

    client.io.emit("feed", {
      type: "normal",
      icon: "☀️",
      message: `System ➡ ${meta.user}`,
      action: `+ 500 KEEB`,
    });
    await client.chat.say(meta.channel, `รับ 500 กีบ`);
  },
};
