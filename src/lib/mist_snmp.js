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
        console.log(this.mib)
        this.load();
    }


    add_site(site) {
        this.mib.addTableRow('siteEntry', [site.index, site.id, site.name]);
    }
    update_site(site) {
        this.mib.deleteTableRow('siteEntry', site.index);
        this.add_site(site);
    }

    add_ap_stats(site_index, ap) {
        var status = 0;
        if (ap.status == "connected") status = 1;
        var name = ap.mac;
        if (ap.name) name = ap.name;
        this.mib.addTableRow('apStatsEntry', [site_index, ap.index, ap.mac, name, status, ap.last_seen, ap.uptime, ap.model, ap.hw_rev, ap.serial, ap.ip, ap.ext_ip, ap.num_clients]);
    }
    update_ap_stats(site_index, ap) {
        this.mib.deleteTableRow('apStatsEntry', [site_index, ap.index]);
        this.add_ap_stats(site_index, ap);
    }

    load() {
        setTimeout(() => {
            Sites.find({})
                .sort({ index: 1 })
                .exec((err, sites) => {
                    sites.forEach(site => {
                        ApStats.find({ site_id: site.id })
                            .sort({ index: 1 })
                            .exec((err, aps) => {
                                if (aps.length > 0) this.add_site(site);
                                aps.forEach(ap => {
                                    this.add_ap_stats(site.index, ap)
                                })
                            })

                    })
                })
        }, 1000)
    }
}

module.exports.Agent = Agent;