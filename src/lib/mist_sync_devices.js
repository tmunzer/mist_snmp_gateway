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
                        device.last_updated = Date.now();
                        device._id = device.mac;
                        model(device).save((err, res) => {
                            if (err) logger.error(err);
                            else agent.router(device_type, "add", res)
                        })
                    } else if (ids_to_do.ids_to_update.includes(device.id)) {
                        device.last_updated = Date.now()
                        model.findOneAndUpdate({ site_id: device.site_id, id: device.id }, device, (err, res) => {
                            if (err) logger.error(err);
                            else agent.router(device_type, "update", res);
                        })
                    }
                })
            if (ids_to_do.ids_to_delete.length > 0)
                devices_from_db.forEach(device => {
                    if (ids_to_do.ids_to_delete.includes(device.id)) {
                        model.findOneAndDelete({ site_id: device.site_id, id: device.id }, device, (err, res) => {
                            if (err) logger.error(err);
                            else agent.router(device_type, "remove", device);
                        })
                    }
                })
        })
}

module.exports.devices = function (host, token, site, agent) {
    Devices.stats(host, token, site.id, "all", (err, devices) => {
        if (err) logger.error(err);
        if (Array.isArray(devices) && devices.length > 0) {
            const aps = devices.filter((device) => { return device.type == "ap" })
            const switches = devices.filter((device) => { return device.type == "switch" })
            if (aps.length > 0) saveDevicesStats(site, aps, "ap", ApStatModel, agent)
            if (switches.length > 0) saveDevicesStats(site, switches, "switch", SwitchStatModel, agent)
        }
    })
}