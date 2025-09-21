const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ChannelType,
  ActionRowBuilder,
  ButtonStyle,
  MessageFlags,
  EmbedBuilder,
} = require("discord.js");
const { api } = require("../utils/api.js");
const tools = require("../utils/tools.js");
const dc = require("../utils/dc.js");
function isMonitoredChannel(categoryIds, channel) {
  const cat = channel.parentId;
  if (!cat) return false;
  return categoryIds.includes(cat);
}

async function fetchConfig(guildId) {
  try {
    const { data } = await api.get(`/words/config/${guildId}`);
    return data;
  } catch (e) {
    return null;
  }
}

async function ensureLogChannel(guild, cfg) {
  if (cfg?.log_channel_id) return cfg.log_channel_id;
  const ch = await guild.channels.create({
    name: "words-log",
    type: ChannelType.GuildText,
  });
  await api.patch(`/words/config/${guild.id}`, { log_channel_id: ch.id });
  return ch.id;
}

async function fetchCategories(guildId) {
  const { data } = await api.get(`/words/categories/${guildId}`);
  return data.categories || [];
}

function countWords(text) {
  const clean = text.trim().replace(/\s+/g, " ");
  if (!clean) return 0;
  return clean.split(" ").length;
}

function buildReportEmbed(report) {
  const e = new EmbedBuilder()
    .setTitle(`Words Report #${report.id}`)
    .setColor("#ffa500")
    .addFields(
      {
        name: "User",
        value: `<@${report.user_id}> (${report.username})`,
        inline: true,
      },
      { name: "Channel", value: `<#${report.channel_id}>`, inline: true },
      { name: "Wörter", value: String(report.word_count), inline: true },
      { name: "Minimum", value: `min ${report.min_words}`, inline: true },
      { name: "Differenz", value: String(report.diff), inline: true },
      { name: "Status", value: report.status, inline: true }
    )
    .setFooter({ text: `messageId: ${report.message_id}` });
  if (report.content) e.setDescription(report.content.slice(0, 1900));
  return e;
}

module.exports = {
  name: "words",
  enabled: true,

  slashCommands: true,
  messages: true,

  data: new SlashCommandBuilder()
    .setName("words")
    .setDescription("WortlÃ¤ngen-Ãœberwachung konfigurieren")
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
        .setDescription("Kategorie zur Ãœberwachung hinzufügen")
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
        .setDescription("Kategorie aus Ãœberwachung entfernen")
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
    const cfg = await fetchConfig(guildId);

    if (sub === "setup") {
      const min = interaction.options.getInteger("min");
      // max entfernt: nur Mindestwert wird verwendet
      const logCh = interaction.options.getChannel("log_channel");
      const teamRole = interaction.options.getRole("teamrole");

      // Upsert Config in DB
      await interaction.reply({
        content: "Speichere Konfiguration â€¦",
        flags: MessageFlags.Ephemeral,
      });
      await api.patch(`/words/config/${guildId}`, {
        min_words: min,
        // max_words entfernt
        ...(teamRole ? { team_role_id: teamRole.id } : {}),
        ...(logCh ? { log_channel_id: logCh.id } : {}),
      });
      // Sicherstellen, dass Log-Channel existiert
      const cfgAfter = await fetchConfig(guildId);
      if (!cfgAfter?.log_channel_id && !logCh) {
        await ensureLogChannel(
          interaction.guild,
          cfgAfter || { log_channel_id: null }
        );
      }
      return interaction.editReply({
        content: `âœ“ Words-Setup gespeichert (min=${min})`,
        flags: MessageFlags.Ephemeral,
      });
    }

    if (sub === "switch") {
      const state = interaction.options.getString("state");
      await api.patch(`/words/config/${guildId}`, {
        enabled: state === "on" ? 1 : 0,
      });
      return interaction.reply({
        content: `Words ist jetzt ${state === "on" ? "aktiv" : "inaktiv"}.`,
        flags: MessageFlags.Ephemeral,
      });
    }

    if (sub === "channel_add") {
      const cat = interaction.options.getChannel("category");
      await api.post(`/words/categories`, {
        guild_id: guildId,
        category_id: cat.id,
      });
      return interaction.reply({
        content: `Kategorie ${cat.name} hinzugefügt.`,
        flags: MessageFlags.Ephemeral,
      });
    }

    if (sub === "channel_remove") {
      const cat = interaction.options.getChannel("category");
      await api.delete(`/words/categories`, {
        data: { guild_id: guildId, category_id: cat.id },
      });
      return interaction.reply({
        content: `Kategorie ${cat.name} entfernt.`,
        flags: MessageFlags.Ephemeral,
      });
    }

    if (sub === "reports") {
      const user = interaction.options.getUser("user");
      const params = new URLSearchParams({
        guild_id: guildId,
        limit: "3",
      });
      if (user) params.set("user_id", user.id);
      const { data } = await api.get(`/words/reports?${params.toString()}`);
      const list = data.items || [];
      if (list.length === 0)
        return interaction.reply({
          content: "Keine Reports gefunden.",
          flags: MessageFlags.Ephemeral,
        });
      const headers = ["ID", "Wörter", "Status"];
      const rows = list.map((r) => [
        `#${r.id}`,
        String(r.word_count),
        String(r.status ?? "-"),
      ]);
      const widths = headers.map((header, idx) =>
        Math.max(header.length, ...rows.map((row) => row[idx].length))
      );
      const formatRow = (row) =>
        row.map((value, idx) => value.padEnd(widths[idx])).join(" | ");
      const separator = widths.map((w) => "-".repeat(w)).join("-+-");
      const table = [
        formatRow(headers),
        separator,
        ...rows.map(formatRow),
      ].join("\n");
      return interaction.reply({
        content: `\n\*\*${user}\*\*\n\`\`\`\n${table}\n\`\`\``,
      });
    }
  },

  async executeMessage(message) {
    try {
      if (message.author.bot) return;
      const guildId = message.guild.id;
      const cfg = await fetchConfig(guildId);
      if (!cfg || !cfg.enabled) return;
      const categories = await fetchCategories(guildId);
      if (!isMonitoredChannel(categories, message.channel)) return;

      const content = message.content || "";
      const trimmed = content.trim();
      if (!trimmed) return; // nur Text auswerten

      // Prefix-Ignore
      let prefixes = ["(", "{", "[", ")", "]", "}"];
      if (cfg.ignore_prefixes) {
        try {
          const parsed = JSON.parse(cfg.ignore_prefixes);
          if (Array.isArray(parsed)) prefixes = parsed;
        } catch {}
      }
      if (prefixes.some((p) => trimmed.startsWith(p))) return;

      const words = countWords(trimmed);
      if (words < 2) return; // Emotes/Leer

      // Nur Mindestwert präfen; Standard-Minimum = 2, wenn nicht gesetzt
      const min = Number(cfg?.min_words);
      const under = words < min;
      console.log(`${min} | ${words} | ${under}`);
      if (!under) return;

      // Differenz = fehlende Wörter bis zum Minimum
      const diff = Math.max(min - words, 0);

      // Report in DB anlegen
      const { data: createRes } = await api.post(`/words/reports`, {
        guild_id: guildId,
        channel_id: message.channel.id,
        message_id: message.id,
        user_id: message.author.id,
        username: message.author.username,
        content: content.slice(0, 1900),
        word_count: words,
        min_words: min,
        // max_words nicht mehr verwendet
        diff,
        status: "auto",
      });
      const rep = createRes.report;

      // Antwort im Channel (User kann Prüfung anfordern)
      const row = new ActionRowBuilder().addComponents(
        dc.createButton(
          `w_req_${rep.id}`,
          "Manuelle Prüfung anfordern",
          ButtonStyle.Danger,
          false
        )
      );
      row.addComponents(
        dc.createButton(
          `w_ack_${rep.id}`,
          "Verstanden",
          ButtonStyle.Success,
          false
        )
      );
      await message.reply({
        content: `⚠️ Deine Nachricht unterschreitet die geforderte Wortanzahl (min=${min}). Klicke auf "Verstanden" oder fordere eine manuelle Prüfung an.`,
        components: [row],
      });

      // Log in Log-Channel
      const logChannelId = await ensureLogChannel(message.guild, cfg);
      const logChannel = message.guild.channels.cache.get(logChannelId);
      if (logChannel) {
        const actions = new ActionRowBuilder().addComponents(
          dc.createButton(
            `w_st_delete_${rep.id}`,
            "Löschen",
            ButtonStyle.Danger,
            false
          ),
          dc.createButton(
            `w_st_ignore_${rep.id}`,
            "Ignorieren",
            ButtonStyle.Secondary,
            false
          ),
          dc.createButton(
            `w_st_confirm_${rep.id}`,
            "Validiert",
            ButtonStyle.Success,
            false
          )
        );
        const embed = buildReportEmbed(rep);
        const logMsg = await logChannel.send({
          embeds: [embed],
          components: [actions],
        });
        await api.patch(`/words/reports/${rep.id}`, {
          log_channel_id: logChannelId,
          log_message_id: logMsg.id,
        });
      }
    } catch (err) {
      console.error("[words] Fehler in executeMessage:", err);
    }
  },
};
