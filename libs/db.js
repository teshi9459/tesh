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
  setupDb: function () {},

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
    const insert = db.prepare(
      'INSERT INTO guilds (id, role) VALUES (@id, @role)'
    );
    const insertMany = db.transaction((guilds) => {
      for (const guild of guilds) insert.run(guild);
    });
    insertMany([{ id: id, role: roleId }]);
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
};
