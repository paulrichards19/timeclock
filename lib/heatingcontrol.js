var _ = require('lodash');
var phpjs = require('phpjs');
var moment = require('moment');

/**
 * OLD NOT Used
 */

function heatcontrol(connection, relayrunner, eventEmitter) {

    var $this = this;

    var config = require('../config.json');

    // default heating status
    var heating_status = 'off';
    var temperature;
    var humidity;

    //console.log(config);

    // main loop to see whats required of off the - every 59 secs
    setTimeout(function(){
        setInterval(monitorHeating, 5000);
    },5000);

    function monitorHeating(  ){
        //console.log( 'Timer check' );
        _.each(config, function(record){

            var current_time = phpjs.date("H:i");
            var current_day = phpjs.strtolower( phpjs.date("D") );

            if( current_time == record.time && phpjs.in_array( current_day, record.days ) ){
                console.log( 'Timer switched' );
                if( record.event == 'on' && heating_status != 'on' ){
                    console.log( 'Timer - Heating on' );
                    relayrunner.heat(true);
                    heating_status = 'on';
                }

                if( record.event == 'off' && heating_status != 'off' ){
                    console.log( 'Timer - Heating off' );
                    relayrunner.heat(false);
                    heating_status = 'off';
                }

            }else{
                //console.log( 'NO - ' + current_time + ' != ' + record.time + ' - ' + current_day );
            }

        });

    }

    setInterval(monitorFuture, 10000);

    function monitorFuture(){
        var now = moment();
        var onTimes = [];
        var offTimes = [];

        // look over each record and create a timestamp for each
        _.each(config, function(record){

            var hours = phpjs.substr(record.time,0,2);
            var mins = phpjs.substr(record.time,3,2);

            _.each(record.days, function(day){

                var daynumber = daytonumber(day);

                var recordMoment = moment();
                recordMoment.set('hour', hours);
                recordMoment.set('minute', mins);
                recordMoment.set('second', 0);
                recordMoment.day(daynumber);

                var difference = recordMoment.diff(now);
                var duration_moment = moment.duration(difference);

                if(record.event == 'on' && recordMoment > now ){
                    onTimes.push(
                        {
                            "unix" : recordMoment.valueOf(),
                            "time" : recordMoment.format("dddd, MMMM Do YYYY, h:mm:ss a"),
                            "duration" : duration_moment.hours() + 'h ' + duration_moment.minutes() + 'm'
                        }
                    );
                }

                if(record.event == 'off' && recordMoment > now ){
                    offTimes.push(
                        {
                            "unix" : recordMoment.valueOf(),
                            "time" : recordMoment.format("dddd, MMMM Do YYYY, h:mm:ss a"),
                            "duration" : duration_moment.hours() + 'h ' + duration_moment.minutes() + 'm'
                        }
                    );
                }
            });
        });

        // SORT
        function compare(a,b) {
            if (a.unix < b.unix)
                return -1;
            if (a.unix > b.unix)
                return 1;
            return 0;
        }

        onTimes.sort(compare);
        offTimes.sort(compare);

        //console.log(onTimes);
        //console.log(offTimes);

    }

    function daytonumber(day){
        switch(day){
            case 'sun':
                return 0;
                break;
            case 'mon':
                return 1;
                break;
            case 'tue':
                return 2;
                break;
            case 'wed':
                return 3;
                break;
            case 'thu':
                return 4;
                break;
            case 'fri':
                return 5;
                break;
            case 'sat':
                return 6;
                break;
        }
    }


    setInterval(monitorRoomTemp, 60000);
    var sys = require('util');
    var exec = require('child_process').exec;
    var child;
    function monitorRoomTemp(){

        child = exec("sudo python /home/pi/Downloads/node/test/bin/Adafruit_Python_DHT-master/examples/simpletest.py", function (error, stdout, stderr) {
            //console.log(stdout);

            // Temp=19.0*C  Humidity=49.0%
            var temp = stdout.match("Temp(.*)C");
            temp = parseFloat( temp[1] );
            //console.log( temp );
            temperature = temp;

            var hum = stdout.match("Humidity(.*)P");
            hum = parseFloat( hum[1] );
            //console.log( hum );
            humidity = hum;


            if (error !== null) {
                console.log('exec error: ' + error);
            }
        });

    };
    monitorRoomTemp();

    $this.getData = function(){

        var data = {};
        data.today = {};
        data.today.heat = {};

        data.today.heat.temperature = temperature;
        data.today.heat.humidity = humidity;
        data.today.heat.heating_status = heating_status;


        return data;

    };


    // gets fired when heating is toggled
    eventEmitter.on('heatButtonToggled', function(state){

        if(state == 1){
            heating_status = 'on';
        }

        if(state == 0){
            heating_status = 'off';
        }

        console.log('Heat control told button is now ' + heating_status);

    });



}

module.exports = heatcontrol;