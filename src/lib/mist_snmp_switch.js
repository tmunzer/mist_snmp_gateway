const logger = require("./logger");


function add_switch(mib, sw) {
    add_switch_stats(mib, sw);
    //add_switch_eth(mib, sw);
}

function remove_switch(mib, sw) {
    remove_switch_stats(mib, sw);
    //remove_switch_eth(mib, sw);
}


function update_switch(mib, sw) {
    remove_switch(mib, sw);
    add_switch(mib, sw);
}


function add_switch_stats(mib, sw) {
    var status = 1;
    if (sw.status == "connected") status = 2;

    var name = sw.mac;
    if (sw.name) name = sw.name;

    sw.module_stat.forEach(member => {
        var vc_role = 1
        switch (member.vcv_role) {
            case "master":
                vc_role = 2;
                break;
            case "backup":
                vc_role = 3;
                break;
            case "linecard":
                vc_role = 4;
                break;
            default:
                vc_role = 1;
                break;
        }

        var poe = { max_power: 0, power_draw: 0 };
        if (member.poe) { poe = member.poe; }

        var fans = [1, 1];
        if (member.fans) {
            for (var i in member.fans) {
                if (member.fans[i] == "ok") fans[i] = 3
                else fan[i] = 2
            }
        }

        var temperatures = { cpu: { celsius: 0, status: 1 }, psu: { celsius: 0, status: 1 } }
        if (member.temperatures) {
            member.temperatures.forEach(temp => {
                var status = 1;
                if (temp.status == "ok") status = 3;
                else status = 2;
                if (temp.name.toLowerCase().includes("cpu")) temperatures.cpu = { celsius: temp.celsius, status: status }
                else if (temp.name.toLowerCase().includes("psu")) temperatures.psu = { celsius: temp.celsius, status: status }
            })
        }

        var psus = [1, 1]
        if (member.psus) {
            for (var i in member.psus) {
                if (member.psus[i].status == "ok") psus[i] = 3;
                else psus[i] = 1;
            }
        }
        mib.addTableRow('switchStatsEntry', [
            sw.site_id,
            sw.mac,
            member.fpc_idx,

            name,
            status,
            sw.last_seen,
            sw.ip,

            member.mac,
            member.serial,
            vc_role,
            member.model,
            member.uptime,
            member.version,
            String(poe.max_power),
            String(poe.power_draw),
            fans[0],
            fans[1],
            temperatures.cpu.celsius,
            temperatures.cpu.status,
            temperatures.psu.celsius,
            temperatures.psu.status,
            psus[0],
            psus[1],
            String(member.cpu_stat.load_avg[0]),
            String(member.cpu_stat.load_avg[1]),
            String(member.cpu_stat.load_avg[2]),
            member.memory_stat.usage
        ]);
    });
}


function remove_switch_stats(mib, sw) {
    sw.module_stat.forEach(member => {

        try {
            mib.deleteTableRow('switchStatsEntry', [sw.site_id, sw.mac, member.fpc_idx]);
        } catch (error) {
            logger.warning("Unable to delete switch index " + sw.site_id + "." + sw.mac + "." + member.fpc_idx + " from MIB")
        }
    })
}


// function add_switch_eth(mib, sw) {
//     for (const [key, value] of Object.entries(ap.port_stat)) {
//         var status = 1;
//         if (value.up) status = 2;
//         var speed = 1;
//         switch (value.speed) {
//             case 10:
//                 speed = 2;
//                 break;
//             case 100:
//                 speed = 3;
//                 break;
//             case 1000:
//                 speed = 4;
//                 break;
//             case 2500:
//                 speed = 5;
//                 break;
//             case 5000:
//                 speed = 6;
//                 break;
//         }
//         var duplex = 1;
//         if (value.full_duplex) duplex = 2;
//         mib.addTableRow('apEthEntry', [ap.site_id, ap.mac, key, status, speed, duplex]);
//     }
// }

// function remove_switch_eth(mib, sw) {
//     for (const [key, value] of Object.entries(ap.port_stat)) {
//         try {
//             mib.deleteTableRow('apEthEntry', [ap.site_id, ap.mac, key]);
//         } catch (error) {
//             logger.warning("Unable to delete ap interface " + ap.site_id + "." + ap.mac + "." + key + " from MIB")
//         }
//     }
// }


module.exports.add = add_switch;
module.exports.remove = remove_switch;
module.exports.update = update_switch;