const bot = require("../config/telegramBot");

module.exports = async function checkJoin(channel, telegramUid) {
  try {
    const member = await bot.getChatMember(channel, telegramUid);
    return ["member", "administrator", "creator"].includes(member.status);
  } catch {
    return false;
  }
};
