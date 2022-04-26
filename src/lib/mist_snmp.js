const snmp = require('net-snmp');
const Sites = require("./models/sites");
const ApStats = require("./models/apStats");


class Agent {

    constructor(communicty, listening_ip, enterprise_oid) {
        this.enterprise_oid = enterprise_oid;

        const options = {
            port: 161,
            retries: 1,
            timeout: 5000,
            backoff: 1.0,
            transport: "udp4",
            trapPort: 162,
            version: snmp.Version2c,
            backwardsGetNexts: true,
            idBitsSize: 32,
        };
        var store = snmp.createModuleStore();
        store.loadFromFile("./mibs/SNMPv2.mib");
        store.loadFromFile("./mibs/SNMPv2-TC.mib");
        store.loadFromFile("./mibs/MISTLAB.mib");
        var jsonModule = store.getModule("MISTLAB-MIB");

        // Fetch MIB providers, create an agent, and register the providers with your agent
        var providers = store.getProvidersForModule("MISTLAB-MIB");
        // Not recommended - but authorization and callback turned off for example brevity
        //this.agent = snmp.createAgent({ disableAuthorization: true }, function(error, data) {});
        this.agent = snmp.createAgent(options, function(err, data) {
            if (err) console.log(err)
            console.info(new Date(), 'SNMP Agent sent a response for the oid ' + data.pdu.varbinds[0].oid + ' from ' + data.rinfo.address);
        });
        this.authorizer = this.agent.getAuthorizer();
        this.authorizer.addCommunity(communicty)
        this.mib = this.agent.getMib();
        this.mib.registerProviders(providers);
        this.load();
    }


    update_org(org) {
        this.mib.setScalarValue('orgName', org.name)
        this.mib.setScalarValue('orgId', org.id)
        this.mib.setScalarValue('numSites', org.stats.num_sites)
        this.mib.setScalarValue('numDevices', org.stats.num_devices)
        this.mib.setScalarValue('numInventory', org.stats.num_inventory)
        this.mib.setScalarValue('numDevicesConnected', org.stats.num_devices_connected)
        this.mib.setScalarValue('numDevicesDisconnected', org.stats.num_devices_disconnected)
        this.mib.setScalarValue('sleCoverageTotal', org.stats.sle.coverage.total)
        this.mib.setScalarValue('sleCoverageOk', org.stats.sle.coverage.ok)
        this.mib.setScalarValue('sleFailedToConnectTotal', org.stats.sle.failed_to_connect.total)
        this.mib.setScalarValue('sleFailedToConnectOk', org.stats.sle.failed_to_connect.ok)
            //this.mib.setScalarValue('sleRoamingTotal', org.stats.sle.roaming.total)
            //this.mib.setScalarValue('sleRoamingOk', org.stats.sle.roaming.ok)
        this.mib.setScalarValue('sleTimeToConnectTotal', org.stats.sle.time_to_connect.total)
        this.mib.setScalarValue('sleTimeToConnectOk', org.stats.sle.time_to_connect.ok)
        this.mib.setScalarValue('sleThroughputTotal', org.stats.sle.throughput.total)
        this.mib.setScalarValue('sleThroughputOk', org.stats.sle.throughput.ok)
        this.mib.setScalarValue('sleCapacityTotal', org.stats.sle.capacity.total)
        this.mib.setScalarValue('sleCapacityOk', org.stats.sle.capacity.ok)
        this.mib.getScalarValue('orgName')

    }

    add_site(site) {
        this.mib.addTableRow('siteEntry', [site.index, site.id, site.name, site.country_code, site.address, site.num_ap, site.num_ap_connected, site.num_switch, site.num_switch_connected, site.num_gateway, site.num_gateway_connected, site.num_devices, site.num_clients, site.num_devices_connected]);
    }
    delete_site(site) {
        this.mib.deleteTableRow('siteEntry', [site.index]);
    }
    update_site(site) {
        this.delete_site(site);
        this.add_site(site);
    }

    add_ap_stats(site_index, ap) {
        var status = 0;
        if (ap.status == "connected") status = 1;
        var name = ap.mac;
        if (ap.name) name = ap.name;
        this.mib.addTableRow('apStatsEntry', [site_index, ap.index, ap.mac, name, status, ap.last_seen, ap.uptime, ap.model, ap.hw_rev, ap.serial, ap.ip, ap.ext_ip, ap.num_clients]);
    }
    delete_ap_stats(site_index, ap) {
        this.mib.deleteTableRow('apStatsEntry', [site_index, ap.index]);
    }
    update_ap_stats(site_index, ap) {
        this.delete_ap_stats(site_index, ap);
        this.add_ap_stats(site_index, ap);
    }

    load() {
        Sites.find({})
            .sort({ index: 1 })
            .exec((err, sites) => {
                sites.forEach(site => {
                    ApStats.find({ site_id: site.id })
                        .sort({ index: 1 })
                        .exec((err, aps) => {
                            //if (aps.length > 0) 
                            this.add_site(site);
                            // aps.forEach(ap => {
                            //     this.add_ap_stats(site.index, ap)
                            // })
                        })
                })
            })
    }
}

module.exports.Agent = Agent;