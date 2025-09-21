const {
  MessageFlags,
  PermissionFlagsBits,
  EmbedBuilder,
} = require("discord.js");
const { brainApi, BrainApiError } = require("../../utils/api.js");
const logger = require("../../utils/logger.js");

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
    logger.warn({ err }, "Konnte Words-Log-Embed nicht aktualisieren");
  }
}

async function respondWithApiError(interaction, error, fallback) {
  const content =
    error instanceof BrainApiError && error.userMessage
      ? error.userMessage
      : fallback;

  if (!content) return;

  try {
    if (interaction.deferred || interaction.replied) {
      await interaction.followUp({ content, flags: MessageFlags.Ephemeral });
    } else {
      await interaction.reply({ content, flags: MessageFlags.Ephemeral });
    }
  } catch (err) {
    logger.error({ err }, "Fehler beim Rückmelden einer API-Störung");
  }
}

async function fetchReport(reportId) {
  return brainApi.get(`/words/reports/${reportId}`, undefined, {
    userMessage: "Der Report konnte nicht gefunden werden.",
  });
}

async function fetchConfig(guildId) {
  return brainApi.get(`/words/config/${guildId}`, undefined, {
    userMessage: "Die Words-Konfiguration konnte nicht geladen werden.",
  });
}

async function handleWordsButton(interaction) {
  const id = interaction.customId;
  const guildId = interaction.guild?.id;

  try {
    if (id.startsWith("w_req_")) {
      const reportId = Number(id.split("_")[2]);
      const report = await fetchReport(reportId);

      if (interaction.user.id !== report.user_id)
        return interaction.reply({
          content: "Nur der Ersteller kann das anfordern.",
          flags: MessageFlags.Ephemeral,
        });

      await brainApi.patch(
        `/words/reports/${reportId}`,
        { status: "requested" },
        undefined,
        { userMessage: "Der Report-Status konnte nicht gesetzt werden." }
      );
      await brainApi.post(
        `/words/reports/${reportId}/actions`,
        {
          actor_user_id: interaction.user.id,
          action: "request",
        },
        undefined,
        {
          userMessage: "Die Aktion konnte nicht protokolliert werden.",
        }
      );
      await updateLogMessage(interaction, report, "requested");

      return interaction.reply({
        content: `OK. Report #${report.id} wurde zur Prüfung markiert.`,
        flags: MessageFlags.Ephemeral,
      });
    }

    if (id.startsWith("w_ack_")) {
      const reportId = Number(id.split("_")[2]);
      const report = await fetchReport(reportId);

      if (interaction.user.id !== report.user_id)
        return interaction.reply({
          content: "Nur der Ersteller kann das bestätigen.",
          flags: MessageFlags.Ephemeral,
        });

      await brainApi.patch(
        `/words/reports/${reportId}`,
        { status: "acknowledged" },
        undefined,
        {
          userMessage: "Die Bestätigung konnte nicht gespeichert werden.",
        }
      );
      await updateLogMessage(interaction, report, "acknowledged");
      return interaction.reply({
        content: "Danke – Verstanden wurde vermerkt.",
        flags: MessageFlags.Ephemeral,
      });
    }

    if (id.startsWith("w_st_")) {
      const [, , action, repIdStr] = id.split("_");
      const reportId = Number(repIdStr);
      const report = await fetchReport(reportId);

      let cfg = null;
      if (guildId) {
        try {
          cfg = await fetchConfig(guildId);
        } catch (err) {
          if (!(err instanceof BrainApiError && err.status === 404)) {
            throw err;
          }
        }
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

      await brainApi.patch(
        `/words/reports/${reportId}`,
        { status: newStatus },
        undefined,
        {
          userMessage: "Der Report-Status konnte nicht aktualisiert werden.",
        }
      );
      await brainApi.post(
        `/words/reports/${reportId}/actions`,
        {
          actor_user_id: interaction.user.id,
          action,
        },
        undefined,
        {
          userMessage: "Die Aktion konnte nicht protokolliert werden.",
        }
      );

      await updateLogMessage(interaction, report, newStatus);

      return interaction.reply({
        content: `OK. Report #${report.id} → ${newStatus}`,
        flags: MessageFlags.Ephemeral,
      });
    }

    return interaction.reply({
      content: "Unbekannter Words-Button.",
      flags: MessageFlags.Ephemeral,
    });
  } catch (error) {
    logger.error({ err: error, id }, "Fehler beim Verarbeiten eines Words-Buttons");
    await respondWithApiError(
      interaction,
      error,
      "Fehler bei der Aktion. Bitte versuche es später erneut."
    );
  }
}

module.exports = handleWordsButton;

module.exports.__internal = {
  updateLogMessage,
  respondWithApiError,
};

