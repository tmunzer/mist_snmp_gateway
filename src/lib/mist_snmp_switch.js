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
    var name = sw.mac;
    var last_seen = 0;
    var ip = "0.0.0.0"

    if (sw.status == "connected") status = 2;
    if (sw.name) name = sw.name;
    if (sw.last_seen) last_seen = sw.last_seen;
    if (sw.ip) ip = sw.ip;
    
    sw.module_stat.forEach(member => {

        var serial = sw.serial;        
        var model = sw.model;        
        var mac = sw.mac;        
        var uptime = 0;        
        var version = "N/A";        
        var vc_role = 1
        var poe = { max_power: 0, power_draw: 0 };
        var fans = [1, 1];
        var temperatures = { cpu: { celsius: 0, status: 1 }, psu: { celsius: 0, status: 1 } };
        var psus = [1, 1];
        var cpu_stat = [-1, -1, -1];
        var memory_stat = -1;
        var fpc_idx = 0;
        

        if (member.serial) serial = member.serial;
        if (member.model) model = member.model;
        if (member.mac) serial = member.mac;
        if (member.uptime) uptime = member.uptime;
        if (member.poe) { poe = member.poe; }
        if (member.cpu_stat && member.cpu_stat.load_avg) cpu_stat = member.cpu_stat.load_avg
        if (member.memory_stat && member.memory_stat.usage) memory_stat = member.memory_stat.usage
        if (member.fpc_idx) fpc_idx = member.fpc_idx

        switch (member.vc_role) {
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

        if (member.fans) {
            for (var i in member.fans) {
                if (member.fans[i] == "ok") fans[i] = 3
                else fans[i] = 2
            }
        }

        if (member.temperatures) {
            member.temperatures.forEach(temp => {
                var status = 1;
                if (temp.status == "ok") status = 3;
                else status = 2;
                if (temp.name.toLowerCase().includes("cpu")) temperatures.cpu = { celsius: temp.celsius, status: status }
                else if (temp.name.toLowerCase().includes("psu")) temperatures.psu = { celsius: temp.celsius, status: status }
            })
        }

        if (member.psus) {
            for (var i in member.psus) {
                if (member.psus[i].status == "ok") psus[i] = 3;
                else psus[i] = 1;
            }
        }

        mib.addTableRow('switchStatsEntry', [
            sw.site_id,
            sw.mac,
            fpc_idx,

            name,
            status,
            last_seen,
            ip,

            mac,
            serial,
            vc_role,
            model,
            uptime,
            version,
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
            String(cpu_stat[0]),
            String(cpu_stat[1]),
            String(cpu_stat[2]),
            memory_stat
        ]);
    });
}


function remove_switch_stats(mib, sw) {
    sw.module_stat.forEach(member => {
        //vJunos may not have member.fpc_idx, adding a default value
        var fpc_idx = 0
        if (member.fpc_idx) fpc_idx = member.fpc_idx

        try {
            mib.deleteTableRow('switchStatsEntry', [sw.site_id, sw.mac, fpc_idx]);
        } catch (error) {
            logger.warning("Unable to delete switch index " + sw.site_id + "." + sw.mac + "." + fpc_idx + " from MIB: " + error)
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