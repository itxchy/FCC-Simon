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

    playerTurn: function playerTurn() {
      var _this2 = this;

      // make simon-buttons clickable
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

        if (computerSteps[currentPlayerStepIndex] === playerSteps[currentPlayerStepIndex]) {
          if (computerSteps.length === playerSteps.length) {
            $('.simon-buttons').off().removeClass('clickable');
            playerSteps = [];

            if (playerSecondChance) {
              _this2.clearAnotherChance();
            }

            return _this2.computerTurn();
          }

          $('.simon-buttons').off().removeClass('clickable');

          return simonLogic.playerTurn();
        }
        // if strictMode is false, player gets another chance
        if (!strictMode) {
          simonLogic.anotherChance();
          $('.simon-buttons').off().removeClass('clickable');
          playerSteps = [];
          return simonLogic.computerTurn();
        } else {
          // else, strictMode is true, which means game over
          simonLogic.gameLose();
          $('.simon-buttons').off().removeClass('clickable');
          return simonLogic.resetGame();
        }
      });
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFwcC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7QUFRQTs7QUFFQSxJQUFNLFFBQVMsWUFBWTs7OztBQUl6QixNQUFNLFdBQVcsS0FBSyxPQUFPLFlBQVAsSUFBdUIsT0FBTyxrQkFBbkMsR0FBakI7QUFDQSxNQUFNLFdBQVcsU0FBUyxVQUFULEVBQWpCO0FBQ0EsV0FBUyxPQUFULENBQWlCLFNBQVMsV0FBMUI7QUFDQSxXQUFTLElBQVQsQ0FBYyxLQUFkLEdBQXNCLElBQXRCO0FBQ0EsTUFBSSxXQUFXLFNBQVMsSUFBVCxDQUFjLEtBQTdCO0FBQ0EsTUFBTSxXQUFXLE1BQWpCOzs7OztBQUtBLE1BQUksdUJBQXVCLFNBQXZCLG9CQUF1QixDQUFDLFNBQUQsRUFBZTtBQUN4QyxRQUFJLGFBQWEsU0FBUyxnQkFBVCxFQUFqQjtBQUNBLGVBQVcsSUFBWCxHQUFrQixRQUFsQjtBQUNBLGVBQVcsU0FBWCxDQUFxQixLQUFyQixHQUE2QixTQUE3QjtBQUNBLGVBQVcsS0FBWCxDQUFpQixDQUFqQjtBQUNBLFdBQU8sVUFBUDtBQUNELEdBTkQ7O0FBUUEsTUFBTSxNQUFLLHFCQUFxQixHQUFyQixDQUFYO0FBQ0EsTUFBTSxNQUFLLHFCQUFxQixNQUFyQixDQUFYO0FBQ0EsTUFBTSxNQUFLLHFCQUFxQixNQUFyQixDQUFYO0FBQ0EsTUFBTSxNQUFLLHFCQUFxQixNQUFyQixDQUFYOzs7OztBQUtBLE1BQUksWUFBWTtBQUNkLHVCQUFtQiwyQkFBQyxVQUFELEVBQWdCO0FBQ2pDLGlCQUFXLE9BQVgsQ0FBbUIsUUFBbkI7QUFDRCxLQUhhO0FBSWQsUUFBSSxjQUFZO0FBQ2QsV0FBSyxpQkFBTCxDQUF1QixHQUF2QjtBQUNELEtBTmE7QUFPZCxRQUFJLGNBQVk7QUFDZCxXQUFLLGlCQUFMLENBQXVCLEdBQXZCO0FBQ0QsS0FUYTtBQVVkLFFBQUksY0FBWTtBQUNkLFdBQUssaUJBQUwsQ0FBdUIsR0FBdkI7QUFDRCxLQVphO0FBYWQsUUFBSSxjQUFZO0FBQ2QsV0FBSyxpQkFBTCxDQUF1QixHQUF2QjtBQUNEO0FBZmEsR0FBaEI7Ozs7O0FBcUJBLE1BQUksV0FBVztBQUNiLFVBQU0sY0FBQyxVQUFELEVBQWdCO0FBQ3BCLGlCQUFXLENBQVg7QUFDQSxpQkFBVyxVQUFYLENBQXNCLFFBQXRCO0FBQ0QsS0FKWTtBQUtiLFFBQUksY0FBWTtBQUNkLFdBQUssSUFBTCxDQUFVLEdBQVY7QUFDRCxLQVBZO0FBUWIsUUFBSSxjQUFZO0FBQ2QsV0FBSyxJQUFMLENBQVUsR0FBVjtBQUNELEtBVlk7QUFXYixRQUFJLGNBQVk7QUFDZCxXQUFLLElBQUwsQ0FBVSxHQUFWO0FBQ0QsS0FiWTtBQWNiLFFBQUksY0FBWTtBQUNkLFdBQUssSUFBTCxDQUFVLEdBQVY7QUFDRDtBQWhCWSxHQUFmOztBQW1CQSxTQUFPO0FBQ0wsUUFBSSxHQURDO0FBRUwsUUFBSSxHQUZDO0FBR0wsUUFBSSxHQUhDO0FBSUwsUUFBSSxHQUpDO0FBS0wsZUFBVyxTQUxOO0FBTUwsY0FBVTtBQU5MLEdBQVA7QUFRRCxDQTlFYSxFQUFkOztBQWdGQSxJQUFNLFFBQVMsWUFBWTs7OztBQUl6QixNQUFNLFNBQVM7QUFDYixRQUFJLE1BRFM7QUFFYixRQUFJLE1BRlM7QUFHYixRQUFJLE1BSFM7QUFJYixRQUFJO0FBSlMsR0FBZjtBQU1BLE1BQU0sZUFBZTtBQUNuQixRQUFJLE1BRGU7QUFFbkIsUUFBSSxNQUZlO0FBR25CLFFBQUksTUFIZTtBQUluQixRQUFJO0FBSmUsR0FBckI7QUFNQSxNQUFNLGlCQUFpQixDQUFDLElBQUQsRUFBTyxJQUFQLEVBQWEsSUFBYixFQUFtQixJQUFuQixDQUF2Qjs7QUFFQSxNQUFJLGdCQUFnQixFQUFwQjtBQUNBLE1BQUksY0FBYyxFQUFsQjtBQUNBLE1BQUksYUFBYSxLQUFqQjtBQUNBLE1BQUkscUJBQXFCLEtBQXpCOztBQUVBLFdBQVMsWUFBVCxDQUF1QixHQUF2QixFQUE0QixHQUE1QixFQUFpQztBQUMvQixXQUFPLEtBQUssS0FBTCxDQUFXLEtBQUssTUFBTCxNQUFpQixNQUFNLEdBQU4sR0FBWSxDQUE3QixJQUFrQyxHQUE3QyxDQUFQO0FBQ0Q7O0FBRUQsTUFBTSxhQUFhOztBQUVqQixtQkFBZSx1QkFBVSxLQUFWLEVBQWlCO0FBQzlCLFFBQUUsVUFBRixFQUNHLEtBREgsR0FFRyxNQUZILENBRVUsS0FGVjtBQUdELEtBTmdCOzs7OztBQVdqQix1QkFBbUIsMkJBQVUsS0FBVixFQUFpQjtBQUFBOztBQUNsQyxVQUFJLENBQUMsY0FBYyxLQUFkLENBQUwsRUFBMkI7QUFDekIsYUFBSyxVQUFMO0FBQ0E7QUFDRDs7QUFFRCxVQUFNLGNBQWMsY0FBYyxLQUFkLENBQXBCO0FBQ0EsVUFBTSxlQUFhLGNBQWMsS0FBZCxDQUFuQjtBQUNBLFVBQU0sY0FBYyxhQUFhLGNBQWMsS0FBZCxDQUFiLENBQXBCO0FBQ0EsVUFBTSxlQUFlLE9BQU8sY0FBYyxLQUFkLENBQVAsQ0FBckI7O0FBRUEsVUFBTSxlQUFlLFNBQWYsWUFBZSxHQUFNO0FBQ3pCLGVBQU8sSUFBSSxPQUFKLENBQVksVUFBQyxPQUFELEVBQVUsTUFBVixFQUFxQjtBQUN0QyxxQkFBVyxZQUFNO0FBQ2YsY0FBRSxNQUFGLEVBQVUsR0FBVixDQUFjLFlBQWQsRUFBNEIsV0FBNUI7QUFDQSxrQkFBTSxTQUFOLENBQWdCLFdBQWhCO0FBQ0E7QUFDRCxXQUpELEVBSUcsR0FKSDtBQUtELFNBTk0sQ0FBUDtBQU9ELE9BUkQ7O0FBVUEscUJBQ0MsSUFERCxDQUNNLFlBQU07QUFDVixlQUFPLElBQUksT0FBSixDQUFZLFVBQUMsT0FBRCxFQUFVLE1BQVYsRUFBcUI7QUFDdEMscUJBQVcsWUFBTTtBQUNmLGNBQUUsTUFBRixFQUFVLEdBQVYsQ0FBYyxZQUFkLEVBQTRCLFlBQTVCO0FBQ0Esa0JBQU0sUUFBTixDQUFlLFdBQWY7QUFDQTtBQUNELFdBSkQsRUFJRyxHQUpIO0FBS0QsU0FOTSxDQUFQO0FBT0QsT0FURCxFQVVDLElBVkQsQ0FVTSxZQUFNO0FBQ1YsY0FBSyxpQkFBTCxDQUF1QixRQUFRLENBQS9CO0FBQ0QsT0FaRDtBQWFELEtBN0NnQjs7QUErQ2pCLGtCQUFjLHdCQUFZO0FBQ3hCLFVBQUksY0FBYyxNQUFkLEtBQXlCLEVBQTdCLEVBQWlDO0FBQy9CLGVBQU8sS0FBSyxPQUFMLEVBQVA7QUFDRDs7QUFFRCxVQUFJLENBQUMsa0JBQUwsRUFBeUI7O0FBRXZCLFlBQUksb0JBQW9CLGFBQWEsQ0FBYixFQUFnQixDQUFoQixDQUF4QjtBQUNBLHNCQUFjLElBQWQsQ0FBbUIsZUFBZSxpQkFBZixDQUFuQjtBQUNEOztBQUVELFdBQUssYUFBTCxDQUFtQixjQUFjLE1BQWpDOztBQUVBLFdBQUssaUJBQUwsQ0FBdUIsQ0FBdkI7QUFDRCxLQTdEZ0I7O0FBK0RqQixnQkFBWSxzQkFBWTtBQUFBOzs7QUFFdEIsUUFBRSxnQkFBRixFQUNDLFFBREQsQ0FDVSxXQURWLEVBRUMsU0FGRCxDQUVXLFVBQUMsR0FBRCxFQUFTO0FBQ2xCLFVBQUUsTUFBTSxJQUFJLE1BQUosQ0FBVyxFQUFuQixFQUF1QixHQUF2QixDQUEyQixZQUEzQixFQUF5QyxhQUFhLElBQUksTUFBSixDQUFXLEVBQXhCLENBQXpDO0FBQ0EsZ0JBQVEsR0FBUixDQUFZLHNCQUFaLEVBQW9DLEdBQXBDO0FBQ0EsY0FBTSxTQUFOLENBQWdCLElBQUksTUFBSixDQUFXLEVBQTNCO0FBQ0QsT0FORCxFQU9DLE9BUEQsQ0FPUyxVQUFDLEdBQUQsRUFBUztBQUNoQixVQUFFLE1BQU0sSUFBSSxNQUFKLENBQVcsRUFBbkIsRUFBdUIsR0FBdkIsQ0FBMkIsWUFBM0IsRUFBeUMsT0FBTyxJQUFJLE1BQUosQ0FBVyxFQUFsQixDQUF6QztBQUNBLGdCQUFRLEdBQVIsQ0FBWSxvQkFBWjtBQUNBLGNBQU0sUUFBTixDQUFlLElBQUksTUFBSixDQUFXLEVBQTFCO0FBQ0QsT0FYRCxFQVlDLEVBWkQsQ0FZSSxPQVpKLEVBWWEsVUFBQyxHQUFELEVBQVM7QUFDcEIsWUFBSSxjQUFKO0FBQ0EsWUFBSSxlQUFKO0FBQ0EsWUFBSSxzQkFBSjs7QUFFQSxvQkFBWSxJQUFaLENBQWlCLElBQUksTUFBSixDQUFXLEVBQTVCO0FBQ0EsaUNBQXlCLFlBQVksTUFBWixHQUFxQixDQUE5Qzs7QUFFQSxZQUFJLGNBQWMsc0JBQWQsTUFBMEMsWUFBWSxzQkFBWixDQUE5QyxFQUFtRjtBQUNqRixjQUFJLGNBQWMsTUFBZCxLQUF5QixZQUFZLE1BQXpDLEVBQWlEO0FBQy9DLGNBQUUsZ0JBQUYsRUFDRyxHQURILEdBRUcsV0FGSCxDQUVlLFdBRmY7QUFHQSwwQkFBYyxFQUFkOztBQUVBLGdCQUFJLGtCQUFKLEVBQXdCO0FBQ3RCLHFCQUFLLGtCQUFMO0FBQ0Q7O0FBRUQsbUJBQU8sT0FBSyxZQUFMLEVBQVA7QUFDRDs7QUFFRCxZQUFFLGdCQUFGLEVBQ0ssR0FETCxHQUVLLFdBRkwsQ0FFaUIsV0FGakI7O0FBSUEsaUJBQU8sV0FBVyxVQUFYLEVBQVA7QUFDRDs7QUFFRCxZQUFJLENBQUMsVUFBTCxFQUFpQjtBQUNmLHFCQUFXLGFBQVg7QUFDQSxZQUFFLGdCQUFGLEVBQ0csR0FESCxHQUVHLFdBRkgsQ0FFZSxXQUZmO0FBR0Esd0JBQWMsRUFBZDtBQUNBLGlCQUFPLFdBQVcsWUFBWCxFQUFQO0FBQ0QsU0FQRCxNQU9POztBQUVMLHFCQUFXLFFBQVg7QUFDQSxZQUFFLGdCQUFGLEVBQ0csR0FESCxHQUVHLFdBRkgsQ0FFZSxXQUZmO0FBR0EsaUJBQU8sV0FBVyxTQUFYLEVBQVA7QUFDRDtBQUNGLE9BeEREO0FBeURELEtBMUhnQjs7QUE0SGpCLGdCQUFZLHNCQUFZO0FBQ3RCLHNCQUFnQixFQUFoQjtBQUNBLG9CQUFjLEVBQWQ7QUFDQSwyQkFBcUIsS0FBckI7QUFDRCxLQWhJZ0I7O0FBa0lqQixlQUFXLHFCQUFZO0FBQ3JCLFdBQUssVUFBTDtBQUNBLFdBQUssYUFBTCxDQUFtQixJQUFuQjtBQUNBLFFBQUUsZ0JBQUYsRUFDRyxHQURILEdBRUcsV0FGSCxDQUVlLFdBRmY7QUFHQSxRQUFFLGVBQUYsRUFBbUIsR0FBbkIsQ0FBdUIsT0FBdkI7QUFDRCxLQXpJZ0I7O0FBMklqQixtQkFBZSx5QkFBWTtBQUN6QixRQUFFLGNBQUYsRUFDRyxLQURILEdBRUcsTUFGSCxDQUVVLDJCQUZWO0FBR0Esb0JBQWMsRUFBZDtBQUNBLDJCQUFxQixJQUFyQjtBQUNELEtBakpnQjs7QUFtSmpCLHdCQUFvQiw4QkFBWTtBQUM5QixXQUFLLGVBQUw7QUFDQSwyQkFBcUIsS0FBckI7QUFDRCxLQXRKZ0I7O0FBd0pqQixhQUFTLG1CQUFZO0FBQUE7O0FBQ25CLFFBQUUsY0FBRixFQUFrQixNQUFsQixDQUF5QixtQkFBekI7QUFDQSxhQUFPLFdBQVcsWUFBTTtBQUN0QixlQUFLLFNBQUw7QUFDQSxlQUFLLGVBQUw7QUFDQSxlQUFLLFlBQUw7QUFDRCxPQUpNLEVBSUosSUFKSSxDQUFQO0FBS0QsS0EvSmdCOztBQWlLakIsY0FBVSxvQkFBWTtBQUNwQixRQUFFLGNBQUYsRUFBa0IsS0FBbEIsR0FBMEIsTUFBMUIsQ0FBaUMsb0JBQWpDO0FBQ0EsYUFBTyxZQUFZLEtBQVosRUFBUDtBQUNELEtBcEtnQjs7QUFzS2pCLHFCQUFpQiwyQkFBWTtBQUMzQixRQUFFLGNBQUYsRUFBa0IsS0FBbEI7QUFDRDtBQXhLZ0IsR0FBbkI7O0FBMktBLE1BQU0sY0FBYztBQUNsQixXQUFPLGlCQUFZO0FBQUE7O0FBQ2pCLFFBQUUsZUFBRixFQUFtQixLQUFuQixDQUF5QixZQUFNO0FBQzdCLG1CQUFXLFVBQVg7QUFDQSxtQkFBVyxlQUFYO0FBQ0EsbUJBQVcsWUFBWDtBQUNBLFVBQUUsZUFBRixFQUFtQixHQUFuQixDQUF1QixPQUF2QjtBQUNBLGVBQU8sT0FBSyxLQUFMLEVBQVA7QUFDRCxPQU5EO0FBT0QsS0FUaUI7O0FBV2xCLFdBQU8saUJBQVk7QUFBQTs7QUFDakIsUUFBRSxlQUFGLEVBQW1CLEtBQW5CLENBQXlCLFlBQU07QUFDN0IsbUJBQVcsU0FBWDtBQUNBLG1CQUFXLGVBQVg7QUFDQSxVQUFFLGVBQUYsRUFBbUIsR0FBbkIsQ0FBdUIsT0FBdkI7QUFDQSxlQUFPLE9BQUssS0FBTCxFQUFQO0FBQ0QsT0FMRDtBQU1ELEtBbEJpQjs7QUFvQmxCLFlBQVEsa0JBQVk7QUFBQTs7QUFDbEIsUUFBRSxxQkFBRixFQUF5QixLQUF6QixDQUErQixZQUFNO0FBQ25DLHFCQUFhLENBQUMsVUFBZDtBQUNBLGVBQUssaUJBQUw7QUFDRCxPQUhEO0FBSUQsS0F6QmlCOztBQTJCbEIsdUJBQW1CLDZCQUFZO0FBQzdCLFFBQUUsb0JBQUYsRUFBd0IsV0FBeEIsQ0FBb0MsSUFBcEM7QUFDRDs7QUE3QmlCLEdBQXBCOztBQWlDQSxXQUFTLElBQVQsR0FBaUI7QUFDZixnQkFBWSxLQUFaO0FBQ0EsZ0JBQVksTUFBWjtBQUNEOztBQUVELFNBQU87QUFDTCxVQUFNLElBREQ7QUFFTCxrQkFBYztBQUZULEdBQVA7QUFJRCxDQWhQYSxFQUFkOztBQWtQQSxFQUFFLFFBQUYsRUFBWSxLQUFaLENBQWtCLFlBQVk7QUFDNUIsUUFBTSxJQUFOO0FBQ0QsQ0FGRCIsImZpbGUiOiJidW5kbGUuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvKiBnbG9iYWwgJCAqL1xuXG4vKipcbiogU2ltb24gaW4gSmF2YVNjcmlwdC5cbiogQW5vdGhlciBGcm9udCBFbmQgY2hhbGxlbmdlIGZvciBGcmVlIENvZGUgQ2FtcC5cbiogaHR0cDovL3d3dy5GcmVlQ29kZUNhbXAuY29tL1xuKi9cblxuJ3N0cmljdCBtb2RlJztcblxuY29uc3QgYXVkaW8gPSAoZnVuY3Rpb24gKCkge1xuICAvKipcbiAgICogQ3JlYXRlIGEgbmV3IGF1ZGlvIGNvbnRleHRcbiAgICovXG4gIGNvbnN0IGF1ZGlvQ3R4ID0gbmV3ICh3aW5kb3cuQXVkaW9Db250ZXh0IHx8IHdpbmRvdy53ZWJraXRBdWRpb0NvbnRleHQpKCk7XG4gIGNvbnN0IGdhaW5Ob2RlID0gYXVkaW9DdHguY3JlYXRlR2FpbigpO1xuICBnYWluTm9kZS5jb25uZWN0KGF1ZGlvQ3R4LmRlc3RpbmF0aW9uKTtcbiAgZ2Fpbk5vZGUuZ2Fpbi52YWx1ZSA9IDAuMDE7XG4gIGxldCBjdXJyR2FpbiA9IGdhaW5Ob2RlLmdhaW4udmFsdWU7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8tdW51c2VkLXZhcnNcbiAgY29uc3Qgd2F2ZVR5cGUgPSAnc2luZSc7XG5cbiAgLyoqXG4gICAqIENyZWF0ZSBvc2NpbGxhdG9ycyBmb3IgdGhlIGZvdXIgZ2FtZSBidXR0b25zXG4gICAqL1xuICBsZXQgaW5pdGlhbGl6ZU9zY2lsbGF0b3IgPSAoZnJlcXVlbmN5KSA9PiB7XG4gICAgbGV0IG9zY2lsbGF0b3IgPSBhdWRpb0N0eC5jcmVhdGVPc2NpbGxhdG9yKCk7XG4gICAgb3NjaWxsYXRvci50eXBlID0gd2F2ZVR5cGU7XG4gICAgb3NjaWxsYXRvci5mcmVxdWVuY3kudmFsdWUgPSBmcmVxdWVuY3k7XG4gICAgb3NjaWxsYXRvci5zdGFydCgwKTtcbiAgICByZXR1cm4gb3NjaWxsYXRvcjtcbiAgfTtcblxuICBjb25zdCBudyA9IGluaXRpYWxpemVPc2NpbGxhdG9yKDQ0MCk7XG4gIGNvbnN0IG5lID0gaW5pdGlhbGl6ZU9zY2lsbGF0b3IoNTU0LjM3KTtcbiAgY29uc3Qgc3cgPSBpbml0aWFsaXplT3NjaWxsYXRvcig2NTkuMjUpO1xuICBjb25zdCBzZSA9IGluaXRpYWxpemVPc2NpbGxhdG9yKDc4My45OSk7XG5cbiAgLyoqXG4gICAqIE1ldGhvZHMgZm9yIHN0YXJ0aW5nIGVhY2ggb3NjaWxsYXRvciB0b25lXG4gICAqL1xuICBsZXQgc3RhcnRUb25lID0ge1xuICAgIGNvbm5lY3RPc2NpbGxhdG9yOiAob3NjaWxsYXRvcikgPT4ge1xuICAgICAgb3NjaWxsYXRvci5jb25uZWN0KGdhaW5Ob2RlKTtcbiAgICB9LFxuICAgIG53OiBmdW5jdGlvbiAoKSB7XG4gICAgICB0aGlzLmNvbm5lY3RPc2NpbGxhdG9yKG53KTtcbiAgICB9LFxuICAgIG5lOiBmdW5jdGlvbiAoKSB7XG4gICAgICB0aGlzLmNvbm5lY3RPc2NpbGxhdG9yKG5lKTtcbiAgICB9LFxuICAgIHN3OiBmdW5jdGlvbiAoKSB7XG4gICAgICB0aGlzLmNvbm5lY3RPc2NpbGxhdG9yKHN3KTtcbiAgICB9LFxuICAgIHNlOiBmdW5jdGlvbiAoKSB7XG4gICAgICB0aGlzLmNvbm5lY3RPc2NpbGxhdG9yKHNlKTtcbiAgICB9XG4gIH07XG5cbiAgLyoqXG4gICAqIE1ldGhvZHMgZm9yIHN0b3BwaW5nIGVhY2ggb3NjaWxsYXRvciB0b25lXG4gICAqL1xuICBsZXQgc3RvcFRvbmUgPSB7XG4gICAgc3RvcDogKG9zY2lsbGF0b3IpID0+IHtcbiAgICAgIGN1cnJHYWluID0gMDtcbiAgICAgIG9zY2lsbGF0b3IuZGlzY29ubmVjdChnYWluTm9kZSk7XG4gICAgfSxcbiAgICBudzogZnVuY3Rpb24gKCkge1xuICAgICAgdGhpcy5zdG9wKG53KTtcbiAgICB9LFxuICAgIG5lOiBmdW5jdGlvbiAoKSB7XG4gICAgICB0aGlzLnN0b3AobmUpO1xuICAgIH0sXG4gICAgc3c6IGZ1bmN0aW9uICgpIHtcbiAgICAgIHRoaXMuc3RvcChzdyk7XG4gICAgfSxcbiAgICBzZTogZnVuY3Rpb24gKCkge1xuICAgICAgdGhpcy5zdG9wKHNlKTtcbiAgICB9XG4gIH07XG5cbiAgcmV0dXJuIHtcbiAgICBudzogbncsXG4gICAgbmU6IG5lLFxuICAgIHN3OiBzdyxcbiAgICBzZTogc2UsXG4gICAgc3RhcnRUb25lOiBzdGFydFRvbmUsXG4gICAgc3RvcFRvbmU6IHN0b3BUb25lXG4gIH07XG59KSgpO1xuXG5jb25zdCBzaW1vbiA9IChmdW5jdGlvbiAoKSB7XG4gIC8qKlxuICAgKiBHYW1lIFN0YXRlXG4gICAqL1xuICBjb25zdCBjb2xvcnMgPSB7XG4gICAgbnc6ICcjMDgwJyxcbiAgICBuZTogJyNGMDAnLFxuICAgIHN3OiAnI0ZGMCcsXG4gICAgc2U6ICcjMDBGJ1xuICB9O1xuICBjb25zdCBjb2xvcnNBY3RpdmUgPSB7XG4gICAgbnc6ICcjOEI4JyxcbiAgICBuZTogJyNGQUEnLFxuICAgIHN3OiAnI0ZGOScsXG4gICAgc2U6ICcjOTlGJ1xuICB9O1xuICBjb25zdCBhdmFpbGFibGVTdGVwcyA9IFsnbncnLCAnbmUnLCAnc3cnLCAnc2UnXTtcblxuICBsZXQgY29tcHV0ZXJTdGVwcyA9IFtdO1xuICBsZXQgcGxheWVyU3RlcHMgPSBbXTtcbiAgbGV0IHN0cmljdE1vZGUgPSBmYWxzZTtcbiAgbGV0IHBsYXllclNlY29uZENoYW5jZSA9IGZhbHNlO1xuXG4gIGZ1bmN0aW9uIGdldFJhbmRvbUludCAobWluLCBtYXgpIHtcbiAgICByZXR1cm4gTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogKG1heCAtIG1pbiArIDEpICsgbWluKTtcbiAgfVxuXG4gIGNvbnN0IHNpbW9uTG9naWMgPSB7XG5cbiAgICB1cGRhdGVEaXNwbGF5OiBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgICQoJyNkaXNwbGF5JylcbiAgICAgICAgLmVtcHR5KClcbiAgICAgICAgLmFwcGVuZCh2YWx1ZSk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFJ1bnMgcmVjdXJzaXZseSB1bnRpbCBlYWNoIGluZGV4IGluIGNvbXB1dGVyU3RlcHMgaXMgcGxheWVkIHRocm91Z2hcbiAgICAgKi9cbiAgICBwbGF5Q29tcHV0ZXJTdGVwczogZnVuY3Rpb24gKGluZGV4KSB7XG4gICAgICBpZiAoIWNvbXB1dGVyU3RlcHNbaW5kZXhdKSB7XG4gICAgICAgIHRoaXMucGxheWVyVHVybigpO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IGN1cnJlbnRTdGVwID0gY29tcHV0ZXJTdGVwc1tpbmRleF07XG4gICAgICBjb25zdCBzdGVwSWQgPSBgIyR7Y29tcHV0ZXJTdGVwc1tpbmRleF19YDtcbiAgICAgIGNvbnN0IGFjdGl2ZUNvbG9yID0gY29sb3JzQWN0aXZlW2NvbXB1dGVyU3RlcHNbaW5kZXhdXTtcbiAgICAgIGNvbnN0IGRlZmF1bHRDb2xvciA9IGNvbG9yc1tjb21wdXRlclN0ZXBzW2luZGV4XV07XG5cbiAgICAgIGNvbnN0IGRpc3BsYXlUdXJucyA9ICgpID0+IHtcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgICAgICQoc3RlcElkKS5jc3MoJ2JhY2tncm91bmQnLCBhY3RpdmVDb2xvcik7XG4gICAgICAgICAgICBhdWRpby5zdGFydFRvbmVbY3VycmVudFN0ZXBdKCk7XG4gICAgICAgICAgICByZXNvbHZlKCk7XG4gICAgICAgICAgfSwgNTAwKTtcbiAgICAgICAgfSk7XG4gICAgICB9O1xuXG4gICAgICBkaXNwbGF5VHVybnMoKVxuICAgICAgLnRoZW4oKCkgPT4ge1xuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICAgICAgJChzdGVwSWQpLmNzcygnYmFja2dyb3VuZCcsIGRlZmF1bHRDb2xvcik7XG4gICAgICAgICAgICBhdWRpby5zdG9wVG9uZVtjdXJyZW50U3RlcF0oKTtcbiAgICAgICAgICAgIHJlc29sdmUoKTtcbiAgICAgICAgICB9LCA1MDApO1xuICAgICAgICB9KTtcbiAgICAgIH0pXG4gICAgICAudGhlbigoKSA9PiB7XG4gICAgICAgIHRoaXMucGxheUNvbXB1dGVyU3RlcHMoaW5kZXggKyAxKTtcbiAgICAgIH0pO1xuICAgIH0sXG5cbiAgICBjb21wdXRlclR1cm46IGZ1bmN0aW9uICgpIHtcbiAgICAgIGlmIChjb21wdXRlclN0ZXBzLmxlbmd0aCA9PT0gMjApIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZ2FtZVdpbigpO1xuICAgICAgfVxuXG4gICAgICBpZiAoIXBsYXllclNlY29uZENoYW5jZSkge1xuICAgICAgICAvLyBhZGQgcmFuZG9tIHN0ZXAgdG8gY29tcHRlclN0ZXBzIGFycmF5XG4gICAgICAgIHZhciByYW5kb21CdXR0b25JbmRleCA9IGdldFJhbmRvbUludCgwLCAzKTtcbiAgICAgICAgY29tcHV0ZXJTdGVwcy5wdXNoKGF2YWlsYWJsZVN0ZXBzW3JhbmRvbUJ1dHRvbkluZGV4XSk7XG4gICAgICB9XG5cbiAgICAgIHRoaXMudXBkYXRlRGlzcGxheShjb21wdXRlclN0ZXBzLmxlbmd0aCk7XG5cbiAgICAgIHRoaXMucGxheUNvbXB1dGVyU3RlcHMoMCk7XG4gICAgfSxcblxuICAgIHBsYXllclR1cm46IGZ1bmN0aW9uICgpIHtcbiAgICAgLy8gbWFrZSBzaW1vbi1idXR0b25zIGNsaWNrYWJsZVxuICAgICAgJCgnLnNpbW9uLWJ1dHRvbnMnKVxuICAgICAgLmFkZENsYXNzKCdjbGlja2FibGUnKVxuICAgICAgLm1vdXNlZG93bigoZXZ0KSA9PiB7XG4gICAgICAgICQoJyMnICsgZXZ0LnRhcmdldC5pZCkuY3NzKCdiYWNrZ3JvdW5kJywgY29sb3JzQWN0aXZlW2V2dC50YXJnZXQuaWRdKTtcbiAgICAgICAgY29uc29sZS5sb2coJ1BMQVlFUiBUT05FIFNUQVJUSU5HJywgZXZ0KTtcbiAgICAgICAgYXVkaW8uc3RhcnRUb25lW2V2dC50YXJnZXQuaWRdKCk7XG4gICAgICB9KVxuICAgICAgLm1vdXNldXAoKGV2dCkgPT4ge1xuICAgICAgICAkKCcjJyArIGV2dC50YXJnZXQuaWQpLmNzcygnYmFja2dyb3VuZCcsIGNvbG9yc1tldnQudGFyZ2V0LmlkXSk7XG4gICAgICAgIGNvbnNvbGUubG9nKCdQTEFZRVIgVE9ORSBFTkRJTkcnKTtcbiAgICAgICAgYXVkaW8uc3RvcFRvbmVbZXZ0LnRhcmdldC5pZF0oKTtcbiAgICAgIH0pXG4gICAgICAub24oJ2NsaWNrJywgKGV2dCkgPT4ge1xuICAgICAgICBldnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgZXZ0LnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgICB2YXIgY3VycmVudFBsYXllclN0ZXBJbmRleDtcblxuICAgICAgICBwbGF5ZXJTdGVwcy5wdXNoKGV2dC50YXJnZXQuaWQpO1xuICAgICAgICBjdXJyZW50UGxheWVyU3RlcEluZGV4ID0gcGxheWVyU3RlcHMubGVuZ3RoIC0gMTtcblxuICAgICAgICBpZiAoY29tcHV0ZXJTdGVwc1tjdXJyZW50UGxheWVyU3RlcEluZGV4XSA9PT0gcGxheWVyU3RlcHNbY3VycmVudFBsYXllclN0ZXBJbmRleF0pIHtcbiAgICAgICAgICBpZiAoY29tcHV0ZXJTdGVwcy5sZW5ndGggPT09IHBsYXllclN0ZXBzLmxlbmd0aCkge1xuICAgICAgICAgICAgJCgnLnNpbW9uLWJ1dHRvbnMnKVxuICAgICAgICAgICAgICAub2ZmKClcbiAgICAgICAgICAgICAgLnJlbW92ZUNsYXNzKCdjbGlja2FibGUnKTtcbiAgICAgICAgICAgIHBsYXllclN0ZXBzID0gW107XG5cbiAgICAgICAgICAgIGlmIChwbGF5ZXJTZWNvbmRDaGFuY2UpIHtcbiAgICAgICAgICAgICAgdGhpcy5jbGVhckFub3RoZXJDaGFuY2UoKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuY29tcHV0ZXJUdXJuKCk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgJCgnLnNpbW9uLWJ1dHRvbnMnKVxuICAgICAgICAgICAgICAub2ZmKClcbiAgICAgICAgICAgICAgLnJlbW92ZUNsYXNzKCdjbGlja2FibGUnKTtcblxuICAgICAgICAgIHJldHVybiBzaW1vbkxvZ2ljLnBsYXllclR1cm4oKTtcbiAgICAgICAgfVxuICAgICAgICAvLyBpZiBzdHJpY3RNb2RlIGlzIGZhbHNlLCBwbGF5ZXIgZ2V0cyBhbm90aGVyIGNoYW5jZVxuICAgICAgICBpZiAoIXN0cmljdE1vZGUpIHtcbiAgICAgICAgICBzaW1vbkxvZ2ljLmFub3RoZXJDaGFuY2UoKTtcbiAgICAgICAgICAkKCcuc2ltb24tYnV0dG9ucycpXG4gICAgICAgICAgICAub2ZmKClcbiAgICAgICAgICAgIC5yZW1vdmVDbGFzcygnY2xpY2thYmxlJyk7XG4gICAgICAgICAgcGxheWVyU3RlcHMgPSBbXTtcbiAgICAgICAgICByZXR1cm4gc2ltb25Mb2dpYy5jb21wdXRlclR1cm4oKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgLy8gZWxzZSwgc3RyaWN0TW9kZSBpcyB0cnVlLCB3aGljaCBtZWFucyBnYW1lIG92ZXJcbiAgICAgICAgICBzaW1vbkxvZ2ljLmdhbWVMb3NlKCk7XG4gICAgICAgICAgJCgnLnNpbW9uLWJ1dHRvbnMnKVxuICAgICAgICAgICAgLm9mZigpXG4gICAgICAgICAgICAucmVtb3ZlQ2xhc3MoJ2NsaWNrYWJsZScpO1xuICAgICAgICAgIHJldHVybiBzaW1vbkxvZ2ljLnJlc2V0R2FtZSgpO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9LFxuXG4gICAgY2xlYXJNb3ZlczogZnVuY3Rpb24gKCkge1xuICAgICAgY29tcHV0ZXJTdGVwcyA9IFtdO1xuICAgICAgcGxheWVyU3RlcHMgPSBbXTtcbiAgICAgIHBsYXllclNlY29uZENoYW5jZSA9IGZhbHNlO1xuICAgIH0sXG5cbiAgICByZXNldEdhbWU6IGZ1bmN0aW9uICgpIHtcbiAgICAgIHRoaXMuY2xlYXJNb3ZlcygpO1xuICAgICAgdGhpcy51cGRhdGVEaXNwbGF5KCctLScpO1xuICAgICAgJCgnLnNpbW9uLWJ1dHRvbnMnKVxuICAgICAgICAub2ZmKClcbiAgICAgICAgLnJlbW92ZUNsYXNzKCdjbGlja2FibGUnKTtcbiAgICAgICQoJyNyZXNldC1idXR0b24nKS5vZmYoJ2NsaWNrJyk7XG4gICAgfSxcblxuICAgIGFub3RoZXJDaGFuY2U6IGZ1bmN0aW9uICgpIHtcbiAgICAgICQoJy5nYW1lLXN0YXR1cycpXG4gICAgICAgIC5lbXB0eSgpXG4gICAgICAgIC5hcHBlbmQoJzxoMj5XUk9ORyEgVFJZIEFHQUlOPC9oMj4nKTtcbiAgICAgIHBsYXllclN0ZXBzID0gW107XG4gICAgICBwbGF5ZXJTZWNvbmRDaGFuY2UgPSB0cnVlO1xuICAgIH0sXG5cbiAgICBjbGVhckFub3RoZXJDaGFuY2U6IGZ1bmN0aW9uICgpIHtcbiAgICAgIHRoaXMuY2xlYXJHYW1lU3RhdHVzKCk7XG4gICAgICBwbGF5ZXJTZWNvbmRDaGFuY2UgPSBmYWxzZTtcbiAgICB9LFxuXG4gICAgZ2FtZVdpbjogZnVuY3Rpb24gKCkge1xuICAgICAgJCgnLmdhbWUtc3RhdHVzJykuYXBwZW5kKCc8aDI+WU9VIFdJTiE8L2gyPicpO1xuICAgICAgcmV0dXJuIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICB0aGlzLnJlc2V0R2FtZSgpO1xuICAgICAgICB0aGlzLmNsZWFyR2FtZVN0YXR1cygpO1xuICAgICAgICB0aGlzLmNvbXB1dGVyVHVybigpO1xuICAgICAgfSwgMTAwMCk7XG4gICAgfSxcblxuICAgIGdhbWVMb3NlOiBmdW5jdGlvbiAoKSB7XG4gICAgICAkKCcuZ2FtZS1zdGF0dXMnKS5lbXB0eSgpLmFwcGVuZCgnPGgyPllPVSBMT1NFITwvaDI+Jyk7XG4gICAgICByZXR1cm4gYnV0dG9uTG9naWMuc3RhcnQoKTtcbiAgICB9LFxuXG4gICAgY2xlYXJHYW1lU3RhdHVzOiBmdW5jdGlvbiAoKSB7XG4gICAgICAkKCcuZ2FtZS1zdGF0dXMnKS5lbXB0eSgpO1xuICAgIH1cbiAgfTtcblxuICBjb25zdCBidXR0b25Mb2dpYyA9IHtcbiAgICBzdGFydDogZnVuY3Rpb24gKCkge1xuICAgICAgJCgnI3N0YXJ0LWJ1dHRvbicpLmNsaWNrKCgpID0+IHtcbiAgICAgICAgc2ltb25Mb2dpYy5jbGVhck1vdmVzKCk7XG4gICAgICAgIHNpbW9uTG9naWMuY2xlYXJHYW1lU3RhdHVzKCk7XG4gICAgICAgIHNpbW9uTG9naWMuY29tcHV0ZXJUdXJuKCk7XG4gICAgICAgICQoJyNzdGFydC1idXR0b24nKS5vZmYoJ2NsaWNrJyk7XG4gICAgICAgIHJldHVybiB0aGlzLnJlc2V0KCk7XG4gICAgICB9KTtcbiAgICB9LFxuXG4gICAgcmVzZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICQoJyNyZXNldC1idXR0b24nKS5jbGljaygoKSA9PiB7XG4gICAgICAgIHNpbW9uTG9naWMucmVzZXRHYW1lKCk7XG4gICAgICAgIHNpbW9uTG9naWMuY2xlYXJHYW1lU3RhdHVzKCk7XG4gICAgICAgICQoJyNyZXNldC1idXR0b24nKS5vZmYoJ2NsaWNrJyk7XG4gICAgICAgIHJldHVybiB0aGlzLnN0YXJ0KCk7XG4gICAgICB9KTtcbiAgICB9LFxuXG4gICAgc3RyaWN0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAkKCcjc3RyaWN0LW1vZGUtYnV0dG9uJykuY2xpY2soKCkgPT4ge1xuICAgICAgICBzdHJpY3RNb2RlID0gIXN0cmljdE1vZGU7XG4gICAgICAgIHRoaXMuc3RyaWN0TGlnaHRUb2dnbGUoKTtcbiAgICAgIH0pO1xuICAgIH0sXG5cbiAgICBzdHJpY3RMaWdodFRvZ2dsZTogZnVuY3Rpb24gKCkge1xuICAgICAgJCgnI3N0cmljdC1tb2RlLWxpZ2h0JykudG9nZ2xlQ2xhc3MoJ29uJyk7XG4gICAgfVxuXG4gIH07XG5cbiAgZnVuY3Rpb24gaW5pdCAoKSB7XG4gICAgYnV0dG9uTG9naWMuc3RhcnQoKTtcbiAgICBidXR0b25Mb2dpYy5zdHJpY3QoKTtcbiAgfVxuXG4gIHJldHVybiB7XG4gICAgaW5pdDogaW5pdCxcbiAgICBnZXRSYW5kb21JbnQ6IGdldFJhbmRvbUludFxuICB9O1xufSkoKTtcblxuJChkb2N1bWVudCkucmVhZHkoZnVuY3Rpb24gKCkge1xuICBzaW1vbi5pbml0KCk7XG59KTtcbiJdLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==
