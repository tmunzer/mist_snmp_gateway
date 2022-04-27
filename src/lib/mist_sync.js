const logger = require("./logger");
const ApStatModel = require("./models/apStats");
const SiteModel = require("./models/sites");
const OrgModel = require("./models/org");
const Orgs = require("./orgs");
const Sites = require("./sites");
const Devices = require("./devices");


function saveDevicesStats(site, devices, agent) {
    if (devices && devices.length > 0) {
        ApStatModel.find({ site_id: site.id })
            .sort({ index: -1 })
            .exec((err, data) => {
                if (err) cb(err);
                else if (data.length == 0) {
                    var index = 0;
                    devices.forEach(device => {
                        index += 1;
                        device.index = index;
                        ApStatModel(device).save((err, res) => {
                            if (err) console.log(err);
                            else agent.add_ap(res)
                        })
                    })
                } else {
                    var index = data[0];
                    var device_ids_from_mist = [];
                    var device_ids_from_db = [];
                    devices.forEach(device => device_ids_from_mist.push(device.id));
                    data.forEach(device => device_ids_from_db.push(device.id));
                    const devices_to_add = device_ids_from_mist.filter(x => !device_ids_from_db.includes(x));
                    const devices_to_update = device_ids_from_mist.filter(x => device_ids_from_db.includes(x));
                    const devices_to_delete = device_ids_from_db.filter(x => !device_ids_from_mist.includes(x));
                    devices.forEach(device => {
                        if (devices_to_add.includes(device.id)) {
                            index += 1;
                            device.index = index;
                            ApStatModel(device).save((err, res) => {
                                if (err) console.log(err);
                                else agent.add_ap(res)
                            })
                        } else if (devices_to_update.includes(device.id)) {
                            ApStatModel.findOneAndUpdate({ site_id: device.site_id, id: device.id }, device, (err, res) => {
                                if (err) console.log(err);
                                else agent.update_ap(res)
                            })
                        } else if (devices_to_delete.includes(device.id)) {
                            ApStatModel.findOneAndDelete({ site_id: device.site_id, id: device.id }, device, (err, res) => {
                                if (err) console.log(err);
                                else agent.delete_ap(res)
                            })
                        } else {
                            logger.error("Unknown AP:")
                            console.log(device)
                        }
                    })
                }
            })
    }
}

function checkApStatModel(host, token, site, new_site, agent) {
    Devices.stats(host, token, site.id, "ap", (err, devices) => {
        if (err) console.log(err);
        if (new_site) agent.add_site(site);
        else agent.update_site(site);
        saveDevicesStats(site, devices, agent)
    })
}


function siteStats(host, token, site_id, cb) {
    Sites.stats(host, token, site_id, (err, data) => {
        if (err) console.log(err)
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


function processSites(host, token, sites, agent) {
    SiteModel.find({})
        .sort({ index: -1 })
        .exec((err, data) => {
            var index = 0;
            if (data.length > 0) index = data.index;
            sites.forEach(site => {
                siteStats(host, token, site.id, (stats) => {
                    SiteModel.findOne({ id: site.id }, (err, data) => {
                        if (err) console.log(err);
                        else if (data) SiteModel.findOneAndUpdate({ _id: data._id }, stats, (err, res) => {
                            if (err) console.log(err);
                            else {
                                checkApStatModel(host, token, res, false, agent);
                            }
                        })
                        else {
                            index += 1;
                            stats.index = index
                            SiteModel(stats).save((err, res) => {
                                if (err) console.log(err);
                                else {
                                    checkApStatModel(host, token, res, true, agent);
                                }
                            })
                        }
                    })
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
    Orgs.org(host, token, org_id, (err, data) => {
        if (err) console.log(err);
        else {
            org.name = data.name;
            Orgs.stats(host, token, org_id, (err, data) => {
                if (err) console.log(err);
                else {
                    org.stats = {
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
                        if (err) console.log(err);
                        agent.update_org(org);
                    });
                }
            })
        }
    })
}

const sync = async function(host, token, org_id, agent) {
    processOrg(host, token, org_id, agent)
    Orgs.sites(host, token, org_id, (err, sites) => {
        if (err) logger.err(err)
        else if (sites && sites.length > 0) {
            processSites(host, token, sites, agent);
        }
    })
}

module.exports = sync