const {
  ChannelType,
  PermissionFlagsBits,
  MessageFlags,
  ActionRowBuilder,
  ButtonStyle,
  EmbedBuilder,
} = require("discord.js");
const { api } = require("../../utils/api.js");
const logger = require("../../utils/logger.js");
const dc = require("../../utils/dc.js");

function buildTicketEmbed({ ticket, logCount = 0 }) {
  const creatorMention = ticket?.creator_id ? `<@${ticket.creator_id}>` : "-";
  const assignedMention = ticket?.assigned_mod_id
    ? `<@${ticket.assigned_mod_id}>`
    : "— nicht zugewiesen —";
  const waitStr = ticket?.waiting === "user" ? "User" : "Team";

  const embed = new EmbedBuilder()
    .setTitle("Ticket Übersicht")
    .setColor("#aaeeff")
    .addFields(
      { name: "Erstellt von", value: creatorMention, inline: true },
      { name: "Zugewiesen an", value: assignedMention, inline: true },
      { name: "Gespeicherte Nachrichten", value: String(logCount), inline: true },
      { name: "Wartet auf", value: waitStr, inline: true },
      { name: "Status", value: ticket?.status || "new", inline: true },
      {
        name: "Team sichtbar",
        value: ticket?.permission_level ? "Ja" : "Nein",
        inline: true,
      }
    )
    .setFooter({ text: `Ticket ${ticket?.id || "?"}` });
  return embed;
}

function buildTicketButtons(ticket) {
  const visLabel = ticket.permission_level ? "Team verstecken" : "Team sichtbar";
  const impLabel = ticket.status === "important" ? "Wichtig (aus)" : "Wichtig";
  const waitLabel = `Wartet: ${ticket.waiting === "user" ? "User" : "Team"}`;
  const row = new ActionRowBuilder().addComponents(
    dc.createButton(
      `t_claim_${ticket.id}`,
      ticket.assigned_mod_id ? "Bereits zugewiesen" : "Claim",
      ButtonStyle.Secondary,
      Boolean(ticket.assigned_mod_id)
    ),
    dc.createButton(`t_close_${ticket.id}`, "Schließen", ButtonStyle.Danger, false),
    dc.createButton(`t_imp_${ticket.id}`, impLabel, ButtonStyle.Primary, false),
    dc.createButton(`t_wait_${ticket.id}`, waitLabel, ButtonStyle.Primary, false),
    dc.createButton(`t_vis_${ticket.id}`, visLabel, ButtonStyle.Secondary, false)
  );
  return [row];
}

async function createTicket(interaction) {
  const panelMsgId = interaction.customId.replace("ticket_", "");
  await interaction.deferReply({ flags: MessageFlags.Ephemeral });
  try {
    const { data: panel } = await api.get(`/tickets/panels/${panelMsgId}`);
    if (panel.status !== "on") return interaction.editReply("❌ Dieses Panel ist aktuell deaktiviert.");

    const guild = interaction.guild;
    const category = guild.channels.cache.get(panel.category_id);
    const member = interaction.member;

    const overwrites = [
      { id: guild.roles.everyone, deny: [PermissionFlagsBits.ViewChannel] },
      {
        id: member.user.id,
        allow: [
          PermissionFlagsBits.ViewChannel,
          PermissionFlagsBits.SendMessages,
          PermissionFlagsBits.ReadMessageHistory,
        ],
      },
    ];
    if (panel.team_role_id) {
      overwrites.push({
        id: panel.team_role_id,
        allow: [
          PermissionFlagsBits.ViewChannel,
          PermissionFlagsBits.SendMessages,
          PermissionFlagsBits.ReadMessageHistory,
        ],
      });
    }

    const ticketChannel = await guild.channels.create({
      name: `ticket-${member.user.username}`,
      type: ChannelType.GuildText,
      parent: category?.id || null,
      permissionOverwrites: overwrites,
    });

    // Sichtbarkeit: 1 wenn Team-Rolle existiert, sonst 0
    const permission_level = panel.team_role_id ? 1 : 0;

    await api.post("/tickets/create", {
      id: ticketChannel.id,
      panel_id: panelMsgId,
      category_id: panel.category_id,
      creator_id: member.user.id,
      permission_level,
    });

    const ticket = { id: ticketChannel.id, creator_id: member.user.id, assigned_mod_id: null, status: "new", permission_level, waiting: "team" };
    const embed = buildTicketEmbed({ ticket, logCount: 0 });
    const mainMsg = await ticketChannel.send({
      content: `<@${member.user.id}> Willkommen im Ticket!`,
      embeds: [embed],
      components: buildTicketButtons(ticket),
    });

    // Speichere die Hauptnachricht in der DB (Status bleibt 'new' bis Claim) + initiales Warten
    await api.patch(`/tickets/${ticketChannel.id}`, { message_id: mainMsg.id, waiting: "team" });

    await interaction.editReply({ content: `✅ Dein Ticket wurde erstellt: <#${ticketChannel.id}>` });
  } catch (err) {
    logger.error("Fehler bei Ticket-Erstellung:", err?.response?.data || err.message);
    return interaction.editReply("❌ Fehler beim Erstellen des Tickets.");
  }
}

async function claimTicket(interaction, ticketId) {
  try {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    const { data: ticket } = await api.get(`/tickets/${ticketId}`);
    if (!ticket) return interaction.editReply("❌ Ticket nicht gefunden.");
    if (ticket.assigned_mod_id) return interaction.editReply("Bereits zugewiesen.");

    await api.patch(`/tickets/${ticketId}`, { assigned_mod_id: interaction.user.id, status: "open" });

    const channel = interaction.channel;
    const mainMsg = await channel.messages.fetch(ticket.message_id).catch(() => null);
    const updated = { ...ticket, assigned_mod_id: interaction.user.id };
    const embed = buildTicketEmbed({ ticket: updated, logCount: 0 });
    if (mainMsg) await mainMsg.edit({ embeds: [embed], components: buildTicketButtons(updated) });
    await interaction.editReply("✅ Ticket übernommen.");
  } catch (err) {
    logger.error("Fehler beim Claim:", err?.response?.data || err.message);
    await interaction.editReply("❌ Fehler beim Claim.");
  }
}

function nowMysql() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return (
    d.getFullYear() +
    "-" +
    pad(d.getMonth() + 1) +
    "-" +
    pad(d.getDate()) +
    " " +
    pad(d.getHours()) +
    ":" +
    pad(d.getMinutes()) +
    ":" +
    pad(d.getSeconds())
  );
}

async function closeTicket(interaction, ticketId) {
  try {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    const { data: ticket } = await api.get(`/tickets/${ticketId}`);
    if (!ticket) return interaction.editReply("❌ Ticket nicht gefunden.");

    // Nur Status setzen; Datum erst beim Archivieren speichern
    await api.patch(`/tickets/${ticketId}`, { status: "closed" });

    // Schreibrechte entziehen für Ersteller
    const guild = interaction.guild;
    const channel = guild.channels.cache.get(ticketId);
    if (channel) {
      await channel.permissionOverwrites.edit(ticket.creator_id, { SendMessages: false, ViewChannel: true });
      const row = new ActionRowBuilder().addComponents(
        dc.createButton(`t_reopen_${ticketId}`, "Wieder öffnen", ButtonStyle.Success, false),
        dc.createButton(`t_archive_${ticketId}`, "Archivieren", ButtonStyle.Secondary, false)
      );
      await channel.send({
        content: `🔒 Ticket geschlossen von <@${interaction.user.id}>. Keine Nachrichten mehr möglich.`,
        components: [row],
      });
    }
    await interaction.editReply("✅ Ticket geschlossen.");
  } catch (err) {
    logger.error("Fehler beim Schließen:", err?.response?.data || err.message);
    await interaction.editReply("❌ Fehler beim Schließen.");
  }
}

async function toggleImportant(interaction, ticketId) {
  try {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    const { data: ticket } = await api.get(`/tickets/${ticketId}`);
    if (!ticket) return interaction.editReply("❌ Ticket nicht gefunden.");
    const newStatus = ticket.status === "important" ? "open" : "important";
    await api.patch(`/tickets/${ticketId}`, { status: newStatus });
    const channel = interaction.channel;
    const mainMsg = await channel.messages.fetch(ticket.message_id).catch(() => null);
    const updated = { ...ticket, status: newStatus };
    const embed = buildTicketEmbed({ ticket: updated, logCount: 0 });
    if (mainMsg) await mainMsg.edit({ embeds: [embed], components: buildTicketButtons(updated) });
    await interaction.editReply(`✅ Status auf '${newStatus}' gesetzt.`);
  } catch (err) {
    logger.error("Fehler beim Setzen 'Wichtig':", err?.response?.data || err.message);
    await interaction.editReply("❌ Fehler beim Setzen des Status.");
  }
}

async function toggleWaiting(interaction, ticketId) {
  try {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    const { data: ticket } = await api.get(`/tickets/${ticketId}`);
    if (!ticket) return interaction.editReply("❌ Ticket nicht gefunden.");
    const newWaiting = ticket.waiting === "user" ? "team" : "user";
    await api.patch(`/tickets/${ticketId}`, { waiting: newWaiting });
    const channel = interaction.channel;
    const mainMsg = await channel.messages.fetch(ticket.message_id).catch(() => null);
    const updated = { ...ticket, waiting: newWaiting };
    const embed = buildTicketEmbed({ ticket: updated, logCount: 0 });
    if (mainMsg) await mainMsg.edit({ embeds: [embed], components: buildTicketButtons(updated) });
    await interaction.editReply(`✅ Wartet jetzt auf '${newWaiting}'.`);
  } catch (err) {
    logger.error("Fehler beim Setzen 'Wartet':", err?.response?.data || err.message);
    await interaction.editReply("❌ Fehler beim Setzen des Status.");
  }
}

async function toggleVisibility(interaction, ticketId) {
  try {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    const { data: ticket } = await api.get(`/tickets/${ticketId}`);
    if (!ticket) return interaction.editReply("❌ Ticket nicht gefunden.");
    // Panel für team_role_id ermitteln
    const { data: panel } = await api.get(`/tickets/panels/${ticket.panel_id}`);
    const teamRoleId = panel?.team_role_id;
    const channel = interaction.channel;
    let newLevel = ticket.permission_level ? 0 : 1;
    await api.patch(`/tickets/${ticketId}`, { permission_level: newLevel });

    if (teamRoleId && channel) {
      if (newLevel === 1) {
        await channel.permissionOverwrites.edit(teamRoleId, {
          ViewChannel: true,
          SendMessages: true,
          ReadMessageHistory: true,
        });
      } else {
        // Entferne explizite Rechte für Team-Rolle (Admins sehen über Serverrechte weiterhin)
        await channel.permissionOverwrites.edit(teamRoleId, {
          ViewChannel: false,
          SendMessages: false,
        });
      }
    }

    const mainMsg = await channel.messages.fetch(ticket.message_id).catch(() => null);
    const updated = { ...ticket, permission_level: newLevel };
    const embed = buildTicketEmbed({ ticket: updated, logCount: 0 });
    if (mainMsg) await mainMsg.edit({ embeds: [embed], components: buildTicketButtons(updated) });
    await interaction.editReply(`✅ Team-Sichtbarkeit: ${newLevel ? "an" : "aus"}.`);
  } catch (err) {
    logger.error("Fehler beim Umschalten Sichtbarkeit:", err?.response?.data || err.message);
    await interaction.editReply("❌ Fehler bei der Sichtbarkeit.");
  }
}

async function reopenTicket(interaction, ticketId) {
  try {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    const { data: ticket } = await api.get(`/tickets/${ticketId}`);
    if (!ticket) return interaction.editReply("❌ Ticket nicht gefunden.");
    await api.patch(`/tickets/${ticketId}`, { status: "open" });
    const guild = interaction.guild;
    const channel = guild.channels.cache.get(ticketId);
    if (channel) {
      await channel.permissionOverwrites.edit(ticket.creator_id, { SendMessages: true, ViewChannel: true });
      await channel.send({ content: "🔓 Ticket wieder geöffnet." });
    }
    await interaction.editReply("✅ Ticket wieder offen.");
  } catch (err) {
    logger.error("Fehler beim Wiederöffnen:", err?.response?.data || err.message);
    await interaction.editReply("❌ Fehler beim Wiederöffnen.");
  }
}

async function handleTicketButton(interaction) {
  const cid = interaction.customId;
  if (cid.startsWith("ticket_")) return createTicket(interaction);
  if (cid.startsWith("t_claim_")) return claimTicket(interaction, cid.split("_")[2]);
  if (cid.startsWith("t_close_")) return closeTicket(interaction, cid.split("_")[2]);
  if (cid.startsWith("t_imp_")) return toggleImportant(interaction, cid.split("_")[2]);
  if (cid.startsWith("t_wait_")) return toggleWaiting(interaction, cid.split("_")[2]);
  if (cid.startsWith("t_vis_")) return toggleVisibility(interaction, cid.split("_")[2]);
  if (cid.startsWith("t_reopen_")) return reopenTicket(interaction, cid.split("_")[2]);
  if (cid.startsWith("t_archive_")) return archiveTicket(interaction, cid.split("_")[2]);
  await interaction.reply({ content: "Unbekannter Ticket-Button.", flags: MessageFlags.Ephemeral });
}

async function archiveTicket(interaction, ticketId) {
  try {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    const { data: ticket } = await api.get(`/tickets/${ticketId}`);
    if (!ticket) return interaction.editReply("❌ Ticket nicht gefunden.");

    await api.patch(`/tickets/${ticketId}`, { status: "archived", closed_at: nowMysql() });

    // Vor dem Löschen des Channels dem Nutzer antworten, sonst könnte editReply fehlschlagen
    await interaction.editReply("✅ Ticket archiviert. Kanal wird gelöscht …");

    // Channel löschen
    const channel = interaction.guild.channels.cache.get(ticketId);
    if (channel) {
      try { await channel.send({ content: `🗃️ Ticket archiviert von <@${interaction.user.id}>. Kanal wird gelöscht...` }); } catch {}
      try { await channel.delete("Ticket archiviert"); } catch {}
    }
  } catch (err) {
    logger.error("Fehler beim Archivieren:", err?.response?.data || err.message);
    await interaction.editReply("❌ Fehler beim Archivieren.");
  }
}

module.exports = handleTicketButton;
