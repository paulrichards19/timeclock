var _           = require('lodash');
var gpio        = require("pi-gpio");
var moment      = require("moment");

function button( eventEmitter) {

    var $this = this;

    // pin from switch
    var inputPin = 22;

    gpio.close(inputPin);

    var multiPressGap = 600;
    //var longPressWaitMin = 1000;
    var lastDownPress = moment();
    var lastUpPress = moment();
    var multiCount = 0;
    var multiTimeout;

    /**
     * This is a push to break button, so it is on ('1') by default
     * @param direction
     */
    function onPress(direction){
        var now = moment();

        // only interesting in an event when the button is released
        if( direction == 1 ){

            var duration = moment.duration(now.diff(lastDownPress));
            var gapToLastPressDown = duration.asMilliseconds();
            //console.log('Gap to last press down (press length): '+ gapToLastPressDown );

            var duration = moment.duration(now.diff(lastUpPress));
            var gapToLastPressUp = duration.asMilliseconds();
            //console.log('Gap to last press up (between presses): '+ gapToLastPressUp );

            if( gapToLastPressUp <= multiPressGap ){
                multiCount++;
                clearTimeout(multiTimeout);
                multiTimeout = setTimeout(function(){
                    //ready to emit multi events
                    switch(multiCount){
                        case 1:
                            console.log( 'Emit double press' );
                            eventEmitter.emit('doublepressed:switch');
                            break;
                        case 2:
                            console.log( 'Emit triple press' );
                            eventEmitter.emit('triplepressed:switch');
                            break;
                        case 3:
                            // could be loads more, but will ignore
                            break;
                    }
                },multiPressGap);
            }else{
                multiCount = 0;
                clearTimeout(multiTimeout);
                multiTimeout = setTimeout(function(){
                    console.log( 'Emit single press' );
                    eventEmitter.emit('pressed:switch');
                },multiPressGap);
            }

        }

        // onPressDown
        if( direction == 0 ){
            lastDownPress = now;
        }

        // onPressUp
        if( direction == 1 ){
            lastUpPress = now;
        }

    }

    // delay the startup first time
    setTimeout(function(){

        gpio.open(inputPin, "input", function (err) {
            // its always on, a push breaks connection
            var currentValue = 1;
            var lastPress = moment();

            setInterval(function(){
                //var pressTime;
                gpio.read(inputPin, function(err, value) {

                    if( currentValue != value ){
                        currentValue = value;
                        onPress(currentValue);
                    }

                });

            },100);

        });

    },1000);

}

module.exports = button;