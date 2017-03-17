'use strict';
/**
* Simon in JavaScript.
* Another Front End challenge for Free Code Camp.
* http://www.FreeCodeCamp.com/
*/

'strict mode';

var audio = function () {

  // ******* Create a new audio context *******

  var audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  var gainNode = audioCtx.createGain();
  gainNode.connect(audioCtx.destination);
  gainNode.gain.value = 0.01;
  var currGain = gainNode.gain.value;
  var waveType = 'sine';

  // ******* Create oscillators for the four game buttons *******

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

  // ******* Methods for starting each audio tone *******

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

  // ******* Methods for stopping each audio tone *******

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

  // ******* Game State *******

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
        simonLogic.playerTurn();
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

    playerTurn: function playerTurn() {

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
              simonLogic.clearAnotherChance();
            }

            return simonLogic.computerTurn();
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
      simonLogic.clearMoves();
      simonLogic.updateDisplay('--');
      $('.simon-buttons').off().removeClass('clickable');
      $('#reset-button').off('click');
    },

    anotherChance: function anotherChance() {
      $('.game-status').empty().append('<h2>WRONG! TRY AGAIN</h2>');
      playerSteps = [];
      playerSecondChance = true;
    },

    clearAnotherChance: function clearAnotherChance() {
      simonLogic.clearGameStatus();
      playerSecondChance = false;
    },

    gameWin: function gameWin() {
      $('.game-status').append('<h2>YOU WIN!</h2>');
      return setTimeout(function () {
        simonLogic.resetGame();
        simonLogic.clearGameStatus();
        simonLogic.computerTurn();
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
      $('#start-button').click(function () {
        simonLogic.clearMoves();
        simonLogic.clearGameStatus();
        simonLogic.computerTurn();
        $('#start-button').off('click');
        return buttonLogic.reset();
      });
    },

    reset: function reset() {
      $('#reset-button').click(function () {
        simonLogic.resetGame();
        simonLogic.clearGameStatus();
        $('#reset-button').off('click');
        return buttonLogic.start();
      });
    },

    strict: function strict() {
      $('#strict-mode-button').click(function () {
        strictMode = !strictMode;
        buttonLogic.strictLightToggle();
      });
    },

    strictLightToggle: function strictLightToggle() {
      $('#strict-mode-light').toggleClass('on');
    }

  };

  function init() {
    buttonLogic.start();
    //buttonLogic.reset();
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
//# sourceMappingURL=data:application/json;base64,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LGtCQUFXO0FBQ2pCLFFBQUUscUJBQUYsRUFBeUIsS0FBekIsQ0FBZ0MsWUFBTTtBQUNwQyxxQkFBYSxDQUFDLFVBQWQ7QUFDQSxvQkFBWSxpQkFBWjtBQUNELE9BSEQ7QUFJRCxLQXpCaUI7O0FBMkJsQix1QkFBbUIsNkJBQVc7QUFDNUIsUUFBRSxvQkFBRixFQUF3QixXQUF4QixDQUFvQyxJQUFwQztBQUNEOztBQTdCaUIsR0FBcEI7O0FBaUNBLFdBQVMsSUFBVCxHQUFpQjtBQUNmLGdCQUFZLEtBQVo7O0FBRUEsZ0JBQVksTUFBWjtBQUNEOztBQUVELFNBQU87QUFDTCxVQUFNLElBREQ7QUFFTCxrQkFBYztBQUZULEdBQVA7QUFLRCxDQXZQYSxFQUFkOztBQXlQQSxFQUFFLFFBQUYsRUFBWSxLQUFaLENBQWtCLFlBQVc7QUFDM0IsUUFBTSxJQUFOO0FBQ0QsQ0FGRCIsImZpbGUiOiJidW5kbGUuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiogU2ltb24gaW4gSmF2YVNjcmlwdC5cbiogQW5vdGhlciBGcm9udCBFbmQgY2hhbGxlbmdlIGZvciBGcmVlIENvZGUgQ2FtcC5cbiogaHR0cDovL3d3dy5GcmVlQ29kZUNhbXAuY29tL1xuKi9cblxuJ3N0cmljdCBtb2RlJztcblxuY29uc3QgYXVkaW8gPSAoZnVuY3Rpb24gKCkge1xuXG4gIC8vICoqKioqKiogQ3JlYXRlIGEgbmV3IGF1ZGlvIGNvbnRleHQgKioqKioqKlxuXG5cdGNvbnN0IGF1ZGlvQ3R4ID0gbmV3ICh3aW5kb3cuQXVkaW9Db250ZXh0IHx8IHdpbmRvdy53ZWJraXRBdWRpb0NvbnRleHQpKCk7XG5cdGNvbnN0IGdhaW5Ob2RlID0gYXVkaW9DdHguY3JlYXRlR2FpbigpO1xuXHRnYWluTm9kZS5jb25uZWN0KGF1ZGlvQ3R4LmRlc3RpbmF0aW9uKTtcblx0Z2Fpbk5vZGUuZ2Fpbi52YWx1ZSA9IDAuMDE7XG5cdGxldCBjdXJyR2FpbiA9IGdhaW5Ob2RlLmdhaW4udmFsdWU7XG5cdGNvbnN0IHdhdmVUeXBlID0gJ3NpbmUnO1xuXG4gIC8vICoqKioqKiogQ3JlYXRlIG9zY2lsbGF0b3JzIGZvciB0aGUgZm91ciBnYW1lIGJ1dHRvbnMgKioqKioqKlxuXG4gIGxldCBpbml0aWFsaXplT3NjaWxsYXRvciA9IChmcmVxdWVuY3kpID0+IHtcbiAgICBsZXQgb3NjaWxsYXRvciA9IGF1ZGlvQ3R4LmNyZWF0ZU9zY2lsbGF0b3IoKTtcbiAgICBvc2NpbGxhdG9yLnR5cGUgPSB3YXZlVHlwZTtcbiAgICBvc2NpbGxhdG9yLmZyZXF1ZW5jeS52YWx1ZSA9IGZyZXF1ZW5jeTtcbiAgICBvc2NpbGxhdG9yLnN0YXJ0KDApXG4gICAgcmV0dXJuIG9zY2lsbGF0b3JcbiAgfVxuXG4gIGNvbnN0IG53ID0gaW5pdGlhbGl6ZU9zY2lsbGF0b3IoNDQwKVxuICBjb25zdCBuZSA9IGluaXRpYWxpemVPc2NpbGxhdG9yKDU1NC4zNylcbiAgY29uc3Qgc3cgPSBpbml0aWFsaXplT3NjaWxsYXRvcig2NTkuMjUpXG4gIGNvbnN0IHNlID0gaW5pdGlhbGl6ZU9zY2lsbGF0b3IoNzgzLjk5KVxuXG4gIC8vICoqKioqKiogTWV0aG9kcyBmb3Igc3RhcnRpbmcgZWFjaCBhdWRpbyB0b25lICoqKioqKiogXG4gIFxuICBsZXQgc3RhcnRUb25lID0ge1xuICAgIGNvbm5lY3RPc2NpbGxhdG9yOiAob3NjaWxsYXRvcikgPT4ge1xuICAgICAgb3NjaWxsYXRvci5jb25uZWN0KGdhaW5Ob2RlKTtcbiAgICB9LFxuICAgIG53OiBmdW5jdGlvbiAoKSB7XG4gICAgICB0aGlzLmNvbm5lY3RPc2NpbGxhdG9yKG53KVxuICAgIH0sXG4gICAgbmU6IGZ1bmN0aW9uICgpIHtcbiAgICAgIHRoaXMuY29ubmVjdE9zY2lsbGF0b3IobmUpXG4gICAgfSxcbiAgICBzdzogZnVuY3Rpb24gKCkge1xuICAgICAgdGhpcy5jb25uZWN0T3NjaWxsYXRvcihzdylcbiAgICB9LFxuICAgIHNlOiBmdW5jdGlvbiAoKSB7XG4gICAgICB0aGlzLmNvbm5lY3RPc2NpbGxhdG9yKHNlKVxuICAgIH1cbiAgfTtcblxuICAvLyAqKioqKioqIE1ldGhvZHMgZm9yIHN0b3BwaW5nIGVhY2ggYXVkaW8gdG9uZSAqKioqKioqXG5cbiAgbGV0IHN0b3BUb25lID0ge1xuICAgIHN0b3A6IChvc2NpbGxhdG9yKSA9PiB7XG4gICAgICBjdXJyR2FpbiA9IDBcbiAgICAgIG9zY2lsbGF0b3IuZGlzY29ubmVjdChnYWluTm9kZSlcbiAgICB9LFxuICAgIG53OiBmdW5jdGlvbiAoKSB7XG4gICAgICB0aGlzLnN0b3AobncpXG4gICAgfSxcbiAgICBuZTogZnVuY3Rpb24gKCkge1xuICAgICAgdGhpcy5zdG9wKG5lKVxuICAgIH0sXG4gICAgc3c6IGZ1bmN0aW9uICgpIHtcbiAgICAgIHRoaXMuc3RvcChzdylcbiAgICB9LFxuICAgIHNlOiBmdW5jdGlvbiAoKSB7XG4gICAgICB0aGlzLnN0b3Aoc2UpXG4gICAgfVxuICB9O1xuXG4gIHJldHVybiB7XG4gIFx0bnc6IG53LFxuICBcdG5lOiBuZSxcbiAgXHRzdzogc3csXG4gIFx0c2U6IHNlLFxuICBcdHN0YXJ0VG9uZTogc3RhcnRUb25lLFxuICBcdHN0b3BUb25lOiBzdG9wVG9uZVxuICB9XG5cbn0pKCk7XG5cbmNvbnN0IHNpbW9uID0gKGZ1bmN0aW9uICgpIHtcbiAgXG4gIC8vICoqKioqKiogR2FtZSBTdGF0ZSAqKioqKioqXG5cbiAgY29uc3QgY29sb3JzID0ge1xuICAgIG53OiAnIzA4MCcsXG4gICAgbmU6ICcjRjAwJyxcbiAgICBzdzogJyNGRjAnLFxuICAgIHNlOiAnIzAwRidcbiAgfTtcbiAgY29uc3QgY29sb3JzQWN0aXZlID0ge1xuICAgIG53OiAnIzhCOCcsXG4gICAgbmU6ICcjRkFBJyxcbiAgICBzdzogJyNGRjknLFxuICAgIHNlOiAnIzk5RidcbiAgfTtcbiAgY29uc3QgYXZhaWxhYmxlU3RlcHMgPSBbJ253JywgJ25lJywgJ3N3JywgJ3NlJ107XG5cbiAgbGV0IGNvbXB1dGVyU3RlcHMgPSBbXTtcbiAgbGV0IHBsYXllclN0ZXBzID0gW107XG4gIGxldCBzdHJpY3RNb2RlID0gZmFsc2U7XG4gIGxldCBwbGF5ZXJTZWNvbmRDaGFuY2UgPSBmYWxzZTtcblxuICBmdW5jdGlvbiBnZXRSYW5kb21JbnQobWluLCBtYXgpIHtcbiAgICByZXR1cm4gTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogKG1heCAtIG1pbiArIDEpICsgbWluKTtcbiAgfVxuXG4gIGNvbnN0IHNpbW9uTG9naWMgPSB7XG5cblx0XHR1cGRhdGVEaXNwbGF5OiBmdW5jdGlvbiAodmFsdWUpIHtcblx0XHRcdCQoJyNkaXNwbGF5JylcbiAgICAgICAgLmVtcHR5KClcbiAgICAgICAgLmFwcGVuZCh2YWx1ZSk7XG4gICAgICB9LFxuXG4gICAgLyoqXG4gICAgICogUnVucyByZWN1cnNpdmx5IHVudGlsIGVhY2ggaW5kZXggaW4gY29tcHV0ZXJTdGVwcyBpcyBwbGF5ZWQgdGhyb3VnaFxuICAgICAqL1xuICAgIHBsYXlDb21wdXRlclN0ZXBzOiBmdW5jdGlvbiAoaW5kZXgpIHtcbiAgICAgIGlmICghY29tcHV0ZXJTdGVwc1tpbmRleF0pIHtcbiAgICAgICAgc2ltb25Mb2dpYy5wbGF5ZXJUdXJuKCk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgY29uc3QgY3VycmVudFN0ZXAgPSBjb21wdXRlclN0ZXBzW2luZGV4XTtcbiAgICAgIGNvbnN0IHN0ZXBJZCA9IGAjJHtjb21wdXRlclN0ZXBzW2luZGV4XX1gO1xuICAgICAgY29uc3QgYWN0aXZlQ29sb3IgPSBjb2xvcnNBY3RpdmVbY29tcHV0ZXJTdGVwc1tpbmRleF1dO1xuICAgICAgY29uc3QgZGVmYXVsdENvbG9yID0gY29sb3JzW2NvbXB1dGVyU3RlcHNbaW5kZXhdXTtcblxuXG4gICAgICBjb25zdCBkaXNwbGF5VHVybnMgPSAoKSA9PiB7XG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgICAgICAkKHN0ZXBJZCkuY3NzKCdiYWNrZ3JvdW5kJywgYWN0aXZlQ29sb3IpO1xuICAgICAgICAgICAgYXVkaW8uc3RhcnRUb25lW2N1cnJlbnRTdGVwXSgpO1xuICAgICAgICAgICAgcmVzb2x2ZSgpO1xuICAgICAgICAgIH0sIDUwMCk7XG4gICAgICAgIH0pXG4gICAgICB9XG5cbiAgICAgIGRpc3BsYXlUdXJucygpXG4gICAgICAudGhlbigoKSA9PiB7XG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZShmdW5jdGlvbihyZXNvbHZlLCByZWplY3QpIHtcbiAgICAgICAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgICAgICQoc3RlcElkKS5jc3MoJ2JhY2tncm91bmQnLCBkZWZhdWx0Q29sb3IpO1xuICAgICAgICAgICAgYXVkaW8uc3RvcFRvbmVbY3VycmVudFN0ZXBdKCk7XG4gICAgICAgICAgICByZXNvbHZlKCk7XG4gICAgICAgICAgfSwgNTAwKTtcbiAgICAgICAgfSk7XG4gICAgICB9KVxuICAgICAgLnRoZW4oKCkgPT4ge1xuICAgICAgICAgIHRoaXMucGxheUNvbXB1dGVyU3RlcHMoaW5kZXggKyAxKTtcbiAgICAgIH0pO1xuICAgIH0sXG5cbiAgICBjb21wdXRlclR1cm46IGZ1bmN0aW9uICgpIHtcblxuICAgICAgaWYgKGNvbXB1dGVyU3RlcHMubGVuZ3RoID09PSAyMCkge1xuICAgICAgICByZXR1cm4gc2ltb25Mb2dpYy5nYW1lV2luKCk7XG4gICAgICB9XG5cbiAgICAgIGlmICghcGxheWVyU2Vjb25kQ2hhbmNlKSB7XG4gICAgICAgIC8vIGFkZCByYW5kb20gc3RlcCB0byBjb21wdGVyU3RlcHMgYXJyYXlcbiAgICAgICAgdmFyIHJhbmRvbUJ1dHRvbkluZGV4ID0gZ2V0UmFuZG9tSW50KDAsIDMpO1xuICAgICAgICBjb21wdXRlclN0ZXBzLnB1c2goYXZhaWxhYmxlU3RlcHNbcmFuZG9tQnV0dG9uSW5kZXhdKTtcbiAgICAgIH1cblxuICAgICAgc2ltb25Mb2dpYy51cGRhdGVEaXNwbGF5KGNvbXB1dGVyU3RlcHMubGVuZ3RoKTtcbiAgICBcbiAgICAgIHRoaXMucGxheUNvbXB1dGVyU3RlcHMoMCk7XG4gICAgfSxcblxuICAgIHBsYXllclR1cm46IGZ1bmN0aW9uICgpIHtcblxuICAgICAvLyBtYWtlIHNpbW9uLWJ1dHRvbnMgY2xpY2thYmxlXG4gICAgICQoJy5zaW1vbi1idXR0b25zJylcbiAgICAgXHQuYWRkQ2xhc3MoJ2NsaWNrYWJsZScpXG4gICAgIFx0Lm1vdXNlZG93bihmdW5jdGlvbihldnQpIHtcbiAgICAgXHRcdCQoJyMnICsgZXZ0LnRhcmdldC5pZCkuY3NzKCdiYWNrZ3JvdW5kJywgY29sb3JzQWN0aXZlW2V2dC50YXJnZXQuaWRdKTtcbiAgICAgICAgY29uc29sZS5sb2coJ1BMQVlFUiBUT05FIFNUQVJUSU5HJywgZXZ0KVxuICAgICBcdFx0YXVkaW8uc3RhcnRUb25lW2V2dC50YXJnZXQuaWRdKCk7XG4gICAgIFx0fSlcbiAgICAgXHQubW91c2V1cChmdW5jdGlvbihldnQpIHtcbiAgICAgXHRcdCQoJyMnICsgZXZ0LnRhcmdldC5pZCkuY3NzKCdiYWNrZ3JvdW5kJywgY29sb3JzW2V2dC50YXJnZXQuaWRdKTtcbiAgICAgICAgY29uc29sZS5sb2coJ1BMQVlFUiBUT05FIEVORElORycpXG4gICAgIFx0XHRhdWRpby5zdG9wVG9uZVtldnQudGFyZ2V0LmlkXSgpO1xuICAgICBcdH0pXG4gICAgIFx0Lm9uKCdjbGljaycsIGZ1bmN0aW9uKGV2dCkge1xuICAgICAgXHRldnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgIFx0ZXZ0LnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgXHR2YXIgY3VycmVudFBsYXllclN0ZXBJbmRleDtcblxuICAgICAgXHRwbGF5ZXJTdGVwcy5wdXNoKGV2dC50YXJnZXQuaWQpO1xuICAgICAgXHRjdXJyZW50UGxheWVyU3RlcEluZGV4ID0gcGxheWVyU3RlcHMubGVuZ3RoIC0gMTtcblxuICAgICAgXHRpZiAoY29tcHV0ZXJTdGVwc1tjdXJyZW50UGxheWVyU3RlcEluZGV4XSA9PT0gcGxheWVyU3RlcHNbY3VycmVudFBsYXllclN0ZXBJbmRleF0pIHtcblxuICAgICAgXHRcdGlmIChjb21wdXRlclN0ZXBzLmxlbmd0aCA9PT0gcGxheWVyU3RlcHMubGVuZ3RoKSB7XG4gICAgICBcdFx0XHQkKCcuc2ltb24tYnV0dG9ucycpXG4gICAgICBcdFx0XHRcdC5vZmYoKVxuICAgICAgXHRcdFx0XHQucmVtb3ZlQ2xhc3MoJ2NsaWNrYWJsZScpO1xuICAgICAgXHRcdFx0cGxheWVyU3RlcHMgPSBbXTtcblxuICAgICAgICAgICAgaWYgKHBsYXllclNlY29uZENoYW5jZSkge1xuICAgICAgICAgICAgICBzaW1vbkxvZ2ljLmNsZWFyQW5vdGhlckNoYW5jZSgpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gc2ltb25Mb2dpYy5jb21wdXRlclR1cm4oKTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICAkKCcuc2ltb24tYnV0dG9ucycpXG4gICAgICAgICAgICAgIC5vZmYoKVxuICAgICAgICAgICAgICAucmVtb3ZlQ2xhc3MoJ2NsaWNrYWJsZScpO1xuXG4gICAgICAgICAgcmV0dXJuIHNpbW9uTG9naWMucGxheWVyVHVybigpO1xuICAgICAgICB9IFxuICAgICAgICAvLyBpZiBzdHJpY3RNb2RlIGlzIGZhbHNlLCBwbGF5ZXIgZ2V0cyBhbm90aGVyIGNoYW5jZVxuICAgICAgICBpZiAoIXN0cmljdE1vZGUpIHtcbiAgICAgICAgICBzaW1vbkxvZ2ljLmFub3RoZXJDaGFuY2UoKTtcbiAgICAgICAgICAkKCcuc2ltb24tYnV0dG9ucycpXG4gICAgICAgICAgICAub2ZmKClcbiAgICAgICAgICAgIC5yZW1vdmVDbGFzcygnY2xpY2thYmxlJyk7XG4gICAgICAgICAgcGxheWVyU3RlcHMgPSBbXTtcbiAgICAgICAgICByZXR1cm4gc2ltb25Mb2dpYy5jb21wdXRlclR1cm4oKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgLy8gZWxzZSwgc3RyaWN0TW9kZSBpcyB0cnVlLCB3aGljaCBtZWFucyBnYW1lIG92ZXIgICAgXG4gICAgICAgICAgc2ltb25Mb2dpYy5nYW1lTG9zZSgpO1xuICAgICAgICAgICQoJy5zaW1vbi1idXR0b25zJylcbiAgICAgICAgICAgIC5vZmYoKVxuICAgICAgICAgICAgLnJlbW92ZUNsYXNzKCdjbGlja2FibGUnKTtcbiAgICAgICAgICByZXR1cm4gc2ltb25Mb2dpYy5yZXNldEdhbWUoKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfSxcblxuXG4gICAgY2xlYXJNb3ZlczogZnVuY3Rpb24oKSB7XG4gICAgICBjb21wdXRlclN0ZXBzID0gW107XG4gICAgICBwbGF5ZXJTdGVwcyA9IFtdO1xuICAgICAgcGxheWVyU2Vjb25kQ2hhbmNlID0gZmFsc2U7XG4gICAgfSxcblxuICAgIHJlc2V0R2FtZTogZnVuY3Rpb24oKSB7XG4gICAgICBzaW1vbkxvZ2ljLmNsZWFyTW92ZXMoKTtcbiAgICAgIHNpbW9uTG9naWMudXBkYXRlRGlzcGxheSgnLS0nKTtcbiAgICAgICQoJy5zaW1vbi1idXR0b25zJylcbiAgICAgICAgLm9mZigpXG4gICAgICAgIC5yZW1vdmVDbGFzcygnY2xpY2thYmxlJyk7XG4gICAgICAkKCcjcmVzZXQtYnV0dG9uJykub2ZmKCdjbGljaycpO1xuICAgIH0sXG5cbiAgICBhbm90aGVyQ2hhbmNlOiBmdW5jdGlvbigpIHtcbiAgICAgICQoJy5nYW1lLXN0YXR1cycpXG4gICAgICAgIC5lbXB0eSgpXG4gICAgICAgIC5hcHBlbmQoJzxoMj5XUk9ORyEgVFJZIEFHQUlOPC9oMj4nKTtcbiAgICAgIHBsYXllclN0ZXBzID0gW107XG4gICAgICBwbGF5ZXJTZWNvbmRDaGFuY2UgPSB0cnVlO1xuICAgIH0sXG5cbiAgICBjbGVhckFub3RoZXJDaGFuY2U6IGZ1bmN0aW9uKCkge1xuICAgICAgc2ltb25Mb2dpYy5jbGVhckdhbWVTdGF0dXMoKTtcbiAgICAgIHBsYXllclNlY29uZENoYW5jZSA9IGZhbHNlO1xuICAgIH0sXG5cbiAgICBnYW1lV2luOiBmdW5jdGlvbigpIHtcbiAgICAgICQoJy5nYW1lLXN0YXR1cycpLmFwcGVuZCgnPGgyPllPVSBXSU4hPC9oMj4nKTtcbiAgICAgIHJldHVybiBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICBzaW1vbkxvZ2ljLnJlc2V0R2FtZSgpO1xuICAgICAgICBzaW1vbkxvZ2ljLmNsZWFyR2FtZVN0YXR1cygpO1xuICAgICAgICBzaW1vbkxvZ2ljLmNvbXB1dGVyVHVybigpO1xuICAgICAgfSwgMTAwMCk7XG4gICAgfSxcblxuICAgIGdhbWVMb3NlOiBmdW5jdGlvbigpIHtcbiAgICAgICQoJy5nYW1lLXN0YXR1cycpLmVtcHR5KCkuYXBwZW5kKCc8aDI+WU9VIExPU0UhPC9oMj4nKTtcbiAgICAgIHJldHVybiBidXR0b25Mb2dpYy5zdGFydCgpO1xuICAgIH0sXG5cbiAgICBjbGVhckdhbWVTdGF0dXM6IGZ1bmN0aW9uKCkge1xuICAgICAgJCgnLmdhbWUtc3RhdHVzJykuZW1wdHkoKTtcbiAgICB9XG4gIH07XG4gIFxuICBjb25zdCBidXR0b25Mb2dpYyA9IHtcbiAgICBzdGFydDogZnVuY3Rpb24gKCkge1xuICAgICAgJCgnI3N0YXJ0LWJ1dHRvbicpLmNsaWNrKCAoKSA9PiB7ICAgXG4gICAgICAgIHNpbW9uTG9naWMuY2xlYXJNb3ZlcygpO1xuICAgICAgICBzaW1vbkxvZ2ljLmNsZWFyR2FtZVN0YXR1cygpO1xuICAgICAgICBzaW1vbkxvZ2ljLmNvbXB1dGVyVHVybigpO1xuICAgICAgICAkKCcjc3RhcnQtYnV0dG9uJykub2ZmKCdjbGljaycpO1xuICAgICAgICByZXR1cm4gYnV0dG9uTG9naWMucmVzZXQoKTtcbiAgICAgIH0pO1xuICAgIH0sXG4gICAgXG4gICAgcmVzZXQ6IGZ1bmN0aW9uKCkge1xuICAgICAgJCgnI3Jlc2V0LWJ1dHRvbicpLmNsaWNrKCAoKSA9PiB7XG4gICAgICAgIHNpbW9uTG9naWMucmVzZXRHYW1lKCk7XG4gICAgICAgIHNpbW9uTG9naWMuY2xlYXJHYW1lU3RhdHVzKCk7XG4gICAgICAgICQoJyNyZXNldC1idXR0b24nKS5vZmYoJ2NsaWNrJyk7XG4gICAgICAgIHJldHVybiBidXR0b25Mb2dpYy5zdGFydCgpO1xuICAgICAgfSk7XG4gICAgfSxcblxuICAgIHN0cmljdDogZnVuY3Rpb24oKSB7XG4gICAgICAkKCcjc3RyaWN0LW1vZGUtYnV0dG9uJykuY2xpY2soICgpID0+IHtcbiAgICAgICAgc3RyaWN0TW9kZSA9ICFzdHJpY3RNb2RlO1xuICAgICAgICBidXR0b25Mb2dpYy5zdHJpY3RMaWdodFRvZ2dsZSgpO1xuICAgICAgfSk7XG4gICAgfSxcblxuICAgIHN0cmljdExpZ2h0VG9nZ2xlOiBmdW5jdGlvbigpIHtcbiAgICAgICQoJyNzdHJpY3QtbW9kZS1saWdodCcpLnRvZ2dsZUNsYXNzKCdvbicpO1xuICAgIH1cblxuICB9O1xuICBcbiAgZnVuY3Rpb24gaW5pdCAoKSB7XG4gICAgYnV0dG9uTG9naWMuc3RhcnQoKTtcbiAgICAvL2J1dHRvbkxvZ2ljLnJlc2V0KCk7XG4gICAgYnV0dG9uTG9naWMuc3RyaWN0KCk7XG4gIH1cbiAgXG4gIHJldHVybiB7XG4gICAgaW5pdDogaW5pdCxcbiAgICBnZXRSYW5kb21JbnQ6IGdldFJhbmRvbUludFxuICB9O1xuICBcbn0pKCk7XG5cbiQoZG9jdW1lbnQpLnJlYWR5KGZ1bmN0aW9uKCkge1xuICBzaW1vbi5pbml0KCk7XG59KTtcbiJdLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==
