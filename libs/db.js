const mysql = require('mysql');
const dotenv = require('dotenv');
const tools = require('./tools');

dotenv.config();
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: 3306
});

const executeQuery = (query, values) => {
    return new Promise((resolve, reject) => {
        pool.query(query, values, (error, results) => {
            if (error) {
                reject(error);
            } else {
                resolve(results);
            }
        });
    });
};

module.exports = {
    /**
     * logt Benutztungen
     */
    logUse: function (app, content) {
        content = tools.removeUnreadableChar(content);
        executeQuery('INSERT INTO LogUse (app, content) VALUES (?, ?)', [app, content]);
    },
    /**
     * logt Fehler
     */
    logError: function (app, category, error) {
        error = tools.removeUnreadableChar(error);
        executeQuery('INSERT INTO LogError (app, category, error) VALUES (?, ?, ?)', [app, category, error]);
    },
    /**
     * checkt die db verbindung
     */
    setupCheck: function () {
        pool.query('SELECT 1 + 1 AS solution', function (error, results, fields) {
            if (error) throw error;
            console.log('Database connection successful!');
            //module.exports.logUse('db', 'Database connection test successful!');
        });
    },

    /**
    * sucht ob der User bereits registriert ist
    * @param {String} id User Id
    * @return {boolean} if exsist
    */
    checkUser: async function (id) {
        try {
            const results = await executeQuery('SELECT * FROM User WHERE id = ?', [id]);
            return results.length > 0; // true, wenn Datensätze vorhanden, sonst false
        } catch (error) {
            console.error(error);
            return false;
        }
    },

    /**
     * erstellt User in Db
     * @param {String} id User Id
     */
    insertUser: function (id) {
        executeQuery('INSERT INTO User (id) VALUES(?)', [id]);
    },

    /**
     * sucht ob der Server bereits registriert ist
     * @param {String} id Guild ID
     * @return {boolean} if exsist
     */
    checkGuild: async function (id) {
        try {
            const results = await executeQuery('SELECT * FROM Guild WHERE id = ?', [id]);
            return results.length > 0; // true, wenn Datensätze vorhanden, sonst false
        } catch (error) {
            console.error(error);
            return false;
        }
    },

    /**
     * erstellt Server in DB
     * @param {String} id Guild Id
     * @param {String} roleid Commander Role Id
     */
    insertGuild: function (id, roleId) {
        executeQuery('INSERT INTO Guild (id, teshrole) VALUES (?, ?)', [id, roleId]);
    },

    /**
     * gibt Commander Rollen Id zurück
     * @param {String} id Guild Id
     * @return {String} Commander Rollen Id
     */
    getGuildRole: async function (id) {
        try {
            const query = 'SELECT teshrole FROM Guild WHERE id = ?';
            const values = [id];
            const results = await executeQuery(query, values);
            if (results.length > 0) {
                return results[0].teshrole;
            } else {
                return undefined;
            }
        } catch (error) {
            console.error(error);
            return undefined;
        }
    },

    /**
  * sucht ob der Server regsitriert ist im Modul
  * @param {String} guild Guild Id
  * @return {boolean} if exsist 
  */
    checkWordsSetup: async function (guild) {
        try {
            const results = await executeQuery('SELECT * FROM Words WHERE guild = ?', [guild]);
            return results.length > 0; // true, wenn Datensätze vorhanden, sonst false
        } catch (error) {
            console.error(error);
            return false;
        }
    },

    /**
  * sucht ob Words aktiviert ist
  * @param {String} guild Guild Id
  * @return {boolean} if on 
  */
    checkWordsToggle: async function (guild) {
        try {
            const results = await executeQuery('SELECT toggle FROM Words WHERE guild = ?', [guild]);
            if (results.length == 0) return false;
            return results[0].toggle;
        } catch (error) {
            console.error(error);
            return false;
        }
    },

    /**
    * erstellt ServerCOnfig in Words
    * @param {String} guild Guild Id
    * @param {String} channel logchannel Id
    */
    insertWordsConfig: function (guild, channel) {
        executeQuery('INSERT INTO Words (guild, channel) VALUES (?, ?)', [guild, channel]);
    },

    /**
    * updatet Schalter für Words
    * @param {String} guild Guild Id
    * @param {String} status toggle
    */
    updateWordsToggle: function (guild, status) {
        executeQuery('UPDATE Words SET toggle = ? WHERE guild = ?;', [status, guild]);
    },

    /**
    * updatet Channel für Words
    * @param {String} guild Guild Id
    * @param {String} mchannel CHannel Id 
    */
    updateWordsChannel: function (guild, channel) {
        executeQuery('UPDATE Words SET channel = ? WHERE guild = ?;', [channel, guild]);
    },

    /**
  * updatet warning für Words
  * @param {String} guild Guild Id
  * @param {String} status toggle
  */
    updateWordsWarning: function (guild, status) {
        executeQuery('UPDATE Words SET warning = ? WHERE guild = ?;', [status, guild]);
    },


    /**
   * updatet min, max für Words
   * @param {String} guild Guild Id
   * @param {String} min min words
   * @param {String} max max words
   */
    updateWordsTrigger: function (guild, min, max) {
        executeQuery('UPDATE Words SET min = ? , max = ? WHERE guild = ?;', [min, max, guild]);
    },

    /**
    * gibt Words config zurück
    * @param {String} guild Guild Id
    * @return {Object} Config OBJ
    */
    getWordsConfig: async function (guild) {
        try {
            const results = await executeQuery('SELECT * FROM Words WHERE guild = ?', [guild]);
            if (results.length > 0) {
                return results[0];
            } else {
                return undefined;
            }
        } catch (error) {
            console.error(error);
            return undefined;
        }
    },

    /**
    * erstellt einen Report
    * @param {String} guild Guild Id
    * @param {String} user user Id
    * @param {String} reason reason
    * @param {String} content the Report
    * @param {String} json the Report JSON
    * @param {Integer} level report Level
    */
    insertReport: function (guild, user, reason, content, json, level) {
        executeQuery('INSERT INTO Report (guild, user, reason, content, json, level) VALUES (?, ?, ?, ?, ?, ?)', [guild, user, reason, content, json, level]);
    },

    /**
  * erstellt einen Report
  * @param {String} guild Guild Id
  * @param {String} user user Id
  * @param {String} reason reason
  * @param {String} content the Report
  * @param {String} json the Report JSON
  */
    insertReport: function (guild, user, reason, content, json) {
        executeQuery('INSERT INTO Report (guild, user, reason, content, json) VALUES (?, ?, ?, ?, ?)', [guild, user, reason, content, json]);
    },


    /**
    * gibt Anzahl an reports zurück und stärke
    * @param {String} guild Guild Id
    * @param {String} user user Id
    * @return {Array} [reports, level]
    */
    countActiveReports: async function (guild, user) {
        try {
            const results = await executeQuery('SELECT level FROM Report WHERE guild = ? AND user = ? AND archived = false;', [guild, user]);
            return results;
        } catch (error) {
            console.error(error);
            return undefined;
        }
    },

    /**
    * sucht ob der Channel eingetragen ist
    * @param { String } id Channel Id
    * @param { String } guild Guild Id
    * @return { boolean } if exsist
    */
    checkChannel: async function (id, guild) {
        try {
            const results = await executeQuery('SELECT * FROM Channel WHERE id = ? AND guild = ?', [id, guild]);
            return results.length > 0; // true, wenn Datensätze vorhanden, sonst false
        } catch (error) {
            console.error(error);
            return false;
        }
    },

    /**
    * erstellt neuen Channel
    * @param {String} id Channel Id
    * @param {String} type varchar 3 type
    * @param {String} guild Guild Id
    */
    insertChannel: function (id, type, guild) {
        executeQuery('INSERT INTO Channel (id, type, guild) VALUES (?, ?, ?)', [id, type, guild]);
    },

    /**
     * gibt alle Channel zurück
     * @param {String} guild Guild Id
     * @return {Array} channel
     */
    getChannel: async function (guild) {
        try {
            const results = await executeQuery('SELECT id FROM Channel WHERE guild = ?', [guild]);
            if (results.length > 0) {
                return results;
            } else {
                return [];
            }
        } catch (error) {
            console.error(error);
            return [];
        }
    },

    /**
     * löscht den Channel
     * @param {String} id Channel Id
     * @param {String} guild Guild Id
     */
    deleteChannel: function (id, guild) {
        executeQuery('DELETE FROM Channel WHERE id = ? AND guild = ?', [id, guild]);
    },

    /**
    * erstellt ein Ticketpannel
    * @param {String} message Message Id (Pannel)
    * @param {String} channel Channel Id
    * @param {String} text text for new tickets
    * @param {String} category category for new tickets
    * @param {String} log log channel
    */
    insertTicketPanel: function (message, channel, guild, text, category, log) {
        executeQuery('INSERT INTO Ticketp (message, channel, guild, category, text, log) VALUES (?, ?, ?, ?, ?, ?)', [message, channel, guild, category, text, log]);
    },

    /**
    * löscht Ticket Panels
    * @param {String} id TicketPanel Id
    * @param {String} guild Guild Id
    */
    deleteTicketPanel: function (id, guild) {
        executeQuery('DELETE FROM Ticketp WHERE message = ? AND guild = ?', [id, guild]);
    },

    /**
     * gibt Ticket Pannel zurück
     * @param {String} id Message ID
     * @param {String} guild Guild Id
     * @return {Object} result Object with category and text
     */
    getTicketPanel: async function (id, guild) {
        try {
            const results = await executeQuery('SELECT category, text, log FROM Ticketp WHERE message = ? AND guild = ?', [id, guild]);
            if (results.length > 0) {
                return results[0];
            } else {
                return undefined;
            }
        } catch (error) {
            console.error(error);
            return undefined;
        }
    },

    /**
    * gibt Ticket Log Channel zurück
    * @param {String} channel Channel Id
    * @param {String} guild Guild Id
    * @return {Strin} Channel Id for logging
    */
    getTicketLog: async function (channel, guild) {
        try {
            const results = await executeQuery('SELECT log FROM Ticket WHERE guild = ? AND channel = ? AND closed = false;', [guild, channel]);
            if (results.length > 0) {
                return results[0].log;
            } else {
                return undefined;
            }
        } catch (error) {
            console.error(error);
            return undefined;
        }
    },

    /**
    * erstellt ein Ticket
    * @param {String} channel Channel Id
    * @param {String} user User Id
    * @param {String} guild Guild Id
    * @param {String} log Log-Channel Id
    */
    insertTicket: function (channel, user, guild, log) {
        const content = JSON.stringify({ messages: [] });
        executeQuery('INSERT INTO Ticket (user, channel, guild, content, log) VALUES (?,?,?,?,?)', [user, channel, guild, content, log]);
    },

    /**
     * gibt Ticket Id zurück
     * @param {String} channel Channel Id
     * @param {String} guild Guild Id
     * @return {Integer} Id
     */
    getTicketId: async function (channel, guild) {
        try {
            const results = await executeQuery('SELECT id FROM Ticket WHERE guild = ? AND channel = ? AND closed = false;', [guild, channel]);
            return results[0].id;
        } catch (error) {
            console.error(error);
            return undefined;
        }
    },

    /**
     * gibt Ticket zurück
     * @param {String} channel channel Id
     * @param {String} guild Guild Id
     * @return {Object} Ticket
    */
    getTicket: async function (channel, guild) {
        try {
            const results = await executeQuery('SELECT * FROM Ticket WHERE guild = ? AND channel = ?;', [guild, channel]);
            return results[0];
        } catch (error) {
            console.error(error);
            return undefined;
        }
    },

    /**
 * gibt Ticket USer id zurück
 * @param {String} channel channel Id
 * @param {String} guild Guild Id
 * @return {Object} Ticket
*/
    getTicketUser: async function (channel, guild) {
        try {
            const results = await executeQuery('SELECT user FROM Ticket WHERE channel = ? AND guild = ?', [channel, guild]);
            if (results.length > 0) {
                return results[0].user;
            } else {
                return undefined;
            }
        } catch (error) {
            console.error(error);
            return undefined;
        }
    },

    /**
     * gibt Ticket Content zurück
     * @param {String} channel channel Id
     * @param {String} guild Guild Id
     * @return {Object} Data Object
    */
    getTicketContent: async function (channel, guild) {
        try {
            const results = await executeQuery('SELECT content FROM Ticket WHERE channel = ? AND guild = ?', [channel, guild]);
            if (results.length > 0) {
                return results[0].content;
            } else {
                return undefined;
            }
        } catch (error) {
            console.error(error);
            return undefined;
        }
    },

    /**
     * updated Ticket content
     * @param {String} channel Channel Id
     * @param {String} guild Guild Id
     * @param {Object} content Object of Content
    */
    updateTicketContent: function (channel, guild, content) {
        content = JSON.stringify(content);
        executeQuery('UPDATE Ticket SET content = ? WHERE channel = ? AND guild = ?', [content, channel, guild]);
    },

    /**
     * schließt ticket
     * @param {String} channel Channel Id
     * @param {String} guild Guild Id
    */
    closeTicket: function (channel, guild) {
        executeQuery('UPDATE Ticket SET closed = true WHERE channel = ? AND guild = ?', [channel, guild]);
    },

    /**
    * sucht ob der Ticket Channel eingetragen ist
    * @param { String } channel Channel Id
    * @param { String } guild Guild Id
    * @return { boolean } if exsist
    */
    checkTicketChannel: async function (channel, guild) {
        try {
            const results = await executeQuery('SELECT * FROM Ticket WHERE channel = ? AND guild = ?', [channel, guild]);
            if (results.length > 0) {
                return true;
            } else {
                return false;
            }
        } catch (error) {
            console.error(error);
            return false;
        }
    },
};