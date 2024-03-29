const logger = require("./logger");

function add_site(mib, site) {
    logger.debug(
        'siteEntry',
        site.id,
        site.name,
        site.country_code,
        site.address,
        site.num_ap,
        site.num_ap_connected,
        site.num_switch,
        site.num_switch_connected,
        site.num_gateway,
        site.num_gateway_connected,
        site.num_devices,
        site.num_devices_connected,
        site.num_clients)
    mib.addTableRow('siteEntry', [
        site.id,
        site.name,
        site.country_code,
        site.address,
        site.num_ap,
        site.num_ap_connected,
        site.num_switch,
        site.num_switch_connected,
        site.num_gateway,
        site.num_gateway_connected,
        site.num_devices,
        site.num_devices_connected,
        site.num_clients
    ]);
}

function remove_site(mib, site) {
    try {
        mib.deleteTableRow('siteEntry', [site.id]);
    } catch {
        logger.warning("Unable to delete site index " + site.index + " from MIB")
    }
}

function update_site(mib, site) {
    remove_site(mib, site);
    add_site(mib, site);
}


module.exports.add = add_site;
module.exports.update = update_site;
module.exports.remove = remove_site;