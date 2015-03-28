var _           = require('lodash');
var gcm         = require("node-gcm");
var config      = require('../config');

function notify( datastore, eventEmitter, temp) {

    var $this = this;

    var key = config.pushkey;

    eventEmitter.on('change:heat', function(state){

        var readings = temp.getReadings();

        if( state == 1 ){

            var message = new gcm.Message({
                collapseKey: 'heaton',
                delayWhileIdle: true,
                timeToLive: 3600,
                data: {
                    title: 'Heating on',
                    message: 'Indoor temp ' + readings.temperature + "\u2103"
                }
            });

            $this.sendNotification(message);

        }else{

            var message = new gcm.Message({
                collapseKey: 'heatoff',
                delayWhileIdle: true,
                timeToLive: 3600,
                data: {
                    title: 'Heating off',
                    message: 'Indoor temp ' + readings.temperature + "\u2103"
                }
            });
            $this.sendNotification(message);

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