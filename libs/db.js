const fs = require('fs');
const tools = require('./tools');
const db = require('better-sqlite3')('database.sqlite');
module.exports = {
    /**
     * erstellt DB verbindung
     * @return {sql.Database} connected DB
     */
    connectDb: function () {
        return db;
    },

    /**
     * checkt ob alle Tabellen exsitieren
     */
    setupCheck: function () {
        db.exec('CREATE TABLE IF NOT EXISTS guilds (id VARCHAR(18) PRIMARY KEY, role VARCHAR(18));');
        db.exec('CREATE TABLE IF NOT EXISTS channels (id VARCHAR(255) NOT NULL PRIMARY KEY,guild VARCHAR(255) NOT NULL,type  VARCHAR(255) NOT NULL); ');
        db.exec('CREATE TABLE IF NOT EXISTS modules (name VARCHAR(100) NOT NULL,enabled BOOLEAN(1) NOT NULL,config TEXT NOT NULL,guild VARCHAR(18) NOT NULL);');
        db.exec('CREATE TABLE IF NOT EXISTS words (id INTEGER PRIMARY KEY AUTOINCREMENT, userid VARCHAR(255) NOT NULL, guild VARCHAR(255) NOT NULL, reports TEXT);');
        console.log('all Tables checked');
    },

    /**
     * sucht ob der Server bereits registriert ist
     * @param {String} id Guild ID
     * @return {boolean} if exsist
     */
    checkGuild: function (id) {
        const row = db.prepare('SELECT * FROM guilds WHERE id = ' + id).all();
        return !(row.length == 0);
    },

    /**
     * erstellt Server in DB
     * @param {String} id Guild Id
     * @param {String} roleid Commander Role Id
     */
    insertGuild: function (id, roleId) {
        const insert = db.prepare('INSERT INTO guilds (id, role) VALUES (@id, @role)');
        const insertMany = db.transaction((guilds) => {
            for (const guild of guilds)
                insert.run(guild);


        });
        insertMany([{
            id: id,
            role: roleId
        }]);
    },

    /**
     * gibt Commander Rollen Id zurück
     * @param {String} id Guild Id
     * @return {String} Commander Rollen Id
     */
    getGuildRole: function (id) {
        const row = db.prepare('SELECT role FROM guilds WHERE id = ' + id).get();
        return row.role;
    },

    /**
    * sucht ob das Module bereits registriert ist
    * @param {String} id Modul Id
    * @param {String} guild Guild Id
    * @return {boolean} if exsist
    */
    checkModule: function (id, guild) {
        const row = db.prepare('SELECT * FROM modules WHERE name = \'' + id + '\' AND guild = ' + guild).all();
        return !(row.length == 0);
    },

    /**
   * erstellt Module in DB
   * @param {String} id Module Id
   * @param {Boolean} enabled toggle
   * @param {String} guild Guild Id
   * @param {JSON} settings Module Settings
   */
    insertModule: function (id, enabled, guild, settings) {
        const insert = db.prepare('INSERT INTO modules (name, enabled, config, guild) VALUES (@id, @enabled, @config, @guildid)');
        const insertMany = db.transaction((tags) => {
            for (const tag of tags)
                insert.run(tag);
        });
        insertMany([
            {
                id: id,
                enabled: '' + enabled,
                config: JSON.stringify(settings),
                guildid: guild

            }
        ]);
    },

    /**
     * gibt Commander Rollen Id zurück
     * @param {String} id Module Id
     * @param {String} guild Guild Id
     * @return {JSON} configurations
     */
    getModuleConfig: function (id, guild) {
        const row = db.prepare('SELECT * FROM modules WHERE name = \'' + id + '\' AND guild = ' + guild).get();
        try {
            return JSON.parse(row.config);
        } catch (error) {
            return undefined;
        }
    },

    /**
     * gibt Commander Rollen Id zurück
     * @param {String} id Module Id
     * @param {String} guild Guild Id
     * @return {Boolean} Status des Modules
     */
    getModuleStatus: function (id, guild) {
        const row = db.prepare(`SELECT enabled FROM guilds WHERE name = ${id} AND guild = ${guild}`).get();
        return row.enabled;
    },

    /**
     * nicht fertig
     * @param {String} id Module Id
     * @param {String} guild Guild Id
     * @return {Boolean} Status des Modules
     */
    updateModuleStatus: function (id, guild, status) {
        const insert = db.prepare('UPDATE modules set enabled = @status WHERE name = \'' + id + '\' AND guild = ' + guild);
        const insertMany = db.transaction((modules) => {
            for (const module of modules)
                insert.run(module);
        });
        insertMany([{
            status: '' + status
        }]);
    },

    /**
     * erneuert
     * @param {String} id Module Id
     * @param {String} guild Guild Id
     * @param {JSON} configText Objekt  der Settings
     */
    updateModuleConfig: function (id, guild, configText) {
        const insert = db.prepare('UPDATE modules set config = @status WHERE name = \'' + id + '\' AND guild = ' + guild);
        const insertMany = db.transaction((modules) => {
            for (const module of modules)
                insert.run(module);
        });
        insertMany([{
            status: JSON.stringify(configText)
        }]);
    },
};