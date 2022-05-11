const logger = require("./logger");



function update_org(mib, org) {
    if (!org.stats.sle.coverage) org.stats.sle.coverage = { total: -1, ok: -1 }
    if (!org.stats.sle.failed_to_connect) org.stats.sle.failed_to_connect = { total: -1, ok: -1 }
    if (!org.stats.sle.roaming) org.stats.sle.roaming = { total: -1, ok: -1 }
    if (!org.stats.sle.time_to_connect) org.stats.sle.time_to_connect = { total: -1, ok: -1 }
    if (!org.stats.sle.throughput) org.stats.sle.throughput = { total: -1, ok: -1 }
    if (!org.stats.sle.capacity) org.stats.sle.capacity = { total: -1, ok: -1 }

    mib.setScalarValue('orgName', org.name)
    mib.setScalarValue('orgId', org.id)
    mib.setScalarValue('numSites', org.stats.num_sites)
    mib.setScalarValue('numDevices', org.stats.num_devices)
    mib.setScalarValue('numInventory', org.stats.num_inventory)
    mib.setScalarValue('numDevicesConnected', org.stats.num_devices_connected)
    mib.setScalarValue('numDevicesDisconnected', org.stats.num_devices_disconnected)
    mib.setScalarValue('sleCoverageTotal', org.stats.sle.coverage.total)
    mib.setScalarValue('sleCoverageOk', org.stats.sle.coverage.ok)
    mib.setScalarValue('sleFailedToConnectTotal', org.stats.sle.failed_to_connect.total)
    mib.setScalarValue('sleFailedToConnectOk', org.stats.sle.failed_to_connect.ok)
    mib.setScalarValue('sleRoamingTotal', org.stats.sle.roaming.total)
    mib.setScalarValue('sleRoamingOk', org.stats.sle.roaming.ok)
    mib.setScalarValue('sleTimeToConnectTotal', org.stats.sle.time_to_connect.total)
    mib.setScalarValue('sleTimeToConnectOk', org.stats.sle.time_to_connect.ok)
    mib.setScalarValue('sleThroughputTotal', org.stats.sle.throughput.total)
    mib.setScalarValue('sleThroughputOk', org.stats.sle.throughput.ok)
    mib.setScalarValue('sleCapacityTotal', org.stats.sle.capacity.total)
    mib.setScalarValue('sleCapacityOk', org.stats.sle.capacity.ok)
    mib.getScalarValue('orgName')

}



module.exports.update = update_org;