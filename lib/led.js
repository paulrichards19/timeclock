var _           = require('lodash');
var gpio        = require("pi-gpio");

function led( eventEmitter) {

    var $this = this;

    // LED 1 output
    var ledOutputPin = 18;

    gpio.close(ledOutputPin);

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

module.exports = led;