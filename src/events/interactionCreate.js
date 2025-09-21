const logger = require("../utils/logger.js");
const handleTicketButton = require("../handler/buttons/ticketButton");

module.exports = {
  name: "interactionCreate",
  once: false,
  async execute(interaction) {
    // kompaktes Logging mit Kontext
    const u = interaction.user;
    const g = interaction.guild;
    const c = interaction;
    const what = c
      ? `${c.commandName || c.customId} (${c.type}-${c.id})`
      : "unknown interaction";
    const who = u ? `${u.username} (${u.id})` : "unknown";
    const where = g ? `${g.name} (${g.id})` : "DM";
    logger.debug({ interaction: what, user: who, guild: where }, "Interaction empfangen");

    // 1) User-Abfrage/Bearbeitung/Erstellung über Brain-API (inkl. Guild-Mapping)
    try {
      if (u) {
        const { api } = require("../utils/api.js");
        // Nutzer suchen über discord_id
        const { data: users } = await api.get(`/users`, {
          params: { discord_id: u.id },
        });

        if (Array.isArray(users) && users.length > 0) {
          const existing = users[0];
          // falls Username geändert → updaten
          if (existing.last_known_username !== u.username) {
            await api.patch(`/users/${existing.id}`, {
              last_known_username: u.username,
            });
            logger.info({ discordId: u.id }, "User aktualisiert (last_known_username)");
          }
          // immer Guild-Mapping sicherstellen (falls in Guild)
          if (g) {
            try {
              await api.post(`/users/link`, {
                discord_id: u.id,
                guild_discord_id: g.id,
              });
              // kein lautes Log nötig – still ok
            } catch (e) {
              logger.warn({ userId: u.id, guildId: g?.id, error: e?.response?.data || e.message }, "Konnte User-Guild-Mapping nicht setzen");
            }
          }
        } else {
          // neu anlegen
          await api.post(`/users`, {
            discord_id: u.id,
            last_known_username: u.username,
            is_admin: 0,
            ...(g ? { guild_discord_id: g.id } : {}),
          });
          logger.info({ discordId: u.id }, "Neuer User registriert");
        }
      }
    } catch (err) {
      logger.error({ err, user: who }, "User-Sync fehlgeschlagen");
    }

    let plugin;

    switch (interaction.type) {
      case 2: // Slash Command (Chat Input)
        plugin = interaction.client.plugins.get(interaction.commandName);
        if (!isPluginValid(plugin, "slashCommands")) return;

        try {
          await plugin.executeSlashCommand(interaction);
        } catch (error) {
          logger.error({ err: error, command: interaction.commandName, user: who, guild: where }, "Fehler in SlashCommand");
        }
        break;

      case 3: // Button Interaction
        const [type] = interaction.customId.split("_");

        switch (type) {
          case "ticket":
          case "t":
            return await handleTicketButton(interaction);
          case "w":
          case "words": {
            const handleWordsButton = require("../handler/buttons/wordsButton");
            return await handleWordsButton(interaction);
          }
          default:
            logger.warn({ type }, "Unbekannter Button-Typ");
        }

        break;

      default:
        logger.warn({ type: interaction.type }, "Unbekannter Interaktionstyp");
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
