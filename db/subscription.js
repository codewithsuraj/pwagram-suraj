const mongoose = require('mongoose');

const Subscription = mongoose.model("Subscription", new mongoose.Schema({
    endpoint: { type: String, required: true },
    expirationTime: { type: String, default: null },
    keys: {
        p256dh: { type: String, required: true },
        auth: { type: String, required: true }
    }
}));

module.exports = Subscription;