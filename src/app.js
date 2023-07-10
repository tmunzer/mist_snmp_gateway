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
        MIST_SITE_IDS: process.env.MIST_SITE_IDS || "",
        MIST_SYNC_TIME: process.env.MIST_SYNC_TIME || 15,
        MONGO_HOST: process.env.MONGO_HOST || null,
        MONGO_DB: process.env.MONGO_DB || "snmp",
        MONGO_USER: process.env.MONGO_USER || null,
        MONGO_PASSWORD: process.env.MONGO_PASSWORD || null,
        MONGO_ENC_KEY: process.env.MONGO_ENC_KEY || null,
        MONGO_SIG_KEY: process.env.MONGO_SIG_KEY || null,
        SNMP_VERSION: process.env.SNMP_VERSION || 2,
        SNMP_V2C_COMMUNITY: process.env.SNMP_V2C_COMMUNITY || "public",
        SNMP_V3_USER: process.env.SNMP_V3_USER || null,
        SNMP_V3_AUTH_PROTOCOL: process.env.SNMP_V3_AUTH_PROTOCOL || "SHA",
        SNMP_V3_AUTH_KEY: process.env.SNMP_V3_AUTH_KEY || null,
        SNMP_V3_PRIV_PROTOCOL: process.env.SNMP_V3_PRIV_PROTOCOL || "AES",
        SNMP_V3_PRIV_KEY: process.env.SNMP_V3_PRIV_KEY || null,
        SNMP_LISTENING_IP: process.env.SNMP_LISTENING_IP || null,
        SNMP_OID: process.env.SNMP_OID || 65535
    }
} finally {
    global.CONFIG = CONFIG;
    if (global.CONFIG.MIST_SITE_IDS) global.CONFIG.MIST_SITE_IDS = global.CONFIG.MIST_SITE_IDS.split(",")

    logger.info("----------------------------------------------------------------------")
    logger.info("                               CONFIG")
    logger.info("MIST_HOST            : " + global.CONFIG.MIST_HOST);
    logger.info("MIST_ORG_ID          : " + global.CONFIG.MIST_ORG_ID);
    logger.info("MIST_SITE_IDS        : " + global.CONFIG.MIST_SITE_IDS);
    logger.info("MIST_SYNC_TIME       : " + global.CONFIG.MIST_SYNC_TIME);
    logger.info("MONGO_HOST           : " + global.CONFIG.MONGO_HOST);
    logger.info("MONGO_DB             : " + global.CONFIG.MONGO_DB);
    logger.info("MONGO_USER           : " + global.CONFIG.MONGO_USER);
    logger.info("SNMP_VERSION         : " + global.CONFIG.SNMP_VERSION);
    if (global.CONFIG.SNMP_VERSION == 2) logger.info("SNMP_V2C_COMMUNITY   : " + global.CONFIG.SNMP_V2C_COMMUNITY);
    else if (global.CONFIG.SNMP_VERSION == 3) {
        logger.info("SNMP_V3_USER         : " + global.CONFIG.SNMP_V3_USER);
        logger.info("SNMP_V3_AUTH_PROTOCOL: " + global.CONFIG.SNMP_V3_AUTH_PROTOCOL);
        logger.info("SNMP_V3_PRIV_PROTOCOL: " + global.CONFIG.SNMP_V3_PRIV_PROTOCOL);
    }
    logger.info("SNMP_LISTENING_IP    : " + global.CONFIG.SNMP_LISTENING_IP);
    logger.info("SNMP_OID             : " + global.CONFIG.SNMP_OID);
    logger.info("----------------------------------------------------------------------")
}

global.appPath = path.dirname(require.main.filename).replace(new RegExp('/bin$'), "");

/*================================================================
MONGO
================================================================*/
// retrieve mongodb parameters from config file
const db = mongoose.connection;

db.on('error', function () { logger.error('Unable to connect to mongoDB on ' + global.CONFIG.MONGO_HOST + ' server') });
db.once('open', function () {
    logger.info("Connected to mongoDB on " + global.CONFIG.MONGO_HOST + " server");
});

// connect to mongodb
var mongo_host = global.CONFIG.MONGO_HOST;
if (global.CONFIG.MONGO_USER && global.CONFIG.MONGO_PASSWORD) mongo_host = global.CONFIG.MONGO_USER + ":" + encodeURI(global.CONFIG.MONGO_PASSWORD) + "@" + mongo_host
mongoose.set('strictQuery', true);
mongoose.connect('mongodb://' + mongo_host + '/' + global.CONFIG.MONGO_DB + "?authSource=admin", { useNewUrlParser: true, useUnifiedTopology: true });

/*================================================================
 AGENTX
 ================================================================*/
// Default options
mist_snmp = new Agent(
    global.CONFIG.SNMP_VERSION,
    global.CONFIG.SNMP_V2C_COMMUNITY,
    global.CONFIG.SNMP_V3_USER,
    global.CONFIG.SNMP_V3_AUTH_PROTOCOL,
    global.CONFIG.SNMP_V3_AUTH_KEY,
    global.CONFIG.SNMP_V3_PRIV_PROTOCOL,
    global.CONFIG.SNMP_V3_PRIV_KEY,
    global.CONFIG.SNMP_LISTENING_IP,
    global.CONFIG.SNMP_OID
)

/*================================================================
 CRON
 ================================================================*/
setTimeout(() => {
    sync(global.CONFIG.MIST_HOST, global.CONFIG.MIST_TOKEN, global.CONFIG.MIST_ORG_ID, global.CONFIG.MIST_SITE_IDS, mist_snmp)
}, 1000)

cron.schedule('*/' + global.CONFIG.MIST_SYNC_TIME + ' * * * *', () => {
    console.log('running a task ' + global.CONFIG.MIST_SYNC_TIME + ' minute(s)');
    sync(global.CONFIG.MIST_HOST, global.CONFIG.MIST_TOKEN, global.CONFIG.MIST_ORG_ID, global.CONFIG.MIST_SITE_IDS, mist_snmp)
});