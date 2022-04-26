const mongoose = require('mongoose');

const SiteSchema = new mongoose.Schema({
    index: Number,
    id: String,
    name: String,
    country_code: String,
    address: String,
    num_ap: Number,
    num_ap_connected: Number,
    num_switch: Number,
    num_switch_connected: Number,
    num_gateway: Number,
    num_gateway_connected: Number,
    num_devices: Number,
    num_clients: Number,
    num_devices_connected: Number
});


const Site = mongoose.model('Site', SiteSchema);
module.exports = Site;