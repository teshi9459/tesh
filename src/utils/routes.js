const express = require("express");
const router = express.Router();

// Einzelne Modulpfade importieren
const pingRoutes = require("./routes.ping.js");
//const ticketRoutes = require("./routes.tickets");
// weitere Module z. B.:
// const wordRoutes = require("./routes.words");

router.use("/ping", pingRoutes);
//router.use("/tickets", ticketRoutes);
// router.use("/words", wordRoutes);

module.exports = router;
