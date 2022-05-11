const mongoose = require('mongoose');

const SiteSchema = new mongoose.Schema({
    index: Number,
    last_updated: Number,
    id: String,
    name: String,
    country_code: String,
    address: String,
    num_ap: { type: Number, default: 0 },
    num_ap_connected: { type: Number, default: 0 },
    num_switch: { type: Number, default: 0 },
    num_switch_connected: { type: Number, default: 0 },
    num_gateway: { type: Number, default: 0 },
    num_gateway_connected: { type: Number, default: 0 },
    num_devices: { type: Number, default: 0 },
    num_clients: { type: Number, default: 0 },
    num_devices_connected: { type: Number, default: 0 }
});


const Site = mongoose.model('Site', SiteSchema);
module.exports = Site;