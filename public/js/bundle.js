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
  var gameReset = false;

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

      console.log('outer game reset:', gameReset);
      if (gameReset) {
        return;
      }

      if (!computerSteps[index]) {
        console.log('player turn');
        console.log('game reset:', gameReset);
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
        audio.startTone[evt.target.id]();
      }).mouseup(function (evt) {
        $('#' + evt.target.id).css('background', colors[evt.target.id]);
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
        gameReset = false;
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
        gameReset = true;
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
//# sourceMappingURL=data:application/json;base64,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O0FBQ0EsZUFBTyxPQUFLLEtBQUwsRUFBUDtBQUNELE9BUEQ7QUFRRCxLQVZpQjs7QUFZbEIsV0FBTyxpQkFBWTtBQUFBOztBQUNqQixRQUFFLGVBQUYsRUFBbUIsS0FBbkIsQ0FBeUIsWUFBTTtBQUM3QixvQkFBWSxJQUFaO0FBQ0EsbUJBQVcsU0FBWDtBQUNBLG1CQUFXLGVBQVg7QUFDQSxVQUFFLGVBQUYsRUFBbUIsR0FBbkIsQ0FBdUIsT0FBdkI7QUFDQSxlQUFPLE9BQUssS0FBTCxFQUFQO0FBQ0QsT0FORDtBQU9ELEtBcEJpQjs7QUFzQmxCLFlBQVEsa0JBQVk7QUFBQTs7QUFDbEIsUUFBRSxxQkFBRixFQUF5QixLQUF6QixDQUErQixZQUFNO0FBQ25DLHFCQUFhLENBQUMsVUFBZDtBQUNBLGVBQUssaUJBQUw7QUFDRCxPQUhEO0FBSUQsS0EzQmlCOztBQTZCbEIsdUJBQW1CLDZCQUFZO0FBQzdCLFFBQUUsb0JBQUYsRUFBd0IsV0FBeEIsQ0FBb0MsSUFBcEM7QUFDRDs7QUEvQmlCLEdBQXBCOztBQW1DQSxXQUFTLElBQVQsR0FBaUI7QUFDZixnQkFBWSxLQUFaO0FBQ0EsZ0JBQVksTUFBWjtBQUNEOztBQUVELFNBQU87QUFDTCxVQUFNLElBREQ7QUFFTCxrQkFBYztBQUZULEdBQVA7QUFJRCxDQXZRYSxFQUFkOztBQXlRQSxFQUFFLFFBQUYsRUFBWSxLQUFaLENBQWtCLFlBQVk7QUFDNUIsUUFBTSxJQUFOO0FBQ0QsQ0FGRCIsImZpbGUiOiJidW5kbGUuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvKiBnbG9iYWwgJCAqL1xuXG4vKipcbiogU2ltb24gaW4gSmF2YVNjcmlwdC5cbiogQW5vdGhlciBGcm9udCBFbmQgY2hhbGxlbmdlIGZvciBGcmVlIENvZGUgQ2FtcC5cbiogaHR0cDovL3d3dy5GcmVlQ29kZUNhbXAuY29tL1xuKi9cblxuJ3N0cmljdCBtb2RlJztcblxuY29uc3QgYXVkaW8gPSAoZnVuY3Rpb24gKCkge1xuICAvKipcbiAgICogQ3JlYXRlIGEgbmV3IGF1ZGlvIGNvbnRleHRcbiAgICovXG4gIGNvbnN0IGF1ZGlvQ3R4ID0gbmV3ICh3aW5kb3cuQXVkaW9Db250ZXh0IHx8IHdpbmRvdy53ZWJraXRBdWRpb0NvbnRleHQpKCk7XG4gIGNvbnN0IGdhaW5Ob2RlID0gYXVkaW9DdHguY3JlYXRlR2FpbigpO1xuICBnYWluTm9kZS5jb25uZWN0KGF1ZGlvQ3R4LmRlc3RpbmF0aW9uKTtcbiAgZ2Fpbk5vZGUuZ2Fpbi52YWx1ZSA9IDAuMDE7XG4gIGxldCBjdXJyR2FpbiA9IGdhaW5Ob2RlLmdhaW4udmFsdWU7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8tdW51c2VkLXZhcnNcbiAgY29uc3Qgd2F2ZVR5cGUgPSAnc2luZSc7XG5cbiAgLyoqXG4gICAqIENyZWF0ZSBvc2NpbGxhdG9ycyBmb3IgdGhlIGZvdXIgZ2FtZSBidXR0b25zXG4gICAqL1xuICBsZXQgaW5pdGlhbGl6ZU9zY2lsbGF0b3IgPSAoZnJlcXVlbmN5KSA9PiB7XG4gICAgbGV0IG9zY2lsbGF0b3IgPSBhdWRpb0N0eC5jcmVhdGVPc2NpbGxhdG9yKCk7XG4gICAgb3NjaWxsYXRvci50eXBlID0gd2F2ZVR5cGU7XG4gICAgb3NjaWxsYXRvci5mcmVxdWVuY3kudmFsdWUgPSBmcmVxdWVuY3k7XG4gICAgb3NjaWxsYXRvci5zdGFydCgwKTtcbiAgICByZXR1cm4gb3NjaWxsYXRvcjtcbiAgfTtcblxuICBjb25zdCBudyA9IGluaXRpYWxpemVPc2NpbGxhdG9yKDQ0MCk7XG4gIGNvbnN0IG5lID0gaW5pdGlhbGl6ZU9zY2lsbGF0b3IoNTU0LjM3KTtcbiAgY29uc3Qgc3cgPSBpbml0aWFsaXplT3NjaWxsYXRvcig2NTkuMjUpO1xuICBjb25zdCBzZSA9IGluaXRpYWxpemVPc2NpbGxhdG9yKDc4My45OSk7XG5cbiAgLyoqXG4gICAqIE1ldGhvZHMgZm9yIHN0YXJ0aW5nIGVhY2ggb3NjaWxsYXRvciB0b25lXG4gICAqL1xuICBsZXQgc3RhcnRUb25lID0ge1xuICAgIGNvbm5lY3RPc2NpbGxhdG9yOiAob3NjaWxsYXRvcikgPT4ge1xuICAgICAgb3NjaWxsYXRvci5jb25uZWN0KGdhaW5Ob2RlKTtcbiAgICB9LFxuICAgIG53OiBmdW5jdGlvbiAoKSB7XG4gICAgICB0aGlzLmNvbm5lY3RPc2NpbGxhdG9yKG53KTtcbiAgICB9LFxuICAgIG5lOiBmdW5jdGlvbiAoKSB7XG4gICAgICB0aGlzLmNvbm5lY3RPc2NpbGxhdG9yKG5lKTtcbiAgICB9LFxuICAgIHN3OiBmdW5jdGlvbiAoKSB7XG4gICAgICB0aGlzLmNvbm5lY3RPc2NpbGxhdG9yKHN3KTtcbiAgICB9LFxuICAgIHNlOiBmdW5jdGlvbiAoKSB7XG4gICAgICB0aGlzLmNvbm5lY3RPc2NpbGxhdG9yKHNlKTtcbiAgICB9XG4gIH07XG5cbiAgLyoqXG4gICAqIE1ldGhvZHMgZm9yIHN0b3BwaW5nIGVhY2ggb3NjaWxsYXRvciB0b25lXG4gICAqL1xuICBsZXQgc3RvcFRvbmUgPSB7XG4gICAgc3RvcDogKG9zY2lsbGF0b3IpID0+IHtcbiAgICAgIGN1cnJHYWluID0gMDtcbiAgICAgIG9zY2lsbGF0b3IuZGlzY29ubmVjdChnYWluTm9kZSk7XG4gICAgfSxcbiAgICBudzogZnVuY3Rpb24gKCkge1xuICAgICAgdGhpcy5zdG9wKG53KTtcbiAgICB9LFxuICAgIG5lOiBmdW5jdGlvbiAoKSB7XG4gICAgICB0aGlzLnN0b3AobmUpO1xuICAgIH0sXG4gICAgc3c6IGZ1bmN0aW9uICgpIHtcbiAgICAgIHRoaXMuc3RvcChzdyk7XG4gICAgfSxcbiAgICBzZTogZnVuY3Rpb24gKCkge1xuICAgICAgdGhpcy5zdG9wKHNlKTtcbiAgICB9XG4gIH07XG5cbiAgcmV0dXJuIHtcbiAgICBudzogbncsXG4gICAgbmU6IG5lLFxuICAgIHN3OiBzdyxcbiAgICBzZTogc2UsXG4gICAgc3RhcnRUb25lOiBzdGFydFRvbmUsXG4gICAgc3RvcFRvbmU6IHN0b3BUb25lXG4gIH07XG59KSgpO1xuXG5jb25zdCBzaW1vbiA9IChmdW5jdGlvbiAoKSB7XG4gIC8qKlxuICAgKiBHYW1lIFN0YXRlXG4gICAqL1xuICBjb25zdCBjb2xvcnMgPSB7XG4gICAgbnc6ICcjMDgwJyxcbiAgICBuZTogJyNGMDAnLFxuICAgIHN3OiAnI0ZGMCcsXG4gICAgc2U6ICcjMDBGJ1xuICB9O1xuICBjb25zdCBjb2xvcnNBY3RpdmUgPSB7XG4gICAgbnc6ICcjOEI4JyxcbiAgICBuZTogJyNGQUEnLFxuICAgIHN3OiAnI0ZGOScsXG4gICAgc2U6ICcjOTlGJ1xuICB9O1xuICBjb25zdCBhdmFpbGFibGVTdGVwcyA9IFsnbncnLCAnbmUnLCAnc3cnLCAnc2UnXTtcblxuICBsZXQgY29tcHV0ZXJTdGVwcyA9IFtdO1xuICBsZXQgcGxheWVyU3RlcHMgPSBbXTtcbiAgbGV0IHN0cmljdE1vZGUgPSBmYWxzZTtcbiAgbGV0IHBsYXllclNlY29uZENoYW5jZSA9IGZhbHNlO1xuICBsZXQgZ2FtZVJlc2V0ID0gZmFsc2U7XG5cbiAgZnVuY3Rpb24gZ2V0UmFuZG9tSW50IChtaW4sIG1heCkge1xuICAgIHJldHVybiBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiAobWF4IC0gbWluICsgMSkgKyBtaW4pO1xuICB9XG5cbiAgY29uc3Qgc2ltb25Mb2dpYyA9IHtcblxuICAgIHVwZGF0ZURpc3BsYXk6IGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgJCgnI2Rpc3BsYXknKVxuICAgICAgICAuZW1wdHkoKVxuICAgICAgICAuYXBwZW5kKHZhbHVlKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogUnVucyByZWN1cnNpdmx5IHVudGlsIGVhY2ggaW5kZXggaW4gY29tcHV0ZXJTdGVwcyBpcyBwbGF5ZWQgdGhyb3VnaFxuICAgICAqL1xuICAgIHBsYXlDb21wdXRlclN0ZXBzOiBmdW5jdGlvbiAoaW5kZXgpIHtcbiAgICAgIGNvbnNvbGUubG9nKCdvdXRlciBnYW1lIHJlc2V0OicsIGdhbWVSZXNldClcbiAgICAgIGlmIChnYW1lUmVzZXQpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICBpZiAoIWNvbXB1dGVyU3RlcHNbaW5kZXhdKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKCdwbGF5ZXIgdHVybicpXG4gICAgICAgIGNvbnNvbGUubG9nKCdnYW1lIHJlc2V0OicsIGdhbWVSZXNldClcbiAgICAgICAgdGhpcy5wbGF5ZXJUdXJuKCk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgY29uc3QgY3VycmVudFN0ZXAgPSBjb21wdXRlclN0ZXBzW2luZGV4XTtcbiAgICAgIGNvbnN0IHN0ZXBJZCA9IGAjJHtjb21wdXRlclN0ZXBzW2luZGV4XX1gO1xuICAgICAgY29uc3QgYWN0aXZlQ29sb3IgPSBjb2xvcnNBY3RpdmVbY29tcHV0ZXJTdGVwc1tpbmRleF1dO1xuICAgICAgY29uc3QgZGVmYXVsdENvbG9yID0gY29sb3JzW2NvbXB1dGVyU3RlcHNbaW5kZXhdXTtcblxuICAgICAgY29uc3QgZGlzcGxheVR1cm5zID0gKCkgPT4ge1xuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICAgICAgJChzdGVwSWQpLmNzcygnYmFja2dyb3VuZCcsIGFjdGl2ZUNvbG9yKTtcbiAgICAgICAgICAgIGF1ZGlvLnN0YXJ0VG9uZVtjdXJyZW50U3RlcF0oKTtcbiAgICAgICAgICAgIHJlc29sdmUoKTtcbiAgICAgICAgICB9LCA1MDApO1xuICAgICAgICB9KTtcbiAgICAgIH07XG5cbiAgICAgIGRpc3BsYXlUdXJucygpXG4gICAgICAudGhlbigoKSA9PiB7XG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgICAgICAkKHN0ZXBJZCkuY3NzKCdiYWNrZ3JvdW5kJywgZGVmYXVsdENvbG9yKTtcbiAgICAgICAgICAgIGF1ZGlvLnN0b3BUb25lW2N1cnJlbnRTdGVwXSgpO1xuICAgICAgICAgICAgcmVzb2x2ZSgpO1xuICAgICAgICAgIH0sIDUwMCk7XG4gICAgICAgIH0pO1xuICAgICAgfSlcbiAgICAgIC50aGVuKCgpID0+IHtcbiAgICAgICAgdGhpcy5wbGF5Q29tcHV0ZXJTdGVwcyhpbmRleCArIDEpO1xuICAgICAgfSk7XG4gICAgfSxcblxuICAgIGNvbXB1dGVyVHVybjogZnVuY3Rpb24gKCkge1xuICAgICAgaWYgKGNvbXB1dGVyU3RlcHMubGVuZ3RoID09PSAyMCkge1xuICAgICAgICByZXR1cm4gdGhpcy5nYW1lV2luKCk7XG4gICAgICB9XG5cbiAgICAgIGlmICghcGxheWVyU2Vjb25kQ2hhbmNlKSB7XG4gICAgICAgIC8vIGFkZCByYW5kb20gc3RlcCB0byBjb21wdGVyU3RlcHMgYXJyYXlcbiAgICAgICAgdmFyIHJhbmRvbUJ1dHRvbkluZGV4ID0gZ2V0UmFuZG9tSW50KDAsIDMpO1xuICAgICAgICBjb21wdXRlclN0ZXBzLnB1c2goYXZhaWxhYmxlU3RlcHNbcmFuZG9tQnV0dG9uSW5kZXhdKTtcbiAgICAgIH1cblxuICAgICAgdGhpcy51cGRhdGVEaXNwbGF5KGNvbXB1dGVyU3RlcHMubGVuZ3RoKTtcblxuICAgICAgdGhpcy5wbGF5Q29tcHV0ZXJTdGVwcygwKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogUnVucyByZWN1cnNpdmx5IHVudGlsIHBsYXllciBtYXRjaGVzIGVhY2ggaW5kZXggaW4gY29tcHV0ZXJTdGVwcyxcbiAgICAgKiBvciB1bnRpbCB0aGUgcGxheWVyIGxvc2VzLlxuICAgICAqL1xuICAgIHBsYXllclR1cm46IGZ1bmN0aW9uICgpIHtcbiAgICAgLy8gU2ltb24gYnV0dG9ucyBjbGljayBoYW5kbGVyXG4gICAgICAkKCcuc2ltb24tYnV0dG9ucycpXG4gICAgICAuYWRkQ2xhc3MoJ2NsaWNrYWJsZScpXG4gICAgICAubW91c2Vkb3duKChldnQpID0+IHtcbiAgICAgICAgJCgnIycgKyBldnQudGFyZ2V0LmlkKS5jc3MoJ2JhY2tncm91bmQnLCBjb2xvcnNBY3RpdmVbZXZ0LnRhcmdldC5pZF0pO1xuICAgICAgICBhdWRpby5zdGFydFRvbmVbZXZ0LnRhcmdldC5pZF0oKTtcbiAgICAgIH0pXG4gICAgICAubW91c2V1cCgoZXZ0KSA9PiB7XG4gICAgICAgICQoJyMnICsgZXZ0LnRhcmdldC5pZCkuY3NzKCdiYWNrZ3JvdW5kJywgY29sb3JzW2V2dC50YXJnZXQuaWRdKTtcbiAgICAgICAgYXVkaW8uc3RvcFRvbmVbZXZ0LnRhcmdldC5pZF0oKTtcbiAgICAgIH0pXG4gICAgICAub24oJ2NsaWNrJywgKGV2dCkgPT4ge1xuICAgICAgICBldnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgZXZ0LnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgICB2YXIgY3VycmVudFBsYXllclN0ZXBJbmRleDtcblxuICAgICAgICBwbGF5ZXJTdGVwcy5wdXNoKGV2dC50YXJnZXQuaWQpO1xuICAgICAgICBjdXJyZW50UGxheWVyU3RlcEluZGV4ID0gcGxheWVyU3RlcHMubGVuZ3RoIC0gMTtcblxuICAgICAgICAvLyBJZiBwbGF5ZXIgbWFrZXMgYSBjb3JyZWN0IHN0ZXAsIHJ1biBwbGF5ZXJUdXJuIGFnYWluXG4gICAgICAgIGlmIChjb21wdXRlclN0ZXBzW2N1cnJlbnRQbGF5ZXJTdGVwSW5kZXhdID09PSBwbGF5ZXJTdGVwc1tjdXJyZW50UGxheWVyU3RlcEluZGV4XSkge1xuICAgICAgICAgIHJldHVybiB0aGlzLmhhbmRsZUNvcnJlY3RVc2VyU3RlcCgpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHRoaXMuaGFuZGxlSW5jb3JyZWN0VXNlclN0ZXAoKTtcbiAgICAgIH0pO1xuICAgIH0sXG5cbiAgICBoYW5kbGVDb3JyZWN0VXNlclN0ZXA6IGZ1bmN0aW9uICgpIHtcbiAgICAgIC8vIElmIGZpbmFsIHN0ZXAgaXMgY29ycmVjdCwgaXQncyB0aGUgY29tcHV0ZXIncyB0dXJuXG4gICAgICBpZiAoY29tcHV0ZXJTdGVwcy5sZW5ndGggPT09IHBsYXllclN0ZXBzLmxlbmd0aCkge1xuICAgICAgICAkKCcuc2ltb24tYnV0dG9ucycpXG4gICAgICAgICAgLm9mZigpXG4gICAgICAgICAgLnJlbW92ZUNsYXNzKCdjbGlja2FibGUnKTtcbiAgICAgICAgcGxheWVyU3RlcHMgPSBbXTtcblxuICAgICAgICBpZiAocGxheWVyU2Vjb25kQ2hhbmNlKSB7XG4gICAgICAgICAgdGhpcy5jbGVhckFub3RoZXJDaGFuY2UoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB0aGlzLmNvbXB1dGVyVHVybigpO1xuICAgICAgfVxuXG4gICAgICAkKCcuc2ltb24tYnV0dG9ucycpXG4gICAgICAgICAgLm9mZigpXG4gICAgICAgICAgLnJlbW92ZUNsYXNzKCdjbGlja2FibGUnKTtcblxuICAgICAgcmV0dXJuIHRoaXMucGxheWVyVHVybigpO1xuICAgIH0sXG5cbiAgICBoYW5kbGVJbmNvcnJlY3RVc2VyU3RlcDogZnVuY3Rpb24gKCkge1xuICAgICAgLy8gaWYgc3RyaWN0TW9kZSBpcyBmYWxzZSwgcGxheWVyIGdldHMgYW5vdGhlciBjaGFuY2VcbiAgICAgIGlmICghc3RyaWN0TW9kZSkge1xuICAgICAgICB0aGlzLmFub3RoZXJDaGFuY2UoKTtcbiAgICAgICAgJCgnLnNpbW9uLWJ1dHRvbnMnKVxuICAgICAgICAgIC5vZmYoKVxuICAgICAgICAgIC5yZW1vdmVDbGFzcygnY2xpY2thYmxlJyk7XG4gICAgICAgIHBsYXllclN0ZXBzID0gW107XG4gICAgICAgIHJldHVybiB0aGlzLmNvbXB1dGVyVHVybigpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgIC8vIGVsc2UsIHN0cmljdE1vZGUgaXMgdHJ1ZSwgd2hpY2ggbWVhbnMgZ2FtZSBvdmVyXG4gICAgICAgIHRoaXMuZ2FtZUxvc2UoKTtcbiAgICAgICAgJCgnLnNpbW9uLWJ1dHRvbnMnKVxuICAgICAgICAgIC5vZmYoKVxuICAgICAgICAgIC5yZW1vdmVDbGFzcygnY2xpY2thYmxlJyk7XG4gICAgICAgIHJldHVybiB0aGlzLnJlc2V0R2FtZSgpO1xuICAgICAgfVxuICAgIH0sXG5cbiAgICBjbGVhck1vdmVzOiBmdW5jdGlvbiAoKSB7XG4gICAgICBjb21wdXRlclN0ZXBzID0gW107XG4gICAgICBwbGF5ZXJTdGVwcyA9IFtdO1xuICAgICAgcGxheWVyU2Vjb25kQ2hhbmNlID0gZmFsc2U7XG4gICAgfSxcblxuICAgIHJlc2V0R2FtZTogZnVuY3Rpb24gKCkge1xuICAgICAgdGhpcy5jbGVhck1vdmVzKCk7XG4gICAgICB0aGlzLnVwZGF0ZURpc3BsYXkoJy0tJyk7XG4gICAgICAkKCcuc2ltb24tYnV0dG9ucycpXG4gICAgICAgIC5vZmYoKVxuICAgICAgICAucmVtb3ZlQ2xhc3MoJ2NsaWNrYWJsZScpO1xuICAgICAgJCgnI3Jlc2V0LWJ1dHRvbicpLm9mZignY2xpY2snKTtcbiAgICB9LFxuXG4gICAgYW5vdGhlckNoYW5jZTogZnVuY3Rpb24gKCkge1xuICAgICAgJCgnLmdhbWUtc3RhdHVzJylcbiAgICAgICAgLmVtcHR5KClcbiAgICAgICAgLmFwcGVuZCgnPGgyPldST05HISBUUlkgQUdBSU48L2gyPicpO1xuICAgICAgcGxheWVyU3RlcHMgPSBbXTtcbiAgICAgIHBsYXllclNlY29uZENoYW5jZSA9IHRydWU7XG4gICAgfSxcblxuICAgIGNsZWFyQW5vdGhlckNoYW5jZTogZnVuY3Rpb24gKCkge1xuICAgICAgdGhpcy5jbGVhckdhbWVTdGF0dXMoKTtcbiAgICAgIHBsYXllclNlY29uZENoYW5jZSA9IGZhbHNlO1xuICAgIH0sXG5cbiAgICBnYW1lV2luOiBmdW5jdGlvbiAoKSB7XG4gICAgICAkKCcuZ2FtZS1zdGF0dXMnKS5hcHBlbmQoJzxoMj5ZT1UgV0lOITwvaDI+Jyk7XG4gICAgICByZXR1cm4gc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgIHRoaXMucmVzZXRHYW1lKCk7XG4gICAgICAgIHRoaXMuY2xlYXJHYW1lU3RhdHVzKCk7XG4gICAgICAgIHRoaXMuY29tcHV0ZXJUdXJuKCk7XG4gICAgICB9LCAxMDAwKTtcbiAgICB9LFxuXG4gICAgZ2FtZUxvc2U6IGZ1bmN0aW9uICgpIHtcbiAgICAgICQoJy5nYW1lLXN0YXR1cycpLmVtcHR5KCkuYXBwZW5kKCc8aDI+WU9VIExPU0UhPC9oMj4nKTtcbiAgICAgIHJldHVybiBidXR0b25Mb2dpYy5zdGFydCgpO1xuICAgIH0sXG5cbiAgICBjbGVhckdhbWVTdGF0dXM6IGZ1bmN0aW9uICgpIHtcbiAgICAgICQoJy5nYW1lLXN0YXR1cycpLmVtcHR5KCk7XG4gICAgfVxuICB9O1xuXG4gIGNvbnN0IGJ1dHRvbkxvZ2ljID0ge1xuICAgIHN0YXJ0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAkKCcjc3RhcnQtYnV0dG9uJykuY2xpY2soKCkgPT4ge1xuICAgICAgICBnYW1lUmVzZXQgPSBmYWxzZTtcbiAgICAgICAgc2ltb25Mb2dpYy5jbGVhck1vdmVzKCk7XG4gICAgICAgIHNpbW9uTG9naWMuY2xlYXJHYW1lU3RhdHVzKCk7XG4gICAgICAgIHNpbW9uTG9naWMuY29tcHV0ZXJUdXJuKCk7XG4gICAgICAgICQoJyNzdGFydC1idXR0b24nKS5vZmYoJ2NsaWNrJyk7XG4gICAgICAgIHJldHVybiB0aGlzLnJlc2V0KCk7XG4gICAgICB9KTtcbiAgICB9LFxuXG4gICAgcmVzZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICQoJyNyZXNldC1idXR0b24nKS5jbGljaygoKSA9PiB7XG4gICAgICAgIGdhbWVSZXNldCA9IHRydWU7XG4gICAgICAgIHNpbW9uTG9naWMucmVzZXRHYW1lKCk7XG4gICAgICAgIHNpbW9uTG9naWMuY2xlYXJHYW1lU3RhdHVzKCk7XG4gICAgICAgICQoJyNyZXNldC1idXR0b24nKS5vZmYoJ2NsaWNrJyk7XG4gICAgICAgIHJldHVybiB0aGlzLnN0YXJ0KCk7XG4gICAgICB9KTtcbiAgICB9LFxuXG4gICAgc3RyaWN0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAkKCcjc3RyaWN0LW1vZGUtYnV0dG9uJykuY2xpY2soKCkgPT4ge1xuICAgICAgICBzdHJpY3RNb2RlID0gIXN0cmljdE1vZGU7XG4gICAgICAgIHRoaXMuc3RyaWN0TGlnaHRUb2dnbGUoKTtcbiAgICAgIH0pO1xuICAgIH0sXG5cbiAgICBzdHJpY3RMaWdodFRvZ2dsZTogZnVuY3Rpb24gKCkge1xuICAgICAgJCgnI3N0cmljdC1tb2RlLWxpZ2h0JykudG9nZ2xlQ2xhc3MoJ29uJyk7XG4gICAgfVxuXG4gIH07XG5cbiAgZnVuY3Rpb24gaW5pdCAoKSB7XG4gICAgYnV0dG9uTG9naWMuc3RhcnQoKTtcbiAgICBidXR0b25Mb2dpYy5zdHJpY3QoKTtcbiAgfVxuXG4gIHJldHVybiB7XG4gICAgaW5pdDogaW5pdCxcbiAgICBnZXRSYW5kb21JbnQ6IGdldFJhbmRvbUludFxuICB9O1xufSkoKTtcblxuJChkb2N1bWVudCkucmVhZHkoZnVuY3Rpb24gKCkge1xuICBzaW1vbi5pbml0KCk7XG59KTtcbiJdLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==
