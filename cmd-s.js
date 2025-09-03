const fs = require("node:fs");
const path = require("node:path");
const { REST, Routes } = require("discord.js");
const dotenv = require("dotenv");

dotenv.config();

function loadSlashCommands() {
  const commandsDir = path.join(__dirname, "src", "plugins");
  const files = fs.readdirSync(commandsDir).filter((f) => f.endsWith(".js"));
  const list = [];
  for (const f of files) {
    try {
      const mod = require(path.join(commandsDir, f));
      if (mod && mod.enabled !== false && mod.slashCommands && mod.data?.toJSON) {
        list.push(mod.data.toJSON());
      }
    } catch (e) {
      console.error(`[cmd-s] Fehler beim Laden von ${f}:`, e.message);
    }
  }
  return list;
}

async function main() {
  const token = process.env.BOT_TOKEN;
  const clientId = process.env.BOT_CLIENT_ID;
  const guildId = process.env.GUILD_ID;
  if (!token || !clientId || !guildId) {
    console.error("[cmd-s] BOT_TOKEN, BOT_CLIENT_ID oder GUILD_ID fehlen in .env");
    process.exit(1);
  }

  const commands = loadSlashCommands();
  console.log(`[cmd-s] Registriere ${commands.length} Guild-Commands für ${guildId}`);

  const rest = new REST({ version: "10" }).setToken(token);
  try {
    const data = await rest.put(
      Routes.applicationGuildCommands(clientId, guildId),
      { body: commands }
    );
    console.log(`[cmd-s] Erfolgreich registriert: ${data.length}`);
  } catch (err) {
    console.error("[cmd-s] Fehler bei Registrierung:", err.message);
    process.exit(1);
  }
}

main();
