const { Attachment } = require('discord.js');
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
        tools.path('./database/Yurest/profile');
        tools.path('./database/Yurest/post');
        db.exec('CREATE TABLE IF NOT EXISTS guilds (id VARCHAR(18) PRIMARY KEY, role VARCHAR(18));');
        db.exec('CREATE TABLE IF NOT EXISTS channels (id VARCHAR(255) NOT NULL PRIMARY KEY,guild VARCHAR(255) NOT NULL,type  VARCHAR(255) NOT NULL); ');
        db.exec('CREATE TABLE IF NOT EXISTS modules (name VARCHAR(100) NOT NULL,enabled BOOLEAN(1) NOT NULL,config TEXT NOT NULL,guild VARCHAR(18) NOT NULL);');

        db.exec('CREATE TABLE IF NOT EXISTS tickets ( id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, channel VARCHAR (18) NOT NULL, type VRACHAR (4) NOT NULL, user VARCHAR (18) NOT NULL, guild VARCHAR (18) NOT NULL, closed BOOLEAN NOT NULL DEFAULT (false), content TEXT);');
        db.exec('CREATE TABLE IF NOT EXISTS ticketp ( message VARCHAR (18) NOT NULL PRIMARY KEY, channel VARCHAR (18) NOT NULL, type VARCHAR (4) NOT NULL, category VARCHAR (18) NOT NULL);');

        db.exec('CREATE TABLE IF NOT EXISTS yurestprofile (guild VARCHAR(18), user VARCHAR(18), charname VARCHAR PRIMARY KEY, username VARCHAR, private BOOLEAN, bio VARCHAR(300), media VARCHAR); ');

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
        const row = db.prepare('SELECT * FROM guilds WHERE id = ' + id).get();
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
    * sucht ob das Module angeschaltet ist
    * @param {String} id Modul Id
    * @param {String} guild Guild Id
    * @return {boolean} if on
    */
    isModuleOn: function (id, guild) {
        const row = db.prepare('SELECT enabled FROM modules WHERE name = \'' + id + '\' AND guild = ' + guild).get();
        if (row === undefined)
            return false;
        else
            return row.enabled;
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
            console.error(error);
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
            status: JSON.stringify(configText)
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
    insertWords: function (id, guild, reports) {
        const insert = db.prepare('INSERT INTO words (user, guild, reports) VALUES (@id, @guildid, @reps)');
        const insertMany = db.transaction((tags) => {
            for (const tag of tags)
                insert.run(tag);
        });
        insertMany([
            {
                id: id,
                guildid: guild,
                reps: JSON.stringify({ data: reports })

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
            return JSON.parse(row.reports).data;
        } catch (error) {
            return [];
        }
    },

    /**
     * updated die Words reports
     * @param {String} id User Id
     * @param {String} guild Guild Id
     * @param {Array} reports Reports Object
     */
    updateWords: function (id, guild, reports) {
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
        return db.prepare('SELECT * FROM channels WHERE guild = ' + guild).all();
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

    /**
  * erstellt ein Ticketpannel
  * @param {String} message Message Id (Pannel)
  * @param {String} channel Channel Id
  * @param {String} text text for new tickets
  * @param {String} name type of tickets
  * @param {String} categorie category for new tickets
  */
    insertPannel: function (message, channel, text, name, category) {
        const insert = db.prepare('INSERT INTO ticketp (message, channel, text, name, category) VALUES (@message, @channel, @text, @name, @category)');
        const insertMany = db.transaction((tags) => {
            for (const tag of tags)
                insert.run(tag);
        });
        insertMany([
            {
                message: message,
                channel: channel,
                text: text,
                name: name,
                category: category
            }
        ]);
    },

    /**
    * löscht Ticket Pannels
    * @param {String} id Ticket Id
    * @param {String} channel Channel Id
    */
    deletePannel: function (id, channel) {
        const insert = db.prepare('DELETE FROM ticketp WHERE message = \'' + id + '\' AND channel = ' + channel);
        const insertMany = db.transaction((modules) => {
            for (const module of modules)
                insert.run(module);
        });
        insertMany([{}]);
    },

    /**
     * gibt Ticket Pannel zurück
     * @param {String} id Module Id
     * @return {Object} Pannel
     */
    getPannel: function (id) {
        const row = db.prepare(`SELECT * FROM ticketp WHERE message = ${id}`).get();
        return row;
    },

    /**
 * erstellt ein Ticket
 * @param {String} channel Channel Id
 * @param {String} name type of ticket
 * @param {String} user User Id
 * @param {String} guild Guild Id
 */
    insertTicket: function (channel, name, user, guild) {
        const content = JSON.stringify({ data: [] });
        const insert = db.prepare('INSERT INTO tickets (channel, name, user, guild, content) VALUES ( @channel, @name, @user, @guild, @content)');
        const insertMany = db.transaction((tags) => {
            for (const tag of tags)
                insert.run(tag);
        });
        insertMany([
            {
                channel: channel,
                name: name,
                user: user,
                guild: guild,
                content: content
            }
        ]);
    },

    /**
     * gibt Ticket Id zurück
     * @param {String} channel Channel Id
     * @param {String} guild Guild Id
     * @return {Integer} Id
     */
    getTicketId: function (channel, guild) {
        const row = db.prepare(`SELECT * FROM tickets WHERE channel = ${channel} AND guild = ${guild}`).get();
        return row.id;
    },

    /**
     * gibt Ticket zurück
     * @param {String} id channel Id
     * @param {String} guild Guild Id
     * @return {Object} Ticket
   */
    getTicket: function (id, guild) {
        const row = db.prepare(`SELECT * FROM tickets WHERE channel = ${id} AND guild = ${guild}`).get();
        return row;
    },

    /**
     * gibt Ticket Content zurück
     * @param {String} id channel Id
     * @param {String} guild Guild Id
     * @return {Object} Data Object
   */
    getTicketContent: function (id, guild) {
        const row = db.prepare(`SELECT * FROM tickets WHERE channel = ${id} AND guild = ${guild}`).get();
        return JSON.parse(row.content);
    },

    /**
     * updated Ticket content
     * @param {String} id Ticket Id
     * @param {String} guild Guild Id
     * @param {Object} content Object of Content
    */
    updateTicketContent: function (id, guild, content) {
        const insert = db.prepare('UPDATE tickets set content = @cont WHERE channel = ' + id + ' AND guild = ' + guild);
        const insertMany = db.transaction((modules) => {
            for (const module of modules)
                insert.run(module);
        });
        insertMany([{
            cont: JSON.stringify(content)
        }]);
    },

    /**
     * schließt ein Ticket
     * @param {String} id Ticket Id
    */
    closeTicket: function (id) {
        const insert = db.prepare('UPDATE tickets set closed = true WHERE id = ' + id);
        const insertMany = db.transaction((modules) => {
            for (const module of modules)
                insert.run(module);
        });
        insertMany([{}]);
    },

    /**
    * sucht ob der Ticket Channel eingetragen ist
    * @param { String } id Channel Id
    * @param { String } guild Guild Id
    * @return { boolean } if exsist
    */
    checkTicketChannel: function (id, guild) {
        const row = db.prepare('SELECT * FROM tickets WHERE channel = \'' + id + '\' AND guild = ' + guild).all();
        return !(row.length == 0);
    },

    /**
    * erstellt ein Yurest Profil
    * @param {String} guild Guild Id
    * @param {String} user User Id
    * @param {String} charanme name of Char
    * @param {String} username username
    * @param {String} biography Biography
    * @param {Boolean} private if Profile is private = true
    * @param {Attachment} media Discord Attachment to store
    */
    insertYurestProfile: function (guild, user, charname, username, biography, privae, media) {
        const content = JSON.stringify({ data: [] });
        const insert = db.prepare('INSERT INTO yurestprofile (channel, type, user, guild, content) VALUES ( @channel, @type, @user, @guild, @content)');
        const insertMany = db.transaction((tags) => {
            for (const tag of tags)
                insert.run(tag);
        });
        insertMany([
            {
                channel: channel,
                type: type,
                user: user,
                guild: guild,
                content: content
            }
        ]);
    },

};