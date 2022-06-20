const logger = require("./logger");


function add_ap(mib, ap) {
    add_ap_stats(mib, ap);
    add_ap_eth(mib, ap);
}

function remove_ap(mib, ap) {
    remove_ap_stats(mib, ap);
    remove_ap_eth(mib, ap);
}


function update_ap(mib, ap) {
    remove_ap(mib, ap);
    add_ap(mib, ap);
}


function add_ap_stats(mib, ap) {
    var status = 1;
    if (ap.status == "connected") status = 2;
    var name = ap.mac;
    if (ap.name) name = ap.name;
    var lldp_med = 1;
    if (ap.lldp_stat.lldp_med_supported) lldp_med = 2;
    if (ap.last_seen) {
        mib.addTableRow('apStatsEntry', [
            ap.site_id,
            ap.mac,
            name,
            status,
            ap.last_seen,
            ap.uptime,
            ap.model,
            ap.hw_rev,
            ap.serial,
            ap.ip,
            ap.ext_ip,
            ap.num_clients,
            ap.lldp_stat.system_name,
            ap.lldp_stat.system_desc,
            ap.lldp_stat.port_id,
            ap.lldp_stat.port_desc,
            ap.lldp_stat.chassis_id,
            lldp_med,
            ap.lldp_stat.power_requested,
            ap.lldp_stat.power_allocated,
            ap.lldp_stat.power_draw
        ]);
    }
}


function remove_ap_stats(mib, ap) {
    try {
        mib.deleteTableRow('apStatsEntry', [ap.site_id, ap.mac]);
    } catch (error) {
        logger.warning("Unable to delete ap index " + ap.site_id + "." + ap.mac + " from MIB")
    }
}


function add_ap_eth(mib, ap) {
    for (const [key, value] of Object.entries(ap.port_stat)) {
        var status = 1;
        if (value.up) status = 2;
        var speed = 1;
        switch (value.speed) {
            case 10:
                speed = 2;
                break;
            case 100:
                speed = 3;
                break;
            case 1000:
                speed = 4;
                break;
            case 2500:
                speed = 5;
                break;
            case 5000:
                speed = 6;
                break;
        }
        var duplex = 1;
        if (value.full_duplex) duplex = 2;
        mib.addTableRow('apEthEntry', [ap.site_id, ap.mac, key, status, speed, duplex]);
    }
}

function remove_ap_eth(mib, ap) {
    for (const [key, value] of Object.entries(ap.port_stat)) {
        try {
            mib.deleteTableRow('apEthEntry', [ap.site_id, ap.mac, key]);
        } catch (error) {
            logger.warning("Unable to delete ap interface " + ap.site_id + "." + ap.mac + "." + key + " from MIB")
        }
    }
}


module.exports.add = add_ap;
module.exports.remove = remove_ap;
module.exports.update = update_ap;