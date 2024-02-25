export default {
  name: "help",
  description: "ดูคำสั่งทั้งหมดที่ใช้ได้",
  alias: ['h', 'commands', 'command'],
  args: [],
  execute: async (client, meta, message, args) => {
    await client.chat.say(
      meta.channel,
      `📚 ดูคำสั่งตรง Panels ข้างล่างเลยนะครับ becbecBetheart`,
    );
  },
};
