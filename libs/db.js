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
        db.exec('CREATE TABLE IF NOT EXISTS words (user VARCHAR(18) NOT NULL, guild VARCHAR(18) NOT NULL, reports TEXT);');
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
   * @param {Object} settings Module Settings
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
     * @return {Object} configurations
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
     * updated das Modul auf aus oder an (kaput)
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
     * updated die Modul Einstellungen
     * @param {String} id Module Id
     * @param {String} guild Guild Id
     * @param {Object} configText Objekt von Einstellungen
     */
    updateModuleConfig: function (id, guild, configText) {
        const insert = db.prepare('UPDATE modules set config = @status WHERE name = \'' + id + '\' AND guild = ' + guild);
        const insertMany = db.transaction((modules) => {
            for (const module of modules)
                insert.run(module);
        });
        insertMany([{
            status: Object.stringify(configText)
        }]);
    },

    /**
   * sucht ob der User bereits registriert ist
   * @param {String} id User Id
   * @param {String} guild Guild Id
   * @return {boolean} if exsist
   */
    checkWords: function (id, guild) {
        const row = db.prepare('SELECT * FROM words WHERE user = \'' + id + '\' AND guild = ' + guild).all();
        return !(row.length == 0);
    },

    /**
  * erstellt User für Words
  * @param {String} id User Id
  * @param {String} guild Guild Id
  */
    insertWords: function (id, guild) {
        const insert = db.prepare('INSERT INTO words (user, guild, reports) VALUES (@id, @guildid, @reps)');
        const insertMany = db.transaction((tags) => {
            for (const tag of tags)
                insert.run(tag);
        });
        insertMany([
            {
                id: id,
                guildid: guild,
                rpes: JSON.stringify({ data: [] })

            }
        ]);
    },

    /**
     * gibt Words Reports zurück
     * @param {String} id Module Id
     * @param {String} guild Guild Id
     * @return {Array} Reports
     */
    getWords: function (id, guild) {
        const row = db.prepare('SELECT * FROM words WHERE user = \'' + id + '\' AND guild = ' + guild).get();
        try {
            return JSON.parse(row.reports).array;
        } catch (error) {
            return undefined;
        }
    },

    /**
     * updated die Words reports
     * @param {Array} reports Reports Object
     * @param {String} id User Id
     * @param {String} guild Guild Id
     */
    updateWords: function (reports, id, guild) {
        const insert = db.prepare('UPDATE words set reports = @reps WHERE user = \'' + id + '\' AND guild = ' + guild);
        const insertMany = db.transaction((modules) => {
            for (const module of modules)
                insert.run(module);
        });
        insertMany([{
            reps: JSON.stringify({ data: reports })
        }]);
    },

    /**
    * sucht ob der Channel eingetragen ist
    * @param { String } id Channel Id
    * @param { String } guild Guild Id
    * @return { boolean } if exsist
    */
    checkChannel: function (id, guild) {
        const row = db.prepare('SELECT * FROM channels WHERE id = \'' + id + '\' AND guild = ' + guild).all();
        return !(row.length == 0);
    },

    /**
    * erstellt neuen Cahnnel
    * @param {String} id Channel Id
    * @param {String} guild Guild Id
    */
    insertChannel: function (id, guild) {
        const insert = db.prepare('INSERT INTO channels (id, guild, type) VALUES (@id, @guildid, @typ)');
        const insertMany = db.transaction((tags) => {
            for (const tag of tags)
                insert.run(tag);
        });
        insertMany([
            {
                id: id,
                guildid: guild,
                typ: 'rpCat'
            }
        ]);
    },

    /**
     * gibt alle Channel zurück
     * @param {String} guild Guild Id
     * @return {Array} channel
     */
    getChannel: function (guild) {
        const row = db.prepare('SELECT * FROM channels WHERE guild = ' + guild).all();
        try {
            return row;
        } catch (error) {
            return undefined;
        }
    },

    /**
     * löscht den Channel
     * @param {String} id Channel Id
     * @param {String} guild Guild Id
     */
    deleteChannel: function (id, guild) {
        const insert = db.prepare('DELETE FROM channels WHERE id = \'' + id + '\' AND guild = ' + guild);
        const insertMany = db.transaction((modules) => {
            for (const module of modules)
                insert.run(module);
        });
        insertMany([{}]);
    },


};