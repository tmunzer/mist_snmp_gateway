const logger = require("./logger");
const SiteModel = require("./models/sites");
const OrgModel = require("./models/org");
const Orgs = require("./orgs");
const Sites = require("./sites");
const processIds = require("./common").processIds;
const SyncDevices = require("./mist_sync_devices");



function syncSiteDevices(host, token, site, agent) {
    // SyncDevices.ap(host, token, site, agent);
    // 
    SyncDevices.devices(host, token, site, agent);
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

async function _sync_sites(host, token, agent, sites_from_mist, site_ids, ids_to_do) {
    const timer = ms => new Promise(res => setTimeout(res, ms))
    const delay = 250;
    //sites_from_mist.forEach(site => {
    for (var index in sites_from_mist) {
        var site = sites_from_mist[index];
        if (site_ids.length == 0 || site_ids.includes(site.id)) {
            if (ids_to_do.ids_to_add.includes(site.id)) {
                siteStats(host, token, site.id, (stats) => {
                    index += 1;
                    stats.index = index;
                    stats.last_updated = Date.now();
                    SiteModel(stats).save((err, res) => {
                        if (err) logger.error(err);
                        else {
                            agent.add_site(stats);
                            syncSiteDevices(host, token, site, agent)
                        }
                    })
                })
            } else if (ids_to_do.ids_to_update.includes(site.id)) {
                siteStats(host, token, site.id, (stats) => {
                    stats.last_updated = Date.now();
                    SiteModel.findOneAndUpdate({ id: site.id }, stats, (err, res) => {
                        if (err) logger.error(err);
                        else {
                            agent.update_site(stats);
                            syncSiteDevices(host, token, site, agent)
                        }
                    })
                })
            }
        };
        await timer(delay);
    }
}

function processSites(host, token, sites_from_mist, site_ids, agent) {
    SiteModel.find({})
        .sort({ index: -1 })
        .exec((err, sites_from_db) => {
            if (err) cb(err);
            var index = 0;
            if (sites_from_db.length > 0) index = sites_from_db[0].index;
            const ids_to_do = processIds(sites_from_db, sites_from_mist)
            if (ids_to_do.ids_to_add.length > 0 || ids_to_do.ids_to_update.length > 0) {
                _sync_sites(host, token, agent, sites_from_mist, site_ids, ids_to_do)
            }
            if (ids_to_do.ids_to_delete.length > 0)
                sites_from_db.forEach(site => {
                    if (ids_to_do.ids_to_delete.includes(site.id))
                        SiteModel.findOneAndDelete({ site_id: site.id }, (err) => {
                            if (err) logger.error(err);
                            else agent.remove_site(res)
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
            org.name = data.name;
            org.stats = {
                last_updated: Date.now(),
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

const sync = async function (host, token, org_id, site_ids, agent) {
    processOrg(host, token, org_id, agent)
    Orgs.sites(host, token, org_id, (err, sites) => {
        if (err) logger.error(err)
        else if (sites && sites.length > 0) {
            setTimeout(() => {
                processSites(host, token, sites, site_ids, agent)
            },
                1000);
        }
    })
}

module.exports = sync