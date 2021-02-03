var express = require("express");
var HTTP_PORT = 8000;
var app = express();
var mongoose = require("mongoose");
var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
const fetch = require("node-fetch");
var MongoClient = require('mongodb').MongoClient;
var uri = "mongodb+srv://nick:nick@cluster0.kriff.mongodb.net/luckydraw?retryWrites=true&w=majority";


var bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));
app.set("view engine","ejs");
app.get("/",(req,res)=>{
  res.sendFile(__dirname+"/index.htm");

});
app.get("/raffleticket/:name",(req,res)=>{
  
 
    MongoClient.connect(uri,function(err, client) {
         if (err) {
             res.json(err);
        console.log('Error occurred while connecting to MongoDB Atlas...\n',err);
   }
   console.log('Connected...');
   const collection = client.db("luckydraw").collection("user");
  collection.updateOne( { usernae: req.params.name },{ $inc: { raffletickets: 1 }});
   client.close();
});
      
    res.json({ok:1})
 
     });

    
    
    
    

app.listen(process.env.PORT || HTTP_PORT, () => {
  console.log("Server running on port %PORT%".replace("%PORT%", HTTP_PORT))
});