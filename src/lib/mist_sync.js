const logger = require("./logger");
const ApStats = require("./models/apStats");
const Sites = require("./models/sites");
const Orgs = require("./orgs");
const Devices = require("./devices");
const Site = require("./models/sites");


function saveDevicesStats(site_id, devices, cb) {
    if (devices && devices.length > 0) {
        ApStats.find({ site_id: site_id })
            .sort({ index: -1 })
            .exec((err, data) => {
                if (err) cb(err);
                else if (data.length == 0) {
                    var index = 0;
                    var done = 0;
                    devices.forEach(device => {
                        index += 1;
                        device.index = index;
                        ApStats(device).save(err => {
                            done += 1;
                            if (err) console.log(err);
                            if (done == devices.length) cb();
                        })
                    })
                } else {
                    var index = data[0];
                    var device_ids_from_mist = [];
                    var device_ids_from_db = [];
                    var done = 0;
                    devices.forEach(device => device_ids_from_mist.push(device.id));
                    data.forEach(device => device_ids_from_db.push(device.id));
                    const devices_to_add = device_ids_from_mist.filter(x => !device_ids_from_db.includes(x));
                    const devices_to_update = device_ids_from_mist.filter(x => device_ids_from_db.includes(x));
                    const devices_to_delete = device_ids_from_db.filter(x => !device_ids_from_mist.includes(x));
                    devices.forEach(device => {
                        if (devices_to_add.includes(device.id)) {
                            index += 1;
                            device.index = index;
                            ApStats(device).save(err => {
                                done += 1;
                                if (err) console.log(err);
                                if (done == devices.length) cb();
                            })
                        } else if (devices_to_update.includes(device.id)) {
                            ApStats.findOneAndUpdate({ id: device.site_id, id: device.id }, device, (err) => {
                                done += 1;
                                if (err) console.log(err);
                                if (done == devices.length) cb();
                            })
                        } else if (devices_to_delete.includes(device.id)) {
                            ApStats.findOneAndDelete({ id: device.site_id, id: device.id }, device, (err) => {
                                done += 1;
                                if (err) console.log(err);
                                if (done == devices.length) cb();
                            })
                        } else {
                            logger.error("Unknown AP:")
                            console.log(device)
                            done += 1;
                            if (done == devices.length) cb();
                        }
                    })
                }
            })
    }
}

function getDevicesStats(host, token, site_id) {
    return new Promise((res, rej) =>
        Devices.stats(host, token, site_id, "ap", (err, devices) => {
            if (err) {
                console.log(err);
                rej()
            } else saveDevicesStats(site_id, devices, (err) => {
                if (err) {
                    console.log(err);
                    rej()
                } else res(site_id)
            })
        })
    )
}

const checkApStats = async function(host, token, sites) {
    var allPromises = [];
    sites.forEach(site => {
        console.log(site.id)
        const promise = new Promise((res, rej) =>
            getDevicesStats(host, token, site.id)
            .then(() => { res(site.id) }) // succeed
            .catch(err => { res(null) }) // failed
        )
        allPromises.push(promise);
    })
    let results = await Promise.all(allPromises);
    results = results.map(r => r !== null);
    console.log("all done")
}

function saveSites(sites) {
    Site.find({})
        .sort({ index: -1 })
        .exec((err, data) => {
            var index = 0;
            if (data.length > 0) index = data.index;
            sites.forEach(site => {
                Site.findOne({ id: site.id }, (err, data) => {
                    if (err) console.log(err);
                    else if (data) Site.findOneAndUpdate({ _id: data._id }, { name: site.name }, (err, res) => {
                        if (err) console.log(err)
                    })
                    else {
                        index += 1;
                        Site({ index: index, id: site.id, name: site.name }).save(err => {
                            if (err) console.log(err)
                        })
                    }
                })
            })
        })
}

const sync = async function(host, token, org_id) {
    Orgs.sites(host, token, org_id, (err, sites) => {
        if (err) logger.err(err)
        else if (sites && sites.length > 0) {
            saveSites(sites);
            checkApStats(host, token, sites);
        }
    })
}

module.exports = sync