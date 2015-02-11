var _           = require('lodash');
var gpio        = require("pi-gpio");

function ledSwitch( eventEmitter) {

    var $this = this;

    // pin from switch
    var inputPin = 22;

    // LED 1 output
    var ledOutputPin = 18;

    gpio.close(inputPin);
    gpio.close(ledOutputPin);

    var debounced = _.debounce(function(err, value) {

        console.log('Switch pressed');

        eventEmitter.emit('pressed:switch');

    },400,true);


    // delay the statup first time

    setTimeout(function(){

        gpio.open(inputPin, "input", function (err) {
            // its always on, a push breaks connection
            var currentValue = 1;

            setInterval(function(){
                //var pressTime;
                gpio.read(inputPin, function(err, value) {

                    //pressTime = Date.now();
                    if( currentValue != value ){
                        currentValue = value;
                        debounced();
                    }

                });

            },100);

        });

    },5000);


    eventEmitter.on('change:heat', function(state){

        if( state == 1 ){

            // lets turn on the LED
            gpio.open(ledOutputPin, "output", function(){
                gpio.write(ledOutputPin, 1);
            });


        }else{

            // lets switch of the LED
            gpio.open(ledOutputPin, "output", function(){
                gpio.write(ledOutputPin, 0);
            });

        }

    });

}

module.exports = ledSwitch;