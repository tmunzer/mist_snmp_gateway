const mongoose = require('mongoose');

const SwitchStatsSchema = new mongoose.Schema({
    index: Number,
    last_updated: Number,
    org_id: String,
    name: String,
    version: String,
    ip_stat: {
        netmask: String,
        ip: String,
        ips: { String: String },
        gateway: String
    },
    fwupdate: {
        timestamp: Number,
        status: String,
        status_id: Number,
        progress: Number,
        will_retry: Boolean
    },
    config_status: String,
    service_stat: {},
    mac: String,
    cpu_stat: {
        system: Number,
        idle: Number,
        interrupt: Number,
        user: Number,
        load_avg: [Number]
    },
    model: String,
    memory_stat: {
        usage: Number
    },
    type: String,
    site_id: String,
    uptime: Number,
    serial: String,
    dhcpd_stat: {},
    if_stat: { String: {} },
    config_version: Number,
    _ttl: Number,
    vc_setup_info: {
        config_type: String
    },
    module_stat: [{
        memory_stat: {
            usage: Number
        },
        vc_state: String,
        boot_partition: String,
        recovery_version: String,
        poe: {
            max_power: Number,
            power_draw: Number
        },
        backup_version: String,
        pending_version: String,
        _type: Number,
        cpu_stat: {
            interrupt: Number,
            idle: Number,
            user: Number,
            system: Number,
            load_avg: [Number]
        },
        version: String,
        fpc_idx: Number,
        mac: String,
        fans: [{
            name: String,
            status: String,
            airflow: String
        }],
        uptime: Number,
        _idx: Number,
        temperatures: [{ name: String, status: String, celsius: Number }],
        vc_links: [],
        serial: String,
        psus: [{ name: String, status: String }],
        vc_role: String,
        model: String,
        pics: [{ port_groups: [{ count: Number, _type: String }], index: Number }]
    }],
    _id: String,
    ip: String,
    last_seen: Number,
    status: String,
    auto_upgrade_stat: {},
    notes: String,
    ip_config: {
        _type: String,
        ip: String,
        netmask: String,
        network: String,
        gateway: String,
        dns: [String]
    },
    x: Number,
    y: Number,
    x_m: Number,
    y_m: Number,
    id: String,
    created_time: Number,
    modified_time: Number,
    map_id: String,
    hw_rev: String,
    tag_uuid: String,
    tag_id: Number,
    image1_url: String
});

SwitchStatsSchema.pre("save", function(next) {
    if (this.module_stat) this.module_stat.forEach(member => {
        if (member.type) {
            member._type = member.type;
            delete member.type;
        }
        if (member.pics) member.pics.forEach(pic => {
            if (pic.port_groups) pic.port_groups.forEach(port_group => {
                port_group._type = port_group.type;
                delete port_group.type;
            })
        })
    })
    if (this.ip_config && this.ip_config.type) {
        this.ip_config._type = this.ip_config.type;
        delete this.ip_config.type;
    }
    next();
});

const SwitchStats = mongoose.model('SwitchStats', SwitchStatsSchema);
module.exports = SwitchStats;