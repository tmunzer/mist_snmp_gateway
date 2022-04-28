const mongoose = require('mongoose');

const ApStatsSchema = new mongoose.Schema({
    index: Number,
    last_updated: Number,
    port_stat: {
        eth1: {
            up: Boolean,
            speed: Number,
            full_duplex: Boolean,
            tx_bytes: Number,
            tx_pkts: Number,
            rx_bytes: Number,
            rx_pkts: Number,
            rx_errors: Number,
            rx_peak_bps: Number,
            tx_peak_bps: Number
        },
        eth0: {
            up: Boolean,
            speed: Number,
            full_duplex: Boolean,
            tx_bytes: Number,
            tx_pkts: Number,
            rx_bytes: Number,
            rx_pkts: Number,
            rx_errors: Number,
            rx_peak_bps: Number,
            tx_peak_bps: Number
        }
    },
    lldp_stat: {
        system_name: String,
        system_desc: String,
        mgmt_addr: String,
        mgmt_addrs: [String],
        port_desc: String,
        port_id: String,
        chassis_id: String,
        lldp_med_supported: Boolean,
        power_request_count: Number,
        power_allocated: Number,
        power_requested: Number,
        power_draw: Number
    },
    ip_stat: {
        dns: [String],
        gateway: String,
        dhcp_server: String,
        ip6: String,
        netmask6: String,
        ip: String,
        netmask: String
    },
    l2tp_stat: {},
    radio_stat: {
        band_5: {
            num_clients: Number,
            channel: Number,
            bandwidth: Number,
            power: Number,
            tx_bytes: Number,
            tx_pkts: Number,
            rx_bytes: Number,
            rx_pkts: Number,
            noise_floor: Number,
            usage: String,
            util_all: Number,
            util_tx: Number,
            util_rx_in_bss: Number,
            util_rx_other_bss: Number,
            util_unknown_wifi: Number,
            util_non_wifi: Number,
            mac: String
        },
        band_24: {
            num_clients: Number,
            channel: Number,
            bandwidth: Number,
            power: Number,
            tx_bytes: Number,
            tx_pkts: Number,
            rx_bytes: Number,
            rx_pkts: Number,
            noise_floor: Number,
            usage: String,
            util_all: Number,
            util_tx: Number,
            util_rx_in_bss: Number,
            util_rx_other_bss: Number,
            util_unknown_wifi: Number,
            util_non_wifi: Number,
            mac: String
        },
        band_6: {
            num_clients: Number,
            channel: Number,
            bandwidth: Number,
            power: Number,
            tx_bytes: Number,
            tx_pkts: Number,
            rx_bytes: Number,
            rx_pkts: Number,
            noise_floor: Number,
            usage: String,
            util_all: Number,
            util_tx: Number,
            util_rx_in_bss: Number,
            util_rx_other_bss: Number,
            util_unknown_wifi: Number,
            util_non_wifi: Number,
            mac: String
        }
    },
    inactive_wired_vlans: [Number],
    config_reverted: Boolean,
    last_trouble: {
        code: String,
        timestamp: Number
    },
    fwupdate: {
        timestamp: Number,
        status: String,
        status_id: Number,
        progress: Number,
        will_retry: Boolean
    },
    tx_bps: Number,
    tx_pkts: Number,
    tx_bytes: Number,
    rx_bps: Number,
    rx_pkts: Number,
    rx_bytes: Number,
    power_budget: Number,
    power_src: String,
    cpu_system: Number,
    cpu_util: Number,
    uptime: Number,
    mem_total_kb: Number,
    mem_used_kb: Number,
    cpu_user: Number,
    ip: String,
    ext_ip: String,
    last_seen: Number,
    num_clients: { type: Number, default: 0 },
    version: String,
    mac: String,
    model: String,
    cert_expiry: Number,
    status: String,
    auto_upgrade_stat: {
        lastcheck: Number,
        scheduled: Boolean,
        scheduled_version: String,
        scheduled_time: Number
    },
    poe_passthrough: Boolean,
    id: String,
    name: String,
    site_id: String,
    org_id: String,
    created_time: Number,
    modified_time: Number,
    map_id: String,
    serial: String,
    hw_rev: String,
    type: String
});


const ApStats = mongoose.model('ApStats', ApStatsSchema);
module.exports = ApStats;