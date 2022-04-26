const req = require("./req");


module.exports.stats = function(host, token, site_id, cb) {
    url = "https://" + host + "/api/v1/sites/" + site_id + "/stats"
    resp = req.GET({ host: host, token: token }, url, (err, data) => cb(err, data))
}