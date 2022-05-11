module.exports.processIds = function(list_from_db, list_from_mist) {
    var ids_from_db = [];
    var ids_from_mist = [];
    list_from_db.forEach(obj => ids_from_db.push(obj.id));
    list_from_mist.forEach(obj => ids_from_mist.push(obj.id));
    const ids_to_add = ids_from_mist.filter(x => !ids_from_db.includes(x));
    const ids_to_update = ids_from_mist.filter(x => ids_from_db.includes(x));
    const ids_to_delete = ids_from_db.filter(x => !ids_from_mist.includes(x));
    return { ids_to_add: ids_to_add, ids_to_update: ids_to_update, ids_to_delete: ids_to_delete }
}