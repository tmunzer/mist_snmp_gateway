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
        this.mib.addTableRow('siteEntry', [site.id, site.name, site.country_code, site.address, site.num_ap, site.num_ap_connected, site.num_switch, site.num_switch_connected, site.num_gateway, site.num_gateway_connected, site.num_devices, site.num_clients, site.num_devices_connected]);
    }
    delete_site(site) {
        try {
            this.mib.deleteTableRow('siteEntry', [site.id]);
        } catch {
            console.log("Unable to delete site index " + site.index + " from MIB")
        }
    }
    update_site(site) {
        this.delete_site(site);
        this.add_site(site);
    }

    add_ap(ap) {
        this.add_ap_stats(ap);
        this.add_ap_eth(ap);
    }
    delete_ap(ap) {
        this.delete_ap_stats(ap);
        this.delete_ap_eth(ap);
    }
    update_ap(ap) {
        this.delete_ap(ap);
        this.add_ap(ap);
    }

    add_ap_stats(ap) {
        var status = 1;
        if (ap.status == "connected") status = 2;
        var name = ap.mac;
        if (ap.name) name = ap.name;
        var lldp_med = 1;
        if (ap.lldp_stat.lldp_med_supported) lldp_med = 2;
        this.mib.addTableRow('apStatsEntry', [
            ap.site_id,
            ap.mac,
            name,
            status,
            ap.last_seen,
            ap.uptime,
            ap.model,
            ap.hw_rev,
            ap.serial,
            ap.ip,
            ap.ext_ip,
            ap.num_clients,
            ap.lldp_stat.system_name,
            ap.lldp_stat.system_desc,
            ap.lldp_stat.port_id,
            ap.lldp_stat.port_desc,
            ap.lldp_stat.chassis_id,
            lldp_med,
            ap.lldp_stat.power_requested,
            ap.lldp_stat.power_allocated,
            ap.lldp_stat.power_draw
        ]);
    }
    delete_ap_stats(ap) {
        try {
            this.mib.deleteTableRow('apStatsEntry', [ap.site_id, ap.mac]);
        } catch (error) {
            console.log("Unable to delete ap index " + ap.site_id + "." + ap.mac + " from MIB")
        }
    }

    add_ap_eth(ap) {
        for (const [key, value] of Object.entries(ap.port_stat)) {
            var status = 1;
            if (value.up) status = 2;
            var speed = 1;
            switch (value.speed) {
                case 10:
                    speed = 2;
                    break;
                case 100:
                    speed = 3;
                    break;
                case 1000:
                    speed = 4;
                    break;
                case 2500:
                    speed = 5;
                    break;
                case 5000:
                    speed = 6;
                    break;
            }
            var duplex = 1;
            if (value.full_duplex) duplex = 2;
            this.mib.addTableRow('apEthEntry', [ap.site_id, ap.mac, key, status, speed, duplex]);
        }
    }
    delete_ap_eth(ap) {
        for (const [key, value] of Object.entries(ap.port_stat)) {
            try {
                this.mib.deleteTableRow('apEthEntry', [ap.site_id, ap.mac, key]);
            } catch (error) {
                console.log("Unable to delete ap interface " + ap.site_id + "." + ap.mac + "." + key + " from MIB")
            }
        }
    }


    load() {
        Sites.find({})
            .sort({ index: 1 })
            .exec((err, sites) => {
                sites.forEach(site => {
                    ApStats.find({ site_id: site.id })
                        .sort({ index: 1 })
                        .exec((err, aps) => {
                            this.add_site(site);
                            aps.forEach(ap => {
                                this.add_ap(ap)
                            })
                        })
                })
            })
    }
}

module.exports.Agent = Agent;