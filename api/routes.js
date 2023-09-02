const express = require('express');
const router = express.Router();
const ping = require('ping');
async function pingServer(serverAddress) {
    try {
        const response = await ping.promise.probe(serverAddress);
        if (response.alive) {
            return response.time;
        } else {
            return 'Server ist nicht erreichbar';
        }
    } catch (error) {
        console.error('Fehler beim Pingen des Servers:', error);
        return 'Fehler beim Pingen des Servers';
    }
}
router.get('/ready', (req, res) => {
    res.send(req.client.user.id);
    console.log(' WEB bereit!');
});
router.get('/test', (req, res) => {
    res.sendStatus(200);
    req.client.channels.cache.get('942431374432935967').send('Test!');
    console.log('Test!');
});
router.get('/', (req, res) => {
    res.send('Hallo Welt!');
});
router.get('/ping', async (req, res) => {
    try {
        const pingTime = await pingServer('google.de');
        console.log(`Ping-Zeit: ${pingTime} ms`);
        res.send(`${pingTime}`);
    } catch (error) {
        console.error('Fehler:', error);
        res.status(500).send('Serverfehler');
    }
});
router.get('/guilds', async (req, res) => {
    guilds = [];
    req.client.guilds.cache.forEach(guild => {
        guilds.push(guild);
    });
    res.send(guilds);
});
router.get('/modules', async (req, res) => {
    console.log(req.query.guildId + "-" + req.query.userId);
    res.send([["Modul 1", "Modul 2", "Modul 3"], ["Modul 4", "Modul 5", "Modul 6"]]);
});
module.exports = router;