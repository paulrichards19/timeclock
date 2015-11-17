var _           = require('lodash');
var gcm         = require("node-gcm");
var config      = require('../config');

function notify( datastore, eventEmitter, temp, weatherstation) {

    var $this = this;

    var currentOutSideTemp = '-';

    eventEmitter.on('change:heat', function(state, type){

        var readings = temp.getReadings(), switchType;

        switch( type ){

            case 'api':
                switchType = 'API';
                break;
            case 'switch':
                switchType = 'wall switch';
                break;
            case 'preset':
                switchType = 'time clock';
                break;

        }


        if( !_.isUndefined( weatherstation.getData().today.weather.temp ) ){

            currentOutSideTemp = weatherstation.getData().today.weather.temp;

        }


        if( state == 1 ){

            var message = new gcm.Message({
                collapseKey: 'heat',
                delayWhileIdle: false,
                timeToLive: 3600,
                data: {
                    title: 'Heating switched on ('+switchType+')',
                    message: 'Currently ' + readings.temperature + "\u2103 / "+currentOutSideTemp+"\u2103"
                    //icon: 'www/img/notification.png'
                    //image: "https://dl.dropboxusercontent.com/u/887989/antshot.png"
                }
            });

            $this.sendNotification(message);

        }else{

            var message = new gcm.Message({
                collapseKey: 'heat',
                delayWhileIdle: false,
                timeToLive: 3600,
                data: {
                    title: 'Heating switched off ('+switchType+')',
                    message: 'Currently ' + readings.temperature + "\u2103 / "+currentOutSideTemp+"\u2103"
                    //icon: 'www/img/notification.png'
                    //image: "https://dl.dropboxusercontent.com/u/887989/antshot.png"
                }
            });

            $this.sendNotification(message);

        }

    });


    $this.createMessage = function( title, message, icon, collaspeKey, delayWhileIdle, timeToLive ){

        return new gcm.Message({
            collapseKey: collaspeKey,
            delayWhileIdle: delayWhileIdle,
            timeToLive: timeToLive,
            data: {
                title: title,
                message: message,
                icon: icon
            }
        });

    };

    $this.sendNotification = function(message){

        var sender = new gcm.Sender( config.pushkey );
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