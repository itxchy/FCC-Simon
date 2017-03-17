/**
* Simon in JavaScript.
* Another Front End challenge for Free Code Camp.
* http://www.FreeCodeCamp.com/
*/

'strict mode';

const audio = (function () {

  // ******* Create a new audio context *******

	const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
	const gainNode = audioCtx.createGain();
	gainNode.connect(audioCtx.destination);
	gainNode.gain.value = 0.01;
	let currGain = gainNode.gain.value;
	const waveType = 'sine';

  // ******* Create oscillators for the four game buttons *******

  let initializeOscillator = (frequency) => {
    let oscillator = audioCtx.createOscillator();
    oscillator.type = waveType;
    oscillator.frequency.value = frequency;
    oscillator.start(0)
    return oscillator
  }

  const nw = initializeOscillator(440)
  const ne = initializeOscillator(554.37)
  const sw = initializeOscillator(659.25)
  const se = initializeOscillator(783.99)

  // ******* Methods for starting each audio tone ******* 
  
  let startTone = {
    connectOscillator: (oscillator) => {
      oscillator.connect(gainNode);
    },
    nw: function () {
      this.connectOscillator(nw)
    },
    ne: function () {
      this.connectOscillator(ne)
    },
    sw: function () {
      this.connectOscillator(sw)
    },
    se: function () {
      this.connectOscillator(se)
    }
  };

  // ******* Methods for stopping each audio tone *******

  let stopTone = {
    stop: (oscillator) => {
      currGain = 0
      oscillator.disconnect(gainNode)
    },
    nw: function () {
      this.stop(nw)
    },
    ne: function () {
      this.stop(ne)
    },
    sw: function () {
      this.stop(sw)
    },
    se: function () {
      this.stop(se)
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
  
  // ******* Game State *******

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

  function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min);
  }

  const simonLogic = {

		updateDisplay: function (value) {
			$('#display')
        .empty()
        .append(value);
      },

    /**
     * Runs recursivly until each index in computerSteps is played through
     */
    playComputerSteps: function (index) {
      if (!computerSteps[index]) {
        simonLogic.playerTurn();
        return;
      }

      const currentStep = computerSteps[index];
      const stepId = `#${computerSteps[index]}`;
      const activeColor = colorsActive[computerSteps[index]];
      const defaultColor = colors[computerSteps[index]];


      const displayTurns = () => {
        return new Promise((resolve, reject) => {
          setTimeout(() => {
            $(stepId).css('background', activeColor);
            audio.startTone[currentStep]();
            resolve();
          }, 500);
        })
      }

      displayTurns()
      .then(() => {
        return new Promise(function(resolve, reject) {
          setTimeout(() => {
            $(stepId).css('background', defaultColor);
            audio.stopTone[currentStep]();
            resolve();
          }, 500);
        });
      })
      .then(() => {
          this.playComputerSteps(index + 1);
      });
    },

    computerTurn: function () {

      if (computerSteps.length === 20) {
        return simonLogic.gameWin();
      }

      if (!playerSecondChance) {
        // add random step to compterSteps array
        var randomButtonIndex = getRandomInt(0, 3);
        computerSteps.push(availableSteps[randomButtonIndex]);
      }

      simonLogic.updateDisplay(computerSteps.length);
    
      this.playComputerSteps(0);
    },

    playerTurn: function () {

     // make simon-buttons clickable
     $('.simon-buttons')
     	.addClass('clickable')
     	.mousedown(function(evt) {
     		$('#' + evt.target.id).css('background', colorsActive[evt.target.id]);
        console.log('PLAYER TONE STARTING', evt)
     		audio.startTone[evt.target.id]();
     	})
     	.mouseup(function(evt) {
     		$('#' + evt.target.id).css('background', colors[evt.target.id]);
        console.log('PLAYER TONE ENDING')
     		audio.stopTone[evt.target.id]();
     	})
     	.on('click', function(evt) {
      	evt.preventDefault();
      	evt.stopPropagation();
      	var currentPlayerStepIndex;

      	playerSteps.push(evt.target.id);
      	currentPlayerStepIndex = playerSteps.length - 1;

      	if (computerSteps[currentPlayerStepIndex] === playerSteps[currentPlayerStepIndex]) {

      		if (computerSteps.length === playerSteps.length) {
      			$('.simon-buttons')
      				.off()
      				.removeClass('clickable');
      			playerSteps = [];

            if (playerSecondChance) {
              simonLogic.clearAnotherChance();
            }

            return simonLogic.computerTurn();
          }

          $('.simon-buttons')
              .off()
              .removeClass('clickable');

          return simonLogic.playerTurn();
        } 
        // if strictMode is false, player gets another chance
        if (!strictMode) {
          simonLogic.anotherChance();
          $('.simon-buttons')
            .off()
            .removeClass('clickable');
          playerSteps = [];
          return simonLogic.computerTurn();
        } else {
        // else, strictMode is true, which means game over    
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
        simonLogic.computerTurn();
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
  
  const buttonLogic = {
    start: function () {
      $('#start-button').click( () => {   
        simonLogic.clearMoves();
        simonLogic.clearGameStatus();
        simonLogic.computerTurn();
        $('#start-button').off('click');
        return buttonLogic.reset();
      });
    },
    
    reset: function() {
      $('#reset-button').click( () => {
        simonLogic.resetGame();
        simonLogic.clearGameStatus();
        $('#reset-button').off('click');
        return buttonLogic.start();
      });
    },

    strict: function() {
      $('#strict-mode-button').click( () => {
        strictMode = !strictMode;
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
