const mongoose = require('mongoose');

_mongoDbUrl = 'mongodb+srv://pwagram-suraj:pwagramsuraj@cluster0.qsdim.mongodb.net/pwagramtest?authSource=admin&replicaSet=atlas-t097ik-shard-0&w=majority&readPreference=primary&appname=MongoDB%20Compass&retryWrites=true&ssl=true';
mongoose.connect(_mongoDbUrl).then(() => {
    console.log('MongoDB Connected successfully');
}).catch((err) => {
    console.log(err);
})

const Post = mongoose.model("Post", new mongoose.Schema({
    id: { type: String, required: true },
    title: { type: String, required: true },
    location: { type: String, required: true },
    rawLocationLat: { type: String, default: '0' },
    rawLocationLng: { type: String, default: '0' },
    image: { type: String, required: true }
}));

module.exports = Post;