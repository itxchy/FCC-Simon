/*!
* Simon in JavaScript.
* Another Front End challenge for Free Code Camp.
* http://www.FreeCodeCamp.com/
*/

const audio = (function () {

  // ******* Create a new audio context *******

	let audioCtx = new (window.AudioContext || window.webkitAudioContext)();
	let gainNode = audioCtx.createGain();
	gainNode.connect(audioCtx.destination);
	gainNode.gain.value = 0.01;
	let currGain = gainNode.gain.value;

	let waveType = 'sine';

  // ******* Create oscillators for the four game buttons *******

  let nw = audioCtx.createOscillator();
  nw.type = waveType;
  nw.frequency.value = 440;
  nw.start(0);
  
  let ne = audioCtx.createOscillator();
  ne.type = waveType;
  ne.frequency.value = 554.37;
  ne.start(0);
  
  let sw = audioCtx.createOscillator();
  sw.type = waveType;
  sw.frequency.value = 659.25;
  sw.start(0);
  
  let se = audioCtx.createOscillator();
  se.type = waveType;
  se.frequency.value = 783.99;
  se.start(0);

  // ******* Methods for starting each audio tone ******* 
  
  let startTone = {
    fadeIn: function () {
      setTimeout(function() {
        currGain = .1;
      }, 60);
    },
    nw: () => {
      nw.connect(gainNode);
      startTone.fadeIn();
    },
    ne: () => {
      ne.connect(gainNode);
      startTone.fadeIn();
    },
    sw: () => {
      sw.connect(gainNode);
			startTone.fadeIn();
    },
    se: () => {
      se.connect(gainNode);
      startTone.fadeIn();
    }
  };

  // ******* Methods for stopping each audio tone *******

  let stopTone = {
  	fadeOut: () => {
        currGain = 0;
  	},
  	nw: () => {
      stopTone.fadeOut();
  		setTimeout(() => {
  			nw.disconnect(gainNode);
  		}, 60);
  	},
  	ne: () => {
  		stopTone.fadeOut();
  		//ne.stop(audioCtx.currentTime + .2);
  		setTimeout(() => {
  			ne.disconnect(gainNode);
  		}, 60);
  	},
  	sw: () => {
  		stopTone.fadeOut();
  		//sw.stop(audioCtx.currentTime + .2);
  		setTimeout(() => {
  			sw.disconnect(gainNode);
  		}, 60);  		
  	},
  	se: () => {
  		stopTone.fadeOut();
  		//se.stop(audioCtx.currentTime + .2);
  		setTimeout(() => {
  			se.disconnect(gainNode);
  		}, 60);  		
  	}
  };

  return {
  	nw: nw,
  	ne: ne,
  	sw: sw,
  	se: se,
  	startTone: startTone,
  	stopTone: stopTone
  }

})();

const simon = (function () {

  const colors = {
    nw: '#080',
    ne: '#F00',
    sw: '#FF0',
    se: '#00F'
  };
  const colorsActive = {
    nw: '#8B8',
    ne: '#FAA',
    sw: '#FF9',
    se: '#99F'
  };
  const availableSteps = ['nw', 'ne', 'sw', 'se'];

  let computerSteps = [];
  let playerSteps = [];
  let strictMode = false;
  let playerSecondChance = false;

  let buttonLogic;

  function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min);
  }

  const simonLogic = {

		updateDisplay: function (value) {
			$('#display')
        .empty()
        .append(value);
      },

    showComputerSteps: function () {
      console.log('computer turn...');

      if (computerSteps.length === 20) {
        return simonLogic.gameWin();
      }

      if (!playerSecondChance) {
        // add random step to compterSteps array
        var randomButtonIndex = getRandomInt(0, 3);
        computerSteps.push(availableSteps[randomButtonIndex]);
        console.log('new computer step!: ', computerSteps);
      }

      // display current number of steps in step-count-display
      simonLogic.updateDisplay(computerSteps.length);

      // play through computerSteps with brightened button and sound
      function playComputerSteps (index) {

				if (!computerSteps[index]) {
					console.log('computer done playing!');
					simonLogic.playerTurn();
					return;
				}

				var currentStep = computerSteps[index];
        var stepId = `#${computerSteps[index]}`;
        var activeColor = colorsActive[computerSteps[index]];
        var defaultColor = colors[computerSteps[index]];

        function setColor(stepId, activeColor, resolve) {
          setTimeout(() => {
            $(stepId).css('background', activeColor);
            resolve();
          }, 500);
        }

        let promise = new Promise((resolve, reject) => {
          setColor(stepId, activeColor, resolve); 
          setTimeout(() => {
            audio.startTone[currentStep]();
          }, 500);
        })
        .then(() => {
          return new Promise(function(resolve, reject) {
            setColor(stepId, defaultColor, resolve);
            setTimeout(() => {
            	audio.stopTone[currentStep]();
            }, 500);
          });
        })
        .then(() => {
          playComputerSteps(index + 1);
        });
      }

      playComputerSteps(0);

    },

    playerTurn: function () {
    	console.log('players turn...');
      console.log('playerSteps at turn start', playerSteps);

     // make simon-buttons clickable
     $('.simon-buttons')
     	.addClass('clickable')
     	.mousedown(function(evt) {
     		$('#' + evt.target.id).css('background', colorsActive[evt.target.id]);
     		audio.startTone[evt.target.id]();
     	})
     	.mouseup(function(evt) {
     		$('#' + evt.target.id).css('background', colors[evt.target.id]);
     		audio.stopTone[evt.target.id]();
     	})
     	.on('click', function(evt) {
      	evt.preventDefault();
      	evt.stopPropagation();
      	var currentPlayerStepIndex;

      	playerSteps.push(evt.target.id);
      	currentPlayerStepIndex = playerSteps.length - 1;
      	console.log('player pressed: ' + evt.target.id);
      	console.log('playerSteps array: ', playerSteps);

      	if (computerSteps[currentPlayerStepIndex] === playerSteps[currentPlayerStepIndex]) {

      		if (computerSteps.length === playerSteps.length) {
      			$('.simon-buttons')
      				.off()
      				.removeClass('clickable');
      			playerSteps = [];

            if (playerSecondChance) {
              simonLogic.clearAnotherChance();
            }

            return simonLogic.showComputerSteps();
          }

          $('.simon-buttons')
              .off()
              .removeClass('clickable');

          return simonLogic.playerTurn();
        } 
        console.log('wrong move, is strictMode true or false?: ', strictMode);
        // if strictMode is false, player gets another chance
        if (!strictMode) {
          simonLogic.anotherChance();
          $('.simon-buttons')
            .off()
            .removeClass('clickable');
          playerSteps = [];
          return simonLogic.showComputerSteps();
        } else {
        // else, strictMode is true, which means game over    
      		console.log('Game Over!');
      		console.log('computerSteps[currentPlayerStepIndex]: ', computerSteps[currentPlayerStepIndex]);
      		console.log('playerSteps[currentPlayerStepIndex]: ', playerSteps[currentPlayerStepIndex]);
          simonLogic.gameLose();
          $('.simon-buttons')
            .off()
            .removeClass('clickable');
          return simonLogic.resetGame();
        }
      });
    },


    clearMoves: function() {
      computerSteps = [];
      playerSteps = [];
      playerSecondChance = false;
    },

    resetGame: function() {
      simonLogic.clearMoves();
      simonLogic.updateDisplay('--');
      $('.simon-buttons')
        .off()
        .removeClass('clickable');
      $('#reset-button').off('click');
    },

    anotherChance: function() {
      $('.game-status')
        .empty()
        .append('<h2>WRONG! TRY AGAIN</h2>');
      playerSteps = [];
      playerSecondChance = true;
    },

    clearAnotherChance: function() {
      simonLogic.clearGameStatus();
      playerSecondChance = false;
    },

    gameWin: function() {
      $('.game-status').append('<h2>YOU WIN!</h2>');
      return setTimeout(function() {
        simonLogic.resetGame();
        simonLogic.clearGameStatus();
        simonLogic.showComputerSteps();
      }, 1000);
    },

    gameLose: function() {
      $('.game-status').empty().append('<h2>YOU LOSE!</h2>');
      return buttonLogic.start();
    },

    clearGameStatus: function() {
      $('.game-status').empty();
    }
  };
  
  buttonLogic = {
    start: function () {
      $('#start-button').click( () => {   
        simonLogic.clearMoves();
        simonLogic.clearGameStatus();
        simonLogic.showComputerSteps();
        $('#start-button').off('click');
        return buttonLogic.reset();
      });
    },
    
    reset: function() {
      $('#reset-button').click( () => {
        console.log('reset button clicked');
        simonLogic.resetGame();
        simonLogic.clearGameStatus();
        $('#reset-button').off('click');
        return buttonLogic.start();
      });
    },

    strict: function() {
      $('#strict-mode-button').click( () => {
        strictMode = !strictMode;
        console.log('strictMode: ', strictMode);
        buttonLogic.strictLightToggle();
      });
    },

    strictLightToggle: function() {
      $('#strict-mode-light').toggleClass('on');
    }

  };
  
  function init () {
    buttonLogic.start();
    //buttonLogic.reset();
    buttonLogic.strict();
  }
  
  return {
    init: init,
    getRandomInt: getRandomInt
  };
  
})();

$(document).ready(function() {
  simon.init();
});
