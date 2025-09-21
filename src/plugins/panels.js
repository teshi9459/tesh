const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ActionRowBuilder,
  ButtonStyle,
  MessageFlags,
} = require("discord.js");
const dc = require("../utils/dc.js");
const { api } = require("../utils/api.js");
const logger = require("../utils/logger.js");

module.exports = {
  // Info
  name: "panels",
  enabled: true,

  // Interaktionstypen
  slashCommands: true,
  contectMenues: false,
  buttons: true,
  selectMenues: false,
  modal: false,
  messages: false,

  // Kategorien
  database: true,
  logging: true,
  moderation: true,
  ephemeralresponse: true,
  setup: false,

  // SlashCommands Builder
  data: new SlashCommandBuilder()
    .setName("panels")
    .setDescription("Ticket-Panels verwalten")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand((sub) =>
      sub
        .setName("create")
        .setDescription("Neues Ticket-Panel im aktuellen Channel erstellen")
        .addStringOption((opt) =>
          opt
            .setName("type")
            .setDescription("Panel-Typ")
            .setRequired(true)
            .addChoices(
              { name: "Charakter", value: "character" },
              { name: "Support", value: "support" },
              { name: "Bot-Support", value: "botsupport" }
            )
        )
        .addChannelOption((opt) =>
          opt
            .setName("category")
            .setDescription("Channelkategorie fÃ¼r neue Tickets")
            .setRequired(true)
            .addChannelTypes(4)
        )
        .addRoleOption((opt) =>
          opt
            .setName("team_role")
            .setDescription("Rolle, die Tickets sehen/bearbeiten darf")
            .setRequired(true)
        )
        .addStringOption((opt) =>
          opt
            .setName("label")
            .setDescription("Panel-Beschriftung")
            .setRequired(true)
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName("delete")
        .setDescription("Panel lÃ¶schen")
        .addStringOption((opt) =>
          opt
            .setName("message_id")
            .setDescription("Message-ID des Panels")
            .setRequired(true)
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName("status")
        .setDescription("Panel aktivieren/deaktivieren")
        .addStringOption((opt) =>
          opt
            .setName("message_id")
            .setDescription("Message-ID des Panels")
            .setRequired(true)
        )
        .addStringOption((opt) =>
          opt
            .setName("status")
            .setDescription("Status: on, off, deleted")
            .setRequired(true)
            .addChoices(
              { name: "aktiv", value: "on" },
              { name: "deaktiviert", value: "off" }
            )
        )
    ),

  async executeSlashCommand(interaction) {
    const sub = interaction.options.getSubcommand();
    const channel = interaction.channel;

    if (sub === "create") {
      const category = interaction.options.getChannel("category");
      const type = interaction.options.getString("type");
      let label = interaction.options.getString("label");
      const teamRole = interaction.options.getRole("team_role");
      if (label.length > 80) label = label.slice(0, 80);

      await interaction.reply({
        content: "Ein Moment ...",
        flags: MessageFlags.Ephemeral,
      });

      try {
        const embed = dc.sEmbed(
          "Ticket",
          "Pannel wird generiert",
          "Ticket System",
          "#ff0000"
        );
        const msg = await channel.send({ embeds: [embed] });

        const customId = "ticket_" + msg.id;

        await api.post("/tickets/panels", {
          id: msg.id,
          channel_id: channel.id,
          category_id: category.id,
          button_id: customId,
          type: type,
          team_role_id: teamRole.id,
        });

        const row = new ActionRowBuilder().addComponents(
          dc.createButton(customId, "ðŸ“¨ Ticket", ButtonStyle.Primary, null)
        );

        const panelEmbed = dc.sEmbed(
          "Ticket erstellen",
          label + "\n\n*Ã¶ffne ein Ticket in dem du auf den Button klickst* â†“",
          "Ticket Pannel " + msg.id,
          "#aaeeff"
        );

        await msg.edit({ embeds: [panelEmbed], components: [row] });
      } catch (err) {
        logger.error({ err }, "Fehler beim Erstellen des Panels");
        await interaction.followUp({
          content: "âŒ Fehler beim Erstellen des Panels.",
          flags: MessageFlags.Ephemeral,
        });
      }
    } else if (sub === "delete") {
      const messageId = interaction.options.getString("message_id");

      try {
        await api.patch(`/tickets/panels/${messageId}/status`, {
          status: "deleted",
        });

        const msg = await interaction.channel.messages.fetch(messageId);
        await msg.delete();

        return interaction.reply({
          content: `Panel ${messageId} gelÃ¶scht.`,
          flags: MessageFlags.Ephemeral,
        });
      } catch (err) {
        logger.error("Fehler beim LÃ¶schen des Panels:", err);
        return interaction.reply({
          content: "âŒ Panel konnte nicht gelÃ¶scht werden.",
          flags: MessageFlags.Ephemeral,
        });
      }
    } else if (sub === "status") {
      const messageId = interaction.options.getString("message_id");
      const status = interaction.options.getString("status");

      try {
        await api.patch(`/tickets/panels/${messageId}/status`, { status });

        const msg = await interaction.channel.messages.fetch(messageId);

        if (status === "off") {
          const row = new ActionRowBuilder().addComponents(
            dc.createButton(
              "ticket_off",
              "ðŸ”’ Nicht aktiv",
              ButtonStyle.Primary,
              true
            )
          );
          await msg.edit({ components: [row] });
        } else if (status === "on") {
          const row = new ActionRowBuilder().addComponents(
            dc.createButton(
              "ticket_" + msg.id,
              "ðŸ“¨ Ticket",
              ButtonStyle.Primary,
              null
            )
          );
          await msg.edit({ components: [row] });
        }

        return interaction.reply({
          content: `Panel ${messageId} auf '${status}' gesetzt.`,
          flags: MessageFlags.Ephemeral,
        });
      } catch (err) {
        logger.error("Fehler beim Ã„ndern des Panel-Status:", err);
        return interaction.reply({
          content: "âŒ Panel-Status konnte nicht geÃ¤ndert werden.",
          flags: MessageFlags.Ephemeral,
        });
      }
    }
  },
};
