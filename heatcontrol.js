console.log('Heating System Control');

var _                   = require('lodash');
var fs                  = require('fs');
var moment              = require('moment');
var async               = require('async');

var config              = require('./config');

var express             = require('express');
var bodyParser          = require("body-parser");
var app                 = express();

app.use(bodyParser.urlencoded({ extended: false }));

var Sun                 = require('./lib/sun');
var Weatherstation      = require('./lib/weatherstation');
var temperature         = require('./lib/temperature');
var relay               = require('./lib/relay');
var button              = require('./lib/button');
var led                 = require('./lib/led');
var Scheduler           = require('./lib/scheduler');
var notify              = require('./lib/notify');


var events = require('events');
var eventEmitter = new events.EventEmitter();


var DatastoreClass = require('./lib/datastore');
var datastore = new DatastoreClass();

var temp = new temperature();
var weatherstation = new Weatherstation();

var replyRunner = new relay( eventEmitter );
var buttonRunner = new button( eventEmitter );
var ledRunner = new led( eventEmitter );
var notifyRunner = new notify( datastore, eventEmitter, temp, weatherstation );


var schedulerRunner;
//heat control - reset to no heat on then start time clock
setTimeout(function(){

    console.log('Start Schedular');
    schedulerRunner = new Scheduler( datastore, eventEmitter, weatherstation, temp );

},1000)

//app.use( express.basicAuth( config.username, config.password ) );

app.get('*',function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
    next();
});


app.get('/api', function(req, res){

    console.log('Web access /api');

    fs.exists(__dirname + '/views/api.html', function (exists) {
        if (exists) {
            // return the file found
            res.sendfile(__dirname + '/views/api.html');
        }else{
            // cant find the file
            res.end("404!");
        }
    });

});

app.get('/notify', function(req, res){

    console.log('Web access /notify');

    fs.exists(__dirname + '/views/notify.html', function (exists) {
        if (exists) {
            // return the file found
            res.sendfile(__dirname + '/views/notify.html');
        }else{
            // cant find the file
            res.end("404!");
        }
    });

});

app.get('/api/heat/on', function(req, res){

    eventEmitter.emit('toggle:api',1);

    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify({"heat":"on"}));

});

app.get('/api/heat/off', function(req, res){

    eventEmitter.emit('toggle:api',0);

    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify({"heat":"off"}));

});

app.get('/api/mode/off', function(req, res){

    schedulerRunner.setMode('off');

    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify({"mode":"off"}));

});

app.get('/api/mode/auto', function(req, res){

    schedulerRunner.setMode('auto');

    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify({"mode":"auto"}));

});

app.get('/api/data/next', function(req, res){

    async.parallel([
        function(callback1){
            schedulerRunner.getFutureSchedule( moment().toDate(), function(data){
                callback1(null, data);
            });
        },
        function(callback2){
            schedulerRunner.getFutureSchedule( moment().add(1,'d').toDate(), function(data){
                callback2(null, data);
            });
        },
        function(callback3){
            schedulerRunner.getFutureSchedule( moment().add(2,'d').toDate(), function(data){
                callback3(null, data);
            });
        },
        function(callback4){
            schedulerRunner.getFutureSchedule( moment().add(3,'d').toDate(), function(data){
                callback4(null, data);
            });
        },
        function(callback5){
            schedulerRunner.getFutureSchedule( moment().add(4,'d').toDate(), function(data){
                callback5(null, data);
            });
        },
        function(callback6){
            schedulerRunner.getFutureSchedule( moment().add(5,'d').toDate(), function(data){
                callback6(null, data);
            });
        },
        function(callback7){
            schedulerRunner.getFutureSchedule( moment().add(6,'d').toDate(), function(data){
                callback7(null, data);
            });
        }
    ], function(err, results){

        res.setHeader('Content-Type', 'application/json');
        res.send( JSON.stringify( results ) );

    });

});

app.get('/api/data/now', function(req, res){

    var data = schedulerRunner.getCurrentSchedule();

    res.setHeader('Content-Type', 'application/json');
    res.send( JSON.stringify( data  ) );

});

app.get('/api/log/heating', function(req, res){

    datastore.getHeatingLog(function(data){

        res.setHeader('Content-Type', 'application/json');
        res.send( JSON.stringify( data  ) );

    });

});

app.get('/api/log/sensors', function(req, res){

    datastore.getSensorLog(function(data){

        res.setHeader('Content-Type', 'application/json');
        res.send( JSON.stringify( data  ) );

    });

});

app.get('/api/mobile/register', function(req, res){

    notifyRunner.registerPhone(req.query.regid);

    res.setHeader('Content-Type', 'application/json');
    res.send( JSON.stringify( { 'register': true } ) );

});


app.get('/api/data', function(req, res){

    var sunData = new Sun().getData();
    var weatherStationData = weatherstation.getData();

    var tempData = temp.getData();

    schedulerRunner.getData(function(heatingData){

        var data = _.merge(sunData,weatherStationData,heatingData,tempData);

        res.setHeader('Content-Type', 'application/json');
        res.send(JSON.stringify(data));

    });

});

app.post('/api/notify', function(req, res){


    var message = notifyRunner.createMessage( req.body.title,
        req.body.message,
        req.body.icon,
        req.body.collaspeKey,
        false, 3600 );

    notifyRunner.sendNotification( message );

    var data = {
        'title'  : req.body.title,
        'message'  : req.body.message,
        'collaspeKey'  : req.body.collaspeKey,
        'icon'  : req.body.icon
    };

    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify(data));

});


app.get('/api/rest/settings/:settings', function(req, res){

    var result = {

        heating_status  : '1',
        mode  : 'auto',

        schedule : {
            way : 'on',
            day : [
                'tues',
                'wed'
            ]
        }

    };

    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify(result));

});

app.options('/api/rest/settings/:settings', function(req, res){

    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");

    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify({}));

});

app.put('/api/rest/settings/:settings', function(req, res){

    var result = {

        heating_status  : '1',
        mode  : 'auto',

        schedule : {
            way : 'on',
            day : [
                'tues',
                'wed'
            ]
        }

    };

    console.log('Settings update');
    console.log( req.params );

    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");

    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify(result));

});


var server = app.listen(3001, function(){
    console.log('Express is listening on 3001');
});