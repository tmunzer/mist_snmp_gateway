const https = require('https');
const logger = require("./logger")

function generate_headers(mist) {
    var headers = {}
    if (mist.cookie) {
        headers = {}
        for (var i in mist.cookie) {
            cookie = mist.cookie[i].split(';')[0].split("=")
            if (cookie[0].startsWith("csrftoken")) {
                headers["X-CSRFToken"] = cookie[1]
            }
        }
        headers.cookie = mist.cookie
    } else if (mist.token) {
        headers.Authorization = "Token " + mist.token;
    }
    headers['Content-Type'] = 'application/json'

    return headers
}

/**
 * HTTP GET Request
 * @param {Object} mist - API credentials
 * @param {String} mist.host - Mist Cloud to request
 * @param {String} mist.token - Mist API Token
 * @param {String} mist.cookie - Mist Auth Cookies
 * @param {String} path - path to request the ACS endpoint
 *  */
module.exports.GET = function(mist, path, callback) {
    let rejectUnauthorized = true;

    const headers = generate_headers(mist)
    const options = {
        rejectUnauthorized: rejectUnauthorized,
        host: mist.host,
        port: 443,
        path: path,
        method: "GET",
        headers: headers
    };
    this.httpRequest(options, callback);
};
/**
 * HTTP POST Request
 * @param {Object} mist - API credentials
 * @param {String} mist.host - Mist Cloud to request
 * @param {String} mist.token - Mist API Token
 * @param {String} mist.cookie - Mist Auth Cookies
 * @param {String} path - path to request the ACS endpoint
 * @param {Object} data - data to include to the POST Request
 *  */
module.exports.POST = function(mist, path, data, callback) {
    let rejectUnauthorized = true;

    const headers = generate_headers(mist)
    const options = {
        rejectUnauthorized: rejectUnauthorized,
        host: mist.host,
        port: 443,
        path: path,
        method: "POST",
        headers: headers
    };
    const body = JSON.stringify(data);
    this.httpRequest(options, callback, body);
};
/**
 * HTTP PUT Request
 * @param {Object} mist - API credentials
 * @param {String} mist.host - Mist Cloud to request
 * @param {String} mist.token - Mist API Token
 * @param {String} mist.cookie - Mist Auth Cookies
 * @param {String} path - path to request the ACS endpoint
 * @param {Object} data - data to include to the POST Request
 *  */
module.exports.PUT = function(mist, path, callback) {
    let rejectUnauthorized = true;

    const headers = generate_headers(mist)
    const options = {
        rejectUnauthorized: rejectUnauthorized,
        host: mist.host,
        port: 443,
        path: path,
        method: "PUT",
        headers: headers
    };
    this.httpRequest(options, callback);
};
/**
 * HTTP DELETE Request
 * @param {Object} mist - API credentials
 * @param {String} mist.host - Mist Cloud to request
 * @param {String} mist.token - Mist API Token
 * @param {String} mist.cookie - Mist Auth Cookies
 * @param {String} path - path to request the ACS endpoint
 *  */
module.exports.DELETE = function(mist, path, callback) {
    let rejectUnauthorized = true;

    const headers = generate_headers(mist)
    const options = {
        rejectUnauthorized: rejectUnauthorized,
        host: mist.host,
        port: 443,
        path: path,
        method: "DELETE",
        headers: headers
    };
    this.httpRequest(options, callback);
};

/**
 * @param {Object} options - HTTP options
 * @param {function} callback(err, data)
 * */
module.exports.httpRequest = function(options, callback, body) {
    let result = {};
    result.request = {};
    result.result = {};

    result.request.options = options;
    const req = https.request(options, function(res) {
        result.result.status = res.statusCode;
        logger.info('REQUEST QUERY: ' + options.method + " " + options.path);
        logger.debug('REQUEST STATUS: ' + result.result.status);
        result.result.headers = JSON.stringify(res.headers);
        res.setEncoding('utf8');
        let data = '';
        res.on('data', function(chunk) {
            data += chunk;
        });
        res.on('end', function() {
            switch (result.result.status) {
                case 200:
                    if (data != '') {
                        if (data.length > 400) logger.debug("RESPONSE DATA: " + data.substr(0, 400) + '...');
                        else logger.debug("RESPONSE DATA: " + data);
                    }
                    var dataJSON = JSON.parse(data);
                    callback(null, dataJSON, result.result.headers);
                    break;
                case 404:
                    callback({ code: 404, error: "Not Found" })
                    break;
                default:
                    var dataJSON = JSON.parse(data);
                    if ("detail" in dataJSON) dataJSON = dataJSON.detail
                    logger.error("RESPONSE ERROR: " + data);
                    callback({ code: result.result.status, error: dataJSON });
                    break;

            }
        });
    });
    req.on('error', function(err) {
        logger.error("REQUEST QUERY: " + options.path);
        logger.error("REQUEST ERROR: " + JSON.stringify(err));
        callback(err, null);
    });


    // write data to request body
    req.write(body + '\n');
    req.end();
}