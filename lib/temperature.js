
var DatastoreClass = require('./datastore');
var datastore = new DatastoreClass();

function temperature() {

    // record the temperature every x mins
    var record_interval = 5;
    var current_temp = 0;
    var current_hum = 0;

    setInterval(monitorRoomTemp, 1000 * 60 * record_interval );
    var sys = require('util');
    var exec = require('child_process').exec;
    var child;

    function monitorRoomTemp(){

        child = exec("sudo python /home/pi/Downloads/node/test/bin/Adafruit_Python_DHT-master/examples/simpletest.py", function (error, stdout, stderr) {

            // Temp=19.0*C  Humidity=49.0%
            var temp = stdout.match("Temp(.*)C");
            temp = parseFloat( temp[1] );

            current_temp = temp;

            var hum = stdout.match("Humidity(.*)P");
            hum = parseFloat( hum[1] );

            current_hum = hum;

            datastore.saveSensorReading({
                type: 'dht22',
                name: 'downstairs',
                temperature: current_temp,
                humidity: current_hum,
                date: new Date
            });

            if (error !== null) {
                console.log('exec error: ' + error);
            }

        });

    };
    // run straight away
    monitorRoomTemp();

    this.getData = function(){

        var data = {};
        data.today = {};
        data.today.heat = {};

        data.today.heat.temperature = current_temp;
        data.today.heat.humidity = current_hum;

        return data;

    };

    this.getReadings = function(){
      return {
          temperature: current_temp,
          humidity: current_hum
      }
    };


}

module.exports = temperature;