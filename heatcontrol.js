console.log('Heating System Control');

var _                   = require('lodash');
var fs                  = require('fs');
var moment              = require('moment');
var async               = require('async');

var config              = require('./config');

var express             = require('express');
var app                 = express();

var Sun                 = require('./lib/sun');
var Weatherstation      = require('./lib/weatherstation');
var temperature         = require('./lib/temperature');
var relay               = require('./lib/relay');
var ledSwitch           = require('./lib/switch');
var Scheduler           = require('./lib/scheduler');


var events = require('events');
var eventEmitter = new events.EventEmitter();


var DatastoreClass = require('./lib/datastore');
var datastore = new DatastoreClass();

var temp = new temperature();
var weatherstation = new Weatherstation();

var replyRunner = new relay( eventEmitter );
var ledSwitchRunner = new ledSwitch( eventEmitter );

var schedulerRunner;

//heat control - reset to no heat on then start time clock
setTimeout(function(){

    console.log('Heat forced off to reset at startup');

    setTimeout(function(){
        schedulerRunner = new Scheduler( datastore, eventEmitter );
    },2000)

},1000)

app.use( express.basicAuth( config.username, config.password ) );

app.get('/api', function(req, res){

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

app.get('/api/heat/on', function(req, res){

    eventEmitter.emit('toggle:api',1);

    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify({"done":"toggled"}));

});

app.get('/api/heat/off', function(req, res){

    eventEmitter.emit('toggle:api',0);

    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify({"done":"toggled"}));

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


app.get('/api/data', function(req, res){

    var sunData = new Sun().getData();
    var weatherStationData = weatherstation.getData();
    var heatingData = schedulerRunner.getData();
    var tempData = temp.getData();

    var data = _.merge(sunData,weatherStationData,heatingData,tempData);

    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify(data));

});

var server = app.listen(3001, function(){
    console.log('Express is listening');
});