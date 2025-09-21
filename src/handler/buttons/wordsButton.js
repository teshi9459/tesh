const {
  MessageFlags,
  PermissionFlagsBits,
  EmbedBuilder,
} = require("discord.js");
const { api } = require("../../utils/api.js");

async function updateLogMessage(interaction, report, newStatus) {
  if (!report?.log_channel_id || !report?.log_message_id) return;
  try {
    let channel = null;
    if (interaction.channel?.id === report.log_channel_id) {
      channel = interaction.channel;
    } else if (interaction.guild?.channels?.cache?.has(report.log_channel_id)) {
      channel = interaction.guild.channels.cache.get(report.log_channel_id);
    } else {
      channel = await interaction.client.channels
        .fetch(report.log_channel_id)
        .catch(() => null);
    }
    if (!channel || typeof channel.isTextBased !== "function" || !channel.isTextBased()) return;
    const msg = await channel.messages.fetch(report.log_message_id);
    const baseEmbed = msg.embeds[0];
    if (!baseEmbed) return;
    const embed = EmbedBuilder.from(baseEmbed);
    const fields = Array.isArray(embed.data.fields) ? [...embed.data.fields] : [];
    const idx = fields.findIndex((f) => f.name === "Status");
    const value = String(newStatus ?? report.status ?? "-");
    if (idx >= 0) fields[idx] = { ...fields[idx], value };
    else fields.push({ name: "Status", value, inline: true });
    embed.setFields(fields);
    await msg.edit({ embeds: [embed] });
  } catch (err) {
    console.error("[wordsButton] Failed to update log message:", err);
  }
}

async function handleWordsButton(interaction) {
  const id = interaction.customId;
  const guildId = interaction.guild?.id;

  try {
    if (id.startsWith("w_req_")) {
      // Nutzer fordert manuelle Prüfung an
      const repId = Number(id.split("_")[2]);
      const { data: rep } = await api.get(`/words/reports/${repId}`);
      if (interaction.user.id !== rep.user_id)
        return interaction.reply({
          content: "Nur der Ersteller kann das anfordern.",
          flags: MessageFlags.Ephemeral,
        });
      await api.patch(`/words/reports/${repId}`, { status: "requested" });
      await api.post(`/words/reports/${repId}/actions`, {
        actor_user_id: interaction.user.id,
        action: "request",
      });
      await updateLogMessage(interaction, rep, "requested");
      return interaction.reply({
        content: `OK. Report #${rep.id} wurde zu Prüfung makiert`,
        flags: MessageFlags.Ephemeral,
      });
    }

    if (id.startsWith("w_ack_")) {
      // Nutzer bestätigt die Bot-Nachricht (Acknowledge)
      const repId = Number(id.split("_")[2]);
      const { data: rep } = await api.get(`/words/reports/${repId}`);
      if (interaction.user.id !== rep.user_id)
        return interaction.reply({
          content: "Nur der Ersteller kann das bestätigen.",
          flags: MessageFlags.Ephemeral,
        });

      await api.patch(`/words/reports/${repId}`, { status: "acknowledged" });
      await updateLogMessage(interaction, rep, "acknowledged");
      return interaction.reply({
        content: "Danke – Verstanden wurde vermerkt.",
        flags: MessageFlags.Ephemeral,
      });
    }

    if (id.startsWith("w_st_")) {
      // Status-Änderungen im Log (Teamrolle/Admin)
      const [, , action, repIdStr] = id.split("_");
      const repId = Number(repIdStr);
      const { data: rep } = await api.get(`/words/reports/${repId}`);

      // Load config for team role
      let cfg = null;
      if (guildId) {
        try {
          const res = await api.get(`/words/config/${guildId}`);
          cfg = res.data;
        } catch {}
      }

      const member = interaction.member;
      const isAdmin = member.permissions.has(PermissionFlagsBits.Administrator);
      const hasTeam = cfg?.team_role_id
        ? member.roles.cache.has(cfg.team_role_id)
        : false;
      if (!isAdmin && !hasTeam)
        return interaction.reply({
          content: "Keine Berechtigung.",
          flags: MessageFlags.Ephemeral,
        });

      let newStatus;
      if (action === "delete") newStatus = "deleted";
      else if (action === "ignore") newStatus = "ignored";
      else if (action === "confirm") newStatus = "confirmed";
      else
        return interaction.reply({
          content: "Unbekannte Aktion.",
          flags: MessageFlags.Ephemeral,
        });

      await api.patch(`/words/reports/${repId}`, { status: newStatus });
      await api.post(`/words/reports/${repId}/actions`, {
        actor_user_id: interaction.user.id,
        action,
      });

      await updateLogMessage(interaction, rep, newStatus);

      return interaction.reply({
        content: `OK. Report #${rep.id} → ${newStatus}`,
        flags: MessageFlags.Ephemeral,
      });
    }

    return interaction.reply({
      content: "Unbekannter Words-Button.",
      flags: MessageFlags.Ephemeral,
    });
  } catch (err) {
    console.error("[wordsButton] Fehler:", err);
    return interaction.reply({
      content: "Fehler bei der Aktion.",
      flags: MessageFlags.Ephemeral,
    });
  }
}

module.exports = handleWordsButton;
