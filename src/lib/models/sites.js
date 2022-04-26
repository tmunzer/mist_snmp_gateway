const mongoose = require('mongoose');

const SiteSchema = new mongoose.Schema({
    index: Number,
    id: String,
    name: String
});


const Site = mongoose.model('Site', SiteSchema);
module.exports = Site;