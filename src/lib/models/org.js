const mongoose = require('mongoose');

const OrgSchema = new mongoose.Schema({
    id: String,
    name: String,
    stats: {
        num_sites: Number,
        num_devices: Number,
        num_inventory: Number,
        num_devices_connected: Number,
        num_devices_disconnected: Number,
        sle: {
            coverage: { total: Number, ok: Number },
            failed_to_connect: { total: Number, ok: Number },
            roaming: { total: Number, ok: Number },
            time_to_connect: { total: Number, ok: Number },
            ap_availability: { total: Number, ok: Number },
            throughput: { total: Number, ok: Number },
            capacity: { total: Number, ok: Number }
        }
    }
});


const Org = mongoose.model('Org', OrgSchema);
module.exports = Org;