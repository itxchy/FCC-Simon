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
  var colors = {
    nw: '#080',
    ne: '#F00',
    sw: '#FF0',
    se: '#00F'
  };
  var colorsActive = {
    nw: '#8B8',
    ne: '#FAA',
    sw: '#FF9',
    se: '#99F'
  };
  var availableSteps = ['nw', 'ne', 'sw', 'se'];

  var computerSteps = [];
  var playerSteps = [];
  var strictMode = false;
  var playerSecondChance = false;

  function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min);
  }

  var simonLogic = {

    updateDisplay: function updateDisplay(value) {
      $('#display').empty().append(value);
    },

    /**
     * Runs recursivly until each index in computerSteps is played through
     */
    playComputerSteps: function playComputerSteps(index) {
      var _this = this;

      if (!computerSteps[index]) {
        this.playerTurn();
        return;
      }

      var currentStep = computerSteps[index];
      var stepId = '#' + computerSteps[index];
      var activeColor = colorsActive[computerSteps[index]];
      var defaultColor = colors[computerSteps[index]];

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
      if (computerSteps.length === 20) {
        return this.gameWin();
      }

      if (!playerSecondChance) {
        // add random step to compterSteps array
        var randomButtonIndex = getRandomInt(0, 3);
        computerSteps.push(availableSteps[randomButtonIndex]);
      }

      this.updateDisplay(computerSteps.length);

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
        $('#' + evt.target.id).css('background', colorsActive[evt.target.id]);
        console.log('PLAYER TONE STARTING', evt);
        audio.startTone[evt.target.id]();
      }).mouseup(function (evt) {
        $('#' + evt.target.id).css('background', colors[evt.target.id]);
        console.log('PLAYER TONE ENDING');
        audio.stopTone[evt.target.id]();
      }).on('click', function (evt) {
        evt.preventDefault();
        evt.stopPropagation();
        var currentPlayerStepIndex;

        playerSteps.push(evt.target.id);
        currentPlayerStepIndex = playerSteps.length - 1;

        // If player makes a correct step, run playerTurn again
        if (computerSteps[currentPlayerStepIndex] === playerSteps[currentPlayerStepIndex]) {
          return _this2.handleCorrectUserStep();
        }

        return _this2.handleIncorrectUserStep();
      });
    },

    handleCorrectUserStep: function handleCorrectUserStep() {
      // If final step is correct, it's the computer's turn
      if (computerSteps.length === playerSteps.length) {
        $('.simon-buttons').off().removeClass('clickable');
        playerSteps = [];

        if (playerSecondChance) {
          this.clearAnotherChance();
        }

        return this.computerTurn();
      }

      $('.simon-buttons').off().removeClass('clickable');

      return this.playerTurn();
    },

    handleIncorrectUserStep: function handleIncorrectUserStep() {
      // if strictMode is false, player gets another chance
      if (!strictMode) {
        this.anotherChance();
        $('.simon-buttons').off().removeClass('clickable');
        playerSteps = [];
        return this.computerTurn();
      } else {
        // else, strictMode is true, which means game over
        this.gameLose();
        $('.simon-buttons').off().removeClass('clickable');
        return this.resetGame();
      }
    },

    clearMoves: function clearMoves() {
      computerSteps = [];
      playerSteps = [];
      playerSecondChance = false;
    },

    resetGame: function resetGame() {
      this.clearMoves();
      this.updateDisplay('--');
      $('.simon-buttons').off().removeClass('clickable');
      $('#reset-button').off('click');
    },

    anotherChance: function anotherChance() {
      $('.game-status').empty().append('<h2>WRONG! TRY AGAIN</h2>');
      playerSteps = [];
      playerSecondChance = true;
    },

    clearAnotherChance: function clearAnotherChance() {
      this.clearGameStatus();
      playerSecondChance = false;
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
        simonLogic.resetGame();
        simonLogic.clearGameStatus();
        $('#reset-button').off('click');
        return _this5.start();
      });
    },

    strict: function strict() {
      var _this6 = this;

      $('#strict-mode-button').click(function () {
        strictMode = !strictMode;
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
    init: init,
    getRandomInt: getRandomInt
  };
}();

$(document).ready(function () {
  simon.init();
});
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

var simonState = function () {
  return {
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
    playerSecondChance: false
  };
}();

var simonLogic = function simonLogic() {
  return {
    getRandomInt: function getRandomInt(min, max) {
      return Math.floor(Math.random() * (max - min + 1) + min);
    },
    clearMoves: function clearMoves() {
      computerSteps = [];
      playerSteps = [];
      playerSecondChance = false;
    }
  };
};
//# sourceMappingURL=data:application/json;base64,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TDtBQU5LLEdBQVA7QUFRRCxDQS9FYSxFQUFkOztBQWlGQSxJQUFNLGFBQWMsWUFBWTtBQUM5QixTQUFPO0FBQ0wsWUFBUTtBQUNOLFVBQUksTUFERTtBQUVOLFVBQUksTUFGRTtBQUdOLFVBQUksTUFIRTtBQUlOLFVBQUk7QUFKRSxLQURIO0FBT0wsa0JBQWM7QUFDWixVQUFJLE1BRFE7QUFFWixVQUFJLE1BRlE7QUFHWixVQUFJLE1BSFE7QUFJWixVQUFJO0FBSlEsS0FQVDtBQWFMLG9CQUFnQixDQUFDLElBQUQsRUFBTyxJQUFQLEVBQWEsSUFBYixFQUFtQixJQUFuQixDQWJYO0FBY0wsbUJBQWUsRUFkVjtBQWVMLGlCQUFhLEVBZlI7QUFnQkwsZ0JBQVksS0FoQlA7QUFpQkwsd0JBQW9CO0FBakJmLEdBQVA7QUFtQkQsQ0FwQmtCLEVBQW5COztBQXNCQSxJQUFNLGFBQWMsU0FBZCxVQUFjLEdBQVk7QUFDOUIsU0FBTztBQUNMLGdCQURLLHdCQUNTLEdBRFQsRUFDYyxHQURkLEVBQ21CO0FBQ3RCLGFBQU8sS0FBSyxLQUFMLENBQVcsS0FBSyxNQUFMLE1BQWlCLE1BQU0sR0FBTixHQUFZLENBQTdCLElBQWtDLEdBQTdDLENBQVA7QUFDRCxLQUhJO0FBSUwsY0FKSyx3QkFJUztBQUNaLHNCQUFnQixFQUFoQjtBQUNBLG9CQUFjLEVBQWQ7QUFDQSwyQkFBcUIsS0FBckI7QUFDRDtBQVJJLEdBQVA7QUFVRCxDQVhEIiwiZmlsZSI6ImJ1bmRsZS5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8qIGdsb2JhbCAkICovXG5cbi8qKlxuKiBTaW1vbiBpbiBKYXZhU2NyaXB0LlxuKiBBbm90aGVyIEZyb250IEVuZCBjaGFsbGVuZ2UgZm9yIEZyZWUgQ29kZSBDYW1wLlxuKiBodHRwOi8vd3d3LkZyZWVDb2RlQ2FtcC5jb20vXG4qL1xuXG4nc3RyaWN0IG1vZGUnO1xuXG5jb25zdCBhdWRpbyA9IChmdW5jdGlvbiAoKSB7XG4gIC8qKlxuICAgKiBDcmVhdGUgYSBuZXcgYXVkaW8gY29udGV4dFxuICAgKi9cbiAgY29uc3QgYXVkaW9DdHggPSBuZXcgKHdpbmRvdy5BdWRpb0NvbnRleHQgfHwgd2luZG93LndlYmtpdEF1ZGlvQ29udGV4dCkoKTtcbiAgY29uc3QgZ2Fpbk5vZGUgPSBhdWRpb0N0eC5jcmVhdGVHYWluKCk7XG4gIGdhaW5Ob2RlLmNvbm5lY3QoYXVkaW9DdHguZGVzdGluYXRpb24pO1xuICBnYWluTm9kZS5nYWluLnZhbHVlID0gMC4wMTtcbiAgbGV0IGN1cnJHYWluID0gZ2Fpbk5vZGUuZ2Fpbi52YWx1ZTsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby11bnVzZWQtdmFyc1xuICBjb25zdCB3YXZlVHlwZSA9ICdzaW5lJztcblxuICAvKipcbiAgICogQ3JlYXRlIG9zY2lsbGF0b3JzIGZvciB0aGUgZm91ciBnYW1lIGJ1dHRvbnNcbiAgICovXG4gIGxldCBpbml0aWFsaXplT3NjaWxsYXRvciA9IChmcmVxdWVuY3kpID0+IHtcbiAgICBsZXQgb3NjaWxsYXRvciA9IGF1ZGlvQ3R4LmNyZWF0ZU9zY2lsbGF0b3IoKTtcbiAgICBvc2NpbGxhdG9yLnR5cGUgPSB3YXZlVHlwZTtcbiAgICBvc2NpbGxhdG9yLmZyZXF1ZW5jeS52YWx1ZSA9IGZyZXF1ZW5jeTtcbiAgICBvc2NpbGxhdG9yLnN0YXJ0KDApO1xuICAgIHJldHVybiBvc2NpbGxhdG9yO1xuICB9O1xuXG4gIGNvbnN0IG53ID0gaW5pdGlhbGl6ZU9zY2lsbGF0b3IoNDQwKTtcbiAgY29uc3QgbmUgPSBpbml0aWFsaXplT3NjaWxsYXRvcig1NTQuMzcpO1xuICBjb25zdCBzdyA9IGluaXRpYWxpemVPc2NpbGxhdG9yKDY1OS4yNSk7XG4gIGNvbnN0IHNlID0gaW5pdGlhbGl6ZU9zY2lsbGF0b3IoNzgzLjk5KTtcblxuICAvKipcbiAgICogTWV0aG9kcyBmb3Igc3RhcnRpbmcgZWFjaCBvc2NpbGxhdG9yIHRvbmVcbiAgICovXG5cbiAgbGV0IHN0YXJ0VG9uZSA9IHtcbiAgICBjb25uZWN0T3NjaWxsYXRvcjogKG9zY2lsbGF0b3IpID0+IHtcbiAgICAgIG9zY2lsbGF0b3IuY29ubmVjdChnYWluTm9kZSk7XG4gICAgfSxcbiAgICBudzogZnVuY3Rpb24gKCkge1xuICAgICAgdGhpcy5jb25uZWN0T3NjaWxsYXRvcihudyk7XG4gICAgfSxcbiAgICBuZTogZnVuY3Rpb24gKCkge1xuICAgICAgdGhpcy5jb25uZWN0T3NjaWxsYXRvcihuZSk7XG4gICAgfSxcbiAgICBzdzogZnVuY3Rpb24gKCkge1xuICAgICAgdGhpcy5jb25uZWN0T3NjaWxsYXRvcihzdyk7XG4gICAgfSxcbiAgICBzZTogZnVuY3Rpb24gKCkge1xuICAgICAgdGhpcy5jb25uZWN0T3NjaWxsYXRvcihzZSk7XG4gICAgfVxuICB9O1xuXG4gIC8qKlxuICAgKiBNZXRob2RzIGZvciBzdG9wcGluZyBlYWNoIG9zY2lsbGF0b3IgdG9uZVxuICAgKi9cbiAgbGV0IHN0b3BUb25lID0ge1xuICAgIHN0b3A6IChvc2NpbGxhdG9yKSA9PiB7XG4gICAgICBjdXJyR2FpbiA9IDA7XG4gICAgICBvc2NpbGxhdG9yLmRpc2Nvbm5lY3QoZ2Fpbk5vZGUpO1xuICAgIH0sXG4gICAgbnc6IGZ1bmN0aW9uICgpIHtcbiAgICAgIHRoaXMuc3RvcChudyk7XG4gICAgfSxcbiAgICBuZTogZnVuY3Rpb24gKCkge1xuICAgICAgdGhpcy5zdG9wKG5lKTtcbiAgICB9LFxuICAgIHN3OiBmdW5jdGlvbiAoKSB7XG4gICAgICB0aGlzLnN0b3Aoc3cpO1xuICAgIH0sXG4gICAgc2U6IGZ1bmN0aW9uICgpIHtcbiAgICAgIHRoaXMuc3RvcChzZSk7XG4gICAgfVxuICB9O1xuXG4gIHJldHVybiB7XG4gICAgbnc6IG53LFxuICAgIG5lOiBuZSxcbiAgICBzdzogc3csXG4gICAgc2U6IHNlLFxuICAgIHN0YXJ0VG9uZTogc3RhcnRUb25lLFxuICAgIHN0b3BUb25lOiBzdG9wVG9uZVxuICB9O1xufSkoKTtcblxuY29uc3Qgc2ltb24gPSAoZnVuY3Rpb24gKCkge1xuICAvKipcbiAgICogR2FtZSBTdGF0ZVxuICAgKi9cbiAgY29uc3QgY29sb3JzID0ge1xuICAgIG53OiAnIzA4MCcsXG4gICAgbmU6ICcjRjAwJyxcbiAgICBzdzogJyNGRjAnLFxuICAgIHNlOiAnIzAwRidcbiAgfTtcbiAgY29uc3QgY29sb3JzQWN0aXZlID0ge1xuICAgIG53OiAnIzhCOCcsXG4gICAgbmU6ICcjRkFBJyxcbiAgICBzdzogJyNGRjknLFxuICAgIHNlOiAnIzk5RidcbiAgfTtcbiAgY29uc3QgYXZhaWxhYmxlU3RlcHMgPSBbJ253JywgJ25lJywgJ3N3JywgJ3NlJ107XG5cbiAgbGV0IGNvbXB1dGVyU3RlcHMgPSBbXTtcbiAgbGV0IHBsYXllclN0ZXBzID0gW107XG4gIGxldCBzdHJpY3RNb2RlID0gZmFsc2U7XG4gIGxldCBwbGF5ZXJTZWNvbmRDaGFuY2UgPSBmYWxzZTtcblxuICBmdW5jdGlvbiBnZXRSYW5kb21JbnQgKG1pbiwgbWF4KSB7XG4gICAgcmV0dXJuIE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIChtYXggLSBtaW4gKyAxKSArIG1pbik7XG4gIH1cblxuICBjb25zdCBzaW1vbkxvZ2ljID0ge1xuXG4gICAgdXBkYXRlRGlzcGxheTogZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICAkKCcjZGlzcGxheScpXG4gICAgICAgIC5lbXB0eSgpXG4gICAgICAgIC5hcHBlbmQodmFsdWUpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBSdW5zIHJlY3Vyc2l2bHkgdW50aWwgZWFjaCBpbmRleCBpbiBjb21wdXRlclN0ZXBzIGlzIHBsYXllZCB0aHJvdWdoXG4gICAgICovXG4gICAgcGxheUNvbXB1dGVyU3RlcHM6IGZ1bmN0aW9uIChpbmRleCkge1xuICAgICAgaWYgKCFjb21wdXRlclN0ZXBzW2luZGV4XSkge1xuICAgICAgICB0aGlzLnBsYXllclR1cm4oKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICBjb25zdCBjdXJyZW50U3RlcCA9IGNvbXB1dGVyU3RlcHNbaW5kZXhdO1xuICAgICAgY29uc3Qgc3RlcElkID0gYCMke2NvbXB1dGVyU3RlcHNbaW5kZXhdfWA7XG4gICAgICBjb25zdCBhY3RpdmVDb2xvciA9IGNvbG9yc0FjdGl2ZVtjb21wdXRlclN0ZXBzW2luZGV4XV07XG4gICAgICBjb25zdCBkZWZhdWx0Q29sb3IgPSBjb2xvcnNbY29tcHV0ZXJTdGVwc1tpbmRleF1dO1xuXG4gICAgICBjb25zdCBkaXNwbGF5VHVybnMgPSAoKSA9PiB7XG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgICAgICAkKHN0ZXBJZCkuY3NzKCdiYWNrZ3JvdW5kJywgYWN0aXZlQ29sb3IpO1xuICAgICAgICAgICAgYXVkaW8uc3RhcnRUb25lW2N1cnJlbnRTdGVwXSgpO1xuICAgICAgICAgICAgcmVzb2x2ZSgpO1xuICAgICAgICAgIH0sIDUwMCk7XG4gICAgICAgIH0pO1xuICAgICAgfTtcblxuICAgICAgZGlzcGxheVR1cm5zKClcbiAgICAgIC50aGVuKCgpID0+IHtcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgICAgICQoc3RlcElkKS5jc3MoJ2JhY2tncm91bmQnLCBkZWZhdWx0Q29sb3IpO1xuICAgICAgICAgICAgYXVkaW8uc3RvcFRvbmVbY3VycmVudFN0ZXBdKCk7XG4gICAgICAgICAgICByZXNvbHZlKCk7XG4gICAgICAgICAgfSwgNTAwKTtcbiAgICAgICAgfSk7XG4gICAgICB9KVxuICAgICAgLnRoZW4oKCkgPT4ge1xuICAgICAgICB0aGlzLnBsYXlDb21wdXRlclN0ZXBzKGluZGV4ICsgMSk7XG4gICAgICB9KTtcbiAgICB9LFxuXG4gICAgY29tcHV0ZXJUdXJuOiBmdW5jdGlvbiAoKSB7XG4gICAgICBpZiAoY29tcHV0ZXJTdGVwcy5sZW5ndGggPT09IDIwKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmdhbWVXaW4oKTtcbiAgICAgIH1cblxuICAgICAgaWYgKCFwbGF5ZXJTZWNvbmRDaGFuY2UpIHtcbiAgICAgICAgLy8gYWRkIHJhbmRvbSBzdGVwIHRvIGNvbXB0ZXJTdGVwcyBhcnJheVxuICAgICAgICB2YXIgcmFuZG9tQnV0dG9uSW5kZXggPSBnZXRSYW5kb21JbnQoMCwgMyk7XG4gICAgICAgIGNvbXB1dGVyU3RlcHMucHVzaChhdmFpbGFibGVTdGVwc1tyYW5kb21CdXR0b25JbmRleF0pO1xuICAgICAgfVxuXG4gICAgICB0aGlzLnVwZGF0ZURpc3BsYXkoY29tcHV0ZXJTdGVwcy5sZW5ndGgpO1xuXG4gICAgICB0aGlzLnBsYXlDb21wdXRlclN0ZXBzKDApO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBSdW5zIHJlY3Vyc2l2bHkgdW50aWwgcGxheWVyIG1hdGNoZXMgZWFjaCBpbmRleCBpbiBjb21wdXRlclN0ZXBzLFxuICAgICAqIG9yIHVudGlsIHRoZSBwbGF5ZXIgbG9zZXMuXG4gICAgICovXG4gICAgcGxheWVyVHVybjogZnVuY3Rpb24gKCkge1xuICAgICAvLyBTaW1vbiBidXR0b25zIGNsaWNrIGhhbmRsZXJcbiAgICAgICQoJy5zaW1vbi1idXR0b25zJylcbiAgICAgIC5hZGRDbGFzcygnY2xpY2thYmxlJylcbiAgICAgIC5tb3VzZWRvd24oKGV2dCkgPT4ge1xuICAgICAgICAkKCcjJyArIGV2dC50YXJnZXQuaWQpLmNzcygnYmFja2dyb3VuZCcsIGNvbG9yc0FjdGl2ZVtldnQudGFyZ2V0LmlkXSk7XG4gICAgICAgIGNvbnNvbGUubG9nKCdQTEFZRVIgVE9ORSBTVEFSVElORycsIGV2dCk7XG4gICAgICAgIGF1ZGlvLnN0YXJ0VG9uZVtldnQudGFyZ2V0LmlkXSgpO1xuICAgICAgfSlcbiAgICAgIC5tb3VzZXVwKChldnQpID0+IHtcbiAgICAgICAgJCgnIycgKyBldnQudGFyZ2V0LmlkKS5jc3MoJ2JhY2tncm91bmQnLCBjb2xvcnNbZXZ0LnRhcmdldC5pZF0pO1xuICAgICAgICBjb25zb2xlLmxvZygnUExBWUVSIFRPTkUgRU5ESU5HJyk7XG4gICAgICAgIGF1ZGlvLnN0b3BUb25lW2V2dC50YXJnZXQuaWRdKCk7XG4gICAgICB9KVxuICAgICAgLm9uKCdjbGljaycsIChldnQpID0+IHtcbiAgICAgICAgZXZ0LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIGV2dC5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgICAgdmFyIGN1cnJlbnRQbGF5ZXJTdGVwSW5kZXg7XG5cbiAgICAgICAgcGxheWVyU3RlcHMucHVzaChldnQudGFyZ2V0LmlkKTtcbiAgICAgICAgY3VycmVudFBsYXllclN0ZXBJbmRleCA9IHBsYXllclN0ZXBzLmxlbmd0aCAtIDE7XG5cbiAgICAgICAgLy8gSWYgcGxheWVyIG1ha2VzIGEgY29ycmVjdCBzdGVwLCBydW4gcGxheWVyVHVybiBhZ2FpblxuICAgICAgICBpZiAoY29tcHV0ZXJTdGVwc1tjdXJyZW50UGxheWVyU3RlcEluZGV4XSA9PT0gcGxheWVyU3RlcHNbY3VycmVudFBsYXllclN0ZXBJbmRleF0pIHtcbiAgICAgICAgICByZXR1cm4gdGhpcy5oYW5kbGVDb3JyZWN0VXNlclN0ZXAoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB0aGlzLmhhbmRsZUluY29ycmVjdFVzZXJTdGVwKCk7XG4gICAgICB9KTtcbiAgICB9LFxuXG4gICAgaGFuZGxlQ29ycmVjdFVzZXJTdGVwOiBmdW5jdGlvbiAoKSB7XG4gICAgICAvLyBJZiBmaW5hbCBzdGVwIGlzIGNvcnJlY3QsIGl0J3MgdGhlIGNvbXB1dGVyJ3MgdHVyblxuICAgICAgaWYgKGNvbXB1dGVyU3RlcHMubGVuZ3RoID09PSBwbGF5ZXJTdGVwcy5sZW5ndGgpIHtcbiAgICAgICAgJCgnLnNpbW9uLWJ1dHRvbnMnKVxuICAgICAgICAgIC5vZmYoKVxuICAgICAgICAgIC5yZW1vdmVDbGFzcygnY2xpY2thYmxlJyk7XG4gICAgICAgIHBsYXllclN0ZXBzID0gW107XG5cbiAgICAgICAgaWYgKHBsYXllclNlY29uZENoYW5jZSkge1xuICAgICAgICAgIHRoaXMuY2xlYXJBbm90aGVyQ2hhbmNlKCk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gdGhpcy5jb21wdXRlclR1cm4oKTtcbiAgICAgIH1cblxuICAgICAgJCgnLnNpbW9uLWJ1dHRvbnMnKVxuICAgICAgICAgIC5vZmYoKVxuICAgICAgICAgIC5yZW1vdmVDbGFzcygnY2xpY2thYmxlJyk7XG5cbiAgICAgIHJldHVybiB0aGlzLnBsYXllclR1cm4oKTtcbiAgICB9LFxuXG4gICAgaGFuZGxlSW5jb3JyZWN0VXNlclN0ZXA6IGZ1bmN0aW9uICgpIHtcbiAgICAgIC8vIGlmIHN0cmljdE1vZGUgaXMgZmFsc2UsIHBsYXllciBnZXRzIGFub3RoZXIgY2hhbmNlXG4gICAgICBpZiAoIXN0cmljdE1vZGUpIHtcbiAgICAgICAgdGhpcy5hbm90aGVyQ2hhbmNlKCk7XG4gICAgICAgICQoJy5zaW1vbi1idXR0b25zJylcbiAgICAgICAgICAub2ZmKClcbiAgICAgICAgICAucmVtb3ZlQ2xhc3MoJ2NsaWNrYWJsZScpO1xuICAgICAgICBwbGF5ZXJTdGVwcyA9IFtdO1xuICAgICAgICByZXR1cm4gdGhpcy5jb21wdXRlclR1cm4oKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAvLyBlbHNlLCBzdHJpY3RNb2RlIGlzIHRydWUsIHdoaWNoIG1lYW5zIGdhbWUgb3ZlclxuICAgICAgICB0aGlzLmdhbWVMb3NlKCk7XG4gICAgICAgICQoJy5zaW1vbi1idXR0b25zJylcbiAgICAgICAgICAub2ZmKClcbiAgICAgICAgICAucmVtb3ZlQ2xhc3MoJ2NsaWNrYWJsZScpO1xuICAgICAgICByZXR1cm4gdGhpcy5yZXNldEdhbWUoKTtcbiAgICAgIH1cbiAgICB9LFxuXG4gICAgY2xlYXJNb3ZlczogZnVuY3Rpb24gKCkge1xuICAgICAgY29tcHV0ZXJTdGVwcyA9IFtdO1xuICAgICAgcGxheWVyU3RlcHMgPSBbXTtcbiAgICAgIHBsYXllclNlY29uZENoYW5jZSA9IGZhbHNlO1xuICAgIH0sXG5cbiAgICByZXNldEdhbWU6IGZ1bmN0aW9uICgpIHtcbiAgICAgIHRoaXMuY2xlYXJNb3ZlcygpO1xuICAgICAgdGhpcy51cGRhdGVEaXNwbGF5KCctLScpO1xuICAgICAgJCgnLnNpbW9uLWJ1dHRvbnMnKVxuICAgICAgICAub2ZmKClcbiAgICAgICAgLnJlbW92ZUNsYXNzKCdjbGlja2FibGUnKTtcbiAgICAgICQoJyNyZXNldC1idXR0b24nKS5vZmYoJ2NsaWNrJyk7XG4gICAgfSxcblxuICAgIGFub3RoZXJDaGFuY2U6IGZ1bmN0aW9uICgpIHtcbiAgICAgICQoJy5nYW1lLXN0YXR1cycpXG4gICAgICAgIC5lbXB0eSgpXG4gICAgICAgIC5hcHBlbmQoJzxoMj5XUk9ORyEgVFJZIEFHQUlOPC9oMj4nKTtcbiAgICAgIHBsYXllclN0ZXBzID0gW107XG4gICAgICBwbGF5ZXJTZWNvbmRDaGFuY2UgPSB0cnVlO1xuICAgIH0sXG5cbiAgICBjbGVhckFub3RoZXJDaGFuY2U6IGZ1bmN0aW9uICgpIHtcbiAgICAgIHRoaXMuY2xlYXJHYW1lU3RhdHVzKCk7XG4gICAgICBwbGF5ZXJTZWNvbmRDaGFuY2UgPSBmYWxzZTtcbiAgICB9LFxuXG4gICAgZ2FtZVdpbjogZnVuY3Rpb24gKCkge1xuICAgICAgJCgnLmdhbWUtc3RhdHVzJykuYXBwZW5kKCc8aDI+WU9VIFdJTiE8L2gyPicpO1xuICAgICAgcmV0dXJuIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICB0aGlzLnJlc2V0R2FtZSgpO1xuICAgICAgICB0aGlzLmNsZWFyR2FtZVN0YXR1cygpO1xuICAgICAgICB0aGlzLmNvbXB1dGVyVHVybigpO1xuICAgICAgfSwgMTAwMCk7XG4gICAgfSxcblxuICAgIGdhbWVMb3NlOiBmdW5jdGlvbiAoKSB7XG4gICAgICAkKCcuZ2FtZS1zdGF0dXMnKS5lbXB0eSgpLmFwcGVuZCgnPGgyPllPVSBMT1NFITwvaDI+Jyk7XG4gICAgICByZXR1cm4gYnV0dG9uTG9naWMuc3RhcnQoKTtcbiAgICB9LFxuXG4gICAgY2xlYXJHYW1lU3RhdHVzOiBmdW5jdGlvbiAoKSB7XG4gICAgICAkKCcuZ2FtZS1zdGF0dXMnKS5lbXB0eSgpO1xuICAgIH1cbiAgfTtcblxuICBjb25zdCBidXR0b25Mb2dpYyA9IHtcbiAgICBzdGFydDogZnVuY3Rpb24gKCkge1xuICAgICAgJCgnI3N0YXJ0LWJ1dHRvbicpLmNsaWNrKCgpID0+IHtcbiAgICAgICAgc2ltb25Mb2dpYy5jbGVhck1vdmVzKCk7XG4gICAgICAgIHNpbW9uTG9naWMuY2xlYXJHYW1lU3RhdHVzKCk7XG4gICAgICAgIHNpbW9uTG9naWMuY29tcHV0ZXJUdXJuKCk7XG4gICAgICAgICQoJyNzdGFydC1idXR0b24nKS5vZmYoJ2NsaWNrJyk7XG4gICAgICAgIHJldHVybiB0aGlzLnJlc2V0KCk7XG4gICAgICB9KTtcbiAgICB9LFxuXG4gICAgcmVzZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICQoJyNyZXNldC1idXR0b24nKS5jbGljaygoKSA9PiB7XG4gICAgICAgIHNpbW9uTG9naWMucmVzZXRHYW1lKCk7XG4gICAgICAgIHNpbW9uTG9naWMuY2xlYXJHYW1lU3RhdHVzKCk7XG4gICAgICAgICQoJyNyZXNldC1idXR0b24nKS5vZmYoJ2NsaWNrJyk7XG4gICAgICAgIHJldHVybiB0aGlzLnN0YXJ0KCk7XG4gICAgICB9KTtcbiAgICB9LFxuXG4gICAgc3RyaWN0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAkKCcjc3RyaWN0LW1vZGUtYnV0dG9uJykuY2xpY2soKCkgPT4ge1xuICAgICAgICBzdHJpY3RNb2RlID0gIXN0cmljdE1vZGU7XG4gICAgICAgIHRoaXMuc3RyaWN0TGlnaHRUb2dnbGUoKTtcbiAgICAgIH0pO1xuICAgIH0sXG5cbiAgICBzdHJpY3RMaWdodFRvZ2dsZTogZnVuY3Rpb24gKCkge1xuICAgICAgJCgnI3N0cmljdC1tb2RlLWxpZ2h0JykudG9nZ2xlQ2xhc3MoJ29uJyk7XG4gICAgfVxuXG4gIH07XG5cbiAgZnVuY3Rpb24gaW5pdCAoKSB7XG4gICAgYnV0dG9uTG9naWMuc3RhcnQoKTtcbiAgICBidXR0b25Mb2dpYy5zdHJpY3QoKTtcbiAgfVxuXG4gIHJldHVybiB7XG4gICAgaW5pdDogaW5pdCxcbiAgICBnZXRSYW5kb21JbnQ6IGdldFJhbmRvbUludFxuICB9O1xufSkoKTtcblxuJChkb2N1bWVudCkucmVhZHkoZnVuY3Rpb24gKCkge1xuICBzaW1vbi5pbml0KCk7XG59KTtcbiIsIi8qIGdsb2JhbCAkICovXG5cbi8qKlxuKiBTaW1vbiBpbiBKYXZhU2NyaXB0LlxuKiBBbm90aGVyIEZyb250IEVuZCBjaGFsbGVuZ2UgZm9yIEZyZWUgQ29kZSBDYW1wLlxuKiBodHRwOi8vd3d3LkZyZWVDb2RlQ2FtcC5jb20vXG4qL1xuXG4nc3RyaWN0IG1vZGUnO1xuXG5jb25zdCBhdWRpbyA9IChmdW5jdGlvbiAoKSB7XG4gIC8qKlxuICAgKiBDcmVhdGUgYSBuZXcgYXVkaW8gY29udGV4dFxuICAgKi9cbiAgY29uc3QgYXVkaW9DdHggPSBuZXcgKHdpbmRvdy5BdWRpb0NvbnRleHQgfHwgd2luZG93LndlYmtpdEF1ZGlvQ29udGV4dCkoKTtcbiAgY29uc3QgZ2Fpbk5vZGUgPSBhdWRpb0N0eC5jcmVhdGVHYWluKCk7XG4gIGdhaW5Ob2RlLmNvbm5lY3QoYXVkaW9DdHguZGVzdGluYXRpb24pO1xuICBnYWluTm9kZS5nYWluLnZhbHVlID0gMC4wMTtcbiAgbGV0IGN1cnJHYWluID0gZ2Fpbk5vZGUuZ2Fpbi52YWx1ZTsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby11bnVzZWQtdmFyc1xuICBjb25zdCB3YXZlVHlwZSA9ICdzaW5lJztcblxuICAvKipcbiAgICogQ3JlYXRlIG9zY2lsbGF0b3JzIGZvciB0aGUgZm91ciBnYW1lIGJ1dHRvbnNcbiAgICovXG4gIGxldCBpbml0aWFsaXplT3NjaWxsYXRvciA9IChmcmVxdWVuY3kpID0+IHtcbiAgICBsZXQgb3NjaWxsYXRvciA9IGF1ZGlvQ3R4LmNyZWF0ZU9zY2lsbGF0b3IoKTtcbiAgICBvc2NpbGxhdG9yLnR5cGUgPSB3YXZlVHlwZTtcbiAgICBvc2NpbGxhdG9yLmZyZXF1ZW5jeS52YWx1ZSA9IGZyZXF1ZW5jeTtcbiAgICBvc2NpbGxhdG9yLnN0YXJ0KDApO1xuICAgIHJldHVybiBvc2NpbGxhdG9yO1xuICB9O1xuXG4gIGNvbnN0IG53ID0gaW5pdGlhbGl6ZU9zY2lsbGF0b3IoNDQwKTtcbiAgY29uc3QgbmUgPSBpbml0aWFsaXplT3NjaWxsYXRvcig1NTQuMzcpO1xuICBjb25zdCBzdyA9IGluaXRpYWxpemVPc2NpbGxhdG9yKDY1OS4yNSk7XG4gIGNvbnN0IHNlID0gaW5pdGlhbGl6ZU9zY2lsbGF0b3IoNzgzLjk5KTtcblxuICAvKipcbiAgICogTWV0aG9kcyBmb3Igc3RhcnRpbmcgZWFjaCBvc2NpbGxhdG9yIHRvbmVcbiAgICovXG5cbiAgbGV0IHN0YXJ0VG9uZSA9IHtcbiAgICBjb25uZWN0T3NjaWxsYXRvciAob3NjaWxsYXRvcikge1xuICAgICAgb3NjaWxsYXRvci5jb25uZWN0KGdhaW5Ob2RlKTtcbiAgICB9LFxuICAgIG53ICgpIHtcbiAgICAgIHRoaXMuY29ubmVjdE9zY2lsbGF0b3IobncpO1xuICAgIH0sXG4gICAgbmUgKCkge1xuICAgICAgdGhpcy5jb25uZWN0T3NjaWxsYXRvcihuZSk7XG4gICAgfSxcbiAgICBzdyAoKSB7XG4gICAgICB0aGlzLmNvbm5lY3RPc2NpbGxhdG9yKHN3KTtcbiAgICB9LFxuICAgIHNlICgpIHtcbiAgICAgIHRoaXMuY29ubmVjdE9zY2lsbGF0b3Ioc2UpO1xuICAgIH1cbiAgfTtcblxuICAvKipcbiAgICogTWV0aG9kcyBmb3Igc3RvcHBpbmcgZWFjaCBvc2NpbGxhdG9yIHRvbmVcbiAgICovXG4gIGxldCBzdG9wVG9uZSA9IHtcbiAgICBzdG9wIChvc2NpbGxhdG9yKSB7XG4gICAgICBjdXJyR2FpbiA9IDA7XG4gICAgICBvc2NpbGxhdG9yLmRpc2Nvbm5lY3QoZ2Fpbk5vZGUpO1xuICAgIH0sXG4gICAgbncgKCkge1xuICAgICAgdGhpcy5zdG9wKG53KTtcbiAgICB9LFxuICAgIG5lOiBmdW5jdGlvbiAoKSB7XG4gICAgICB0aGlzLnN0b3AobmUpO1xuICAgIH0sXG4gICAgc3c6IGZ1bmN0aW9uICgpIHtcbiAgICAgIHRoaXMuc3RvcChzdyk7XG4gICAgfSxcbiAgICBzZTogZnVuY3Rpb24gKCkge1xuICAgICAgdGhpcy5zdG9wKHNlKTtcbiAgICB9XG4gIH07XG5cbiAgcmV0dXJuIHtcbiAgICBudyxcbiAgICBuZSxcbiAgICBzdyxcbiAgICBzZSxcbiAgICBzdGFydFRvbmUsXG4gICAgc3RvcFRvbmVcbiAgfTtcbn0pKCk7XG5cbmNvbnN0IHNpbW9uU3RhdGUgPSAoZnVuY3Rpb24gKCkge1xuICByZXR1cm4ge1xuICAgIGNvbG9yczoge1xuICAgICAgbnc6ICcjMDgwJyxcbiAgICAgIG5lOiAnI0YwMCcsXG4gICAgICBzdzogJyNGRjAnLFxuICAgICAgc2U6ICcjMDBGJ1xuICAgIH0sXG4gICAgY29sb3JzQWN0aXZlOiB7XG4gICAgICBudzogJyM4QjgnLFxuICAgICAgbmU6ICcjRkFBJyxcbiAgICAgIHN3OiAnI0ZGOScsXG4gICAgICBzZTogJyM5OUYnICAgICAgXG4gICAgfSxcbiAgICBhdmFpbGFibGVTdGVwczogWydudycsICduZScsICdzdycsICdzZSddLFxuICAgIGNvbXB1dGVyU3RlcHM6IFtdLFxuICAgIHBsYXllclN0ZXBzOiBbXSxcbiAgICBzdHJpY3RNb2RlOiBmYWxzZSxcbiAgICBwbGF5ZXJTZWNvbmRDaGFuY2U6IGZhbHNlXG4gIH1cbn0pKCk7XG5cbmNvbnN0IHNpbW9uTG9naWMgPSAoZnVuY3Rpb24gKCkge1xuICByZXR1cm4ge1xuICAgIGdldFJhbmRvbUludCAobWluLCBtYXgpIHtcbiAgICAgIHJldHVybiBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiAobWF4IC0gbWluICsgMSkgKyBtaW4pOyAgICAgIFxuICAgIH0sXG4gICAgY2xlYXJNb3ZlcyAoKSB7XG4gICAgICBjb21wdXRlclN0ZXBzID0gW107XG4gICAgICBwbGF5ZXJTdGVwcyA9IFtdO1xuICAgICAgcGxheWVyU2Vjb25kQ2hhbmNlID0gZmFsc2U7XG4gICAgfVxuICB9XG59KSJdLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==
