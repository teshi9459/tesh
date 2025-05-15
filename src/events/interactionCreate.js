const { Client, GatewayIntentBits } = require("discord.js");
const handleTicketButton = require("../handler/buttons/ticketButton");

module.exports = {
  name: "interactionCreate",
  once: false,
  async execute(interaction) {
    // 🔍 Logging für Debugging (nur im Dev-Modus empfohlen)
    console.log(
      `[→] interaction: type=${interaction.type}, id=${interaction.id}`
    );

    let plugin;

    switch (interaction.type) {
      case 2: // Slash Command (Chat Input)
        plugin = interaction.client.plugins.get(interaction.commandName);
        if (!isPluginValid(plugin, "slashCommands")) return;

        try {
          await plugin.executeSlashCommand(interaction);
        } catch (error) {
          console.error(
            `[✗] Fehler in SlashCommand '${interaction.commandName}':`,
            error
          );
        }
        break;

      case 3: // Button Interaction
        const [type] = interaction.customId.split("_");

        switch (type) {
          case "ticket":
            return await handleTicketButton(interaction);
          // case "close": return await handleCloseTicket(interaction);
          default:
            console.warn(`⚠️ Unbekannter Button-Typ: ${type}`);
        }

        break;

      default:
        console.warn(`[!] Unbekannter Interaktionstyp (${interaction.type})`);
        break;
    }
  },
};

// 🔧 Hilfsfunktion zur Validierung von Plugins
function isPluginValid(plugin, feature) {
  if (!plugin) return false;
  if (!plugin.enabled) return false;
  if (!plugin[feature]) return false;
  return true;
}
