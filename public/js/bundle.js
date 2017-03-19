'use strict';
/* global $ */

/**
* Simon in JavaScript.
* Another Front End challenge for Free Code Camp.
* http://www.FreeCodeCamp.com/
*/

'strict mode';

var audio = function () {
  /**
   * Create a new audio context
   */
  var audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  var gainNode = audioCtx.createGain();
  gainNode.connect(audioCtx.destination);
  gainNode.gain.value = 0.01;
  var currGain = gainNode.gain.value; // eslint-disable-line no-unused-vars
  var waveType = 'sine';

  /**
   * Create oscillators for the four game buttons
   */
  var initializeOscillator = function initializeOscillator(frequency) {
    var oscillator = audioCtx.createOscillator();
    oscillator.type = waveType;
    oscillator.frequency.value = frequency;
    oscillator.start(0);
    return oscillator;
  };

  var _nw = initializeOscillator(440);
  var _ne = initializeOscillator(554.37);
  var _sw = initializeOscillator(659.25);
  var _se = initializeOscillator(783.99);

  /**
   * Methods for starting each oscillator tone
   */
  var startTone = {
    connectOscillator: function connectOscillator(oscillator) {
      oscillator.connect(gainNode);
    },
    nw: function nw() {
      this.connectOscillator(_nw);
    },
    ne: function ne() {
      this.connectOscillator(_ne);
    },
    sw: function sw() {
      this.connectOscillator(_sw);
    },
    se: function se() {
      this.connectOscillator(_se);
    }
  };

  /**
   * Methods for stopping each oscillator tone
   */
  var stopTone = {
    stop: function stop(oscillator) {
      currGain = 0;
      oscillator.disconnect(gainNode);
    },
    nw: function nw() {
      this.stop(_nw);
    },
    ne: function ne() {
      this.stop(_ne);
    },
    sw: function sw() {
      this.stop(_sw);
    },
    se: function se() {
      this.stop(_se);
    }
  };

  return {
    nw: _nw,
    ne: _ne,
    sw: _sw,
    se: _se,
    startTone: startTone,
    stopTone: stopTone
  };
}();

var simon = function () {
  /**
   * Game State
   */

  var state = {
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

  // const colors = {
  //   nw: '#080',
  //   ne: '#F00',
  //   sw: '#FF0',
  //   se: '#00F'
  // };
  // const colorsActive = {
  //   nw: '#8B8',
  //   ne: '#FAA',
  //   sw: '#FF9',
  //   se: '#99F'
  // };
  // const availableSteps = ['nw', 'ne', 'sw', 'se'];

  // let computerSteps = [];
  // let playerSteps = [];
  // let strictMode = false;
  // let playerSecondChance = false;
  // let gameReset = false;

  var simonLogic = {

    getRandomInt: function getRandomInt(min, max) {
      return Math.floor(Math.random() * (max - min + 1) + min);
    },

    updateDisplay: function updateDisplay(value) {
      $('#display').empty().append(value);
    },

    /**
     * Runs recursivly until each index in computerSteps is played through
     */
    playComputerSteps: function playComputerSteps(index) {
      var _this = this;

      if (state.gameReset) {
        return;
      }

      if (!state.computerSteps[index]) {
        this.playerTurn();
        return;
      }

      var currentStep = state.computerSteps[index];
      var stepId = '#' + state.computerSteps[index];
      var activeColor = state.colorsActive[state.computerSteps[index]];
      var defaultColor = state.colors[state.computerSteps[index]];

      var displayTurns = function displayTurns() {
        return new Promise(function (resolve, reject) {
          setTimeout(function () {
            $(stepId).css('background', activeColor);
            audio.startTone[currentStep]();
            resolve();
          }, 500);
        });
      };

      displayTurns().then(function () {
        return new Promise(function (resolve, reject) {
          setTimeout(function () {
            $(stepId).css('background', defaultColor);
            audio.stopTone[currentStep]();
            resolve();
          }, 500);
        });
      }).then(function () {
        _this.playComputerSteps(index + 1);
      });
    },

    computerTurn: function computerTurn() {
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
    playerTurn: function playerTurn() {
      var _this2 = this;

      // Simon buttons click handler
      $('.simon-buttons').addClass('clickable').mousedown(function (evt) {
        $('#' + evt.target.id).css('background', state.colorsActive[evt.target.id]);
        audio.startTone[evt.target.id]();
      }).mouseup(function (evt) {
        $('#' + evt.target.id).css('background', state.colors[evt.target.id]);
        audio.stopTone[evt.target.id]();
      }).on('click', function (evt) {
        evt.preventDefault();
        evt.stopPropagation();

        state.playerSteps.push(evt.target.id);
        var currentPlayerStepIndex = state.playerSteps.length - 1;

        // If player makes a correct step, run playerTurn again
        if (state.computerSteps[currentPlayerStepIndex] === state.playerSteps[currentPlayerStepIndex]) {
          return _this2.handleCorrectUserStep();
        }

        return _this2.handleIncorrectUserStep();
      });
    },

    handleCorrectUserStep: function handleCorrectUserStep() {
      // If final step is correct, it's the computer's turn
      if (state.computerSteps.length === state.playerSteps.length) {
        $('.simon-buttons').off().removeClass('clickable');
        state.playerSteps = [];

        if (state.playerSecondChance) {
          this.clearAnotherChance();
        }

        return this.computerTurn();
      }

      $('.simon-buttons').off().removeClass('clickable');

      return this.playerTurn();
    },

    handleIncorrectUserStep: function handleIncorrectUserStep() {
      // if strictMode is false, player gets another chance
      if (!state.strictMode) {
        this.anotherChance();
        $('.simon-buttons').off().removeClass('clickable');
        state.playerSteps = [];
        return this.computerTurn();
      } else {
        // else, strictMode is true, which means game over
        this.gameLose();
        $('.simon-buttons').off().removeClass('clickable');
        return this.resetGame();
      }
    },

    clearMoves: function clearMoves() {
      state.computerSteps = [];
      state.playerSteps = [];
      state.playerSecondChance = false;
    },

    resetGame: function resetGame() {
      this.clearMoves();
      this.updateDisplay('--');
      $('.simon-buttons').off().removeClass('clickable');
      $('#reset-button').off('click');
    },

    anotherChance: function anotherChance() {
      $('.game-status').empty().append('<h2>WRONG! TRY AGAIN</h2>');
      state.playerSteps = [];
      state.playerSecondChance = true;
    },

    clearAnotherChance: function clearAnotherChance() {
      this.clearGameStatus();
      state.playerSecondChance = false;
    },

    gameWin: function gameWin() {
      var _this3 = this;

      $('.game-status').append('<h2>YOU WIN!</h2>');
      return setTimeout(function () {
        _this3.resetGame();
        _this3.clearGameStatus();
        _this3.computerTurn();
      }, 1000);
    },

    gameLose: function gameLose() {
      $('.game-status').empty().append('<h2>YOU LOSE!</h2>');
      return buttonLogic.start();
    },

    clearGameStatus: function clearGameStatus() {
      $('.game-status').empty();
    }
  };

  var buttonLogic = {
    start: function start() {
      var _this4 = this;

      $('#start-button').click(function () {
        state.gameReset = false;
        simonLogic.clearMoves();
        simonLogic.clearGameStatus();
        simonLogic.computerTurn();
        $('#start-button').off('click');
        return _this4.reset();
      });
    },

    reset: function reset() {
      var _this5 = this;

      $('#reset-button').click(function () {
        state.gameReset = true;
        simonLogic.resetGame();
        simonLogic.clearGameStatus();
        $('#reset-button').off('click');
        return _this5.start();
      });
    },

    strict: function strict() {
      var _this6 = this;

      $('#strict-mode-button').click(function () {
        state.strictMode = !state.strictMode;
        _this6.strictLightToggle();
      });
    },

    strictLightToggle: function strictLightToggle() {
      $('#strict-mode-light').toggleClass('on');
    }

  };

  function init() {
    buttonLogic.start();
    buttonLogic.strict();
  }

  return {
    init: init
  };
}();

$(document).ready(function () {
  simon.init();
});
//# sourceMappingURL=data:application/json;base64,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Iiwic291cmNlc0NvbnRlbnQiOlsiLyogZ2xvYmFsICQgKi9cblxuLyoqXG4qIFNpbW9uIGluIEphdmFTY3JpcHQuXG4qIEFub3RoZXIgRnJvbnQgRW5kIGNoYWxsZW5nZSBmb3IgRnJlZSBDb2RlIENhbXAuXG4qIGh0dHA6Ly93d3cuRnJlZUNvZGVDYW1wLmNvbS9cbiovXG5cbidzdHJpY3QgbW9kZSc7XG5cbmNvbnN0IGF1ZGlvID0gKGZ1bmN0aW9uICgpIHtcbiAgLyoqXG4gICAqIENyZWF0ZSBhIG5ldyBhdWRpbyBjb250ZXh0XG4gICAqL1xuICBjb25zdCBhdWRpb0N0eCA9IG5ldyAod2luZG93LkF1ZGlvQ29udGV4dCB8fCB3aW5kb3cud2Via2l0QXVkaW9Db250ZXh0KSgpO1xuICBjb25zdCBnYWluTm9kZSA9IGF1ZGlvQ3R4LmNyZWF0ZUdhaW4oKTtcbiAgZ2Fpbk5vZGUuY29ubmVjdChhdWRpb0N0eC5kZXN0aW5hdGlvbik7XG4gIGdhaW5Ob2RlLmdhaW4udmFsdWUgPSAwLjAxO1xuICBsZXQgY3VyckdhaW4gPSBnYWluTm9kZS5nYWluLnZhbHVlOyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLXVudXNlZC12YXJzXG4gIGNvbnN0IHdhdmVUeXBlID0gJ3NpbmUnO1xuXG4gIC8qKlxuICAgKiBDcmVhdGUgb3NjaWxsYXRvcnMgZm9yIHRoZSBmb3VyIGdhbWUgYnV0dG9uc1xuICAgKi9cbiAgbGV0IGluaXRpYWxpemVPc2NpbGxhdG9yID0gKGZyZXF1ZW5jeSkgPT4ge1xuICAgIGxldCBvc2NpbGxhdG9yID0gYXVkaW9DdHguY3JlYXRlT3NjaWxsYXRvcigpO1xuICAgIG9zY2lsbGF0b3IudHlwZSA9IHdhdmVUeXBlO1xuICAgIG9zY2lsbGF0b3IuZnJlcXVlbmN5LnZhbHVlID0gZnJlcXVlbmN5O1xuICAgIG9zY2lsbGF0b3Iuc3RhcnQoMCk7XG4gICAgcmV0dXJuIG9zY2lsbGF0b3I7XG4gIH07XG5cbiAgY29uc3QgbncgPSBpbml0aWFsaXplT3NjaWxsYXRvcig0NDApO1xuICBjb25zdCBuZSA9IGluaXRpYWxpemVPc2NpbGxhdG9yKDU1NC4zNyk7XG4gIGNvbnN0IHN3ID0gaW5pdGlhbGl6ZU9zY2lsbGF0b3IoNjU5LjI1KTtcbiAgY29uc3Qgc2UgPSBpbml0aWFsaXplT3NjaWxsYXRvcig3ODMuOTkpO1xuXG4gIC8qKlxuICAgKiBNZXRob2RzIGZvciBzdGFydGluZyBlYWNoIG9zY2lsbGF0b3IgdG9uZVxuICAgKi9cbiAgbGV0IHN0YXJ0VG9uZSA9IHtcbiAgICBjb25uZWN0T3NjaWxsYXRvcjogKG9zY2lsbGF0b3IpID0+IHtcbiAgICAgIG9zY2lsbGF0b3IuY29ubmVjdChnYWluTm9kZSk7XG4gICAgfSxcbiAgICBudzogZnVuY3Rpb24gKCkge1xuICAgICAgdGhpcy5jb25uZWN0T3NjaWxsYXRvcihudyk7XG4gICAgfSxcbiAgICBuZTogZnVuY3Rpb24gKCkge1xuICAgICAgdGhpcy5jb25uZWN0T3NjaWxsYXRvcihuZSk7XG4gICAgfSxcbiAgICBzdzogZnVuY3Rpb24gKCkge1xuICAgICAgdGhpcy5jb25uZWN0T3NjaWxsYXRvcihzdyk7XG4gICAgfSxcbiAgICBzZTogZnVuY3Rpb24gKCkge1xuICAgICAgdGhpcy5jb25uZWN0T3NjaWxsYXRvcihzZSk7XG4gICAgfVxuICB9O1xuXG4gIC8qKlxuICAgKiBNZXRob2RzIGZvciBzdG9wcGluZyBlYWNoIG9zY2lsbGF0b3IgdG9uZVxuICAgKi9cbiAgbGV0IHN0b3BUb25lID0ge1xuICAgIHN0b3A6IChvc2NpbGxhdG9yKSA9PiB7XG4gICAgICBjdXJyR2FpbiA9IDA7XG4gICAgICBvc2NpbGxhdG9yLmRpc2Nvbm5lY3QoZ2Fpbk5vZGUpO1xuICAgIH0sXG4gICAgbnc6IGZ1bmN0aW9uICgpIHtcbiAgICAgIHRoaXMuc3RvcChudyk7XG4gICAgfSxcbiAgICBuZTogZnVuY3Rpb24gKCkge1xuICAgICAgdGhpcy5zdG9wKG5lKTtcbiAgICB9LFxuICAgIHN3OiBmdW5jdGlvbiAoKSB7XG4gICAgICB0aGlzLnN0b3Aoc3cpO1xuICAgIH0sXG4gICAgc2U6IGZ1bmN0aW9uICgpIHtcbiAgICAgIHRoaXMuc3RvcChzZSk7XG4gICAgfVxuICB9O1xuXG4gIHJldHVybiB7XG4gICAgbnc6IG53LFxuICAgIG5lOiBuZSxcbiAgICBzdzogc3csXG4gICAgc2U6IHNlLFxuICAgIHN0YXJ0VG9uZTogc3RhcnRUb25lLFxuICAgIHN0b3BUb25lOiBzdG9wVG9uZVxuICB9O1xufSkoKTtcblxuY29uc3Qgc2ltb24gPSAoZnVuY3Rpb24gKCkge1xuICAvKipcbiAgICogR2FtZSBTdGF0ZVxuICAgKi9cblxuICBjb25zdCBzdGF0ZSA9IHtcbiAgICBjb2xvcnM6IHtcbiAgICAgIG53OiAnIzA4MCcsXG4gICAgICBuZTogJyNGMDAnLFxuICAgICAgc3c6ICcjRkYwJyxcbiAgICAgIHNlOiAnIzAwRidcbiAgICB9LFxuICAgIGNvbG9yc0FjdGl2ZToge1xuICAgICAgbnc6ICcjOEI4JyxcbiAgICAgIG5lOiAnI0ZBQScsXG4gICAgICBzdzogJyNGRjknLFxuICAgICAgc2U6ICcjOTlGJ1xuICAgIH0sXG4gICAgYXZhaWxhYmxlU3RlcHM6IFsnbncnLCAnbmUnLCAnc3cnLCAnc2UnXSxcbiAgICBjb21wdXRlclN0ZXBzOiBbXSxcbiAgICBwbGF5ZXJTdGVwczogW10sXG4gICAgc3RyaWN0TW9kZTogZmFsc2UsXG4gICAgcGxheWVyU2Vjb25kQ2hhbmNlOiBmYWxzZSxcbiAgICBnYW1lUmVzZXQ6IGZhbHNlXG4gIH07XG5cbiAgLy8gY29uc3QgY29sb3JzID0ge1xuICAvLyAgIG53OiAnIzA4MCcsXG4gIC8vICAgbmU6ICcjRjAwJyxcbiAgLy8gICBzdzogJyNGRjAnLFxuICAvLyAgIHNlOiAnIzAwRidcbiAgLy8gfTtcbiAgLy8gY29uc3QgY29sb3JzQWN0aXZlID0ge1xuICAvLyAgIG53OiAnIzhCOCcsXG4gIC8vICAgbmU6ICcjRkFBJyxcbiAgLy8gICBzdzogJyNGRjknLFxuICAvLyAgIHNlOiAnIzk5RidcbiAgLy8gfTtcbiAgLy8gY29uc3QgYXZhaWxhYmxlU3RlcHMgPSBbJ253JywgJ25lJywgJ3N3JywgJ3NlJ107XG5cbiAgLy8gbGV0IGNvbXB1dGVyU3RlcHMgPSBbXTtcbiAgLy8gbGV0IHBsYXllclN0ZXBzID0gW107XG4gIC8vIGxldCBzdHJpY3RNb2RlID0gZmFsc2U7XG4gIC8vIGxldCBwbGF5ZXJTZWNvbmRDaGFuY2UgPSBmYWxzZTtcbiAgLy8gbGV0IGdhbWVSZXNldCA9IGZhbHNlO1xuXG4gIGNvbnN0IHNpbW9uTG9naWMgPSB7XG5cbiAgICBnZXRSYW5kb21JbnQ6IGZ1bmN0aW9uIChtaW4sIG1heCkge1xuICAgICAgcmV0dXJuIE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIChtYXggLSBtaW4gKyAxKSArIG1pbik7XG4gICAgfSxcblxuICAgIHVwZGF0ZURpc3BsYXk6IGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgJCgnI2Rpc3BsYXknKVxuICAgICAgICAuZW1wdHkoKVxuICAgICAgICAuYXBwZW5kKHZhbHVlKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogUnVucyByZWN1cnNpdmx5IHVudGlsIGVhY2ggaW5kZXggaW4gY29tcHV0ZXJTdGVwcyBpcyBwbGF5ZWQgdGhyb3VnaFxuICAgICAqL1xuICAgIHBsYXlDb21wdXRlclN0ZXBzOiBmdW5jdGlvbiAoaW5kZXgpIHtcbiAgICAgIGlmIChzdGF0ZS5nYW1lUmVzZXQpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICBpZiAoIXN0YXRlLmNvbXB1dGVyU3RlcHNbaW5kZXhdKSB7XG4gICAgICAgIHRoaXMucGxheWVyVHVybigpO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IGN1cnJlbnRTdGVwID0gc3RhdGUuY29tcHV0ZXJTdGVwc1tpbmRleF07XG4gICAgICBjb25zdCBzdGVwSWQgPSBgIyR7c3RhdGUuY29tcHV0ZXJTdGVwc1tpbmRleF19YDtcbiAgICAgIGNvbnN0IGFjdGl2ZUNvbG9yID0gc3RhdGUuY29sb3JzQWN0aXZlW3N0YXRlLmNvbXB1dGVyU3RlcHNbaW5kZXhdXTtcbiAgICAgIGNvbnN0IGRlZmF1bHRDb2xvciA9IHN0YXRlLmNvbG9yc1tzdGF0ZS5jb21wdXRlclN0ZXBzW2luZGV4XV07XG5cbiAgICAgIGNvbnN0IGRpc3BsYXlUdXJucyA9ICgpID0+IHtcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgICAgICQoc3RlcElkKS5jc3MoJ2JhY2tncm91bmQnLCBhY3RpdmVDb2xvcik7XG4gICAgICAgICAgICBhdWRpby5zdGFydFRvbmVbY3VycmVudFN0ZXBdKCk7XG4gICAgICAgICAgICByZXNvbHZlKCk7XG4gICAgICAgICAgfSwgNTAwKTtcbiAgICAgICAgfSk7XG4gICAgICB9O1xuXG4gICAgICBkaXNwbGF5VHVybnMoKVxuICAgICAgLnRoZW4oKCkgPT4ge1xuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICAgICAgJChzdGVwSWQpLmNzcygnYmFja2dyb3VuZCcsIGRlZmF1bHRDb2xvcik7XG4gICAgICAgICAgICBhdWRpby5zdG9wVG9uZVtjdXJyZW50U3RlcF0oKTtcbiAgICAgICAgICAgIHJlc29sdmUoKTtcbiAgICAgICAgICB9LCA1MDApO1xuICAgICAgICB9KTtcbiAgICAgIH0pXG4gICAgICAudGhlbigoKSA9PiB7XG4gICAgICAgIHRoaXMucGxheUNvbXB1dGVyU3RlcHMoaW5kZXggKyAxKTtcbiAgICAgIH0pO1xuICAgIH0sXG5cbiAgICBjb21wdXRlclR1cm46IGZ1bmN0aW9uICgpIHtcbiAgICAgIGlmIChzdGF0ZS5jb21wdXRlclN0ZXBzLmxlbmd0aCA9PT0gMjApIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZ2FtZVdpbigpO1xuICAgICAgfVxuXG4gICAgICBpZiAoIXN0YXRlLnBsYXllclNlY29uZENoYW5jZSkge1xuICAgICAgICAvLyBhZGQgcmFuZG9tIHN0ZXAgdG8gY29tcHRlclN0ZXBzIGFycmF5XG4gICAgICAgIHZhciByYW5kb21CdXR0b25JbmRleCA9IHRoaXMuZ2V0UmFuZG9tSW50KDAsIDMpO1xuICAgICAgICBzdGF0ZS5jb21wdXRlclN0ZXBzLnB1c2goc3RhdGUuYXZhaWxhYmxlU3RlcHNbcmFuZG9tQnV0dG9uSW5kZXhdKTtcbiAgICAgIH1cblxuICAgICAgdGhpcy51cGRhdGVEaXNwbGF5KHN0YXRlLmNvbXB1dGVyU3RlcHMubGVuZ3RoKTtcblxuICAgICAgdGhpcy5wbGF5Q29tcHV0ZXJTdGVwcygwKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogUnVucyByZWN1cnNpdmx5IHVudGlsIHBsYXllciBtYXRjaGVzIGVhY2ggaW5kZXggaW4gY29tcHV0ZXJTdGVwcyxcbiAgICAgKiBvciB1bnRpbCB0aGUgcGxheWVyIGxvc2VzLlxuICAgICAqL1xuICAgIHBsYXllclR1cm46IGZ1bmN0aW9uICgpIHtcbiAgICAgLy8gU2ltb24gYnV0dG9ucyBjbGljayBoYW5kbGVyXG4gICAgICAkKCcuc2ltb24tYnV0dG9ucycpXG4gICAgICAuYWRkQ2xhc3MoJ2NsaWNrYWJsZScpXG4gICAgICAubW91c2Vkb3duKChldnQpID0+IHtcbiAgICAgICAgJCgnIycgKyBldnQudGFyZ2V0LmlkKS5jc3MoJ2JhY2tncm91bmQnLCBzdGF0ZS5jb2xvcnNBY3RpdmVbZXZ0LnRhcmdldC5pZF0pO1xuICAgICAgICBhdWRpby5zdGFydFRvbmVbZXZ0LnRhcmdldC5pZF0oKTtcbiAgICAgIH0pXG4gICAgICAubW91c2V1cCgoZXZ0KSA9PiB7XG4gICAgICAgICQoJyMnICsgZXZ0LnRhcmdldC5pZCkuY3NzKCdiYWNrZ3JvdW5kJywgc3RhdGUuY29sb3JzW2V2dC50YXJnZXQuaWRdKTtcbiAgICAgICAgYXVkaW8uc3RvcFRvbmVbZXZ0LnRhcmdldC5pZF0oKTtcbiAgICAgIH0pXG4gICAgICAub24oJ2NsaWNrJywgKGV2dCkgPT4ge1xuICAgICAgICBldnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgZXZ0LnN0b3BQcm9wYWdhdGlvbigpO1xuXG4gICAgICAgIHN0YXRlLnBsYXllclN0ZXBzLnB1c2goZXZ0LnRhcmdldC5pZCk7XG4gICAgICAgIGNvbnN0IGN1cnJlbnRQbGF5ZXJTdGVwSW5kZXggPSBzdGF0ZS5wbGF5ZXJTdGVwcy5sZW5ndGggLSAxO1xuXG4gICAgICAgIC8vIElmIHBsYXllciBtYWtlcyBhIGNvcnJlY3Qgc3RlcCwgcnVuIHBsYXllclR1cm4gYWdhaW5cbiAgICAgICAgaWYgKHN0YXRlLmNvbXB1dGVyU3RlcHNbY3VycmVudFBsYXllclN0ZXBJbmRleF0gPT09IHN0YXRlLnBsYXllclN0ZXBzW2N1cnJlbnRQbGF5ZXJTdGVwSW5kZXhdKSB7XG4gICAgICAgICAgcmV0dXJuIHRoaXMuaGFuZGxlQ29ycmVjdFVzZXJTdGVwKCk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gdGhpcy5oYW5kbGVJbmNvcnJlY3RVc2VyU3RlcCgpO1xuICAgICAgfSk7XG4gICAgfSxcblxuICAgIGhhbmRsZUNvcnJlY3RVc2VyU3RlcDogZnVuY3Rpb24gKCkge1xuICAgICAgLy8gSWYgZmluYWwgc3RlcCBpcyBjb3JyZWN0LCBpdCdzIHRoZSBjb21wdXRlcidzIHR1cm5cbiAgICAgIGlmIChzdGF0ZS5jb21wdXRlclN0ZXBzLmxlbmd0aCA9PT0gc3RhdGUucGxheWVyU3RlcHMubGVuZ3RoKSB7XG4gICAgICAgICQoJy5zaW1vbi1idXR0b25zJylcbiAgICAgICAgICAub2ZmKClcbiAgICAgICAgICAucmVtb3ZlQ2xhc3MoJ2NsaWNrYWJsZScpO1xuICAgICAgICBzdGF0ZS5wbGF5ZXJTdGVwcyA9IFtdO1xuXG4gICAgICAgIGlmIChzdGF0ZS5wbGF5ZXJTZWNvbmRDaGFuY2UpIHtcbiAgICAgICAgICB0aGlzLmNsZWFyQW5vdGhlckNoYW5jZSgpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHRoaXMuY29tcHV0ZXJUdXJuKCk7XG4gICAgICB9XG5cbiAgICAgICQoJy5zaW1vbi1idXR0b25zJylcbiAgICAgICAgICAub2ZmKClcbiAgICAgICAgICAucmVtb3ZlQ2xhc3MoJ2NsaWNrYWJsZScpO1xuXG4gICAgICByZXR1cm4gdGhpcy5wbGF5ZXJUdXJuKCk7XG4gICAgfSxcblxuICAgIGhhbmRsZUluY29ycmVjdFVzZXJTdGVwOiBmdW5jdGlvbiAoKSB7XG4gICAgICAvLyBpZiBzdHJpY3RNb2RlIGlzIGZhbHNlLCBwbGF5ZXIgZ2V0cyBhbm90aGVyIGNoYW5jZVxuICAgICAgaWYgKCFzdGF0ZS5zdHJpY3RNb2RlKSB7XG4gICAgICAgIHRoaXMuYW5vdGhlckNoYW5jZSgpO1xuICAgICAgICAkKCcuc2ltb24tYnV0dG9ucycpXG4gICAgICAgICAgLm9mZigpXG4gICAgICAgICAgLnJlbW92ZUNsYXNzKCdjbGlja2FibGUnKTtcbiAgICAgICAgc3RhdGUucGxheWVyU3RlcHMgPSBbXTtcbiAgICAgICAgcmV0dXJuIHRoaXMuY29tcHV0ZXJUdXJuKCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgLy8gZWxzZSwgc3RyaWN0TW9kZSBpcyB0cnVlLCB3aGljaCBtZWFucyBnYW1lIG92ZXJcbiAgICAgICAgdGhpcy5nYW1lTG9zZSgpO1xuICAgICAgICAkKCcuc2ltb24tYnV0dG9ucycpXG4gICAgICAgICAgLm9mZigpXG4gICAgICAgICAgLnJlbW92ZUNsYXNzKCdjbGlja2FibGUnKTtcbiAgICAgICAgcmV0dXJuIHRoaXMucmVzZXRHYW1lKCk7XG4gICAgICB9XG4gICAgfSxcblxuICAgIGNsZWFyTW92ZXM6IGZ1bmN0aW9uICgpIHtcbiAgICAgIHN0YXRlLmNvbXB1dGVyU3RlcHMgPSBbXTtcbiAgICAgIHN0YXRlLnBsYXllclN0ZXBzID0gW107XG4gICAgICBzdGF0ZS5wbGF5ZXJTZWNvbmRDaGFuY2UgPSBmYWxzZTtcbiAgICB9LFxuXG4gICAgcmVzZXRHYW1lOiBmdW5jdGlvbiAoKSB7XG4gICAgICB0aGlzLmNsZWFyTW92ZXMoKTtcbiAgICAgIHRoaXMudXBkYXRlRGlzcGxheSgnLS0nKTtcbiAgICAgICQoJy5zaW1vbi1idXR0b25zJylcbiAgICAgICAgLm9mZigpXG4gICAgICAgIC5yZW1vdmVDbGFzcygnY2xpY2thYmxlJyk7XG4gICAgICAkKCcjcmVzZXQtYnV0dG9uJykub2ZmKCdjbGljaycpO1xuICAgIH0sXG5cbiAgICBhbm90aGVyQ2hhbmNlOiBmdW5jdGlvbiAoKSB7XG4gICAgICAkKCcuZ2FtZS1zdGF0dXMnKVxuICAgICAgICAuZW1wdHkoKVxuICAgICAgICAuYXBwZW5kKCc8aDI+V1JPTkchIFRSWSBBR0FJTjwvaDI+Jyk7XG4gICAgICBzdGF0ZS5wbGF5ZXJTdGVwcyA9IFtdO1xuICAgICAgc3RhdGUucGxheWVyU2Vjb25kQ2hhbmNlID0gdHJ1ZTtcbiAgICB9LFxuXG4gICAgY2xlYXJBbm90aGVyQ2hhbmNlOiBmdW5jdGlvbiAoKSB7XG4gICAgICB0aGlzLmNsZWFyR2FtZVN0YXR1cygpO1xuICAgICAgc3RhdGUucGxheWVyU2Vjb25kQ2hhbmNlID0gZmFsc2U7XG4gICAgfSxcblxuICAgIGdhbWVXaW46IGZ1bmN0aW9uICgpIHtcbiAgICAgICQoJy5nYW1lLXN0YXR1cycpLmFwcGVuZCgnPGgyPllPVSBXSU4hPC9oMj4nKTtcbiAgICAgIHJldHVybiBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgdGhpcy5yZXNldEdhbWUoKTtcbiAgICAgICAgdGhpcy5jbGVhckdhbWVTdGF0dXMoKTtcbiAgICAgICAgdGhpcy5jb21wdXRlclR1cm4oKTtcbiAgICAgIH0sIDEwMDApO1xuICAgIH0sXG5cbiAgICBnYW1lTG9zZTogZnVuY3Rpb24gKCkge1xuICAgICAgJCgnLmdhbWUtc3RhdHVzJykuZW1wdHkoKS5hcHBlbmQoJzxoMj5ZT1UgTE9TRSE8L2gyPicpO1xuICAgICAgcmV0dXJuIGJ1dHRvbkxvZ2ljLnN0YXJ0KCk7XG4gICAgfSxcblxuICAgIGNsZWFyR2FtZVN0YXR1czogZnVuY3Rpb24gKCkge1xuICAgICAgJCgnLmdhbWUtc3RhdHVzJykuZW1wdHkoKTtcbiAgICB9XG4gIH07XG5cbiAgY29uc3QgYnV0dG9uTG9naWMgPSB7XG4gICAgc3RhcnQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICQoJyNzdGFydC1idXR0b24nKS5jbGljaygoKSA9PiB7XG4gICAgICAgIHN0YXRlLmdhbWVSZXNldCA9IGZhbHNlO1xuICAgICAgICBzaW1vbkxvZ2ljLmNsZWFyTW92ZXMoKTtcbiAgICAgICAgc2ltb25Mb2dpYy5jbGVhckdhbWVTdGF0dXMoKTtcbiAgICAgICAgc2ltb25Mb2dpYy5jb21wdXRlclR1cm4oKTtcbiAgICAgICAgJCgnI3N0YXJ0LWJ1dHRvbicpLm9mZignY2xpY2snKTtcbiAgICAgICAgcmV0dXJuIHRoaXMucmVzZXQoKTtcbiAgICAgIH0pO1xuICAgIH0sXG5cbiAgICByZXNldDogZnVuY3Rpb24gKCkge1xuICAgICAgJCgnI3Jlc2V0LWJ1dHRvbicpLmNsaWNrKCgpID0+IHtcbiAgICAgICAgc3RhdGUuZ2FtZVJlc2V0ID0gdHJ1ZTtcbiAgICAgICAgc2ltb25Mb2dpYy5yZXNldEdhbWUoKTtcbiAgICAgICAgc2ltb25Mb2dpYy5jbGVhckdhbWVTdGF0dXMoKTtcbiAgICAgICAgJCgnI3Jlc2V0LWJ1dHRvbicpLm9mZignY2xpY2snKTtcbiAgICAgICAgcmV0dXJuIHRoaXMuc3RhcnQoKTtcbiAgICAgIH0pO1xuICAgIH0sXG5cbiAgICBzdHJpY3Q6IGZ1bmN0aW9uICgpIHtcbiAgICAgICQoJyNzdHJpY3QtbW9kZS1idXR0b24nKS5jbGljaygoKSA9PiB7XG4gICAgICAgIHN0YXRlLnN0cmljdE1vZGUgPSAhc3RhdGUuc3RyaWN0TW9kZTtcbiAgICAgICAgdGhpcy5zdHJpY3RMaWdodFRvZ2dsZSgpO1xuICAgICAgfSk7XG4gICAgfSxcblxuICAgIHN0cmljdExpZ2h0VG9nZ2xlOiBmdW5jdGlvbiAoKSB7XG4gICAgICAkKCcjc3RyaWN0LW1vZGUtbGlnaHQnKS50b2dnbGVDbGFzcygnb24nKTtcbiAgICB9XG5cbiAgfTtcblxuICBmdW5jdGlvbiBpbml0ICgpIHtcbiAgICBidXR0b25Mb2dpYy5zdGFydCgpO1xuICAgIGJ1dHRvbkxvZ2ljLnN0cmljdCgpO1xuICB9XG5cbiAgcmV0dXJuIHtcbiAgICBpbml0OiBpbml0XG4gIH07XG59KSgpO1xuXG4kKGRvY3VtZW50KS5yZWFkeShmdW5jdGlvbiAoKSB7XG4gIHNpbW9uLmluaXQoKTtcbn0pO1xuIl0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9
