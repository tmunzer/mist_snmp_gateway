const req = require("./req");

module.exports.stats = function(host, token, site_id, device_type = "ap", cb) {
    url = "https://" + host + "/api/v1/sites/" + site_id + "/stats/devices?type=" + device_type;
    resp = req.GET({ host: host, token: token }, url, (err, data) => cb(err, data))
}
module.exports.list = function(host, token, site_id, device_type = "ap", cb) {
    url = "https://" + host + "/api/v1/sites/" + site_id + "/devices?type=" + device_type;
    resp = req.GET({ host: host, token: token }, url, (err, data) => cb(err, data))
}