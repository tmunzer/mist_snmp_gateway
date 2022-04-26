const req = require("./req");

module.exports.sites = function(host, token, org_id, cb) {
    url = "https://" + host + "/api/v1/orgs/" + org_id + "/sites"
    resp = req.GET({ host: host, token: token }, url, (err, data) => cb(err, data))
}

module.exports.org = function(host, token, org_id, cb) {
    url = "https://" + host + "/api/v1/orgs/" + org_id
    resp = req.GET({ host: host, token: token }, url, (err, data) => cb(err, data))
}

module.exports.stats = function(host, token, org_id, cb) {
    url = "https://" + host + "/api/v1/orgs/" + org_id + "/stats"
    resp = req.GET({ host: host, token: token }, url, (err, data) => cb(err, data))
}