const logger = require("./logger");
const ApStatModel = require("./models/apStats");
const SwitchStatModel = require("./models/switchStats");
const Devices = require("./devices");
const processIds = require("./common").processIds;


function saveDevicesStats(site, devices_from_mist, device_type, model, agent) {
    model.find({ site_id: site.id })
        .sort({ index: -1 })
        .exec((err, devices_from_db) => {
            if (err) cb(err);
            var index = 0;
            if (devices_from_db.length > 0) index = devices_from_db[0].index;
            const ids_to_do = processIds(devices_from_db, devices_from_mist)
            if (ids_to_do.ids_to_add.length > 0 || ids_to_do.ids_to_update.length > 0)
                devices_from_mist.forEach(device => {
                    if (ids_to_do.ids_to_add.includes(device.id)) {
                        index += 1;
                        device.index = index;
                        device.last_updated = Date.now()
                        model(device).save((err, res) => {
                            if (err) logger.error(err);
                            else agent.router(device_type, "add", res)
                        })
                    } else if (ids_to_do.ids_to_update.includes(device.id)) {
                        device.last_updated = Date.now()
                        model.findOneAndUpdate({ site_id: device.site_id, id: device.id }, device, (err, res) => {
                            if (err) logger.error(err);
                            else agent.router(device_type, "update", res)
                        })
                    }
                })
            else if (ids_to_do.ids_to_delete.length > 0)
                devices_from_db.forEach(device => {
                    if (ids_to_do.ids_to_delete.includes(device.id)) {
                        console.log(device)
                        model.findOneAndDelete({ site_id: device.site_id, id: device.id }, device, (err, res) => {
                            if (err) logger.error(err);
                            else agent.router(device_type, "remove", device)
                        })
                    }
                })
        })
}

module.exports.ap = function(host, token, site, agent) {
    Devices.stats(host, token, site.id, "ap", (err, devices) => {
        if (err) logger.error(err);
        saveDevicesStats(site, devices, "ap", ApStatModel, agent)
    })
}

module.exports.switch = function(host, token, site, agent) {
    Devices.stats(host, token, site.id, "switch", (err, devices) => {
        if (err) logger.error(err);
        saveDevicesStats(site, devices, "switch", SwitchStatModel, agent)
    })
}