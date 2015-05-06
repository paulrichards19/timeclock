var _           = require('lodash');
var gcm         = require("node-gcm");
var config      = require('../config');

function notify( datastore, eventEmitter, temp) {

    var $this = this;

    var key = config.pushkey;

    var Parse = require('node-parse-api').Parse;

    var app = new Parse(config.parseAppid, config.parseKey);

    var Parse = require('node-parse-api').Parse;

    var options = {
        app_id: config.parseAppid,
        api_key: config.parseKey
    }

    var app = new Parse(options);

    eventEmitter.on('change:heat', function(state){

        var readings = temp.getReadings();


        if( state == 1 ){

//            var message = new gcm.Message({
//                collapseKey: 'heaton',
//                delayWhileIdle: true,
//                timeToLive: 3600,
//                data: {
//                    title: 'Heating on',
//                    message: 'Indoor temp ' + readings.temperature + "\u2103"
//                }
//            });
//
//            $this.sendNotification(message);

            var notification = {
                channels: ['Heating'],
                data: {
                    title: 'HEAT: ON',
                    alert: 'Indoor temp ' + readings.temperature + "\u2103"
                }
            };
            app.sendPush(notification, function(err, resp){
                console.log(resp);
            });



        }else{

//            var message = new gcm.Message({
//                collapseKey: 'heatoff',
//                delayWhileIdle: true,
//                timeToLive: 3600,
//                data: {
//                    title: 'Heating off',
//                    message: 'Indoor temp ' + readings.temperature + "\u2103"
//                }
//            });
//            $this.sendNotification(message);

            var notification = {
                channels: ['Heating'],
                data: {
                    title: 'HEAT: OFF',
                    alert: 'Indoor temp ' + readings.temperature + "\u2103"
                }
            };
            app.sendPush(notification, function(err, resp){
                console.log(resp);
            });


        }

    });


    $this.sendNotification = function(message){

        var sender = new gcm.Sender( key );
        var registrationIds = [];

        // Add the registration IDs of the devices you want to send to
        datastore.getMobileRegistrations(function(data){

            _.each( data, function(row){
                registrationIds.push( row.regid );
            });

            sender.send(message, registrationIds, function (err, result) {
                if(err) console.error(err);
                else    console.log(result);
            });

        });

    };

    $this.registerPhone = function( id ){

        console.log('register attempt ' + id);

        datastore.registerMobile({regid: id});

    };

}

module.exports = notify;