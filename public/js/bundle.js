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

      if (gameReset) {
        return;
      }

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
//# sourceMappingURL=data:application/json;base64,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eUIsWUFBTTtBQUM3QixvQkFBWSxJQUFaO0FBQ0EsbUJBQVcsU0FBWDtBQUNBLG1CQUFXLGVBQVg7QUFDQSxVQUFFLGVBQUYsRUFBbUIsR0FBbkIsQ0FBdUIsT0FBdkI7QUFDQSxlQUFPLE9BQUssS0FBTCxFQUFQO0FBQ0QsT0FORDtBQU9ELEtBcEJpQjs7QUFzQmxCLFlBQVEsa0JBQVk7QUFBQTs7QUFDbEIsUUFBRSxxQkFBRixFQUF5QixLQUF6QixDQUErQixZQUFNO0FBQ25DLHFCQUFhLENBQUMsVUFBZDtBQUNBLGVBQUssaUJBQUw7QUFDRCxPQUhEO0FBSUQsS0EzQmlCOztBQTZCbEIsdUJBQW1CLDZCQUFZO0FBQzdCLFFBQUUsb0JBQUYsRUFBd0IsV0FBeEIsQ0FBb0MsSUFBcEM7QUFDRDs7QUEvQmlCLEdBQXBCOztBQW1DQSxXQUFTLElBQVQsR0FBaUI7QUFDZixnQkFBWSxLQUFaO0FBQ0EsZ0JBQVksTUFBWjtBQUNEOztBQUVELFNBQU87QUFDTCxVQUFNLElBREQ7QUFFTCxrQkFBYztBQUZULEdBQVA7QUFJRCxDQXBRYSxFQUFkOztBQXNRQSxFQUFFLFFBQUYsRUFBWSxLQUFaLENBQWtCLFlBQVk7QUFDNUIsUUFBTSxJQUFOO0FBQ0QsQ0FGRCIsImZpbGUiOiJidW5kbGUuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvKiBnbG9iYWwgJCAqL1xuXG4vKipcbiogU2ltb24gaW4gSmF2YVNjcmlwdC5cbiogQW5vdGhlciBGcm9udCBFbmQgY2hhbGxlbmdlIGZvciBGcmVlIENvZGUgQ2FtcC5cbiogaHR0cDovL3d3dy5GcmVlQ29kZUNhbXAuY29tL1xuKi9cblxuJ3N0cmljdCBtb2RlJztcblxuY29uc3QgYXVkaW8gPSAoZnVuY3Rpb24gKCkge1xuICAvKipcbiAgICogQ3JlYXRlIGEgbmV3IGF1ZGlvIGNvbnRleHRcbiAgICovXG4gIGNvbnN0IGF1ZGlvQ3R4ID0gbmV3ICh3aW5kb3cuQXVkaW9Db250ZXh0IHx8IHdpbmRvdy53ZWJraXRBdWRpb0NvbnRleHQpKCk7XG4gIGNvbnN0IGdhaW5Ob2RlID0gYXVkaW9DdHguY3JlYXRlR2FpbigpO1xuICBnYWluTm9kZS5jb25uZWN0KGF1ZGlvQ3R4LmRlc3RpbmF0aW9uKTtcbiAgZ2Fpbk5vZGUuZ2Fpbi52YWx1ZSA9IDAuMDE7XG4gIGxldCBjdXJyR2FpbiA9IGdhaW5Ob2RlLmdhaW4udmFsdWU7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8tdW51c2VkLXZhcnNcbiAgY29uc3Qgd2F2ZVR5cGUgPSAnc2luZSc7XG5cbiAgLyoqXG4gICAqIENyZWF0ZSBvc2NpbGxhdG9ycyBmb3IgdGhlIGZvdXIgZ2FtZSBidXR0b25zXG4gICAqL1xuICBsZXQgaW5pdGlhbGl6ZU9zY2lsbGF0b3IgPSAoZnJlcXVlbmN5KSA9PiB7XG4gICAgbGV0IG9zY2lsbGF0b3IgPSBhdWRpb0N0eC5jcmVhdGVPc2NpbGxhdG9yKCk7XG4gICAgb3NjaWxsYXRvci50eXBlID0gd2F2ZVR5cGU7XG4gICAgb3NjaWxsYXRvci5mcmVxdWVuY3kudmFsdWUgPSBmcmVxdWVuY3k7XG4gICAgb3NjaWxsYXRvci5zdGFydCgwKTtcbiAgICByZXR1cm4gb3NjaWxsYXRvcjtcbiAgfTtcblxuICBjb25zdCBudyA9IGluaXRpYWxpemVPc2NpbGxhdG9yKDQ0MCk7XG4gIGNvbnN0IG5lID0gaW5pdGlhbGl6ZU9zY2lsbGF0b3IoNTU0LjM3KTtcbiAgY29uc3Qgc3cgPSBpbml0aWFsaXplT3NjaWxsYXRvcig2NTkuMjUpO1xuICBjb25zdCBzZSA9IGluaXRpYWxpemVPc2NpbGxhdG9yKDc4My45OSk7XG5cbiAgLyoqXG4gICAqIE1ldGhvZHMgZm9yIHN0YXJ0aW5nIGVhY2ggb3NjaWxsYXRvciB0b25lXG4gICAqL1xuICBsZXQgc3RhcnRUb25lID0ge1xuICAgIGNvbm5lY3RPc2NpbGxhdG9yOiAob3NjaWxsYXRvcikgPT4ge1xuICAgICAgb3NjaWxsYXRvci5jb25uZWN0KGdhaW5Ob2RlKTtcbiAgICB9LFxuICAgIG53OiBmdW5jdGlvbiAoKSB7XG4gICAgICB0aGlzLmNvbm5lY3RPc2NpbGxhdG9yKG53KTtcbiAgICB9LFxuICAgIG5lOiBmdW5jdGlvbiAoKSB7XG4gICAgICB0aGlzLmNvbm5lY3RPc2NpbGxhdG9yKG5lKTtcbiAgICB9LFxuICAgIHN3OiBmdW5jdGlvbiAoKSB7XG4gICAgICB0aGlzLmNvbm5lY3RPc2NpbGxhdG9yKHN3KTtcbiAgICB9LFxuICAgIHNlOiBmdW5jdGlvbiAoKSB7XG4gICAgICB0aGlzLmNvbm5lY3RPc2NpbGxhdG9yKHNlKTtcbiAgICB9XG4gIH07XG5cbiAgLyoqXG4gICAqIE1ldGhvZHMgZm9yIHN0b3BwaW5nIGVhY2ggb3NjaWxsYXRvciB0b25lXG4gICAqL1xuICBsZXQgc3RvcFRvbmUgPSB7XG4gICAgc3RvcDogKG9zY2lsbGF0b3IpID0+IHtcbiAgICAgIGN1cnJHYWluID0gMDtcbiAgICAgIG9zY2lsbGF0b3IuZGlzY29ubmVjdChnYWluTm9kZSk7XG4gICAgfSxcbiAgICBudzogZnVuY3Rpb24gKCkge1xuICAgICAgdGhpcy5zdG9wKG53KTtcbiAgICB9LFxuICAgIG5lOiBmdW5jdGlvbiAoKSB7XG4gICAgICB0aGlzLnN0b3AobmUpO1xuICAgIH0sXG4gICAgc3c6IGZ1bmN0aW9uICgpIHtcbiAgICAgIHRoaXMuc3RvcChzdyk7XG4gICAgfSxcbiAgICBzZTogZnVuY3Rpb24gKCkge1xuICAgICAgdGhpcy5zdG9wKHNlKTtcbiAgICB9XG4gIH07XG5cbiAgcmV0dXJuIHtcbiAgICBudzogbncsXG4gICAgbmU6IG5lLFxuICAgIHN3OiBzdyxcbiAgICBzZTogc2UsXG4gICAgc3RhcnRUb25lOiBzdGFydFRvbmUsXG4gICAgc3RvcFRvbmU6IHN0b3BUb25lXG4gIH07XG59KSgpO1xuXG5jb25zdCBzaW1vbiA9IChmdW5jdGlvbiAoKSB7XG4gIC8qKlxuICAgKiBHYW1lIFN0YXRlXG4gICAqL1xuICBjb25zdCBjb2xvcnMgPSB7XG4gICAgbnc6ICcjMDgwJyxcbiAgICBuZTogJyNGMDAnLFxuICAgIHN3OiAnI0ZGMCcsXG4gICAgc2U6ICcjMDBGJ1xuICB9O1xuICBjb25zdCBjb2xvcnNBY3RpdmUgPSB7XG4gICAgbnc6ICcjOEI4JyxcbiAgICBuZTogJyNGQUEnLFxuICAgIHN3OiAnI0ZGOScsXG4gICAgc2U6ICcjOTlGJ1xuICB9O1xuICBjb25zdCBhdmFpbGFibGVTdGVwcyA9IFsnbncnLCAnbmUnLCAnc3cnLCAnc2UnXTtcblxuICBsZXQgY29tcHV0ZXJTdGVwcyA9IFtdO1xuICBsZXQgcGxheWVyU3RlcHMgPSBbXTtcbiAgbGV0IHN0cmljdE1vZGUgPSBmYWxzZTtcbiAgbGV0IHBsYXllclNlY29uZENoYW5jZSA9IGZhbHNlO1xuICBsZXQgZ2FtZVJlc2V0ID0gZmFsc2U7XG5cbiAgZnVuY3Rpb24gZ2V0UmFuZG9tSW50IChtaW4sIG1heCkge1xuICAgIHJldHVybiBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiAobWF4IC0gbWluICsgMSkgKyBtaW4pO1xuICB9XG5cbiAgY29uc3Qgc2ltb25Mb2dpYyA9IHtcblxuICAgIHVwZGF0ZURpc3BsYXk6IGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgJCgnI2Rpc3BsYXknKVxuICAgICAgICAuZW1wdHkoKVxuICAgICAgICAuYXBwZW5kKHZhbHVlKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogUnVucyByZWN1cnNpdmx5IHVudGlsIGVhY2ggaW5kZXggaW4gY29tcHV0ZXJTdGVwcyBpcyBwbGF5ZWQgdGhyb3VnaFxuICAgICAqL1xuICAgIHBsYXlDb21wdXRlclN0ZXBzOiBmdW5jdGlvbiAoaW5kZXgpIHtcbiAgICAgIGlmIChnYW1lUmVzZXQpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICBpZiAoIWNvbXB1dGVyU3RlcHNbaW5kZXhdKSB7XG4gICAgICAgIHRoaXMucGxheWVyVHVybigpO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IGN1cnJlbnRTdGVwID0gY29tcHV0ZXJTdGVwc1tpbmRleF07XG4gICAgICBjb25zdCBzdGVwSWQgPSBgIyR7Y29tcHV0ZXJTdGVwc1tpbmRleF19YDtcbiAgICAgIGNvbnN0IGFjdGl2ZUNvbG9yID0gY29sb3JzQWN0aXZlW2NvbXB1dGVyU3RlcHNbaW5kZXhdXTtcbiAgICAgIGNvbnN0IGRlZmF1bHRDb2xvciA9IGNvbG9yc1tjb21wdXRlclN0ZXBzW2luZGV4XV07XG5cbiAgICAgIGNvbnN0IGRpc3BsYXlUdXJucyA9ICgpID0+IHtcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgICAgICQoc3RlcElkKS5jc3MoJ2JhY2tncm91bmQnLCBhY3RpdmVDb2xvcik7XG4gICAgICAgICAgICBhdWRpby5zdGFydFRvbmVbY3VycmVudFN0ZXBdKCk7XG4gICAgICAgICAgICByZXNvbHZlKCk7XG4gICAgICAgICAgfSwgNTAwKTtcbiAgICAgICAgfSk7XG4gICAgICB9O1xuXG4gICAgICBkaXNwbGF5VHVybnMoKVxuICAgICAgLnRoZW4oKCkgPT4ge1xuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICAgICAgJChzdGVwSWQpLmNzcygnYmFja2dyb3VuZCcsIGRlZmF1bHRDb2xvcik7XG4gICAgICAgICAgICBhdWRpby5zdG9wVG9uZVtjdXJyZW50U3RlcF0oKTtcbiAgICAgICAgICAgIHJlc29sdmUoKTtcbiAgICAgICAgICB9LCA1MDApO1xuICAgICAgICB9KTtcbiAgICAgIH0pXG4gICAgICAudGhlbigoKSA9PiB7XG4gICAgICAgIHRoaXMucGxheUNvbXB1dGVyU3RlcHMoaW5kZXggKyAxKTtcbiAgICAgIH0pO1xuICAgIH0sXG5cbiAgICBjb21wdXRlclR1cm46IGZ1bmN0aW9uICgpIHtcbiAgICAgIGlmIChjb21wdXRlclN0ZXBzLmxlbmd0aCA9PT0gMjApIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZ2FtZVdpbigpO1xuICAgICAgfVxuXG4gICAgICBpZiAoIXBsYXllclNlY29uZENoYW5jZSkge1xuICAgICAgICAvLyBhZGQgcmFuZG9tIHN0ZXAgdG8gY29tcHRlclN0ZXBzIGFycmF5XG4gICAgICAgIHZhciByYW5kb21CdXR0b25JbmRleCA9IGdldFJhbmRvbUludCgwLCAzKTtcbiAgICAgICAgY29tcHV0ZXJTdGVwcy5wdXNoKGF2YWlsYWJsZVN0ZXBzW3JhbmRvbUJ1dHRvbkluZGV4XSk7XG4gICAgICB9XG5cbiAgICAgIHRoaXMudXBkYXRlRGlzcGxheShjb21wdXRlclN0ZXBzLmxlbmd0aCk7XG5cbiAgICAgIHRoaXMucGxheUNvbXB1dGVyU3RlcHMoMCk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFJ1bnMgcmVjdXJzaXZseSB1bnRpbCBwbGF5ZXIgbWF0Y2hlcyBlYWNoIGluZGV4IGluIGNvbXB1dGVyU3RlcHMsXG4gICAgICogb3IgdW50aWwgdGhlIHBsYXllciBsb3Nlcy5cbiAgICAgKi9cbiAgICBwbGF5ZXJUdXJuOiBmdW5jdGlvbiAoKSB7XG4gICAgIC8vIFNpbW9uIGJ1dHRvbnMgY2xpY2sgaGFuZGxlclxuICAgICAgJCgnLnNpbW9uLWJ1dHRvbnMnKVxuICAgICAgLmFkZENsYXNzKCdjbGlja2FibGUnKVxuICAgICAgLm1vdXNlZG93bigoZXZ0KSA9PiB7XG4gICAgICAgICQoJyMnICsgZXZ0LnRhcmdldC5pZCkuY3NzKCdiYWNrZ3JvdW5kJywgY29sb3JzQWN0aXZlW2V2dC50YXJnZXQuaWRdKTtcbiAgICAgICAgYXVkaW8uc3RhcnRUb25lW2V2dC50YXJnZXQuaWRdKCk7XG4gICAgICB9KVxuICAgICAgLm1vdXNldXAoKGV2dCkgPT4ge1xuICAgICAgICAkKCcjJyArIGV2dC50YXJnZXQuaWQpLmNzcygnYmFja2dyb3VuZCcsIGNvbG9yc1tldnQudGFyZ2V0LmlkXSk7XG4gICAgICAgIGF1ZGlvLnN0b3BUb25lW2V2dC50YXJnZXQuaWRdKCk7XG4gICAgICB9KVxuICAgICAgLm9uKCdjbGljaycsIChldnQpID0+IHtcbiAgICAgICAgZXZ0LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIGV2dC5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgICAgdmFyIGN1cnJlbnRQbGF5ZXJTdGVwSW5kZXg7XG5cbiAgICAgICAgcGxheWVyU3RlcHMucHVzaChldnQudGFyZ2V0LmlkKTtcbiAgICAgICAgY3VycmVudFBsYXllclN0ZXBJbmRleCA9IHBsYXllclN0ZXBzLmxlbmd0aCAtIDE7XG5cbiAgICAgICAgLy8gSWYgcGxheWVyIG1ha2VzIGEgY29ycmVjdCBzdGVwLCBydW4gcGxheWVyVHVybiBhZ2FpblxuICAgICAgICBpZiAoY29tcHV0ZXJTdGVwc1tjdXJyZW50UGxheWVyU3RlcEluZGV4XSA9PT0gcGxheWVyU3RlcHNbY3VycmVudFBsYXllclN0ZXBJbmRleF0pIHtcbiAgICAgICAgICByZXR1cm4gdGhpcy5oYW5kbGVDb3JyZWN0VXNlclN0ZXAoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB0aGlzLmhhbmRsZUluY29ycmVjdFVzZXJTdGVwKCk7XG4gICAgICB9KTtcbiAgICB9LFxuXG4gICAgaGFuZGxlQ29ycmVjdFVzZXJTdGVwOiBmdW5jdGlvbiAoKSB7XG4gICAgICAvLyBJZiBmaW5hbCBzdGVwIGlzIGNvcnJlY3QsIGl0J3MgdGhlIGNvbXB1dGVyJ3MgdHVyblxuICAgICAgaWYgKGNvbXB1dGVyU3RlcHMubGVuZ3RoID09PSBwbGF5ZXJTdGVwcy5sZW5ndGgpIHtcbiAgICAgICAgJCgnLnNpbW9uLWJ1dHRvbnMnKVxuICAgICAgICAgIC5vZmYoKVxuICAgICAgICAgIC5yZW1vdmVDbGFzcygnY2xpY2thYmxlJyk7XG4gICAgICAgIHBsYXllclN0ZXBzID0gW107XG5cbiAgICAgICAgaWYgKHBsYXllclNlY29uZENoYW5jZSkge1xuICAgICAgICAgIHRoaXMuY2xlYXJBbm90aGVyQ2hhbmNlKCk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gdGhpcy5jb21wdXRlclR1cm4oKTtcbiAgICAgIH1cblxuICAgICAgJCgnLnNpbW9uLWJ1dHRvbnMnKVxuICAgICAgICAgIC5vZmYoKVxuICAgICAgICAgIC5yZW1vdmVDbGFzcygnY2xpY2thYmxlJyk7XG5cbiAgICAgIHJldHVybiB0aGlzLnBsYXllclR1cm4oKTtcbiAgICB9LFxuXG4gICAgaGFuZGxlSW5jb3JyZWN0VXNlclN0ZXA6IGZ1bmN0aW9uICgpIHtcbiAgICAgIC8vIGlmIHN0cmljdE1vZGUgaXMgZmFsc2UsIHBsYXllciBnZXRzIGFub3RoZXIgY2hhbmNlXG4gICAgICBpZiAoIXN0cmljdE1vZGUpIHtcbiAgICAgICAgdGhpcy5hbm90aGVyQ2hhbmNlKCk7XG4gICAgICAgICQoJy5zaW1vbi1idXR0b25zJylcbiAgICAgICAgICAub2ZmKClcbiAgICAgICAgICAucmVtb3ZlQ2xhc3MoJ2NsaWNrYWJsZScpO1xuICAgICAgICBwbGF5ZXJTdGVwcyA9IFtdO1xuICAgICAgICByZXR1cm4gdGhpcy5jb21wdXRlclR1cm4oKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAvLyBlbHNlLCBzdHJpY3RNb2RlIGlzIHRydWUsIHdoaWNoIG1lYW5zIGdhbWUgb3ZlclxuICAgICAgICB0aGlzLmdhbWVMb3NlKCk7XG4gICAgICAgICQoJy5zaW1vbi1idXR0b25zJylcbiAgICAgICAgICAub2ZmKClcbiAgICAgICAgICAucmVtb3ZlQ2xhc3MoJ2NsaWNrYWJsZScpO1xuICAgICAgICByZXR1cm4gdGhpcy5yZXNldEdhbWUoKTtcbiAgICAgIH1cbiAgICB9LFxuXG4gICAgY2xlYXJNb3ZlczogZnVuY3Rpb24gKCkge1xuICAgICAgY29tcHV0ZXJTdGVwcyA9IFtdO1xuICAgICAgcGxheWVyU3RlcHMgPSBbXTtcbiAgICAgIHBsYXllclNlY29uZENoYW5jZSA9IGZhbHNlO1xuICAgIH0sXG5cbiAgICByZXNldEdhbWU6IGZ1bmN0aW9uICgpIHtcbiAgICAgIHRoaXMuY2xlYXJNb3ZlcygpO1xuICAgICAgdGhpcy51cGRhdGVEaXNwbGF5KCctLScpO1xuICAgICAgJCgnLnNpbW9uLWJ1dHRvbnMnKVxuICAgICAgICAub2ZmKClcbiAgICAgICAgLnJlbW92ZUNsYXNzKCdjbGlja2FibGUnKTtcbiAgICAgICQoJyNyZXNldC1idXR0b24nKS5vZmYoJ2NsaWNrJyk7XG4gICAgfSxcblxuICAgIGFub3RoZXJDaGFuY2U6IGZ1bmN0aW9uICgpIHtcbiAgICAgICQoJy5nYW1lLXN0YXR1cycpXG4gICAgICAgIC5lbXB0eSgpXG4gICAgICAgIC5hcHBlbmQoJzxoMj5XUk9ORyEgVFJZIEFHQUlOPC9oMj4nKTtcbiAgICAgIHBsYXllclN0ZXBzID0gW107XG4gICAgICBwbGF5ZXJTZWNvbmRDaGFuY2UgPSB0cnVlO1xuICAgIH0sXG5cbiAgICBjbGVhckFub3RoZXJDaGFuY2U6IGZ1bmN0aW9uICgpIHtcbiAgICAgIHRoaXMuY2xlYXJHYW1lU3RhdHVzKCk7XG4gICAgICBwbGF5ZXJTZWNvbmRDaGFuY2UgPSBmYWxzZTtcbiAgICB9LFxuXG4gICAgZ2FtZVdpbjogZnVuY3Rpb24gKCkge1xuICAgICAgJCgnLmdhbWUtc3RhdHVzJykuYXBwZW5kKCc8aDI+WU9VIFdJTiE8L2gyPicpO1xuICAgICAgcmV0dXJuIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICB0aGlzLnJlc2V0R2FtZSgpO1xuICAgICAgICB0aGlzLmNsZWFyR2FtZVN0YXR1cygpO1xuICAgICAgICB0aGlzLmNvbXB1dGVyVHVybigpO1xuICAgICAgfSwgMTAwMCk7XG4gICAgfSxcblxuICAgIGdhbWVMb3NlOiBmdW5jdGlvbiAoKSB7XG4gICAgICAkKCcuZ2FtZS1zdGF0dXMnKS5lbXB0eSgpLmFwcGVuZCgnPGgyPllPVSBMT1NFITwvaDI+Jyk7XG4gICAgICByZXR1cm4gYnV0dG9uTG9naWMuc3RhcnQoKTtcbiAgICB9LFxuXG4gICAgY2xlYXJHYW1lU3RhdHVzOiBmdW5jdGlvbiAoKSB7XG4gICAgICAkKCcuZ2FtZS1zdGF0dXMnKS5lbXB0eSgpO1xuICAgIH1cbiAgfTtcblxuICBjb25zdCBidXR0b25Mb2dpYyA9IHtcbiAgICBzdGFydDogZnVuY3Rpb24gKCkge1xuICAgICAgJCgnI3N0YXJ0LWJ1dHRvbicpLmNsaWNrKCgpID0+IHtcbiAgICAgICAgZ2FtZVJlc2V0ID0gZmFsc2U7XG4gICAgICAgIHNpbW9uTG9naWMuY2xlYXJNb3ZlcygpO1xuICAgICAgICBzaW1vbkxvZ2ljLmNsZWFyR2FtZVN0YXR1cygpO1xuICAgICAgICBzaW1vbkxvZ2ljLmNvbXB1dGVyVHVybigpO1xuICAgICAgICAkKCcjc3RhcnQtYnV0dG9uJykub2ZmKCdjbGljaycpO1xuICAgICAgICByZXR1cm4gdGhpcy5yZXNldCgpO1xuICAgICAgfSk7XG4gICAgfSxcblxuICAgIHJlc2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAkKCcjcmVzZXQtYnV0dG9uJykuY2xpY2soKCkgPT4ge1xuICAgICAgICBnYW1lUmVzZXQgPSB0cnVlO1xuICAgICAgICBzaW1vbkxvZ2ljLnJlc2V0R2FtZSgpO1xuICAgICAgICBzaW1vbkxvZ2ljLmNsZWFyR2FtZVN0YXR1cygpO1xuICAgICAgICAkKCcjcmVzZXQtYnV0dG9uJykub2ZmKCdjbGljaycpO1xuICAgICAgICByZXR1cm4gdGhpcy5zdGFydCgpO1xuICAgICAgfSk7XG4gICAgfSxcblxuICAgIHN0cmljdDogZnVuY3Rpb24gKCkge1xuICAgICAgJCgnI3N0cmljdC1tb2RlLWJ1dHRvbicpLmNsaWNrKCgpID0+IHtcbiAgICAgICAgc3RyaWN0TW9kZSA9ICFzdHJpY3RNb2RlO1xuICAgICAgICB0aGlzLnN0cmljdExpZ2h0VG9nZ2xlKCk7XG4gICAgICB9KTtcbiAgICB9LFxuXG4gICAgc3RyaWN0TGlnaHRUb2dnbGU6IGZ1bmN0aW9uICgpIHtcbiAgICAgICQoJyNzdHJpY3QtbW9kZS1saWdodCcpLnRvZ2dsZUNsYXNzKCdvbicpO1xuICAgIH1cblxuICB9O1xuXG4gIGZ1bmN0aW9uIGluaXQgKCkge1xuICAgIGJ1dHRvbkxvZ2ljLnN0YXJ0KCk7XG4gICAgYnV0dG9uTG9naWMuc3RyaWN0KCk7XG4gIH1cblxuICByZXR1cm4ge1xuICAgIGluaXQ6IGluaXQsXG4gICAgZ2V0UmFuZG9tSW50OiBnZXRSYW5kb21JbnRcbiAgfTtcbn0pKCk7XG5cbiQoZG9jdW1lbnQpLnJlYWR5KGZ1bmN0aW9uICgpIHtcbiAgc2ltb24uaW5pdCgpO1xufSk7XG4iXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=
