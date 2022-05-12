const logger = require("./logger");



function update_org(mib, org) {
    const sles = ["coverage", "failed_to_connect", "roaming", "time_to_connect", "throughput", "capacity"]
    var percent = {};
    sles.forEach(sle => {
        if (!org.stats.sle[sle]) {
            org.stats.sle[sle] = { total: 0, ok: 0 }
        }
        if (org.stats.sle[sle].total > 0) percent[sle] = (org.stats.sle[sle].ok / org.stats.sle[sle].total) * 100
        else percent[sle] = 0;
    })

    mib.setScalarValue('orgName', org.name)
    mib.setScalarValue('orgId', org.id)
    mib.setScalarValue('numSites', org.stats.num_sites)
    mib.setScalarValue('numDevices', org.stats.num_devices)
    mib.setScalarValue('numInventory', org.stats.num_inventory)
    mib.setScalarValue('numDevicesConnected', org.stats.num_devices_connected)
    mib.setScalarValue('numDevicesDisconnected', org.stats.num_devices_disconnected)

    mib.setScalarValue('sleCoverageTotal', org.stats.sle.coverage.total)
    mib.setScalarValue('sleCoverageOk', org.stats.sle.coverage.ok)
    mib.setScalarValue('sleCoveragePercent', percent.coverage)

    mib.setScalarValue('sleFailedToConnectTotal', org.stats.sle.failed_to_connect.total)
    mib.setScalarValue('sleFailedToConnectOk', org.stats.sle.failed_to_connect.ok)
    mib.setScalarValue('sleFailedToConnectPercent', percent.failed_to_connect)

    mib.setScalarValue('sleRoamingTotal', org.stats.sle.roaming.total)
    mib.setScalarValue('sleRoamingOk', org.stats.sle.roaming.ok)
    mib.setScalarValue('sleRoamingPercent', percent.roaming)

    mib.setScalarValue('sleTimeToConnectTotal', org.stats.sle.time_to_connect.total)
    mib.setScalarValue('sleTimeToConnectOk', org.stats.sle.time_to_connect.ok)
    mib.setScalarValue('sleTimeToConnectPercent', percent.time_to_connect)

    mib.setScalarValue('sleThroughputTotal', org.stats.sle.throughput.total)
    mib.setScalarValue('sleThroughputOk', org.stats.sle.throughput.ok)
    mib.setScalarValue('sleThroughputPercent', percent.throughput)

    mib.setScalarValue('sleCapacityTotal', org.stats.sle.capacity.total)
    mib.setScalarValue('sleCapacityOk', org.stats.sle.capacity.ok)
    mib.setScalarValue('sleCapacityPercent', percent.capacity)

}



module.exports.update = update_org;