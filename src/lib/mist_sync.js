const logger = require("./logger");
const ApStatModel = require("./models/apStats");
const SiteModel = require("./models/sites");
const OrgModel = require("./models/org");
const Orgs = require("./orgs");
const Sites = require("./sites");
const Devices = require("./devices");


function process_ids(list_from_db, list_from_mist) {
    var ids_from_db = [];
    var ids_from_mist = [];
    list_from_db.forEach(obj => ids_from_db.push(obj.id));
    list_from_mist.forEach(obj => ids_from_mist.push(obj.id));
    const ids_to_add = ids_from_mist.filter(x => !ids_from_db.includes(x));
    const ids_to_update = ids_from_mist.filter(x => ids_from_db.includes(x));
    const ids_to_delete = ids_from_db.filter(x => !ids_from_mist.includes(x));
    return { ids_to_add: ids_to_add, ids_to_update: ids_to_update, ids_to_delete: ids_to_delete }
}


function saveDevicesStats(site, devices_from_mist, agent) {
    ApStatModel.find({ site_id: site.id })
        .sort({ index: -1 })
        .exec((err, devices_from_db) => {
            if (err) cb(err);
            var index = 0;
            if (devices_from_db.length > 0) index = devices_from_db[0].index;
            const ids_to_do = process_ids(devices_from_db, devices_from_mist)
            if (ids_to_do.ids_to_add.length > 0 || ids_to_do.ids_to_update.length > 0)
                devices_from_mist.forEach(device => {
                    if (ids_to_do.ids_to_add.includes(device.id)) {
                        index += 1;
                        device.index = index;
                        device.last_updated = Date.now()
                        ApStatModel(device).save((err, res) => {
                            if (err) logger.error(err);
                            else agent.add_ap(res)
                        })
                    } else if (ids_to_do.ids_to_update.includes(device.id)) {
                        device.last_updated = Date.now()
                        ApStatModel.findOneAndUpdate({ site_id: device.site_id, id: device.id }, device, (err, res) => {
                            if (err) logger.error(err);
                            else agent.update_ap(res)
                        })
                    }
                })
            else if (ids_to_do.ids_to_delete.length > 0)
                devices_from_db.forEach(device => {
                    if (ids_to_do.ids_to_delete.includes(device.id))
                        ApStatModel.findOneAndDelete({ site_id: device.site_id, id: device.id }, device, (err, res) => {
                            if (err) logger.error(err);
                            else agent.delete_ap(res)
                        })
                })
        })
}

function checkApStatModel(host, token, site, new_site, agent) {
    Devices.stats(host, token, site.id, "ap", (err, devices) => {
        if (err) logger.error(err);
        if (new_site) agent.add_site(site);
        else agent.update_site(site);
        saveDevicesStats(site, devices, agent)
    })
}


function siteStats(host, token, site_id, cb) {
    Sites.stats(host, token, site_id, (err, data) => {
        if (err) logger.error(err)
        else {
            const stats = {
                id: data.id,
                name: data.name,
                country_code: data.country_code,
                address: data.address,
                num_ap: data.num_ap,
                num_ap_connected: data.num_ap_connected,
                num_switch: data.num_switch,
                num_switch_connected: data.num_switch_connected,
                num_gateway: data.num_gateway,
                num_gateway_connected: data.num_gateway_connected,
                num_devices: data.num_devices,
                num_clients: data.num_clients,
                num_devices_connected: data.num_devices_connected
            }
            cb(stats);
        }
    })
}


function processSites(host, token, sites_from_mist, site_ids, agent) {
    SiteModel.find({})
        .sort({ index: -1 })
        .exec((err, sites_from_db) => {
            if (err) cb(err);
            var index = 0;
            if (sites_from_db.length > 0) index = sites_from_db[0].index;
            const ids_to_do = process_ids(sites_from_db, sites_from_mist)
            if (ids_to_do.ids_to_add.length > 0 || ids_to_do.ids_to_update.length > 0)
                sites_from_mist.forEach(site => {
                    if (site_ids.length == 0 || site_ids.includes(site.id)) {
                        if (ids_to_do.ids_to_add.includes(site.id)) {
                            siteStats(host, token, site.id, (stats) => {
                                index += 1;
                                stats.index = index;
                                stats.last_updated = Date.now();
                                SiteModel(stats).save((err, res) => {
                                    if (err) logger.error(err);
                                    else checkApStatModel(host, token, res, true, agent);
                                })
                            })
                        } else if (ids_to_do.ids_to_update.includes(site.id)) {
                            siteStats(host, token, site.id, (stats) => {
                                stats.last_updated = Date.now();
                                SiteModel.findOneAndUpdate({ id: site.id }, stats, (err, res) => {
                                    if (err) logger.error(err);
                                    else checkApStatModel(host, token, res, false, agent);
                                })
                            })
                        }
                    }
                })
            else if (ids_to_do.ids_to_delete.length > 0)
                sites_from_db.forEach(site => {
                    if (ids_to_do.ids_to_delete.includes(site.id))
                        SiteModel.findOneAndDelete({ site_id: site.id }, (err) => {
                            if (err) logger.error(err);
                            else agent.delete_ap(res)
                        })
                })
        })
}

function processOrg(host, token, org_id, agent) {
    var org = {
        id: org_id,
        name: "",
        stats: {}
    }
    Orgs.stats(host, token, org_id, (err, data) => {
        if (err) logger.error(err);
        else {
            org.stats = {
                last_updated: Date.now(),
                name: data.name,
                num_sites: data.num_sites,
                num_devices: data.num_devices,
                num_inventory: data.num_inventory,
                num_devices_connected: data.num_devices_connected,
                num_devices_disconnected: data.num_devices_disconnected,
                sle: {}
            }
            data.sle.forEach(sle => {
                switch (sle.path) {
                    case "coverage":
                        org.stats.sle.coverage = { total: sle.user_minutes.total, ok: sle.user_minutes.ok };
                        break;
                    case "roaming":
                        org.stats.sle.roaming = { total: sle.user_minutes.total, ok: sle.user_minutes.ok };
                        break;
                    case "Failed to Connect":
                        org.stats.sle.failed_to_connect = { total: sle.user_minutes.total, ok: sle.user_minutes.ok };
                        break;
                    case "Time to Connect":
                        org.stats.sle.time_to_connect = { total: sle.user_minutes.total, ok: sle.user_minutes.ok };
                        break;
                    case "ap-availability":
                        org.stats.sle.ap_availability = { total: sle.user_minutes.total, ok: sle.user_minutes.ok };
                        break;
                    case "throughput":
                        org.stats.sle.throughput = { total: sle.user_minutes.total, ok: sle.user_minutes.ok };
                        break;
                    case "capacity":
                        org.stats.sle.capacity = { total: sle.user_minutes.total, ok: sle.user_minutes.ok };
                        break;
                }
            })
            OrgModel.findOneAndUpdate({ id: org.id }, org, { upsert: true, setDefaultsOnInsert: true }, (err) => {
                if (err) logger.error(err);
                agent.update_org(org);
            });
        }
    })
}

const sync = async function(host, token, org_id, site_ids, agent) {
    processOrg(host, token, org_id, agent)
    Orgs.sites(host, token, org_id, (err, sites) => {
        if (err) logger.err(err)
        else if (sites && sites.length > 0) {
            processSites(host, token, sites, site_ids, agent);
        }
    })
}

module.exports = sync