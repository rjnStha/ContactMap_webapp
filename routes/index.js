var MongoClient = require('mongodb').MongoClient;
var ObjectID = require('mongodb').ObjectID;
var url = 'mongodb://rojan:Sthanajor!1@ds161804.mlab.com:61804/finalrshresth';
var contacts; // will hold the contacts collection.

//Adding Location to Contacts
var NodeGeocoder = require('node-geocoder');

var options = {
  provider: 'mapquest',

  // Optional depending on the providers
  httpAdapter: 'https', // Default
  apiKey: ' xW93ZBIzaoLzzOEWKhXyRJQbeaDVHqkL ', // for Mapquest, OpenCage, Google Premier
  formatter: null         // 'gpx', 'string', ...
};

var geocoder = NodeGeocoder(options);


// Create "contacts" collection in the relevant database
MongoClient.connect(url, function(err, db) {
  if (err) throw err;
  var dbo = db.db("finalrshresth");
  contacts = dbo.collection("customers");
}); 

let login = function(req, res, next){
  res.render('login', { });
}

let mailer = function(req, res, next){
  res.render('mailer', { });
}

let home = function(req, res, next){
  res.render('home', { });
}

let processPostContacts = function(req, res, next){
  let post = req.body;

  if("delete" in post ){
    //Delete an element from database
    try{
      contacts.deleteOne( {_id:ObjectID(post["databaseId"]) } );
    } catch(e){
      console.log(e);
    }

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(post));
    return;
  }
  
  setAdditionalPostProperty("canMail", post, "checkBoxMail");
  setAdditionalPostProperty("canCall", post, "checkBoxPhone");
  setAdditionalPostProperty("canEmail", post, "checkBoxEmail");

  let fullAddress = post["street"] + " " + post["city"] + " " + post["stateCode"] + " " + post["zip"];

  geocoder.geocode(fullAddress, function(err, resGeoCode) {
    let latLong = [];

    latLong.push(resGeoCode[0]["latitude"]);
    latLong.push(resGeoCode[0]["longitude"]);

    post["latlong"] = latLong;

    let objectId = post["databaseId"];
    res.writeHead(200, { 'Content-Type': 'application/json' });  

    if(objectId == ""){
      //Insert to database

      contacts.insertOne(post, function(err, doc) {
        if (doc.result.ok){ 
            // console.log("document inserted");
            // console.log(doc.result);
            
            res.end(JSON.stringify(post));
        }
      });
    } else{
      //Update the database

      contacts.updateOne( {_id:ObjectID(objectId)}, {'$set': post});
      res.end(JSON.stringify(post));
    }
  });
  
}


let processPostMailer = function(req, res, next){
  let post = req.body;
  
  setAdditionalPostProperty("canMail", post, "checkBoxMail");
  setAdditionalPostProperty("canCall", post, "checkBoxPhone");
  setAdditionalPostProperty("canEmail", post, "checkBoxEmail");

  let fullAddress = post["street"] + ", " + post["city"] + ", " + post["stateCode"] + " " + post["zip"];
  
  geocoder.geocode(fullAddress, function(err, res) {
    let latLong = [];

    latLong.push(res[0]["latitude"]);
    latLong.push(res[0]["longitude"]);

    post["latlong"] = latLong;

    contacts.insertOne(post, function(err, doc) {
      if (doc.result.ok){ 
          // console.log("document inserted");
          // console.log(doc.result);
      }
    });
  });
  

  res.render('success_contact', { });
}

function setAdditionalPostProperty(postProperty, post, checkBoxProperty){
  if( canContact(post, checkBoxProperty) )
    post[postProperty] = true;
  else
    post[postProperty] = false;
}

function canContact(post, checkBoxProperty){
  if("checkBoxAny" in post || checkBoxProperty in post)
    return true;

  return false;
}

let displayAllContacts = function(req, res, next){

  contacts.find({}).toArray( function (err, result) {
    res.render("allContacts", {all_contacts: result });
  }); 
}

var express = require('express');
var router = express.Router();
module.exports = router;


let ensureLoggedIn = function(req, res, next) {
	if ( req.user ) {
		next();
	}
	else {
		res.redirect("/login");
	}
}

router.get('/', home);
router.get('/home', home);
router.get('/mailer', mailer);
router.post('/mailer', processPostMailer); 
router.get('/contacts', ensureLoggedIn, displayAllContacts );
router.post('/contacts', ensureLoggedIn, processPostContacts);