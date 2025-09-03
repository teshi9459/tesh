const { EmbedBuilder, ActionRowBuilder, ButtonStyle } = require("discord.js");
const { api } = require("../utils/api.js");
const dc = require("../utils/dc.js");

function buildTicketEmbed({ ticket, logCount = 0 }) {
  const creatorMention = ticket?.creator_id ? `<@${ticket.creator_id}>` : "-";
  const assignedMention = ticket?.assigned_mod_id
    ? `<@${ticket.assigned_mod_id}>`
    : "— nicht zugewiesen —";
  const waitStr = ticket?.waiting === "user" ? "User" : "Team";

  return new EmbedBuilder()
    .setTitle("Ticket Übersicht")
    .setColor("#aaeeff")
    .addFields(
      { name: "Erstellt von", value: creatorMention, inline: true },
      { name: "Zugewiesen an", value: assignedMention, inline: true },
      { name: "Gespeicherte Nachrichten", value: String(logCount), inline: true },
      { name: "Wartet auf", value: waitStr, inline: true },
      { name: "Status", value: ticket?.status || "open", inline: true },
      { name: "Team sichtbar", value: ticket?.permission_level ? "Ja" : "Nein", inline: true }
    )
    .setFooter({ text: `Ticket ${ticket?.id || "?"}` });
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

module.exports = {
  name: "tickets",
  enabled: true,

  // Wir hören auf Nachrichten
  messages: true,

  async executeMessage(message) {
    try {
      // Nur in Guild und Textchannel relevant
      if (!message.guild || message.author.bot) return;

      // Prüfen, ob Channel ein Ticket ist (id == tickets.id)
      const channelId = message.channel.id;
      let ticket;
      try {
        const res = await api.get(`/tickets/${channelId}`);
        ticket = res.data;
      } catch (e) {
        return; // kein Ticket-Channel
      }

      // Ticket-Log speichern
      const attachments = message.attachments?.size
        ? JSON.stringify(
            Array.from(message.attachments.values()).map((a) => ({ url: a.url, name: a.name }))
          )
        : null;

      const { data: logResult } = await api.post(`/tickets/logs`, {
        ticket_id: channelId,
        message_id: message.id,
        user_id: message.author?.id || null,
        username: message.author?.username || null,
        text: message.content || null,
        attachments,
      });

      const logCount = logResult?.count ?? 0;

      // Waiting anhand des letzten Senders automatisch setzen
      const newWaiting = message.author?.id === ticket.creator_id ? "team" : "user";
      try {
        await api.patch(`/tickets/${channelId}`, { waiting: newWaiting });
      } catch (e) {
        // tolerieren, falls Patch fehlschlägt
      }

      // Hauptnachricht aktualisieren
      if (ticket.message_id) {
        try {
          // Ticket frisch laden (falls Status/Visibility geändert)
          const { data: fresh } = await api.get(`/tickets/${channelId}`);
          const mainMsg = await message.channel.messages.fetch(fresh.message_id);
          const embed = buildTicketEmbed({ ticket: fresh, logCount });
          await mainMsg.edit({ embeds: [embed], components: buildTicketButtons(fresh) });
        } catch (e) {
          // ignoriere, wenn die Nachricht nicht gefunden wird
        }
      }
    } catch (err) {
      console.error("[tickets] Fehler in executeMessage:", err?.response?.data || err.message);
    }
  },
};
