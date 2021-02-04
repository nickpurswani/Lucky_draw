var express = require("express");
var HTTP_PORT = 8000;
var app = express();
var mongoose = require("mongoose");
var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
const fetch = require("node-fetch");
var MongoClient = require("mongodb").MongoClient;
const { ObjectId } = require("mongodb");
var uri =
  "mongodb+srv://nick:nick@cluster0.kriff.mongodb.net/luckydraw?retryWrites=true&w=majority";

var bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
app.set("view engine", "ejs");
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/index.htm");
});
app.get("/dash/:user", (req, res) => {
  let username = req.params.user;
  MongoClient.connect(uri, function (err, client) {
    if (err) {
      res.json(err);
      console.log("Error occurred while connecting to MongoDB Atlas...\n", err);
    }

    const collection = client.db("luckydraw").collection("user");
    collection
      .find({ username: username })
      .toArray()
      .then(function (s) {
        res.render("dash", { s: s });
      });

    client.close();
  });
});
app.post("/dash", (req, res) => {
  let username = req.body.username;
  MongoClient.connect(uri, function (err, client) {
    if (err) {
      res.json(err);
      console.log("Error occurred while connecting to MongoDB Atlas...\n", err);
    }

    const collection = client.db("luckydraw").collection("user");
    collection
      .find({ username: username })
      .toArray()
      .then(function (s) {
        if (s.length == 0) res.redirect("/create/" + req.body.username);
        else res.render("dash", { s: s });
      });

    client.close();
  });
});
app.get("/create/:user", (req, res) => {
  let username = req.params.user;
  MongoClient.connect(uri, function (err, client) {
    if (err) {
      res.json(err);
      console.log("Error occurred while connecting to MongoDB Atlas...\n", err);
    }

    const collection = client.db("luckydraw").collection("user");
    collection
      .insertOne({
        username: username,
        raffletickets: 0,
        luckydraw: [],
      })
      .then(function (s) {
        res.redirect("/dash/" + req.params.user);
      });

    client.close();
  });
});
app.get("/luckydraw", (req, res) => {
  MongoClient.connect(uri, function (err, client) {
    if (err) {
      res.json(err);
      console.log("Error occurred while connecting to MongoDB Atlas...\n", err);
    }

    const collection = client.db("luckydraw").collection("luckydraw");
    collection
      .find()
      .toArray()
      .then(function (s) {
        console.log(s);
        res.render("event", { s: s });
      });

    client.close();
  });
});
app.get("/raffleticket/:name", (req, res) => {
  MongoClient.connect(uri, function (err, client) {
    if (err) {
      res.json(err);
      console.log("Error occurred while connecting to MongoDB Atlas...\n", err);
    }

    const collection = client.db("luckydraw").collection("user");
    collection.updateOne(
      { username: req.params.name },
      { $inc: { raffletickets: 1 } }
    );

    client.close();
  });
  res.redirect("/dash/" + req.params.name);
});
app.get("/nextevents", (req, res) => {
  var isodate = new Date();

  MongoClient.connect(uri, function (err, client) {
    if (err) {
      res.json(err);
      console.log("Error occurred while connecting to MongoDB Atlas...\n", err);
    }

    const collection = client.db("luckydraw").collection("luckydraw");

    collection
      .find({
        date: {
          $gte: isodate,
        },
      })
      .toArray()
      .then(function (feedbacks) {
        res.json(feedbacks);
      });

    client.close();
  });
});
app.get("/participate/:id/:user", (req, res) => {
  MongoClient.connect(uri, function (err, client) {
    if (err) {
      res.json(err);
      console.log("Error occurred while connecting to MongoDB Atlas...\n", err);
    }

    const collection = client.db("luckydraw").collection("user");
    collection.findOne({ username: req.params.user }).then(function (s) {
      s.luckydraw.forEach(function (i) {
        if (i == req.params.id)
          res.json({
            err: "user already participated try any other lucky draw",
          });
      });
    });

    client.close();
  });
  MongoClient.connect(uri, function (err, client) {
    if (err) {
      res.json(err);
      console.log("Error occurred while connecting to MongoDB Atlas...\n", err);
    }

    const collection = client.db("luckydraw").collection("luckydraw");

    collection
      .findOneAndUpdate(
        { _id: ObjectId(req.params.id) },
        { $push: { users: req.params.user } }
      )
      .then(function (s) {
        res.json({ ok: 1 });
      });

    client.close();
  });
  MongoClient.connect(uri, function (err, client) {
    if (err) {
      res.json(err);
      console.log("Error occurred while connecting to MongoDB Atlas...\n", err);
    }

    const collection = client.db("luckydraw").collection("user");
    collection.updateOne(
      { username: req.params.user },
      { $inc: { raffletickets: -1 } }
    );
    collection.findOneAndUpdate(
      { username: req.params.user },
      { $push: { luckydraw: ObjectId(req.params.id) } }
    );

    client.close();
  });
});
app.post("/createevent", (req, res) => {
  let date = new Date(req.body.date + ":00.000z");

  let name = req.body.name;
  let users = [];
  let winner = "";
  let reward = req.body.reward;
  MongoClient.connect(uri, function (err, client) {
    if (err) {
      res.json(err);
      console.log("Error occurred while connecting to MongoDB Atlas...\n", err);
    }

    const collection = client.db("luckydraw").collection("luckydraw");
    collection.insertOne(
      { users: users, name: name, winner: winner, reward: reward, date: date },
      function (err, s) {
        if (err) throw err;
        res.json({ inserted: 1 });
      }
    );

    client.close();
  });
});
app.get("/pickwinner/:id", (req, res) => {
  MongoClient.connect(uri, function (err, client) {
    if (err) {
      res.json(err);
      console.log("Error occurred while connecting to MongoDB Atlas...\n", err);
    }

    const collection = client.db("luckydraw").collection("luckydraw");

    collection.findOne({ _id: ObjectId(req.params.id) }).then(function (s) {
      console.log(s.users[Math.floor(Math.random() * s.users.length)]);
      res.redirect(
        "/updatewinner/" +
          req.params.id +
          "/" +
          s.users[Math.floor(Math.random() * s.users.length)]
      );
    });

    client.close();
  });
});
app.get("/updatewinner/:id/:user", (req, res) => {
  MongoClient.connect(uri, function (err, client) {
    if (err) {
      res.json(err);
      console.log("Error occurred while connecting to MongoDB Atlas...\n", err);
    }

    const collection = client.db("luckydraw").collection("luckydraw");

    collection
      .updateOne(
        { _id: ObjectId(req.params.id) },
        { $set: { winner: req.params.user } },
        { upsert: true }
      )
      .then(function (s) {
        res.json({ winner: req.params.user });
      });

    client.close();
  });
});
app.get("/listwinners", (req, res) => {
  var isodate = new Date();

  MongoClient.connect(uri, function (err, client) {
    if (err) {
      res.json(err);
      console.log("Error occurred while connecting to MongoDB Atlas...\n", err);
    }

    const collection = client.db("luckydraw").collection("luckydraw");

    collection
      .find({
        date: {
          $lt: isodate,
        },
      })
      .toArray()
      .then(function (feedbacks) {
        res.json(feedbacks);
      });

    client.close();
  });
});
app.listen(process.env.PORT || HTTP_PORT, () => {
  console.log("Server running on port %PORT%".replace("%PORT%", HTTP_PORT));
});
