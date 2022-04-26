const cron = require("node-cron")
const path = require('path');
const mongoose = require('mongoose');
mongoose.Promise = require('bluebird');
const logger = require("./lib/logger");
const sync = require("./lib/mist_sync");
const Agent = require("./lib/mist_snmp").Agent;
const dotenv = require('dotenv');

var CONFIG = {}
try {
    CONFIG = require("./config");
    logger.info("Config file found!")
} catch (e) {
    logger.info("No Config file. Using ENV variables!")
    dotenv.config();
    CONFIG = {
        MIST_TOKEN: process.env.MIST_TOKEN || null,
        MIST_HOST: process.env.MIST_HOST || "api.mist.com",
        MIST_ORG_ID: process.env.MIST_ORG_ID || null,
        MONGO_HOST: process.env.MONGO_HOST || null,
        MONGO_DB: process.env.MONGO_DB || "snmp",
        MONGO_USER: process.env.MONGO_USER || null,
        MONGO_PASSWORD: process.env.MONGO_PASSWORD || null,
        MONGO_ENC_KEY: process.env.MONGO_ENC_KEY || null,
        MONGO_SIG_KEY: process.env.MONGO_SIG_KEY || null,
        SNMP_COMMUNITY: process.env.SNMP_COMMUNITY || "public",
        SNMP_SERVER_IP: process.env.SNMP_SERVER_IP || "0.0.0.0/0",
        SNMP_OID: process.env.SNMP_OID || 65535
    }
} finally {
    logger.info("Config loaded!")
    global.CONFIG = CONFIG;

    logger.info("MIST_HOST     : " + global.CONFIG.MIST_HOST);
    logger.info("MIST_ORG_ID   : " + global.CONFIG.MIST_ORG_ID);
    logger.info("MONGO_HOST    : " + global.CONFIG.MONGO_HOST);
    logger.info("MONGO_DB      : " + global.CONFIG.MONGO_DB);
    logger.info("MONGO_USER    : " + global.CONFIG.MONGO_USER);
    logger.info("SNMP_COMMUNITY: " + global.CONFIG.SNMP_COMMUNITY);
    logger.info("SNMP_SERVER_IP: " + global.CONFIG.SNMP_SERVER_IP);
    logger.info("SNMP_OID      : " + global.CONFIG.SNMP_OID);
}

global.appPath = path.dirname(require.main.filename).replace(new RegExp('/bin$'), "");

/*================================================================
MONGO
================================================================*/
// retrieve mongodb parameters from config file
const db = mongoose.connection;

db.on('error', function() { logger.error('Unable to connect to mongoDB on ' + global.CONFIG.MONGO_HOST + ' server') });
db.once('open', function() {
    logger.info("Connected to mongoDB on " + global.CONFIG.MONGO_HOST + " server");
});

// connect to mongodb
var mongo_host = global.CONFIG.MONGO_HOST;
if (global.CONFIG.MONGO_USER && global.CONFIG.MONGO_PASSWORD) mongo_host = global.CONFIG.MONGO_USER + ":" + encodeURI(global.CONFIG.MONGO_PASSWORD) + "@" + mongo_host
mongoose.connect('mongodb://' + mongo_host + '/' + global.CONFIG.MONGO_DB + "?authSource=admin", { useNewUrlParser: true, useUnifiedTopology: true });

/*================================================================
 AGENTX
 ================================================================*/
// Default options
mist_snmp = new Agent(global.CONFIG.SNMP_COMMUNITY, global.SNMP_SERVER_IP, global.CONFIG.SNMP_OID)


/*================================================================
 CRON
 ================================================================*/
//setTimeout(() => {
sync(global.CONFIG.MIST_HOST, global.CONFIG.MIST_TOKEN, global.CONFIG.MIST_ORG_ID)
    // }, 1000)

cron.schedule('* * * * *', () => {
    console.log('running a task every minute');
});