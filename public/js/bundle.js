'use strict';

/*!
* Simon in JavaScript.
* Another Front End challenge for Free Code Camp.
* http://www.FreeCodeCamp.com/
*/

var audio = function () {

  // ******* Create a new audio context *******

  var audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  var gainNode = audioCtx.createGain();
  gainNode.connect(audioCtx.destination);
  gainNode.gain.value = 0.01;
  var currGain = gainNode.gain.value;

  var waveType = 'sine';

  // ******* Create oscillators for the four game buttons *******

  var _nw = audioCtx.createOscillator();
  _nw.type = waveType;
  _nw.frequency.value = 440;
  _nw.start(0);

  var _ne = audioCtx.createOscillator();
  _ne.type = waveType;
  _ne.frequency.value = 554.37;
  _ne.start(0);

  var _sw = audioCtx.createOscillator();
  _sw.type = waveType;
  _sw.frequency.value = 659.25;
  _sw.start(0);

  var _se = audioCtx.createOscillator();
  _se.type = waveType;
  _se.frequency.value = 783.99;
  _se.start(0);

  // ******* Methods for starting each audio tone *******

  var startTone = {
    fadeIn: function fadeIn() {
      setTimeout(function () {
        currGain = .1;
      }, 60);
    },
    nw: function nw() {
      _nw.connect(gainNode);
      startTone.fadeIn();
    },
    ne: function ne() {
      _ne.connect(gainNode);
      startTone.fadeIn();
    },
    sw: function sw() {
      _sw.connect(gainNode);
      startTone.fadeIn();
    },
    se: function se() {
      _se.connect(gainNode);
      startTone.fadeIn();
    }
  };

  // ******* Methods for stopping each audio tone *******

  var stopTone = {
    fadeOut: function fadeOut() {
      currGain = 0;
    },
    nw: function nw() {
      stopTone.fadeOut();
      setTimeout(function () {
        _nw.disconnect(gainNode);
      }, 60);
    },
    ne: function ne() {
      stopTone.fadeOut();
      //ne.stop(audioCtx.currentTime + .2);
      setTimeout(function () {
        _ne.disconnect(gainNode);
      }, 60);
    },
    sw: function sw() {
      stopTone.fadeOut();
      //sw.stop(audioCtx.currentTime + .2);
      setTimeout(function () {
        _sw.disconnect(gainNode);
      }, 60);
    },
    se: function se() {
      stopTone.fadeOut();
      //se.stop(audioCtx.currentTime + .2);
      setTimeout(function () {
        _se.disconnect(gainNode);
      }, 60);
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

  var buttonLogic = void 0;

  function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min);
  }

  var simonLogic = {

    updateDisplay: function updateDisplay(value) {
      $('#display').empty().append(value);
    },

    showComputerSteps: function showComputerSteps() {
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
      function playComputerSteps(index) {

        if (!computerSteps[index]) {
          console.log('computer done playing!');
          simonLogic.playerTurn();
          return;
        }

        var currentStep = computerSteps[index];
        var stepId = '#' + computerSteps[index];
        var activeColor = colorsActive[computerSteps[index]];
        var defaultColor = colors[computerSteps[index]];

        function setColor(stepId, activeColor, resolve) {
          setTimeout(function () {
            $(stepId).css('background', activeColor);
            resolve();
          }, 500);
        }

        var promise = new Promise(function (resolve, reject) {
          setColor(stepId, activeColor, resolve);
          setTimeout(function () {
            audio.startTone[currentStep]();
          }, 500);
        }).then(function () {
          return new Promise(function (resolve, reject) {
            setColor(stepId, defaultColor, resolve);
            setTimeout(function () {
              audio.stopTone[currentStep]();
            }, 500);
          });
        }).then(function () {
          playComputerSteps(index + 1);
        });
      }

      playComputerSteps(0);
    },

    playerTurn: function playerTurn() {
      console.log('players turn...');
      console.log('playerSteps at turn start', playerSteps);

      // make simon-buttons clickable
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
        console.log('player pressed: ' + evt.target.id);
        console.log('playerSteps array: ', playerSteps);

        if (computerSteps[currentPlayerStepIndex] === playerSteps[currentPlayerStepIndex]) {

          if (computerSteps.length === playerSteps.length) {
            $('.simon-buttons').off().removeClass('clickable');
            playerSteps = [];

            if (playerSecondChance) {
              simonLogic.clearAnotherChance();
            }

            return simonLogic.showComputerSteps();
          }

          $('.simon-buttons').off().removeClass('clickable');

          return simonLogic.playerTurn();
        }
        console.log('wrong move, is strictMode true or false?: ', strictMode);
        // if strictMode is false, player gets another chance
        if (!strictMode) {
          simonLogic.anotherChance();
          $('.simon-buttons').off().removeClass('clickable');
          playerSteps = [];
          return simonLogic.showComputerSteps();
        } else {
          // else, strictMode is true, which means game over   
          console.log('Game Over!');
          console.log('computerSteps[currentPlayerStepIndex]: ', computerSteps[currentPlayerStepIndex]);
          console.log('playerSteps[currentPlayerStepIndex]: ', playerSteps[currentPlayerStepIndex]);
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
        simonLogic.showComputerSteps();
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

  buttonLogic = {
    start: function start() {
      $('#start-button').click(function () {
        simonLogic.clearMoves();
        simonLogic.clearGameStatus();
        simonLogic.showComputerSteps();
        $('#start-button').off('click');
        return buttonLogic.reset();
      });
    },

    reset: function reset() {
      $('#reset-button').click(function () {
        console.log('reset button clicked');
        simonLogic.resetGame();
        simonLogic.clearGameStatus();
        $('#reset-button').off('click');
        return buttonLogic.start();
      });
    },

    strict: function strict() {
      $('#strict-mode-button').click(function () {
        strictMode = !strictMode;
        console.log('strictMode: ', strictMode);
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
//# sourceMappingURL=data:application/json;base64,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QVEsR0FBUixDQUFZLGNBQVosRUFBNEIsVUFBNUI7QUFDQSxvQkFBWSxpQkFBWjtBQUNELE9BSkQ7QUFLRCxLQTNCVzs7QUE2QlosdUJBQW1CLDZCQUFXO0FBQzVCLFFBQUUsb0JBQUYsRUFBd0IsV0FBeEIsQ0FBb0MsSUFBcEM7QUFDRDs7QUEvQlcsR0FBZDs7QUFtQ0EsV0FBUyxJQUFULEdBQWlCO0FBQ2YsZ0JBQVksS0FBWjs7QUFFQSxnQkFBWSxNQUFaO0FBQ0Q7O0FBRUQsU0FBTztBQUNMLFVBQU0sSUFERDtBQUVMLGtCQUFjO0FBRlQsR0FBUDtBQUtELENBblFhLEVBQWQ7O0FBcVFBLEVBQUUsUUFBRixFQUFZLEtBQVosQ0FBa0IsWUFBVztBQUMzQixRQUFNLElBQU47QUFDRCxDQUZEIiwiZmlsZSI6ImJ1bmRsZS5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8qIVxuKiBTaW1vbiBpbiBKYXZhU2NyaXB0LlxuKiBBbm90aGVyIEZyb250IEVuZCBjaGFsbGVuZ2UgZm9yIEZyZWUgQ29kZSBDYW1wLlxuKiBodHRwOi8vd3d3LkZyZWVDb2RlQ2FtcC5jb20vXG4qL1xuXG5jb25zdCBhdWRpbyA9IChmdW5jdGlvbiAoKSB7XG5cbiAgLy8gKioqKioqKiBDcmVhdGUgYSBuZXcgYXVkaW8gY29udGV4dCAqKioqKioqXG5cblx0bGV0IGF1ZGlvQ3R4ID0gbmV3ICh3aW5kb3cuQXVkaW9Db250ZXh0IHx8IHdpbmRvdy53ZWJraXRBdWRpb0NvbnRleHQpKCk7XG5cdGxldCBnYWluTm9kZSA9IGF1ZGlvQ3R4LmNyZWF0ZUdhaW4oKTtcblx0Z2Fpbk5vZGUuY29ubmVjdChhdWRpb0N0eC5kZXN0aW5hdGlvbik7XG5cdGdhaW5Ob2RlLmdhaW4udmFsdWUgPSAwLjAxO1xuXHRsZXQgY3VyckdhaW4gPSBnYWluTm9kZS5nYWluLnZhbHVlO1xuXG5cdGxldCB3YXZlVHlwZSA9ICdzaW5lJztcblxuICAvLyAqKioqKioqIENyZWF0ZSBvc2NpbGxhdG9ycyBmb3IgdGhlIGZvdXIgZ2FtZSBidXR0b25zICoqKioqKipcblxuICBsZXQgbncgPSBhdWRpb0N0eC5jcmVhdGVPc2NpbGxhdG9yKCk7XG4gIG53LnR5cGUgPSB3YXZlVHlwZTtcbiAgbncuZnJlcXVlbmN5LnZhbHVlID0gNDQwO1xuICBudy5zdGFydCgwKTtcbiAgXG4gIGxldCBuZSA9IGF1ZGlvQ3R4LmNyZWF0ZU9zY2lsbGF0b3IoKTtcbiAgbmUudHlwZSA9IHdhdmVUeXBlO1xuICBuZS5mcmVxdWVuY3kudmFsdWUgPSA1NTQuMzc7XG4gIG5lLnN0YXJ0KDApO1xuICBcbiAgbGV0IHN3ID0gYXVkaW9DdHguY3JlYXRlT3NjaWxsYXRvcigpO1xuICBzdy50eXBlID0gd2F2ZVR5cGU7XG4gIHN3LmZyZXF1ZW5jeS52YWx1ZSA9IDY1OS4yNTtcbiAgc3cuc3RhcnQoMCk7XG4gIFxuICBsZXQgc2UgPSBhdWRpb0N0eC5jcmVhdGVPc2NpbGxhdG9yKCk7XG4gIHNlLnR5cGUgPSB3YXZlVHlwZTtcbiAgc2UuZnJlcXVlbmN5LnZhbHVlID0gNzgzLjk5O1xuICBzZS5zdGFydCgwKTtcblxuICAvLyAqKioqKioqIE1ldGhvZHMgZm9yIHN0YXJ0aW5nIGVhY2ggYXVkaW8gdG9uZSAqKioqKioqIFxuICBcbiAgbGV0IHN0YXJ0VG9uZSA9IHtcbiAgICBmYWRlSW46IGZ1bmN0aW9uICgpIHtcbiAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgIGN1cnJHYWluID0gLjE7XG4gICAgICB9LCA2MCk7XG4gICAgfSxcbiAgICBudzogKCkgPT4ge1xuICAgICAgbncuY29ubmVjdChnYWluTm9kZSk7XG4gICAgICBzdGFydFRvbmUuZmFkZUluKCk7XG4gICAgfSxcbiAgICBuZTogKCkgPT4ge1xuICAgICAgbmUuY29ubmVjdChnYWluTm9kZSk7XG4gICAgICBzdGFydFRvbmUuZmFkZUluKCk7XG4gICAgfSxcbiAgICBzdzogKCkgPT4ge1xuICAgICAgc3cuY29ubmVjdChnYWluTm9kZSk7XG5cdFx0XHRzdGFydFRvbmUuZmFkZUluKCk7XG4gICAgfSxcbiAgICBzZTogKCkgPT4ge1xuICAgICAgc2UuY29ubmVjdChnYWluTm9kZSk7XG4gICAgICBzdGFydFRvbmUuZmFkZUluKCk7XG4gICAgfVxuICB9O1xuXG4gIC8vICoqKioqKiogTWV0aG9kcyBmb3Igc3RvcHBpbmcgZWFjaCBhdWRpbyB0b25lICoqKioqKipcblxuICBsZXQgc3RvcFRvbmUgPSB7XG4gIFx0ZmFkZU91dDogKCkgPT4ge1xuICAgICAgICBjdXJyR2FpbiA9IDA7XG4gIFx0fSxcbiAgXHRudzogKCkgPT4ge1xuICAgICAgc3RvcFRvbmUuZmFkZU91dCgpO1xuICBcdFx0c2V0VGltZW91dCgoKSA9PiB7XG4gIFx0XHRcdG53LmRpc2Nvbm5lY3QoZ2Fpbk5vZGUpO1xuICBcdFx0fSwgNjApO1xuICBcdH0sXG4gIFx0bmU6ICgpID0+IHtcbiAgXHRcdHN0b3BUb25lLmZhZGVPdXQoKTtcbiAgXHRcdC8vbmUuc3RvcChhdWRpb0N0eC5jdXJyZW50VGltZSArIC4yKTtcbiAgXHRcdHNldFRpbWVvdXQoKCkgPT4ge1xuICBcdFx0XHRuZS5kaXNjb25uZWN0KGdhaW5Ob2RlKTtcbiAgXHRcdH0sIDYwKTtcbiAgXHR9LFxuICBcdHN3OiAoKSA9PiB7XG4gIFx0XHRzdG9wVG9uZS5mYWRlT3V0KCk7XG4gIFx0XHQvL3N3LnN0b3AoYXVkaW9DdHguY3VycmVudFRpbWUgKyAuMik7XG4gIFx0XHRzZXRUaW1lb3V0KCgpID0+IHtcbiAgXHRcdFx0c3cuZGlzY29ubmVjdChnYWluTm9kZSk7XG4gIFx0XHR9LCA2MCk7ICBcdFx0XG4gIFx0fSxcbiAgXHRzZTogKCkgPT4ge1xuICBcdFx0c3RvcFRvbmUuZmFkZU91dCgpO1xuICBcdFx0Ly9zZS5zdG9wKGF1ZGlvQ3R4LmN1cnJlbnRUaW1lICsgLjIpO1xuICBcdFx0c2V0VGltZW91dCgoKSA9PiB7XG4gIFx0XHRcdHNlLmRpc2Nvbm5lY3QoZ2Fpbk5vZGUpO1xuICBcdFx0fSwgNjApOyAgXHRcdFxuICBcdH1cbiAgfTtcblxuICByZXR1cm4ge1xuICBcdG53OiBudyxcbiAgXHRuZTogbmUsXG4gIFx0c3c6IHN3LFxuICBcdHNlOiBzZSxcbiAgXHRzdGFydFRvbmU6IHN0YXJ0VG9uZSxcbiAgXHRzdG9wVG9uZTogc3RvcFRvbmVcbiAgfVxuXG59KSgpO1xuXG5jb25zdCBzaW1vbiA9IChmdW5jdGlvbiAoKSB7XG5cbiAgY29uc3QgY29sb3JzID0ge1xuICAgIG53OiAnIzA4MCcsXG4gICAgbmU6ICcjRjAwJyxcbiAgICBzdzogJyNGRjAnLFxuICAgIHNlOiAnIzAwRidcbiAgfTtcbiAgY29uc3QgY29sb3JzQWN0aXZlID0ge1xuICAgIG53OiAnIzhCOCcsXG4gICAgbmU6ICcjRkFBJyxcbiAgICBzdzogJyNGRjknLFxuICAgIHNlOiAnIzk5RidcbiAgfTtcbiAgY29uc3QgYXZhaWxhYmxlU3RlcHMgPSBbJ253JywgJ25lJywgJ3N3JywgJ3NlJ107XG5cbiAgbGV0IGNvbXB1dGVyU3RlcHMgPSBbXTtcbiAgbGV0IHBsYXllclN0ZXBzID0gW107XG4gIGxldCBzdHJpY3RNb2RlID0gZmFsc2U7XG4gIGxldCBwbGF5ZXJTZWNvbmRDaGFuY2UgPSBmYWxzZTtcblxuICBsZXQgYnV0dG9uTG9naWM7XG5cbiAgZnVuY3Rpb24gZ2V0UmFuZG9tSW50KG1pbiwgbWF4KSB7XG4gICAgcmV0dXJuIE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIChtYXggLSBtaW4gKyAxKSArIG1pbik7XG4gIH1cblxuICBjb25zdCBzaW1vbkxvZ2ljID0ge1xuXG5cdFx0dXBkYXRlRGlzcGxheTogZnVuY3Rpb24gKHZhbHVlKSB7XG5cdFx0XHQkKCcjZGlzcGxheScpXG4gICAgICAgIC5lbXB0eSgpXG4gICAgICAgIC5hcHBlbmQodmFsdWUpO1xuICAgICAgfSxcblxuICAgIHNob3dDb21wdXRlclN0ZXBzOiBmdW5jdGlvbiAoKSB7XG4gICAgICBjb25zb2xlLmxvZygnY29tcHV0ZXIgdHVybi4uLicpO1xuXG4gICAgICBpZiAoY29tcHV0ZXJTdGVwcy5sZW5ndGggPT09IDIwKSB7XG4gICAgICAgIHJldHVybiBzaW1vbkxvZ2ljLmdhbWVXaW4oKTtcbiAgICAgIH1cblxuICAgICAgaWYgKCFwbGF5ZXJTZWNvbmRDaGFuY2UpIHtcbiAgICAgICAgLy8gYWRkIHJhbmRvbSBzdGVwIHRvIGNvbXB0ZXJTdGVwcyBhcnJheVxuICAgICAgICB2YXIgcmFuZG9tQnV0dG9uSW5kZXggPSBnZXRSYW5kb21JbnQoMCwgMyk7XG4gICAgICAgIGNvbXB1dGVyU3RlcHMucHVzaChhdmFpbGFibGVTdGVwc1tyYW5kb21CdXR0b25JbmRleF0pO1xuICAgICAgICBjb25zb2xlLmxvZygnbmV3IGNvbXB1dGVyIHN0ZXAhOiAnLCBjb21wdXRlclN0ZXBzKTtcbiAgICAgIH1cblxuICAgICAgLy8gZGlzcGxheSBjdXJyZW50IG51bWJlciBvZiBzdGVwcyBpbiBzdGVwLWNvdW50LWRpc3BsYXlcbiAgICAgIHNpbW9uTG9naWMudXBkYXRlRGlzcGxheShjb21wdXRlclN0ZXBzLmxlbmd0aCk7XG5cbiAgICAgIC8vIHBsYXkgdGhyb3VnaCBjb21wdXRlclN0ZXBzIHdpdGggYnJpZ2h0ZW5lZCBidXR0b24gYW5kIHNvdW5kXG4gICAgICBmdW5jdGlvbiBwbGF5Q29tcHV0ZXJTdGVwcyAoaW5kZXgpIHtcblxuXHRcdFx0XHRpZiAoIWNvbXB1dGVyU3RlcHNbaW5kZXhdKSB7XG5cdFx0XHRcdFx0Y29uc29sZS5sb2coJ2NvbXB1dGVyIGRvbmUgcGxheWluZyEnKTtcblx0XHRcdFx0XHRzaW1vbkxvZ2ljLnBsYXllclR1cm4oKTtcblx0XHRcdFx0XHRyZXR1cm47XG5cdFx0XHRcdH1cblxuXHRcdFx0XHR2YXIgY3VycmVudFN0ZXAgPSBjb21wdXRlclN0ZXBzW2luZGV4XTtcbiAgICAgICAgdmFyIHN0ZXBJZCA9IGAjJHtjb21wdXRlclN0ZXBzW2luZGV4XX1gO1xuICAgICAgICB2YXIgYWN0aXZlQ29sb3IgPSBjb2xvcnNBY3RpdmVbY29tcHV0ZXJTdGVwc1tpbmRleF1dO1xuICAgICAgICB2YXIgZGVmYXVsdENvbG9yID0gY29sb3JzW2NvbXB1dGVyU3RlcHNbaW5kZXhdXTtcblxuICAgICAgICBmdW5jdGlvbiBzZXRDb2xvcihzdGVwSWQsIGFjdGl2ZUNvbG9yLCByZXNvbHZlKSB7XG4gICAgICAgICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgICAgICAkKHN0ZXBJZCkuY3NzKCdiYWNrZ3JvdW5kJywgYWN0aXZlQ29sb3IpO1xuICAgICAgICAgICAgcmVzb2x2ZSgpO1xuICAgICAgICAgIH0sIDUwMCk7XG4gICAgICAgIH1cblxuICAgICAgICBsZXQgcHJvbWlzZSA9IG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgICBzZXRDb2xvcihzdGVwSWQsIGFjdGl2ZUNvbG9yLCByZXNvbHZlKTsgXG4gICAgICAgICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgICAgICBhdWRpby5zdGFydFRvbmVbY3VycmVudFN0ZXBdKCk7XG4gICAgICAgICAgfSwgNTAwKTtcbiAgICAgICAgfSlcbiAgICAgICAgLnRoZW4oKCkgPT4ge1xuICAgICAgICAgIHJldHVybiBuZXcgUHJvbWlzZShmdW5jdGlvbihyZXNvbHZlLCByZWplY3QpIHtcbiAgICAgICAgICAgIHNldENvbG9yKHN0ZXBJZCwgZGVmYXVsdENvbG9yLCByZXNvbHZlKTtcbiAgICAgICAgICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICAgICAgXHRhdWRpby5zdG9wVG9uZVtjdXJyZW50U3RlcF0oKTtcbiAgICAgICAgICAgIH0sIDUwMCk7XG4gICAgICAgICAgfSk7XG4gICAgICAgIH0pXG4gICAgICAgIC50aGVuKCgpID0+IHtcbiAgICAgICAgICBwbGF5Q29tcHV0ZXJTdGVwcyhpbmRleCArIDEpO1xuICAgICAgICB9KTtcbiAgICAgIH1cblxuICAgICAgcGxheUNvbXB1dGVyU3RlcHMoMCk7XG5cbiAgICB9LFxuXG4gICAgcGxheWVyVHVybjogZnVuY3Rpb24gKCkge1xuICAgIFx0Y29uc29sZS5sb2coJ3BsYXllcnMgdHVybi4uLicpO1xuICAgICAgY29uc29sZS5sb2coJ3BsYXllclN0ZXBzIGF0IHR1cm4gc3RhcnQnLCBwbGF5ZXJTdGVwcyk7XG5cbiAgICAgLy8gbWFrZSBzaW1vbi1idXR0b25zIGNsaWNrYWJsZVxuICAgICAkKCcuc2ltb24tYnV0dG9ucycpXG4gICAgIFx0LmFkZENsYXNzKCdjbGlja2FibGUnKVxuICAgICBcdC5tb3VzZWRvd24oZnVuY3Rpb24oZXZ0KSB7XG4gICAgIFx0XHQkKCcjJyArIGV2dC50YXJnZXQuaWQpLmNzcygnYmFja2dyb3VuZCcsIGNvbG9yc0FjdGl2ZVtldnQudGFyZ2V0LmlkXSk7XG4gICAgIFx0XHRhdWRpby5zdGFydFRvbmVbZXZ0LnRhcmdldC5pZF0oKTtcbiAgICAgXHR9KVxuICAgICBcdC5tb3VzZXVwKGZ1bmN0aW9uKGV2dCkge1xuICAgICBcdFx0JCgnIycgKyBldnQudGFyZ2V0LmlkKS5jc3MoJ2JhY2tncm91bmQnLCBjb2xvcnNbZXZ0LnRhcmdldC5pZF0pO1xuICAgICBcdFx0YXVkaW8uc3RvcFRvbmVbZXZ0LnRhcmdldC5pZF0oKTtcbiAgICAgXHR9KVxuICAgICBcdC5vbignY2xpY2snLCBmdW5jdGlvbihldnQpIHtcbiAgICAgIFx0ZXZ0LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICBcdGV2dC5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgIFx0dmFyIGN1cnJlbnRQbGF5ZXJTdGVwSW5kZXg7XG5cbiAgICAgIFx0cGxheWVyU3RlcHMucHVzaChldnQudGFyZ2V0LmlkKTtcbiAgICAgIFx0Y3VycmVudFBsYXllclN0ZXBJbmRleCA9IHBsYXllclN0ZXBzLmxlbmd0aCAtIDE7XG4gICAgICBcdGNvbnNvbGUubG9nKCdwbGF5ZXIgcHJlc3NlZDogJyArIGV2dC50YXJnZXQuaWQpO1xuICAgICAgXHRjb25zb2xlLmxvZygncGxheWVyU3RlcHMgYXJyYXk6ICcsIHBsYXllclN0ZXBzKTtcblxuICAgICAgXHRpZiAoY29tcHV0ZXJTdGVwc1tjdXJyZW50UGxheWVyU3RlcEluZGV4XSA9PT0gcGxheWVyU3RlcHNbY3VycmVudFBsYXllclN0ZXBJbmRleF0pIHtcblxuICAgICAgXHRcdGlmIChjb21wdXRlclN0ZXBzLmxlbmd0aCA9PT0gcGxheWVyU3RlcHMubGVuZ3RoKSB7XG4gICAgICBcdFx0XHQkKCcuc2ltb24tYnV0dG9ucycpXG4gICAgICBcdFx0XHRcdC5vZmYoKVxuICAgICAgXHRcdFx0XHQucmVtb3ZlQ2xhc3MoJ2NsaWNrYWJsZScpO1xuICAgICAgXHRcdFx0cGxheWVyU3RlcHMgPSBbXTtcblxuICAgICAgICAgICAgaWYgKHBsYXllclNlY29uZENoYW5jZSkge1xuICAgICAgICAgICAgICBzaW1vbkxvZ2ljLmNsZWFyQW5vdGhlckNoYW5jZSgpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gc2ltb25Mb2dpYy5zaG93Q29tcHV0ZXJTdGVwcygpO1xuICAgICAgICAgIH1cblxuICAgICAgICAgICQoJy5zaW1vbi1idXR0b25zJylcbiAgICAgICAgICAgICAgLm9mZigpXG4gICAgICAgICAgICAgIC5yZW1vdmVDbGFzcygnY2xpY2thYmxlJyk7XG5cbiAgICAgICAgICByZXR1cm4gc2ltb25Mb2dpYy5wbGF5ZXJUdXJuKCk7XG4gICAgICAgIH0gXG4gICAgICAgIGNvbnNvbGUubG9nKCd3cm9uZyBtb3ZlLCBpcyBzdHJpY3RNb2RlIHRydWUgb3IgZmFsc2U/OiAnLCBzdHJpY3RNb2RlKTtcbiAgICAgICAgLy8gaWYgc3RyaWN0TW9kZSBpcyBmYWxzZSwgcGxheWVyIGdldHMgYW5vdGhlciBjaGFuY2VcbiAgICAgICAgaWYgKCFzdHJpY3RNb2RlKSB7XG4gICAgICAgICAgc2ltb25Mb2dpYy5hbm90aGVyQ2hhbmNlKCk7XG4gICAgICAgICAgJCgnLnNpbW9uLWJ1dHRvbnMnKVxuICAgICAgICAgICAgLm9mZigpXG4gICAgICAgICAgICAucmVtb3ZlQ2xhc3MoJ2NsaWNrYWJsZScpO1xuICAgICAgICAgIHBsYXllclN0ZXBzID0gW107XG4gICAgICAgICAgcmV0dXJuIHNpbW9uTG9naWMuc2hvd0NvbXB1dGVyU3RlcHMoKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgLy8gZWxzZSwgc3RyaWN0TW9kZSBpcyB0cnVlLCB3aGljaCBtZWFucyBnYW1lIG92ZXIgICAgXG4gICAgICBcdFx0Y29uc29sZS5sb2coJ0dhbWUgT3ZlciEnKTtcbiAgICAgIFx0XHRjb25zb2xlLmxvZygnY29tcHV0ZXJTdGVwc1tjdXJyZW50UGxheWVyU3RlcEluZGV4XTogJywgY29tcHV0ZXJTdGVwc1tjdXJyZW50UGxheWVyU3RlcEluZGV4XSk7XG4gICAgICBcdFx0Y29uc29sZS5sb2coJ3BsYXllclN0ZXBzW2N1cnJlbnRQbGF5ZXJTdGVwSW5kZXhdOiAnLCBwbGF5ZXJTdGVwc1tjdXJyZW50UGxheWVyU3RlcEluZGV4XSk7XG4gICAgICAgICAgc2ltb25Mb2dpYy5nYW1lTG9zZSgpO1xuICAgICAgICAgICQoJy5zaW1vbi1idXR0b25zJylcbiAgICAgICAgICAgIC5vZmYoKVxuICAgICAgICAgICAgLnJlbW92ZUNsYXNzKCdjbGlja2FibGUnKTtcbiAgICAgICAgICByZXR1cm4gc2ltb25Mb2dpYy5yZXNldEdhbWUoKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfSxcblxuXG4gICAgY2xlYXJNb3ZlczogZnVuY3Rpb24oKSB7XG4gICAgICBjb21wdXRlclN0ZXBzID0gW107XG4gICAgICBwbGF5ZXJTdGVwcyA9IFtdO1xuICAgICAgcGxheWVyU2Vjb25kQ2hhbmNlID0gZmFsc2U7XG4gICAgfSxcblxuICAgIHJlc2V0R2FtZTogZnVuY3Rpb24oKSB7XG4gICAgICBzaW1vbkxvZ2ljLmNsZWFyTW92ZXMoKTtcbiAgICAgIHNpbW9uTG9naWMudXBkYXRlRGlzcGxheSgnLS0nKTtcbiAgICAgICQoJy5zaW1vbi1idXR0b25zJylcbiAgICAgICAgLm9mZigpXG4gICAgICAgIC5yZW1vdmVDbGFzcygnY2xpY2thYmxlJyk7XG4gICAgICAkKCcjcmVzZXQtYnV0dG9uJykub2ZmKCdjbGljaycpO1xuICAgIH0sXG5cbiAgICBhbm90aGVyQ2hhbmNlOiBmdW5jdGlvbigpIHtcbiAgICAgICQoJy5nYW1lLXN0YXR1cycpXG4gICAgICAgIC5lbXB0eSgpXG4gICAgICAgIC5hcHBlbmQoJzxoMj5XUk9ORyEgVFJZIEFHQUlOPC9oMj4nKTtcbiAgICAgIHBsYXllclN0ZXBzID0gW107XG4gICAgICBwbGF5ZXJTZWNvbmRDaGFuY2UgPSB0cnVlO1xuICAgIH0sXG5cbiAgICBjbGVhckFub3RoZXJDaGFuY2U6IGZ1bmN0aW9uKCkge1xuICAgICAgc2ltb25Mb2dpYy5jbGVhckdhbWVTdGF0dXMoKTtcbiAgICAgIHBsYXllclNlY29uZENoYW5jZSA9IGZhbHNlO1xuICAgIH0sXG5cbiAgICBnYW1lV2luOiBmdW5jdGlvbigpIHtcbiAgICAgICQoJy5nYW1lLXN0YXR1cycpLmFwcGVuZCgnPGgyPllPVSBXSU4hPC9oMj4nKTtcbiAgICAgIHJldHVybiBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICBzaW1vbkxvZ2ljLnJlc2V0R2FtZSgpO1xuICAgICAgICBzaW1vbkxvZ2ljLmNsZWFyR2FtZVN0YXR1cygpO1xuICAgICAgICBzaW1vbkxvZ2ljLnNob3dDb21wdXRlclN0ZXBzKCk7XG4gICAgICB9LCAxMDAwKTtcbiAgICB9LFxuXG4gICAgZ2FtZUxvc2U6IGZ1bmN0aW9uKCkge1xuICAgICAgJCgnLmdhbWUtc3RhdHVzJykuZW1wdHkoKS5hcHBlbmQoJzxoMj5ZT1UgTE9TRSE8L2gyPicpO1xuICAgICAgcmV0dXJuIGJ1dHRvbkxvZ2ljLnN0YXJ0KCk7XG4gICAgfSxcblxuICAgIGNsZWFyR2FtZVN0YXR1czogZnVuY3Rpb24oKSB7XG4gICAgICAkKCcuZ2FtZS1zdGF0dXMnKS5lbXB0eSgpO1xuICAgIH1cbiAgfTtcbiAgXG4gIGJ1dHRvbkxvZ2ljID0ge1xuICAgIHN0YXJ0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAkKCcjc3RhcnQtYnV0dG9uJykuY2xpY2soICgpID0+IHsgICBcbiAgICAgICAgc2ltb25Mb2dpYy5jbGVhck1vdmVzKCk7XG4gICAgICAgIHNpbW9uTG9naWMuY2xlYXJHYW1lU3RhdHVzKCk7XG4gICAgICAgIHNpbW9uTG9naWMuc2hvd0NvbXB1dGVyU3RlcHMoKTtcbiAgICAgICAgJCgnI3N0YXJ0LWJ1dHRvbicpLm9mZignY2xpY2snKTtcbiAgICAgICAgcmV0dXJuIGJ1dHRvbkxvZ2ljLnJlc2V0KCk7XG4gICAgICB9KTtcbiAgICB9LFxuICAgIFxuICAgIHJlc2V0OiBmdW5jdGlvbigpIHtcbiAgICAgICQoJyNyZXNldC1idXR0b24nKS5jbGljayggKCkgPT4ge1xuICAgICAgICBjb25zb2xlLmxvZygncmVzZXQgYnV0dG9uIGNsaWNrZWQnKTtcbiAgICAgICAgc2ltb25Mb2dpYy5yZXNldEdhbWUoKTtcbiAgICAgICAgc2ltb25Mb2dpYy5jbGVhckdhbWVTdGF0dXMoKTtcbiAgICAgICAgJCgnI3Jlc2V0LWJ1dHRvbicpLm9mZignY2xpY2snKTtcbiAgICAgICAgcmV0dXJuIGJ1dHRvbkxvZ2ljLnN0YXJ0KCk7XG4gICAgICB9KTtcbiAgICB9LFxuXG4gICAgc3RyaWN0OiBmdW5jdGlvbigpIHtcbiAgICAgICQoJyNzdHJpY3QtbW9kZS1idXR0b24nKS5jbGljayggKCkgPT4ge1xuICAgICAgICBzdHJpY3RNb2RlID0gIXN0cmljdE1vZGU7XG4gICAgICAgIGNvbnNvbGUubG9nKCdzdHJpY3RNb2RlOiAnLCBzdHJpY3RNb2RlKTtcbiAgICAgICAgYnV0dG9uTG9naWMuc3RyaWN0TGlnaHRUb2dnbGUoKTtcbiAgICAgIH0pO1xuICAgIH0sXG5cbiAgICBzdHJpY3RMaWdodFRvZ2dsZTogZnVuY3Rpb24oKSB7XG4gICAgICAkKCcjc3RyaWN0LW1vZGUtbGlnaHQnKS50b2dnbGVDbGFzcygnb24nKTtcbiAgICB9XG5cbiAgfTtcbiAgXG4gIGZ1bmN0aW9uIGluaXQgKCkge1xuICAgIGJ1dHRvbkxvZ2ljLnN0YXJ0KCk7XG4gICAgLy9idXR0b25Mb2dpYy5yZXNldCgpO1xuICAgIGJ1dHRvbkxvZ2ljLnN0cmljdCgpO1xuICB9XG4gIFxuICByZXR1cm4ge1xuICAgIGluaXQ6IGluaXQsXG4gICAgZ2V0UmFuZG9tSW50OiBnZXRSYW5kb21JbnRcbiAgfTtcbiAgXG59KSgpO1xuXG4kKGRvY3VtZW50KS5yZWFkeShmdW5jdGlvbigpIHtcbiAgc2ltb24uaW5pdCgpO1xufSk7XG4iXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=
