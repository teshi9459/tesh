const {
  ChannelType,
  PermissionFlagsBits,
  MessageFlags,
} = require("discord.js");
const { api } = require("../../utils/api.js");
const dc = require("../../utils/dc.js");

async function handleTicketButton(interaction) {
  const panelMsgId = interaction.customId.replace("ticket_", "");

  try {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const { data: panel } = await api.get(`/tickets/panels/${panelMsgId}`);

    if (panel.status !== "on") {
      return interaction.editReply("❌ Dieses Panel ist aktuell deaktiviert.");
    }

    const guild = interaction.guild;
    const category = guild.channels.cache.get(panel.category_id);
    const member = interaction.member;

    const ticketChannel = await guild.channels.create({
      name: `ticket-${member.user.username}`,
      type: ChannelType.GuildText,
      parent: category?.id || null,
      permissionOverwrites: [
        {
          id: guild.roles.everyone,
          deny: [PermissionFlagsBits.ViewChannel],
        },
        {
          id: member.user.id,
          allow: [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.ReadMessageHistory,
          ],
        },
      ],
    });

    await api.post("/tickets", {
      id: ticketChannel.id,
      panel_id: panelMsgId,
      category_id: panel.category_id,
      creator_id: member.user.id,
      permission_level: 0,
    });

    await ticketChannel.send({
      content: `<@${member.user.id}> Willkommen im Ticket!`,
      embeds: [
        dc.sEmbed(
          "Ticket erstellt",
          "Das Team wird sich bald bei dir melden.",
          "Support",
          "0x00ff88"
        ),
      ],
    });

    await interaction.editReply({
      content: `✅ Dein Ticket wurde erstellt: <#${ticketChannel.id}>`,
    });
  } catch (err) {
    console.error("Fehler bei Ticket-Erstellung:", err);
    return interaction.editReply("❌ Fehler beim Erstellen des Tickets.");
  }
}

module.exports = handleTicketButton;
