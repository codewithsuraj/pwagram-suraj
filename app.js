const express = require('express');
const bodyParser = require('body-parser');
const multer = require('multer')
const app = express();
const Post = require("./db/post");
const Subscription = require("./db/subscription");
var webpush = require("web-push");

app.use(express.static('public'))

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

let allowCrossDomain = function (req, res, next) {
    res.header('Access-Control-Allow-Origin', "*");
    res.header('Access-Control-Allow-Headers', "*");
    next();
}
app.use(allowCrossDomain)

const storage = multer.diskStorage({
    destination: "public/src/images/posts",
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
        const fileName = req.body.image = file.fieldname + '-' + uniqueSuffix + '.png'
        cb(null, fileName)
    }
})
const upload = multer({ storage: storage })

app.use('/', express.static('public'));

app.get('/posts', async (req, res) => {
    const posts = await Post.find({}, { _id: 0, __v: 0 });
    // console.log(posts);
    res.send(posts);
})

app.post('/subscriptions', async (req, res) => {
    const subscription = new Subscription(req.body)
    try {
        await subscription.save()
        res.status(200).json({ message: "Subscription Success!" });
    } catch (error) {
        res.status(500).send(error);
    }
})

app.post('/posts', upload.single('file'), async (req, res) => {
    const post = new Post({
        id: req.body.id,
        title: req.body.title,
        location: req.body.location,
        rawLocationLat: req.body.rawLocationLat,
        rawLocationLng: req.body.rawLocationLng,
        image: '/src/images/posts/' + req.body.image,
    });
    try {
        await post.save();
        // console.log(post);

        webpush.setVapidDetails(
            "mailto:test@test.com",
            "BOa9jVYoO52O7WIsY2fCuVoyot_Uh4JXrbXOPkebQR9ezojUjCqMWvzzZ6ItyoVUsUIL-hSFpyPkhoKQyhEsOJI",
            "pRUVFcjHvmrVaA6aHJmNj4l_QOK6tHaPTADVr30N9YY"
        );
        try {
            const subscriptions = await Subscription.find({}, { _id: 0, __v: 0 });
            subscriptions.forEach(sub => {
                var pushConfig = {
                    endpoint: sub.endpoint,
                    keys: {
                        auth: sub.keys.auth,
                        p256dh: sub.keys.p256dh
                    }
                };

                webpush.sendNotification(
                    pushConfig,
                    JSON.stringify({
                        title: "New Post",
                        content: "New Post added!",
                        openUrl: "/help"
                    })
                ).catch(function (err) {
                    console.log(err);
                });
            });

            res.status(201).json({ message: "Data stored", id: req.body.id });
        } catch (error) {
            console.log(error);
            res.status(500).send(error);
        }
    } catch (error) {
        console.log(error);
        res.status(500).send(error);
    }

});

var port = process.env.PORT || 3000;
app.listen(port, () => console.log('Listening on port: ', port));