/* global $ */

/**
* Simon in JavaScript.
* Another Front End challenge for Free Code Camp.
* http://www.FreeCodeCamp.com/
*/

'strict mode';

const audio = (function () {
  /**
   * Create a new audio context
   */
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const gainNode = audioCtx.createGain();
  gainNode.connect(audioCtx.destination);
  gainNode.gain.value = 0.01;
  let currGain = gainNode.gain.value; // eslint-disable-line no-unused-vars
  const waveType = 'sine';

  /**
   * Create oscillators for the four game buttons
   */
  let initializeOscillator = (frequency) => {
    let oscillator = audioCtx.createOscillator();
    oscillator.type = waveType;
    oscillator.frequency.value = frequency;
    oscillator.start(0);
    return oscillator;
  };

  const nw = initializeOscillator(440);
  const ne = initializeOscillator(554.37);
  const sw = initializeOscillator(659.25);
  const se = initializeOscillator(783.99);

  /**
   * Methods for starting each oscillator tone
   */
  let startTone = {
    connectOscillator: (oscillator) => {
      oscillator.connect(gainNode);
    },
    nw: function () {
      this.connectOscillator(nw);
    },
    ne: function () {
      this.connectOscillator(ne);
    },
    sw: function () {
      this.connectOscillator(sw);
    },
    se: function () {
      this.connectOscillator(se);
    }
  };

  /**
   * Methods for stopping each oscillator tone
   */
  let stopTone = {
    stop: (oscillator) => {
      currGain = 0;
      oscillator.disconnect(gainNode);
    },
    nw: function () {
      this.stop(nw);
    },
    ne: function () {
      this.stop(ne);
    },
    sw: function () {
      this.stop(sw);
    },
    se: function () {
      this.stop(se);
    }
  };

  return {
    nw: nw,
    ne: ne,
    sw: sw,
    se: se,
    startTone: startTone,
    stopTone: stopTone
  };
})();

const simon = (function () {
  const state = {
    colors: {
      nw: '#080',
      ne: '#F00',
      sw: '#FF0',
      se: '#00F'
    },
    colorsActive: {
      nw: '#8B8',
      ne: '#FAA',
      sw: '#FF9',
      se: '#99F'
    },
    availableSteps: ['nw', 'ne', 'sw', 'se'],
    computerSteps: [],
    playerSteps: [],
    strictMode: false,
    playerSecondChance: false,
    gameReset: false
  };

  const simonLogic = {

    getRandomInt: function (min, max) {
      return Math.floor(Math.random() * (max - min + 1) + min);
    },

    updateDisplay: function (value) {
      $('#display')
        .empty()
        .append(value);
    },

    /**
     * Runs recursivly until each index in computerSteps is played through
     */
    playComputerSteps: function (index) {
      if (state.gameReset) {
        return;
      }

      if (!state.computerSteps[index]) {
        this.playerTurn();
        return;
      }

      const currentStep = state.computerSteps[index];
      const stepId = `#${state.computerSteps[index]}`;
      const activeColor = state.colorsActive[state.computerSteps[index]];
      const defaultColor = state.colors[state.computerSteps[index]];

      const displayTurns = () => {
        return new Promise((resolve, reject) => {
          setTimeout(() => {
            $(stepId).css('background', activeColor);
            audio.startTone[currentStep]();
            resolve();
          }, 500);
        });
      };

      displayTurns()
      .then(() => {
        return new Promise((resolve, reject) => {
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
      if (state.computerSteps.length === 20) {
        return this.gameWin();
      }

      if (!state.playerSecondChance) {
        // add random step to compterSteps array
        var randomButtonIndex = this.getRandomInt(0, 3);
        state.computerSteps.push(state.availableSteps[randomButtonIndex]);
      }

      this.updateDisplay(state.computerSteps.length);

      this.playComputerSteps(0);
    },

    /**
     * Runs recursivly until player matches each index in computerSteps,
     * or until the player loses.
     */
    playerTurn: function () {
     // Simon buttons click handler
      $('.simon-buttons')
      .addClass('clickable')
      .mousedown((evt) => {
        $('#' + evt.target.id).css('background', state.colorsActive[evt.target.id]);
        audio.startTone[evt.target.id]();
      })
      .mouseup((evt) => {
        $('#' + evt.target.id).css('background', state.colors[evt.target.id]);
        audio.stopTone[evt.target.id]();
      })
      .on('click', (evt) => {
        evt.preventDefault();
        evt.stopPropagation();

        state.playerSteps.push(evt.target.id);
        const currentPlayerStepIndex = state.playerSteps.length - 1;

        // If player makes a correct step, run playerTurn again
        if (state.computerSteps[currentPlayerStepIndex] === state.playerSteps[currentPlayerStepIndex]) {
          return this.handleCorrectUserStep();
        }

        return this.handleIncorrectUserStep();
      });
    },

    handleCorrectUserStep: function () {
      // If final step is correct, it's the computer's turn
      if (state.computerSteps.length === state.playerSteps.length) {
        $('.simon-buttons')
          .off()
          .removeClass('clickable');
        state.playerSteps = [];

        if (state.playerSecondChance) {
          this.clearAnotherChance();
        }

        return this.computerTurn();
      }

      $('.simon-buttons')
          .off()
          .removeClass('clickable');

      return this.playerTurn();
    },

    handleIncorrectUserStep: function () {
      // if strictMode is false, player gets another chance
      if (!state.strictMode) {
        this.anotherChance();
        $('.simon-buttons')
          .off()
          .removeClass('clickable');
        state.playerSteps = [];
        return this.computerTurn();
      } else {
      // else, strictMode is true, which means game over
        this.gameLose();
        $('.simon-buttons')
          .off()
          .removeClass('clickable');
        return this.resetGame();
      }
    },

    clearMoves: function () {
      state.computerSteps = [];
      state.playerSteps = [];
      state.playerSecondChance = false;
    },

    resetGame: function () {
      this.clearMoves();
      this.updateDisplay('--');
      $('.simon-buttons')
        .off()
        .removeClass('clickable');
      $('#reset-button').off('click');
    },

    anotherChance: function () {
      $('.game-status')
        .empty()
        .append('<h2>WRONG! TRY AGAIN</h2>');
      state.playerSteps = [];
      state.playerSecondChance = true;
    },

    clearAnotherChance: function () {
      this.clearGameStatus();
      state.playerSecondChance = false;
    },

    gameWin: function () {
      $('.game-status').append('<h2>YOU WIN!</h2>');
      return setTimeout(() => {
        this.resetGame();
        this.clearGameStatus();
        this.computerTurn();
      }, 1000);
    },

    gameLose: function () {
      $('.game-status').empty().append('<h2>YOU LOSE!</h2>');
      return buttonLogic.start();
    },

    clearGameStatus: function () {
      $('.game-status').empty();
    }
  };

  const buttonLogic = {
    start: function () {
      $('#start-button').click(() => {
        state.gameReset = false;
        simonLogic.clearMoves();
        simonLogic.clearGameStatus();
        simonLogic.computerTurn();
        $('#start-button').off('click');
        return this.reset();
      });
    },

    reset: function () {
      $('#reset-button').click(() => {
        state.gameReset = true;
        simonLogic.resetGame();
        simonLogic.clearGameStatus();
        $('#reset-button').off('click');
        return this.start();
      });
    },

    strict: function () {
      $('#strict-mode-button').click(() => {
        state.strictMode = !state.strictMode;
        this.strictLightToggle();
      });
    },

    strictLightToggle: function () {
      $('#strict-mode-light').toggleClass('on');
    }

  };

  function init () {
    buttonLogic.start();
    buttonLogic.strict();
  }

  return {
    init: init
  };
})();

$(document).ready(function () {
  simon.init();
});
