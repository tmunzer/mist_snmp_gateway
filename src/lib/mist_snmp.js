const logger = require("./logger");
const snmp = require('net-snmp');
const Sites = require("./models/sites");
const ApStatModel = require("./models/apStats");
const SwitchStatModel = require("./models/switchStats");
const SnmpOrg = require("./mist_snmp_org");
const SnmpSite = require("./mist_snmp_site");
const SnmpAp = require("./mist_snmp_ap");
const SnmpSwitch = require("./mist_snmp_switch");

class Agent {

    constructor(version, v2_community, v3_user, v3_auth_protocol, v3_auth_key, v3_priv_protocol, v3_priv_key, listening_ip, enterprise_oid) {

        this.enterprise_oid = enterprise_oid;
        var options = {
            port: 161,
            transport: "udp4",
            trapPort: 162,
            address: listening_ip
        };
        switch (version) {
            case 3:
                options.version = snmp.Version3;
                options.disableAuthorization = false;
                options.accessControlModelType = snmp.AccessControlModelType.None;
                options.engineID = "8000B98380CE0EF89195203BD839AAB690";
            case 2:
            default:
                options.version = snmp.Version2c;
                break;
        }

        var store = snmp.createModuleStore();
        store.loadFromFile("./mibs/SNMPv2.mib");
        store.loadFromFile("./mibs/SNMPv2-TC.mib");
        store.loadFromFile("./mibs/MISTLAB.mib");

        // Fetch MIB providers, create an agent, and register the providers with your agent
        var providers = store.getProvidersForModule("MISTLAB-MIB");
        // Not recommended - but authorization and callback turned off for example brevity
        //this.agent = snmp.createAgent({ disableAuthorization: true }, function(error, data) {});
        this.agent = snmp.createAgent(options, function(err, data) {
            if (err) logger.error(err)
            if (data) logger.debug('SNMP Agent sent a response for the oid ' + data.pdu.varbinds[0].oid + ' from ' + data.rinfo.address);
        });


        this.authorizer = this.agent.getAuthorizer();
        if (version == 2) {
            this.authorizer.addCommunity(v2_community)
        } else if (version == 3) {
            var user = {
                name: v3_user,
                level: snmp.SecurityLevel.authPriv,
                authKey: v3_auth_key,
                privKey: v3_priv_key
            };
            if (String(v3_auth_protocol).toLowerCase() == "md5") user.authProtocol = snmp.AuthProtocols.md5;
            else user.authProtocol = snmp.AuthProtocols.sha;
            if (String(v3_priv_protocol).toLowerCase() == "aes") user.privProtocol = snmp.PrivProtocols.aes;
            else user.privProtocol = snmp.PrivProtocols.des;
            this.authorizer.addUser(user);
        }


        this.mib = this.agent.getMib();
        this.mib.registerProviders(providers);
        this.load();

    }
    router(device_type, action, device) {
        var snmp_agent = undefined;
        switch (device_type) {
            case "ap":
                snmp_agent = SnmpAp;
                break;
            case "switch":
                snmp_agent = SnmpSwitch;
                break;
        }
        if (snmp_agent) {
            switch (action) {
                case "add":
                    snmp_agent.add(this.mib, device);
                    break;
                case "remove":
                    snmp_agent.remove(this.mib, device);
                    break;
                case "update":
                    snmp_agent.update(this.mib, device);
                    break;
            }
        }
    }

    update_org(org) { SnmpOrg.update(this.mib, org); }
    add_site(site) { SnmpSite.add(this.mib, site); }
    remove_site(site) { SnmpSite.remove(this.mib, site) }
    update_site(site) { SnmpSite.update(this.mib, site) }

    load() {
        Sites.find({})
            .sort({ index: 1 })
            .exec((err, sites) => {
                sites.forEach(site => {
                    this.add_site(site);
                    ApStatModel.find({ site_id: site.id })
                        .sort({ index: 1 })
                        .exec((err, aps) => {
                            aps.forEach(ap => {
                                this.router("ap", "add", ap);
                            })
                        })
                    SwitchStatModel.find({ site_id: site.id })
                        .sort({ index: 1 })
                        .exec((err, switches) => {
                            switches.forEach(sw => {
                                this.router("switch", "add", sw);
                            })
                        })
                })
            })
    }
}

module.exports.Agent = Agent;