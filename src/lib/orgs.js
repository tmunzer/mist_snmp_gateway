const req = require("./req");

module.exports.sites = function(host, token, org_id, cb) {
    url = "https://" + host + "/api/v1/orgs/" + org_id + "/sites"
    resp = req.GET({ host: host, token: token }, url, (err, data) => cb(err, data))
}