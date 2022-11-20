const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('off')
    .setDescription('Shutdown the client'),
  async execute(interaction) {
    if (interaction.user.id != 652959577293324288) return;
    await interaction.reply('shutdown :[');
    setTimeout(function () {
      interaction.client.destroy();
      process.exit(1);
    }, 1000);
  },
};
