var _           = require('lodash');
var gpio        = require("pi-gpio");

function relay( eventEmitter) {

    var $this = this;

    //replay pin
    var relayPin = 16;

    gpio.close(relayPin);


    eventEmitter.on('change:heat', function(state){

        if( state ){

            // lets turn on the LED
            gpio.open(relayPin, "output", function(){
                gpio.write(relayPin, 1);
            });


        }else{

            // lets switch of the LED
            gpio.open(relayPin, "output", function(){
                gpio.write(relayPin, 0);
            });

        }

    });

}

module.exports = relay;