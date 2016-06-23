'use strict';

/*!
* Simon in JavaScript.
* Another Front End challenge for Free Code Camp.
* http://www.FreeCodeCamp.com/
*/

var audio = function () {

  var audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  var gainNode = audioCtx.createGain();
  gainNode.connect(audioCtx.destination);
  gainNode.gain.value = 0.01;
  var currGain = gainNode.gain.value;

  var waveType = 'sine';

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

    resetGame: function resetGame() {
      computerSteps = [];
      playerSteps = [];
      playerSecondChance = false;
      simonLogic.updateDisplay('--');
      $('.simon-buttons').off().removeClass('clickable');
      return buttonLogic.start();
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
      return $('.game-status').empty().append('<h2>YOU LOSE!</h2>');
    },

    clearGameStatus: function clearGameStatus() {
      $('.game-status').empty();
    }
  };

  buttonLogic = {
    start: function start() {
      $('#start-button').click(function () {
        simonLogic.resetGame();
        simonLogic.clearGameStatus();
        simonLogic.showComputerSteps();
        $('#start-button').off('click');
      });
    },

    reset: function reset() {
      $('#reset-button').click(function () {
        console.log('reset button clicked');
        simonLogic.resetGame();
        simonLogic.clearGameStatus();
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
    buttonLogic.reset();
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
//# sourceMappingURL=data:application/json;base64,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QkFBWSxLQUFaO0FBQ0EsZ0JBQVksS0FBWjtBQUNBLGdCQUFZLE1BQVo7QUFDRDs7QUFFRCxTQUFPO0FBQ0wsVUFBTSxJQUREO0FBRUwsa0JBQWM7QUFGVCxHQUFQO0FBS0QsQ0ExUGEsRUFBZDs7QUE0UEEsRUFBRSxRQUFGLEVBQVksS0FBWixDQUFrQixZQUFXO0FBQzNCLFFBQU0sSUFBTjtBQUNELENBRkQiLCJmaWxlIjoiYnVuZGxlLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLyohXG4qIFNpbW9uIGluIEphdmFTY3JpcHQuXG4qIEFub3RoZXIgRnJvbnQgRW5kIGNoYWxsZW5nZSBmb3IgRnJlZSBDb2RlIENhbXAuXG4qIGh0dHA6Ly93d3cuRnJlZUNvZGVDYW1wLmNvbS9cbiovXG5cbmNvbnN0IGF1ZGlvID0gKGZ1bmN0aW9uICgpIHtcblxuXHRsZXQgYXVkaW9DdHggPSBuZXcgKHdpbmRvdy5BdWRpb0NvbnRleHQgfHwgd2luZG93LndlYmtpdEF1ZGlvQ29udGV4dCkoKTtcblx0bGV0IGdhaW5Ob2RlID0gYXVkaW9DdHguY3JlYXRlR2FpbigpO1xuXHRnYWluTm9kZS5jb25uZWN0KGF1ZGlvQ3R4LmRlc3RpbmF0aW9uKTtcblx0Z2Fpbk5vZGUuZ2Fpbi52YWx1ZSA9IDAuMDE7XG5cdGxldCBjdXJyR2FpbiA9IGdhaW5Ob2RlLmdhaW4udmFsdWU7XG5cblx0bGV0IHdhdmVUeXBlID0gJ3NpbmUnO1xuXG4gIGxldCBudyA9IGF1ZGlvQ3R4LmNyZWF0ZU9zY2lsbGF0b3IoKTtcbiAgbncudHlwZSA9IHdhdmVUeXBlO1xuICBudy5mcmVxdWVuY3kudmFsdWUgPSA0NDA7XG4gIG53LnN0YXJ0KDApO1xuICBcbiAgbGV0IG5lID0gYXVkaW9DdHguY3JlYXRlT3NjaWxsYXRvcigpO1xuICBuZS50eXBlID0gd2F2ZVR5cGU7XG4gIG5lLmZyZXF1ZW5jeS52YWx1ZSA9IDU1NC4zNztcbiAgbmUuc3RhcnQoMCk7XG4gIFxuICBsZXQgc3cgPSBhdWRpb0N0eC5jcmVhdGVPc2NpbGxhdG9yKCk7XG4gIHN3LnR5cGUgPSB3YXZlVHlwZTtcbiAgc3cuZnJlcXVlbmN5LnZhbHVlID0gNjU5LjI1O1xuICBzdy5zdGFydCgwKTtcbiAgXG4gIGxldCBzZSA9IGF1ZGlvQ3R4LmNyZWF0ZU9zY2lsbGF0b3IoKTtcbiAgc2UudHlwZSA9IHdhdmVUeXBlO1xuICBzZS5mcmVxdWVuY3kudmFsdWUgPSA3ODMuOTk7XG4gIHNlLnN0YXJ0KDApO1xuICBcbiAgbGV0IHN0YXJ0VG9uZSA9IHtcbiAgICBmYWRlSW46IGZ1bmN0aW9uICgpIHtcbiAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgIGN1cnJHYWluID0gLjE7XG4gICAgICB9LCA2MCk7XG4gICAgfSxcbiAgICBudzogKCkgPT4ge1xuICAgICAgbncuY29ubmVjdChnYWluTm9kZSk7XG4gICAgICBzdGFydFRvbmUuZmFkZUluKCk7XG4gICAgfSxcbiAgICBuZTogKCkgPT4ge1xuICAgICAgbmUuY29ubmVjdChnYWluTm9kZSk7XG4gICAgICBzdGFydFRvbmUuZmFkZUluKCk7XG4gICAgfSxcbiAgICBzdzogKCkgPT4ge1xuICAgICAgc3cuY29ubmVjdChnYWluTm9kZSk7XG5cdFx0XHRzdGFydFRvbmUuZmFkZUluKCk7XG4gICAgfSxcbiAgICBzZTogKCkgPT4ge1xuICAgICAgc2UuY29ubmVjdChnYWluTm9kZSk7XG4gICAgICBzdGFydFRvbmUuZmFkZUluKCk7XG4gICAgfVxuICB9O1xuXG4gIGxldCBzdG9wVG9uZSA9IHtcbiAgXHRmYWRlT3V0OiAoKSA9PiB7XG4gICAgICAgIGN1cnJHYWluID0gMDtcbiAgXHR9LFxuICBcdG53OiAoKSA9PiB7XG4gICAgICBzdG9wVG9uZS5mYWRlT3V0KCk7XG4gIFx0XHRzZXRUaW1lb3V0KCgpID0+IHtcbiAgXHRcdFx0bncuZGlzY29ubmVjdChnYWluTm9kZSk7XG4gIFx0XHR9LCA2MCk7XG4gIFx0fSxcbiAgXHRuZTogKCkgPT4ge1xuICBcdFx0c3RvcFRvbmUuZmFkZU91dCgpO1xuICBcdFx0Ly9uZS5zdG9wKGF1ZGlvQ3R4LmN1cnJlbnRUaW1lICsgLjIpO1xuICBcdFx0c2V0VGltZW91dCgoKSA9PiB7XG4gIFx0XHRcdG5lLmRpc2Nvbm5lY3QoZ2Fpbk5vZGUpO1xuICBcdFx0fSwgNjApO1xuICBcdH0sXG4gIFx0c3c6ICgpID0+IHtcbiAgXHRcdHN0b3BUb25lLmZhZGVPdXQoKTtcbiAgXHRcdC8vc3cuc3RvcChhdWRpb0N0eC5jdXJyZW50VGltZSArIC4yKTtcbiAgXHRcdHNldFRpbWVvdXQoKCkgPT4ge1xuICBcdFx0XHRzdy5kaXNjb25uZWN0KGdhaW5Ob2RlKTtcbiAgXHRcdH0sIDYwKTsgIFx0XHRcbiAgXHR9LFxuICBcdHNlOiAoKSA9PiB7XG4gIFx0XHRzdG9wVG9uZS5mYWRlT3V0KCk7XG4gIFx0XHQvL3NlLnN0b3AoYXVkaW9DdHguY3VycmVudFRpbWUgKyAuMik7XG4gIFx0XHRzZXRUaW1lb3V0KCgpID0+IHtcbiAgXHRcdFx0c2UuZGlzY29ubmVjdChnYWluTm9kZSk7XG4gIFx0XHR9LCA2MCk7ICBcdFx0XG4gIFx0fVxuICB9O1xuXG4gIHJldHVybiB7XG4gIFx0bnc6IG53LFxuICBcdG5lOiBuZSxcbiAgXHRzdzogc3csXG4gIFx0c2U6IHNlLFxuICBcdHN0YXJ0VG9uZTogc3RhcnRUb25lLFxuICBcdHN0b3BUb25lOiBzdG9wVG9uZVxuICB9XG5cbn0pKCk7XG5cbmNvbnN0IHNpbW9uID0gKGZ1bmN0aW9uICgpIHtcblxuICBjb25zdCBjb2xvcnMgPSB7XG4gICAgbnc6ICcjMDgwJyxcbiAgICBuZTogJyNGMDAnLFxuICAgIHN3OiAnI0ZGMCcsXG4gICAgc2U6ICcjMDBGJ1xuICB9O1xuICBjb25zdCBjb2xvcnNBY3RpdmUgPSB7XG4gICAgbnc6ICcjOEI4JyxcbiAgICBuZTogJyNGQUEnLFxuICAgIHN3OiAnI0ZGOScsXG4gICAgc2U6ICcjOTlGJ1xuICB9O1xuICBjb25zdCBhdmFpbGFibGVTdGVwcyA9IFsnbncnLCAnbmUnLCAnc3cnLCAnc2UnXTtcblxuICBsZXQgY29tcHV0ZXJTdGVwcyA9IFtdO1xuICBsZXQgcGxheWVyU3RlcHMgPSBbXTtcbiAgbGV0IHN0cmljdE1vZGUgPSBmYWxzZTtcbiAgbGV0IHBsYXllclNlY29uZENoYW5jZSA9IGZhbHNlO1xuXG4gIGxldCBidXR0b25Mb2dpYztcblxuICBmdW5jdGlvbiBnZXRSYW5kb21JbnQobWluLCBtYXgpIHtcbiAgICByZXR1cm4gTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogKG1heCAtIG1pbiArIDEpICsgbWluKTtcbiAgfVxuXG4gIGNvbnN0IHNpbW9uTG9naWMgPSB7XG5cblx0XHR1cGRhdGVEaXNwbGF5OiBmdW5jdGlvbiAodmFsdWUpIHtcblx0XHRcdCQoJyNkaXNwbGF5JylcbiAgICAgICAgLmVtcHR5KClcbiAgICAgICAgLmFwcGVuZCh2YWx1ZSk7XG4gICAgICB9LFxuXG4gICAgc2hvd0NvbXB1dGVyU3RlcHM6IGZ1bmN0aW9uICgpIHtcbiAgICAgIGNvbnNvbGUubG9nKCdjb21wdXRlciB0dXJuLi4uJyk7XG5cbiAgICAgIGlmIChjb21wdXRlclN0ZXBzLmxlbmd0aCA9PT0gMjApIHtcbiAgICAgICAgcmV0dXJuIHNpbW9uTG9naWMuZ2FtZVdpbigpO1xuICAgICAgfVxuXG4gICAgICBpZiAoIXBsYXllclNlY29uZENoYW5jZSkge1xuICAgICAgICAvLyBhZGQgcmFuZG9tIHN0ZXAgdG8gY29tcHRlclN0ZXBzIGFycmF5XG4gICAgICAgIHZhciByYW5kb21CdXR0b25JbmRleCA9IGdldFJhbmRvbUludCgwLCAzKTtcbiAgICAgICAgY29tcHV0ZXJTdGVwcy5wdXNoKGF2YWlsYWJsZVN0ZXBzW3JhbmRvbUJ1dHRvbkluZGV4XSk7XG4gICAgICAgIGNvbnNvbGUubG9nKCduZXcgY29tcHV0ZXIgc3RlcCE6ICcsIGNvbXB1dGVyU3RlcHMpO1xuICAgICAgfVxuXG4gICAgICAvLyBkaXNwbGF5IGN1cnJlbnQgbnVtYmVyIG9mIHN0ZXBzIGluIHN0ZXAtY291bnQtZGlzcGxheVxuICAgICAgc2ltb25Mb2dpYy51cGRhdGVEaXNwbGF5KGNvbXB1dGVyU3RlcHMubGVuZ3RoKTtcblxuICAgICAgLy8gcGxheSB0aHJvdWdoIGNvbXB1dGVyU3RlcHMgd2l0aCBicmlnaHRlbmVkIGJ1dHRvbiBhbmQgc291bmRcbiAgICAgIGZ1bmN0aW9uIHBsYXlDb21wdXRlclN0ZXBzIChpbmRleCkge1xuXG5cdFx0XHRcdGlmICghY29tcHV0ZXJTdGVwc1tpbmRleF0pIHtcblx0XHRcdFx0XHRjb25zb2xlLmxvZygnY29tcHV0ZXIgZG9uZSBwbGF5aW5nIScpO1xuXHRcdFx0XHRcdHNpbW9uTG9naWMucGxheWVyVHVybigpO1xuXHRcdFx0XHRcdHJldHVybjtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdHZhciBjdXJyZW50U3RlcCA9IGNvbXB1dGVyU3RlcHNbaW5kZXhdO1xuICAgICAgICB2YXIgc3RlcElkID0gYCMke2NvbXB1dGVyU3RlcHNbaW5kZXhdfWA7XG4gICAgICAgIHZhciBhY3RpdmVDb2xvciA9IGNvbG9yc0FjdGl2ZVtjb21wdXRlclN0ZXBzW2luZGV4XV07XG4gICAgICAgIHZhciBkZWZhdWx0Q29sb3IgPSBjb2xvcnNbY29tcHV0ZXJTdGVwc1tpbmRleF1dO1xuXG4gICAgICAgIGZ1bmN0aW9uIHNldENvbG9yKHN0ZXBJZCwgYWN0aXZlQ29sb3IsIHJlc29sdmUpIHtcbiAgICAgICAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgICAgICQoc3RlcElkKS5jc3MoJ2JhY2tncm91bmQnLCBhY3RpdmVDb2xvcik7XG4gICAgICAgICAgICByZXNvbHZlKCk7XG4gICAgICAgICAgfSwgNTAwKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGxldCBwcm9taXNlID0gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICAgIHNldENvbG9yKHN0ZXBJZCwgYWN0aXZlQ29sb3IsIHJlc29sdmUpOyBcbiAgICAgICAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgICAgIGF1ZGlvLnN0YXJ0VG9uZVtjdXJyZW50U3RlcF0oKTtcbiAgICAgICAgICB9LCA1MDApO1xuICAgICAgICB9KVxuICAgICAgICAudGhlbigoKSA9PiB7XG4gICAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKGZ1bmN0aW9uKHJlc29sdmUsIHJlamVjdCkge1xuICAgICAgICAgICAgc2V0Q29sb3Ioc3RlcElkLCBkZWZhdWx0Q29sb3IsIHJlc29sdmUpO1xuICAgICAgICAgICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgICAgICBcdGF1ZGlvLnN0b3BUb25lW2N1cnJlbnRTdGVwXSgpO1xuICAgICAgICAgICAgfSwgNTAwKTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgfSlcbiAgICAgICAgLnRoZW4oKCkgPT4ge1xuICAgICAgICAgIHBsYXlDb21wdXRlclN0ZXBzKGluZGV4ICsgMSk7XG4gICAgICAgIH0pO1xuICAgICAgfVxuXG4gICAgICBwbGF5Q29tcHV0ZXJTdGVwcygwKTtcblxuICAgIH0sXG5cbiAgICBwbGF5ZXJUdXJuOiBmdW5jdGlvbiAoKSB7XG4gICAgXHRjb25zb2xlLmxvZygncGxheWVycyB0dXJuLi4uJyk7XG4gICAgICBjb25zb2xlLmxvZygncGxheWVyU3RlcHMgYXQgdHVybiBzdGFydCcsIHBsYXllclN0ZXBzKTtcblxuICAgICAvLyBtYWtlIHNpbW9uLWJ1dHRvbnMgY2xpY2thYmxlXG4gICAgICQoJy5zaW1vbi1idXR0b25zJylcbiAgICAgXHQuYWRkQ2xhc3MoJ2NsaWNrYWJsZScpXG4gICAgIFx0Lm1vdXNlZG93bihmdW5jdGlvbihldnQpIHtcbiAgICAgXHRcdCQoJyMnICsgZXZ0LnRhcmdldC5pZCkuY3NzKCdiYWNrZ3JvdW5kJywgY29sb3JzQWN0aXZlW2V2dC50YXJnZXQuaWRdKTtcbiAgICAgXHRcdGF1ZGlvLnN0YXJ0VG9uZVtldnQudGFyZ2V0LmlkXSgpO1xuICAgICBcdH0pXG4gICAgIFx0Lm1vdXNldXAoZnVuY3Rpb24oZXZ0KSB7XG4gICAgIFx0XHQkKCcjJyArIGV2dC50YXJnZXQuaWQpLmNzcygnYmFja2dyb3VuZCcsIGNvbG9yc1tldnQudGFyZ2V0LmlkXSk7XG4gICAgIFx0XHRhdWRpby5zdG9wVG9uZVtldnQudGFyZ2V0LmlkXSgpO1xuICAgICBcdH0pXG4gICAgIFx0Lm9uKCdjbGljaycsIGZ1bmN0aW9uKGV2dCkge1xuICAgICAgXHRldnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgIFx0ZXZ0LnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgXHR2YXIgY3VycmVudFBsYXllclN0ZXBJbmRleDtcblxuICAgICAgXHRwbGF5ZXJTdGVwcy5wdXNoKGV2dC50YXJnZXQuaWQpO1xuICAgICAgXHRjdXJyZW50UGxheWVyU3RlcEluZGV4ID0gcGxheWVyU3RlcHMubGVuZ3RoIC0gMTtcbiAgICAgIFx0Y29uc29sZS5sb2coJ3BsYXllciBwcmVzc2VkOiAnICsgZXZ0LnRhcmdldC5pZCk7XG4gICAgICBcdGNvbnNvbGUubG9nKCdwbGF5ZXJTdGVwcyBhcnJheTogJywgcGxheWVyU3RlcHMpO1xuXG4gICAgICBcdGlmIChjb21wdXRlclN0ZXBzW2N1cnJlbnRQbGF5ZXJTdGVwSW5kZXhdID09PSBwbGF5ZXJTdGVwc1tjdXJyZW50UGxheWVyU3RlcEluZGV4XSkge1xuXG4gICAgICBcdFx0aWYgKGNvbXB1dGVyU3RlcHMubGVuZ3RoID09PSBwbGF5ZXJTdGVwcy5sZW5ndGgpIHtcbiAgICAgIFx0XHRcdCQoJy5zaW1vbi1idXR0b25zJylcbiAgICAgIFx0XHRcdFx0Lm9mZigpXG4gICAgICBcdFx0XHRcdC5yZW1vdmVDbGFzcygnY2xpY2thYmxlJyk7XG4gICAgICBcdFx0XHRwbGF5ZXJTdGVwcyA9IFtdO1xuXG4gICAgICAgICAgICBpZiAocGxheWVyU2Vjb25kQ2hhbmNlKSB7XG4gICAgICAgICAgICAgIHNpbW9uTG9naWMuY2xlYXJBbm90aGVyQ2hhbmNlKCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiBzaW1vbkxvZ2ljLnNob3dDb21wdXRlclN0ZXBzKCk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgJCgnLnNpbW9uLWJ1dHRvbnMnKVxuICAgICAgICAgICAgICAub2ZmKClcbiAgICAgICAgICAgICAgLnJlbW92ZUNsYXNzKCdjbGlja2FibGUnKTtcblxuICAgICAgICAgIHJldHVybiBzaW1vbkxvZ2ljLnBsYXllclR1cm4oKTtcbiAgICAgICAgfSBcbiAgICAgICAgY29uc29sZS5sb2coJ3dyb25nIG1vdmUsIGlzIHN0cmljdE1vZGUgdHJ1ZSBvciBmYWxzZT86ICcsIHN0cmljdE1vZGUpO1xuICAgICAgICAvLyBpZiBzdHJpY3RNb2RlIGlzIGZhbHNlLCBwbGF5ZXIgZ2V0cyBhbm90aGVyIGNoYW5jZVxuICAgICAgICBpZiAoIXN0cmljdE1vZGUpIHtcbiAgICAgICAgICBzaW1vbkxvZ2ljLmFub3RoZXJDaGFuY2UoKTtcbiAgICAgICAgICAkKCcuc2ltb24tYnV0dG9ucycpXG4gICAgICAgICAgICAub2ZmKClcbiAgICAgICAgICAgIC5yZW1vdmVDbGFzcygnY2xpY2thYmxlJyk7XG4gICAgICAgICAgcGxheWVyU3RlcHMgPSBbXTtcbiAgICAgICAgICByZXR1cm4gc2ltb25Mb2dpYy5zaG93Q29tcHV0ZXJTdGVwcygpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAvLyBlbHNlLCBzdHJpY3RNb2RlIGlzIHRydWUsIHdoaWNoIG1lYW5zIGdhbWUgb3ZlciAgICBcbiAgICAgIFx0XHRjb25zb2xlLmxvZygnR2FtZSBPdmVyIScpO1xuICAgICAgXHRcdGNvbnNvbGUubG9nKCdjb21wdXRlclN0ZXBzW2N1cnJlbnRQbGF5ZXJTdGVwSW5kZXhdOiAnLCBjb21wdXRlclN0ZXBzW2N1cnJlbnRQbGF5ZXJTdGVwSW5kZXhdKTtcbiAgICAgIFx0XHRjb25zb2xlLmxvZygncGxheWVyU3RlcHNbY3VycmVudFBsYXllclN0ZXBJbmRleF06ICcsIHBsYXllclN0ZXBzW2N1cnJlbnRQbGF5ZXJTdGVwSW5kZXhdKTtcbiAgICAgICAgICBzaW1vbkxvZ2ljLmdhbWVMb3NlKCk7XG4gICAgICAgICAgJCgnLnNpbW9uLWJ1dHRvbnMnKVxuICAgICAgICAgICAgLm9mZigpXG4gICAgICAgICAgICAucmVtb3ZlQ2xhc3MoJ2NsaWNrYWJsZScpO1xuICAgICAgICAgIHJldHVybiBzaW1vbkxvZ2ljLnJlc2V0R2FtZSgpO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9LFxuXG4gICAgcmVzZXRHYW1lOiBmdW5jdGlvbigpIHtcbiAgICAgIGNvbXB1dGVyU3RlcHMgPSBbXTtcbiAgICAgIHBsYXllclN0ZXBzID0gW107XG4gICAgICBwbGF5ZXJTZWNvbmRDaGFuY2UgPSBmYWxzZTtcbiAgICAgIHNpbW9uTG9naWMudXBkYXRlRGlzcGxheSgnLS0nKTtcbiAgICAgICQoJy5zaW1vbi1idXR0b25zJylcbiAgICAgICAgLm9mZigpXG4gICAgICAgIC5yZW1vdmVDbGFzcygnY2xpY2thYmxlJyk7XG4gICAgICAgIHJldHVybiBidXR0b25Mb2dpYy5zdGFydCgpO1xuICAgIH0sXG5cbiAgICBhbm90aGVyQ2hhbmNlOiBmdW5jdGlvbigpIHtcbiAgICAgICQoJy5nYW1lLXN0YXR1cycpXG4gICAgICAgIC5lbXB0eSgpXG4gICAgICAgIC5hcHBlbmQoJzxoMj5XUk9ORyEgVFJZIEFHQUlOPC9oMj4nKTtcbiAgICAgIHBsYXllclN0ZXBzID0gW107XG4gICAgICBwbGF5ZXJTZWNvbmRDaGFuY2UgPSB0cnVlO1xuICAgIH0sXG5cbiAgICBjbGVhckFub3RoZXJDaGFuY2U6IGZ1bmN0aW9uKCkge1xuICAgICAgc2ltb25Mb2dpYy5jbGVhckdhbWVTdGF0dXMoKTtcbiAgICAgIHBsYXllclNlY29uZENoYW5jZSA9IGZhbHNlO1xuICAgIH0sXG5cbiAgICBnYW1lV2luOiBmdW5jdGlvbigpIHtcbiAgICAgICQoJy5nYW1lLXN0YXR1cycpLmFwcGVuZCgnPGgyPllPVSBXSU4hPC9oMj4nKTtcbiAgICAgIHJldHVybiBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICBzaW1vbkxvZ2ljLnJlc2V0R2FtZSgpO1xuICAgICAgICBzaW1vbkxvZ2ljLmNsZWFyR2FtZVN0YXR1cygpO1xuICAgICAgICBzaW1vbkxvZ2ljLnNob3dDb21wdXRlclN0ZXBzKCk7XG4gICAgICB9LCAxMDAwKTtcbiAgICB9LFxuXG4gICAgZ2FtZUxvc2U6IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuICQoJy5nYW1lLXN0YXR1cycpLmVtcHR5KCkuYXBwZW5kKCc8aDI+WU9VIExPU0UhPC9oMj4nKTtcbiAgICB9LFxuXG4gICAgY2xlYXJHYW1lU3RhdHVzOiBmdW5jdGlvbigpIHtcbiAgICAgICQoJy5nYW1lLXN0YXR1cycpLmVtcHR5KCk7XG4gICAgfVxuICB9O1xuICBcbiAgYnV0dG9uTG9naWMgPSB7XG4gICAgc3RhcnQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICQoJyNzdGFydC1idXR0b24nKS5jbGljayggKCkgPT4geyAgIFxuICAgICAgICBzaW1vbkxvZ2ljLnJlc2V0R2FtZSgpO1xuICAgICAgICBzaW1vbkxvZ2ljLmNsZWFyR2FtZVN0YXR1cygpO1xuICAgICAgICBzaW1vbkxvZ2ljLnNob3dDb21wdXRlclN0ZXBzKCk7XG4gICAgICAgICQoJyNzdGFydC1idXR0b24nKS5vZmYoJ2NsaWNrJyk7XG4gICAgICB9KTtcbiAgICB9LFxuICAgIFxuICAgIHJlc2V0OiBmdW5jdGlvbigpIHtcbiAgICAgICQoJyNyZXNldC1idXR0b24nKS5jbGljayggKCkgPT4ge1xuICAgICAgICBjb25zb2xlLmxvZygncmVzZXQgYnV0dG9uIGNsaWNrZWQnKTtcbiAgICAgICAgc2ltb25Mb2dpYy5yZXNldEdhbWUoKTtcbiAgICAgICAgc2ltb25Mb2dpYy5jbGVhckdhbWVTdGF0dXMoKTtcbiAgICAgIH0pO1xuICAgIH0sXG5cbiAgICBzdHJpY3Q6IGZ1bmN0aW9uKCkge1xuICAgICAgJCgnI3N0cmljdC1tb2RlLWJ1dHRvbicpLmNsaWNrKCAoKSA9PiB7XG4gICAgICAgIHN0cmljdE1vZGUgPSAhc3RyaWN0TW9kZTtcbiAgICAgICAgY29uc29sZS5sb2coJ3N0cmljdE1vZGU6ICcsIHN0cmljdE1vZGUpO1xuICAgICAgICBidXR0b25Mb2dpYy5zdHJpY3RMaWdodFRvZ2dsZSgpO1xuICAgICAgfSk7XG4gICAgfSxcblxuICAgIHN0cmljdExpZ2h0VG9nZ2xlOiBmdW5jdGlvbigpIHtcbiAgICAgICQoJyNzdHJpY3QtbW9kZS1saWdodCcpLnRvZ2dsZUNsYXNzKCdvbicpO1xuICAgIH1cblxuICB9O1xuICBcbiAgZnVuY3Rpb24gaW5pdCAoKSB7XG4gICAgYnV0dG9uTG9naWMuc3RhcnQoKTtcbiAgICBidXR0b25Mb2dpYy5yZXNldCgpO1xuICAgIGJ1dHRvbkxvZ2ljLnN0cmljdCgpO1xuICB9XG4gIFxuICByZXR1cm4ge1xuICAgIGluaXQ6IGluaXQsXG4gICAgZ2V0UmFuZG9tSW50OiBnZXRSYW5kb21JbnRcbiAgfTtcbiAgXG59KSgpO1xuXG4kKGRvY3VtZW50KS5yZWFkeShmdW5jdGlvbigpIHtcbiAgc2ltb24uaW5pdCgpO1xufSk7XG4iXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=
