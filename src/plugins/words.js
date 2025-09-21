const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ChannelType,
  ActionRowBuilder,
  ButtonStyle,
  MessageFlags,
  EmbedBuilder,
} = require("discord.js");
const { brainApi, BrainApiError } = require("../utils/api.js");
const logger = require("../utils/logger.js");
const dc = require("../utils/dc.js");

const CONFIG_CACHE_TTL_MS = Number(process.env.WORDS_CONFIG_CACHE_TTL_MS ?? 30000);
const CATEGORY_CACHE_TTL_MS = Number(
  process.env.WORDS_CATEGORY_CACHE_TTL_MS ?? 30000
);

const configCache = new Map();
const categoryCache = new Map();

function isMonitoredChannel(categoryIds, channel) {
  const cat = channel.parentId;
  if (!cat) return false;
  return categoryIds.includes(cat);
}

function getCached(cache, key) {
  const entry = cache.get(key);
  if (!entry) return undefined;
  if (entry.expiresAt < Date.now()) {
    cache.delete(key);
    return undefined;
  }
  return entry.value;
}

function setCached(cache, key, value, ttl) {
  if (!ttl || ttl <= 0) {
    cache.delete(key);
    return;
  }
  cache.set(key, { value, expiresAt: Date.now() + ttl });
}

function invalidateConfigCache(guildId) {
  configCache.delete(guildId);
}

function invalidateCategoryCache(guildId) {
  categoryCache.delete(guildId);
}

async function fetchConfig(guildId, { forceRefresh = false } = {}) {
  const cached = getCached(configCache, guildId);
  if (!forceRefresh && cached !== undefined) return cached;

  try {
    const data = await brainApi.get(`/words/config/${guildId}`);
    setCached(configCache, guildId, data, CONFIG_CACHE_TTL_MS);
    return data;
  } catch (error) {
    if (error instanceof BrainApiError && error.status === 404) {
      setCached(configCache, guildId, null, CONFIG_CACHE_TTL_MS);
      return null;
    }
    throw error;
  }
}

async function fetchCategories(guildId, { forceRefresh = false } = {}) {
  const cached = getCached(categoryCache, guildId);
  if (!forceRefresh && cached !== undefined) return cached;

  const data = await brainApi.get(`/words/categories/${guildId}`);
  const categories = Array.isArray(data?.categories) ? data.categories : [];
  setCached(categoryCache, guildId, categories, CATEGORY_CACHE_TTL_MS);
  return categories;
}

async function ensureLogChannel(guild, cfg = {}) {
  if (cfg?.log_channel_id) return cfg.log_channel_id;

  const channel = await guild.channels.create({
    name: "words-log",
    type: ChannelType.GuildText,
  });

  await brainApi.patch(
    `/words/config/${guild.id}`,
    { log_channel_id: channel.id },
    undefined,
    {
      userMessage: "Der Log-Kanal konnte nicht gespeichert werden.",
    }
  );

  invalidateConfigCache(guild.id);
  return channel.id;
}

function countWords(text) {
  const clean = text.trim().replace(/\s+/g, " ");
  if (!clean) return 0;
  return clean.split(" ").length;
}

function buildReportEmbed(report) {
  const embed = new EmbedBuilder()
    .setTitle(`Words Report #${report.id}`)
    .setColor("#ffa500")
    .addFields(
      {
        name: "User",
        value: `<@${report.user_id}> (${report.username})`,
        inline: true,
      },
      { name: "Channel", value: `<#${report.channel_id}>`, inline: true },
      { name: "Status", value: report.status, inline: true },
      { name: "Wörter", value: String(report.word_count), inline: true },
      { name: "Minimum", value: String(report.min_words), inline: true },
      { name: "Differenz", value: String(report.diff), inline: true }
    )
    .setFooter({ text: `messageId: ${report.message_id}` });

  if (report.content) embed.setDescription(report.content.slice(0, 1900));
  return embed;
}

function formatReportTable(reports) {
  const headers = ["ID","Wörter", "Status", "Nachricht"];
  const rows = reports.map((report) => [
    `#${report.id}`,
    String(report.word_count),
    String(report.status ?? "-"),
    report.content,
  ]);

  const widths = headers.map((header, idx) =>
    Math.max(header.length, ...rows.map((row) => row[idx].length))
  );

  const formatRow = (row) =>
    row.map((value, idx) => value.padEnd(widths[idx])).join(" | ");

  const separator = widths.map((w) => "-".repeat(w)).join("-+-");
  return [formatRow(headers), separator, ...rows.map(formatRow)].join("\n");
}

async function respondWithApiError(target, error, fallback) {
  const content =
    error instanceof BrainApiError && error.userMessage
      ? error.userMessage
      : fallback;

  if (!content) return;

  try {
    if (typeof target?.isRepliable === "function" && target.isRepliable()) {
      if (target.deferred || target.replied) {
        await target.followUp({ content, flags: MessageFlags.Ephemeral });
      } else {
        await target.reply({ content, flags: MessageFlags.Ephemeral });
      }
    } else if (typeof target?.reply === "function") {
      await target.reply({
        content,
        allowedMentions: { repliedUser: false },
      });
    }
  } catch (err) {
    logger.error({ err }, "Fehler beim Senden der API-Fehlerrückmeldung");
  }
}

function resolveIgnorePrefixes(cfg) {
  const defaults = ["(", "{", "[", ")", "]", "}"];
  if (!cfg?.ignore_prefixes) return defaults;

  try {
    const parsed = JSON.parse(cfg.ignore_prefixes);
    if (Array.isArray(parsed) && parsed.length) return parsed;
  } catch (error) {
    logger.debug({ err: error }, "Konnte ignore_prefixes nicht parsen");
  }
  return defaults;
}

module.exports = {
  name: "words",
  enabled: true,

  slashCommands: true,
  messages: true,

  data: new SlashCommandBuilder()
    .setName("words")
    .setDescription("Wortlängen-Überwachung konfigurieren")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand((sub) =>
      sub
        .setName("setup")
        .setDescription("Grundkonfiguration setzen")
        .addIntegerOption((o) =>
          o.setName("min").setDescription("Mindestwörter").setRequired(true)
        )
        .addChannelOption((o) =>
          o
            .setName("log_channel")
            .setDescription("Log-Channel (optional)")
            .addChannelTypes(ChannelType.GuildText)
        )
        .addRoleOption((o) =>
          o
            .setName("teamrole")
            .setDescription("Teamrolle für Report-Verwaltung")
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName("switch")
        .setDescription("Modul ein-/ausschalten")
        .addStringOption((o) =>
          o
            .setName("state")
            .setDescription("on/off")
            .setRequired(true)
            .addChoices(
              { name: "on", value: "on" },
              { name: "off", value: "off" }
            )
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName("channel_add")
        .setDescription("Kategorie zur Überwachung hinzufügen")
        .addChannelOption((o) =>
          o
            .setName("category")
            .setDescription("Kategorie-Channel")
            .setRequired(true)
            .addChannelTypes(ChannelType.GuildCategory)
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName("channel_remove")
        .setDescription("Kategorie aus Überwachung entfernen")
        .addChannelOption((o) =>
          o
            .setName("category")
            .setDescription("Kategorie-Channel")
            .setRequired(true)
            .addChannelTypes(ChannelType.GuildCategory)
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName("reports")
        .setDescription("Reports anzeigen")
        .addUserOption((o) =>
          o.setName("user").setDescription("Benutzer für Filter")
        )
    ),

  async executeSlashCommand(interaction) {
    const sub = interaction.options.getSubcommand();
    const guildId = interaction.guild.id;

    try {
      switch (sub) {
        case "setup": {
          const min = interaction.options.getInteger("min");
          const logCh = interaction.options.getChannel("log_channel");
          const teamRole = interaction.options.getRole("teamrole");

          await interaction.deferReply({ flags: MessageFlags.Ephemeral });

          await brainApi.patch(
            `/words/config/${guildId}`,
            {
              min_words: min,
              ...(teamRole ? { team_role_id: teamRole.id } : {}),
              ...(logCh ? { log_channel_id: logCh.id } : {}),
            },
            undefined,
            {
              userMessage: "Die Words-Konfiguration konnte nicht gespeichert werden.",
            }
          );

          invalidateConfigCache(guildId);

          let cfgAfter = null;
          try {
            cfgAfter = await fetchConfig(guildId, { forceRefresh: true });
          } catch (err) {
            if (!(err instanceof BrainApiError && err.status === 404)) {
              throw err;
            }
          }

          if (!cfgAfter?.log_channel_id && !logCh) {
            try {
              const ensuredId = await ensureLogChannel(
                interaction.guild,
                cfgAfter || { log_channel_id: null }
              );
              cfgAfter = { ...(cfgAfter || {}), log_channel_id: ensuredId };
            } catch (err) {
              logger.error({ err, guildId }, "Konnte Log-Channel nicht erstellen");
            }
          }

          await interaction.editReply({
            content: `Words-Setup gespeichert (min=${min})`,
          });
          return;
        }
        case "switch": {
          const state = interaction.options.getString("state");
          await brainApi.patch(
            `/words/config/${guildId}`,
            { enabled: state === "on" ? 1 : 0 },
            undefined,
            {
              userMessage: "Der Words-Status konnte nicht aktualisiert werden.",
            }
          );
          invalidateConfigCache(guildId);
          await interaction.reply({
            content: `Words ist jetzt ${state === "on" ? "aktiv" : "inaktiv"}.`,
            flags: MessageFlags.Ephemeral,
          });
          return;
        }
        case "channel_add": {
          const category = interaction.options.getChannel("category");
          await brainApi.post(
            `/words/categories`,
            {
              guild_id: guildId,
              category_id: category.id,
            },
            undefined,
            {
              userMessage: "Die Kategorie konnte nicht hinzugefügt werden.",
            }
          );
          invalidateCategoryCache(guildId);
          await interaction.reply({
            content: `Kategorie ${category.name} hinzugefügt.`,
            flags: MessageFlags.Ephemeral,
          });
          return;
        }
        case "channel_remove": {
          const category = interaction.options.getChannel("category");
          await brainApi.delete(
            `/words/categories`,
            { data: { guild_id: guildId, category_id: category.id } },
            {
              userMessage: "Die Kategorie konnte nicht entfernt werden.",
            }
          );
          invalidateCategoryCache(guildId);
          await interaction.reply({
            content: `Kategorie ${category.name} entfernt.`,
            flags: MessageFlags.Ephemeral,
          });
          return;
        }
        case "reports": {
          const user = interaction.options.getUser("user");
          const params = new URLSearchParams({
            guild_id: guildId,
            limit: "3",
          });
          if (user) params.set("user_id", user.id);

          const data = await brainApi.get(
            `/words/reports?${params.toString()}`,
            undefined,
            {
              userMessage: "Die Reports konnten nicht geladen werden.",
            }
          );

          const list = Array.isArray(data?.items) ? data.items : [];
          if (list.length === 0) {
            await interaction.reply({
              content: "Keine Reports gefunden.",
              flags: MessageFlags.Ephemeral,
            });
            return;
          }

          const table = formatReportTable(list);
          const header = user ? `Berichte für ${user.toString()}` : "Letzte Reports";
          await interaction.reply({
            content: `\n**${header}**\n\`\`\`\n${table}\n\`\`\``,
          });
          return;
        }
        default:
          await interaction.reply({
            content: "Unbekannter Words-Subcommand.",
            flags: MessageFlags.Ephemeral,
          });
      }
    } catch (error) {
      logger.error({ err: error, guildId, sub }, "Fehler in Words-SlashCommand");
      await respondWithApiError(
        interaction,
        error,
        "Beim Ausführen des Befehls ist ein Fehler aufgetreten."
      );
    }
  },

  async executeMessage(message) {
    if (message.author.bot) return;
    const guildId = message.guild?.id;
    if (!guildId) return;

    let cfg;
    try {
      cfg = await fetchConfig(guildId);
    } catch (error) {
      if (error instanceof BrainApiError && error.status === 404) {
        logger.debug({ guildId }, "Keine Words-Konfiguration gefunden");
      } else {
        logger.error({ err: error, guildId }, "Words-Konfiguration konnte nicht geladen werden");
      }
      return;
    }

    if (!cfg || !cfg.enabled) return;

    let categories;
    try {
      categories = await fetchCategories(guildId);
    } catch (error) {
      logger.error({ err: error, guildId }, "Categories für Words konnten nicht geladen werden");
      return;
    }

    if (!isMonitoredChannel(categories, message.channel)) return;

    const content = message.content ?? "";
    const trimmed = content.trim();
    if (!trimmed) return;

    const prefixes = resolveIgnorePrefixes(cfg);
    if (prefixes.some((prefix) => trimmed.startsWith(prefix))) return;

    const words = countWords(trimmed);
    if (words < 2) return;

    const min = Number(cfg?.min_words ?? 2);
    const under = words < min;
    logger.debug({ guildId, min, words, under }, "Words Schwellenwertprüfung");
    if (!under) return;

    const diff = Math.max(min - words, 0);

    let createRes;
    try {
      createRes = await brainApi.post(
        `/words/reports`,
        {
          guild_id: guildId,
          channel_id: message.channel.id,
          message_id: message.id,
          user_id: message.author.id,
          username: message.author.username,
          content: content.slice(0, 1900),
          word_count: words,
          min_words: min,
          diff,
          status: "auto",
        },
        undefined,
        {
          userMessage:
            "Ich konnte den Report gerade nicht speichern. Bitte versuch es später erneut.",
        }
      );
    } catch (error) {
      logger.error(
        { err: error, guildId, channelId: message.channel.id },
        "Erstellung eines Words-Reports fehlgeschlagen"
      );
      await respondWithApiError(
        message,
        error,
        "⚠️ Ich konnte deinen Report gerade nicht speichern. Bitte versuch es später erneut."
      );
      return;
    }

    const rep = createRes?.report;
    if (!rep) {
      logger.error({ guildId, createRes }, "Words-Report Antwort enthält kein report-Objekt");
      return;
    }

    const row = new ActionRowBuilder().addComponents(
      dc.createButton(
        `w_req_${rep.id}`,
        "Manuelle Prüfung anfordern",
        ButtonStyle.Danger,
        false
      ),
      dc.createButton(`w_ack_${rep.id}`, "Verstanden", ButtonStyle.Success, false)
    );

    await message.reply({
      content: `⚠️ Deine Nachricht unterschreitet die geforderte Wortanzahl (min=${min}). Klicke auf "Verstanden" oder fordere eine manuelle Prüfung an.`,
      components: [row],
    });

    let logChannelId = cfg.log_channel_id;
    if (!logChannelId) {
      try {
        logChannelId = await ensureLogChannel(message.guild, cfg);
        cfg.log_channel_id = logChannelId;
      } catch (error) {
        logger.error({ err: error, guildId }, "Konnte Log-Channel für Words nicht sicherstellen");
        return;
      }
    }

    const logChannel = message.guild.channels.cache.get(logChannelId);
    if (!logChannel) {
      logger.warn({ guildId, logChannelId }, "Configured Words-Log Channel nicht gefunden");
      return;
    }

    try {
      const actions = new ActionRowBuilder().addComponents(
        dc.createButton(`w_st_delete_${rep.id}`, "Löschen", ButtonStyle.Danger, false),
        dc.createButton(`w_st_ignore_${rep.id}`, "Ignorieren", ButtonStyle.Secondary, false),
        dc.createButton(`w_st_confirm_${rep.id}`, "Validiert", ButtonStyle.Success, false)
      );
      const embed = buildReportEmbed(rep);
      const logMsg = await logChannel.send({
        embeds: [embed],
        components: [actions],
      });

      await brainApi.patch(
        `/words/reports/${rep.id}`,
        {
          log_channel_id: logChannelId,
          log_message_id: logMsg.id,
        },
        undefined,
        {
          userMessage: "Der Report konnte nicht im Log verknüpft werden.",
        }
      );
    } catch (error) {
      logger.error(
        { err: error, guildId, logChannelId },
        "Konnte Words-Report nicht in Log verlinken"
      );
    }
  },
};

module.exports.__internal = {
  countWords,
  formatReportTable,
  resolveIgnorePrefixes,
};

