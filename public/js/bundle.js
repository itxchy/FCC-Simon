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
//# sourceMappingURL=data:application/json;base64,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Q0FBWSxjQUFaLEVBQTRCLFVBQTVCO0FBQ0Esb0JBQVksaUJBQVo7QUFDRCxPQUpEO0FBS0QsS0EzQlc7O0FBNkJaLHVCQUFtQiw2QkFBVztBQUM1QixRQUFFLG9CQUFGLEVBQXdCLFdBQXhCLENBQW9DLElBQXBDO0FBQ0Q7O0FBL0JXLEdBQWQ7O0FBbUNBLFdBQVMsSUFBVCxHQUFpQjtBQUNmLGdCQUFZLEtBQVo7O0FBRUEsZ0JBQVksTUFBWjtBQUNEOztBQUVELFNBQU87QUFDTCxVQUFNLElBREQ7QUFFTCxrQkFBYztBQUZULEdBQVA7QUFLRCxDQW5RYSxFQUFkOztBQXFRQSxFQUFFLFFBQUYsRUFBWSxLQUFaLENBQWtCLFlBQVc7QUFDM0IsUUFBTSxJQUFOO0FBQ0QsQ0FGRCIsImZpbGUiOiJidW5kbGUuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvKiFcbiogU2ltb24gaW4gSmF2YVNjcmlwdC5cbiogQW5vdGhlciBGcm9udCBFbmQgY2hhbGxlbmdlIGZvciBGcmVlIENvZGUgQ2FtcC5cbiogaHR0cDovL3d3dy5GcmVlQ29kZUNhbXAuY29tL1xuKi9cblxuY29uc3QgYXVkaW8gPSAoZnVuY3Rpb24gKCkge1xuXG5cdGxldCBhdWRpb0N0eCA9IG5ldyAod2luZG93LkF1ZGlvQ29udGV4dCB8fCB3aW5kb3cud2Via2l0QXVkaW9Db250ZXh0KSgpO1xuXHRsZXQgZ2Fpbk5vZGUgPSBhdWRpb0N0eC5jcmVhdGVHYWluKCk7XG5cdGdhaW5Ob2RlLmNvbm5lY3QoYXVkaW9DdHguZGVzdGluYXRpb24pO1xuXHRnYWluTm9kZS5nYWluLnZhbHVlID0gMC4wMTtcblx0bGV0IGN1cnJHYWluID0gZ2Fpbk5vZGUuZ2Fpbi52YWx1ZTtcblxuXHRsZXQgd2F2ZVR5cGUgPSAnc2luZSc7XG5cbiAgbGV0IG53ID0gYXVkaW9DdHguY3JlYXRlT3NjaWxsYXRvcigpO1xuICBudy50eXBlID0gd2F2ZVR5cGU7XG4gIG53LmZyZXF1ZW5jeS52YWx1ZSA9IDQ0MDtcbiAgbncuc3RhcnQoMCk7XG4gIFxuICBsZXQgbmUgPSBhdWRpb0N0eC5jcmVhdGVPc2NpbGxhdG9yKCk7XG4gIG5lLnR5cGUgPSB3YXZlVHlwZTtcbiAgbmUuZnJlcXVlbmN5LnZhbHVlID0gNTU0LjM3O1xuICBuZS5zdGFydCgwKTtcbiAgXG4gIGxldCBzdyA9IGF1ZGlvQ3R4LmNyZWF0ZU9zY2lsbGF0b3IoKTtcbiAgc3cudHlwZSA9IHdhdmVUeXBlO1xuICBzdy5mcmVxdWVuY3kudmFsdWUgPSA2NTkuMjU7XG4gIHN3LnN0YXJ0KDApO1xuICBcbiAgbGV0IHNlID0gYXVkaW9DdHguY3JlYXRlT3NjaWxsYXRvcigpO1xuICBzZS50eXBlID0gd2F2ZVR5cGU7XG4gIHNlLmZyZXF1ZW5jeS52YWx1ZSA9IDc4My45OTtcbiAgc2Uuc3RhcnQoMCk7XG4gIFxuICBsZXQgc3RhcnRUb25lID0ge1xuICAgIGZhZGVJbjogZnVuY3Rpb24gKCkge1xuICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgY3VyckdhaW4gPSAuMTtcbiAgICAgIH0sIDYwKTtcbiAgICB9LFxuICAgIG53OiAoKSA9PiB7XG4gICAgICBudy5jb25uZWN0KGdhaW5Ob2RlKTtcbiAgICAgIHN0YXJ0VG9uZS5mYWRlSW4oKTtcbiAgICB9LFxuICAgIG5lOiAoKSA9PiB7XG4gICAgICBuZS5jb25uZWN0KGdhaW5Ob2RlKTtcbiAgICAgIHN0YXJ0VG9uZS5mYWRlSW4oKTtcbiAgICB9LFxuICAgIHN3OiAoKSA9PiB7XG4gICAgICBzdy5jb25uZWN0KGdhaW5Ob2RlKTtcblx0XHRcdHN0YXJ0VG9uZS5mYWRlSW4oKTtcbiAgICB9LFxuICAgIHNlOiAoKSA9PiB7XG4gICAgICBzZS5jb25uZWN0KGdhaW5Ob2RlKTtcbiAgICAgIHN0YXJ0VG9uZS5mYWRlSW4oKTtcbiAgICB9XG4gIH07XG5cbiAgbGV0IHN0b3BUb25lID0ge1xuICBcdGZhZGVPdXQ6ICgpID0+IHtcbiAgICAgICAgY3VyckdhaW4gPSAwO1xuICBcdH0sXG4gIFx0bnc6ICgpID0+IHtcbiAgICAgIHN0b3BUb25lLmZhZGVPdXQoKTtcbiAgXHRcdHNldFRpbWVvdXQoKCkgPT4ge1xuICBcdFx0XHRudy5kaXNjb25uZWN0KGdhaW5Ob2RlKTtcbiAgXHRcdH0sIDYwKTtcbiAgXHR9LFxuICBcdG5lOiAoKSA9PiB7XG4gIFx0XHRzdG9wVG9uZS5mYWRlT3V0KCk7XG4gIFx0XHQvL25lLnN0b3AoYXVkaW9DdHguY3VycmVudFRpbWUgKyAuMik7XG4gIFx0XHRzZXRUaW1lb3V0KCgpID0+IHtcbiAgXHRcdFx0bmUuZGlzY29ubmVjdChnYWluTm9kZSk7XG4gIFx0XHR9LCA2MCk7XG4gIFx0fSxcbiAgXHRzdzogKCkgPT4ge1xuICBcdFx0c3RvcFRvbmUuZmFkZU91dCgpO1xuICBcdFx0Ly9zdy5zdG9wKGF1ZGlvQ3R4LmN1cnJlbnRUaW1lICsgLjIpO1xuICBcdFx0c2V0VGltZW91dCgoKSA9PiB7XG4gIFx0XHRcdHN3LmRpc2Nvbm5lY3QoZ2Fpbk5vZGUpO1xuICBcdFx0fSwgNjApOyAgXHRcdFxuICBcdH0sXG4gIFx0c2U6ICgpID0+IHtcbiAgXHRcdHN0b3BUb25lLmZhZGVPdXQoKTtcbiAgXHRcdC8vc2Uuc3RvcChhdWRpb0N0eC5jdXJyZW50VGltZSArIC4yKTtcbiAgXHRcdHNldFRpbWVvdXQoKCkgPT4ge1xuICBcdFx0XHRzZS5kaXNjb25uZWN0KGdhaW5Ob2RlKTtcbiAgXHRcdH0sIDYwKTsgIFx0XHRcbiAgXHR9XG4gIH07XG5cbiAgcmV0dXJuIHtcbiAgXHRudzogbncsXG4gIFx0bmU6IG5lLFxuICBcdHN3OiBzdyxcbiAgXHRzZTogc2UsXG4gIFx0c3RhcnRUb25lOiBzdGFydFRvbmUsXG4gIFx0c3RvcFRvbmU6IHN0b3BUb25lXG4gIH1cblxufSkoKTtcblxuY29uc3Qgc2ltb24gPSAoZnVuY3Rpb24gKCkge1xuXG4gIGNvbnN0IGNvbG9ycyA9IHtcbiAgICBudzogJyMwODAnLFxuICAgIG5lOiAnI0YwMCcsXG4gICAgc3c6ICcjRkYwJyxcbiAgICBzZTogJyMwMEYnXG4gIH07XG4gIGNvbnN0IGNvbG9yc0FjdGl2ZSA9IHtcbiAgICBudzogJyM4QjgnLFxuICAgIG5lOiAnI0ZBQScsXG4gICAgc3c6ICcjRkY5JyxcbiAgICBzZTogJyM5OUYnXG4gIH07XG4gIGNvbnN0IGF2YWlsYWJsZVN0ZXBzID0gWydudycsICduZScsICdzdycsICdzZSddO1xuXG4gIGxldCBjb21wdXRlclN0ZXBzID0gW107XG4gIGxldCBwbGF5ZXJTdGVwcyA9IFtdO1xuICBsZXQgc3RyaWN0TW9kZSA9IGZhbHNlO1xuICBsZXQgcGxheWVyU2Vjb25kQ2hhbmNlID0gZmFsc2U7XG5cbiAgbGV0IGJ1dHRvbkxvZ2ljO1xuXG4gIGZ1bmN0aW9uIGdldFJhbmRvbUludChtaW4sIG1heCkge1xuICAgIHJldHVybiBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiAobWF4IC0gbWluICsgMSkgKyBtaW4pO1xuICB9XG5cbiAgY29uc3Qgc2ltb25Mb2dpYyA9IHtcblxuXHRcdHVwZGF0ZURpc3BsYXk6IGZ1bmN0aW9uICh2YWx1ZSkge1xuXHRcdFx0JCgnI2Rpc3BsYXknKVxuICAgICAgICAuZW1wdHkoKVxuICAgICAgICAuYXBwZW5kKHZhbHVlKTtcbiAgICAgIH0sXG5cbiAgICBzaG93Q29tcHV0ZXJTdGVwczogZnVuY3Rpb24gKCkge1xuICAgICAgY29uc29sZS5sb2coJ2NvbXB1dGVyIHR1cm4uLi4nKTtcblxuICAgICAgaWYgKGNvbXB1dGVyU3RlcHMubGVuZ3RoID09PSAyMCkge1xuICAgICAgICByZXR1cm4gc2ltb25Mb2dpYy5nYW1lV2luKCk7XG4gICAgICB9XG5cbiAgICAgIGlmICghcGxheWVyU2Vjb25kQ2hhbmNlKSB7XG4gICAgICAgIC8vIGFkZCByYW5kb20gc3RlcCB0byBjb21wdGVyU3RlcHMgYXJyYXlcbiAgICAgICAgdmFyIHJhbmRvbUJ1dHRvbkluZGV4ID0gZ2V0UmFuZG9tSW50KDAsIDMpO1xuICAgICAgICBjb21wdXRlclN0ZXBzLnB1c2goYXZhaWxhYmxlU3RlcHNbcmFuZG9tQnV0dG9uSW5kZXhdKTtcbiAgICAgICAgY29uc29sZS5sb2coJ25ldyBjb21wdXRlciBzdGVwITogJywgY29tcHV0ZXJTdGVwcyk7XG4gICAgICB9XG5cbiAgICAgIC8vIGRpc3BsYXkgY3VycmVudCBudW1iZXIgb2Ygc3RlcHMgaW4gc3RlcC1jb3VudC1kaXNwbGF5XG4gICAgICBzaW1vbkxvZ2ljLnVwZGF0ZURpc3BsYXkoY29tcHV0ZXJTdGVwcy5sZW5ndGgpO1xuXG4gICAgICAvLyBwbGF5IHRocm91Z2ggY29tcHV0ZXJTdGVwcyB3aXRoIGJyaWdodGVuZWQgYnV0dG9uIGFuZCBzb3VuZFxuICAgICAgZnVuY3Rpb24gcGxheUNvbXB1dGVyU3RlcHMgKGluZGV4KSB7XG5cblx0XHRcdFx0aWYgKCFjb21wdXRlclN0ZXBzW2luZGV4XSkge1xuXHRcdFx0XHRcdGNvbnNvbGUubG9nKCdjb21wdXRlciBkb25lIHBsYXlpbmchJyk7XG5cdFx0XHRcdFx0c2ltb25Mb2dpYy5wbGF5ZXJUdXJuKCk7XG5cdFx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0dmFyIGN1cnJlbnRTdGVwID0gY29tcHV0ZXJTdGVwc1tpbmRleF07XG4gICAgICAgIHZhciBzdGVwSWQgPSBgIyR7Y29tcHV0ZXJTdGVwc1tpbmRleF19YDtcbiAgICAgICAgdmFyIGFjdGl2ZUNvbG9yID0gY29sb3JzQWN0aXZlW2NvbXB1dGVyU3RlcHNbaW5kZXhdXTtcbiAgICAgICAgdmFyIGRlZmF1bHRDb2xvciA9IGNvbG9yc1tjb21wdXRlclN0ZXBzW2luZGV4XV07XG5cbiAgICAgICAgZnVuY3Rpb24gc2V0Q29sb3Ioc3RlcElkLCBhY3RpdmVDb2xvciwgcmVzb2x2ZSkge1xuICAgICAgICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICAgICAgJChzdGVwSWQpLmNzcygnYmFja2dyb3VuZCcsIGFjdGl2ZUNvbG9yKTtcbiAgICAgICAgICAgIHJlc29sdmUoKTtcbiAgICAgICAgICB9LCA1MDApO1xuICAgICAgICB9XG5cbiAgICAgICAgbGV0IHByb21pc2UgPSBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgICAgc2V0Q29sb3Ioc3RlcElkLCBhY3RpdmVDb2xvciwgcmVzb2x2ZSk7IFxuICAgICAgICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICAgICAgYXVkaW8uc3RhcnRUb25lW2N1cnJlbnRTdGVwXSgpO1xuICAgICAgICAgIH0sIDUwMCk7XG4gICAgICAgIH0pXG4gICAgICAgIC50aGVuKCgpID0+IHtcbiAgICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoZnVuY3Rpb24ocmVzb2x2ZSwgcmVqZWN0KSB7XG4gICAgICAgICAgICBzZXRDb2xvcihzdGVwSWQsIGRlZmF1bHRDb2xvciwgcmVzb2x2ZSk7XG4gICAgICAgICAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgICAgIFx0YXVkaW8uc3RvcFRvbmVbY3VycmVudFN0ZXBdKCk7XG4gICAgICAgICAgICB9LCA1MDApO1xuICAgICAgICAgIH0pO1xuICAgICAgICB9KVxuICAgICAgICAudGhlbigoKSA9PiB7XG4gICAgICAgICAgcGxheUNvbXB1dGVyU3RlcHMoaW5kZXggKyAxKTtcbiAgICAgICAgfSk7XG4gICAgICB9XG5cbiAgICAgIHBsYXlDb21wdXRlclN0ZXBzKDApO1xuXG4gICAgfSxcblxuICAgIHBsYXllclR1cm46IGZ1bmN0aW9uICgpIHtcbiAgICBcdGNvbnNvbGUubG9nKCdwbGF5ZXJzIHR1cm4uLi4nKTtcbiAgICAgIGNvbnNvbGUubG9nKCdwbGF5ZXJTdGVwcyBhdCB0dXJuIHN0YXJ0JywgcGxheWVyU3RlcHMpO1xuXG4gICAgIC8vIG1ha2Ugc2ltb24tYnV0dG9ucyBjbGlja2FibGVcbiAgICAgJCgnLnNpbW9uLWJ1dHRvbnMnKVxuICAgICBcdC5hZGRDbGFzcygnY2xpY2thYmxlJylcbiAgICAgXHQubW91c2Vkb3duKGZ1bmN0aW9uKGV2dCkge1xuICAgICBcdFx0JCgnIycgKyBldnQudGFyZ2V0LmlkKS5jc3MoJ2JhY2tncm91bmQnLCBjb2xvcnNBY3RpdmVbZXZ0LnRhcmdldC5pZF0pO1xuICAgICBcdFx0YXVkaW8uc3RhcnRUb25lW2V2dC50YXJnZXQuaWRdKCk7XG4gICAgIFx0fSlcbiAgICAgXHQubW91c2V1cChmdW5jdGlvbihldnQpIHtcbiAgICAgXHRcdCQoJyMnICsgZXZ0LnRhcmdldC5pZCkuY3NzKCdiYWNrZ3JvdW5kJywgY29sb3JzW2V2dC50YXJnZXQuaWRdKTtcbiAgICAgXHRcdGF1ZGlvLnN0b3BUb25lW2V2dC50YXJnZXQuaWRdKCk7XG4gICAgIFx0fSlcbiAgICAgXHQub24oJ2NsaWNrJywgZnVuY3Rpb24oZXZ0KSB7XG4gICAgICBcdGV2dC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgXHRldnQuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICBcdHZhciBjdXJyZW50UGxheWVyU3RlcEluZGV4O1xuXG4gICAgICBcdHBsYXllclN0ZXBzLnB1c2goZXZ0LnRhcmdldC5pZCk7XG4gICAgICBcdGN1cnJlbnRQbGF5ZXJTdGVwSW5kZXggPSBwbGF5ZXJTdGVwcy5sZW5ndGggLSAxO1xuICAgICAgXHRjb25zb2xlLmxvZygncGxheWVyIHByZXNzZWQ6ICcgKyBldnQudGFyZ2V0LmlkKTtcbiAgICAgIFx0Y29uc29sZS5sb2coJ3BsYXllclN0ZXBzIGFycmF5OiAnLCBwbGF5ZXJTdGVwcyk7XG5cbiAgICAgIFx0aWYgKGNvbXB1dGVyU3RlcHNbY3VycmVudFBsYXllclN0ZXBJbmRleF0gPT09IHBsYXllclN0ZXBzW2N1cnJlbnRQbGF5ZXJTdGVwSW5kZXhdKSB7XG5cbiAgICAgIFx0XHRpZiAoY29tcHV0ZXJTdGVwcy5sZW5ndGggPT09IHBsYXllclN0ZXBzLmxlbmd0aCkge1xuICAgICAgXHRcdFx0JCgnLnNpbW9uLWJ1dHRvbnMnKVxuICAgICAgXHRcdFx0XHQub2ZmKClcbiAgICAgIFx0XHRcdFx0LnJlbW92ZUNsYXNzKCdjbGlja2FibGUnKTtcbiAgICAgIFx0XHRcdHBsYXllclN0ZXBzID0gW107XG5cbiAgICAgICAgICAgIGlmIChwbGF5ZXJTZWNvbmRDaGFuY2UpIHtcbiAgICAgICAgICAgICAgc2ltb25Mb2dpYy5jbGVhckFub3RoZXJDaGFuY2UoKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIHNpbW9uTG9naWMuc2hvd0NvbXB1dGVyU3RlcHMoKTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICAkKCcuc2ltb24tYnV0dG9ucycpXG4gICAgICAgICAgICAgIC5vZmYoKVxuICAgICAgICAgICAgICAucmVtb3ZlQ2xhc3MoJ2NsaWNrYWJsZScpO1xuXG4gICAgICAgICAgcmV0dXJuIHNpbW9uTG9naWMucGxheWVyVHVybigpO1xuICAgICAgICB9IFxuICAgICAgICBjb25zb2xlLmxvZygnd3JvbmcgbW92ZSwgaXMgc3RyaWN0TW9kZSB0cnVlIG9yIGZhbHNlPzogJywgc3RyaWN0TW9kZSk7XG4gICAgICAgIC8vIGlmIHN0cmljdE1vZGUgaXMgZmFsc2UsIHBsYXllciBnZXRzIGFub3RoZXIgY2hhbmNlXG4gICAgICAgIGlmICghc3RyaWN0TW9kZSkge1xuICAgICAgICAgIHNpbW9uTG9naWMuYW5vdGhlckNoYW5jZSgpO1xuICAgICAgICAgICQoJy5zaW1vbi1idXR0b25zJylcbiAgICAgICAgICAgIC5vZmYoKVxuICAgICAgICAgICAgLnJlbW92ZUNsYXNzKCdjbGlja2FibGUnKTtcbiAgICAgICAgICBwbGF5ZXJTdGVwcyA9IFtdO1xuICAgICAgICAgIHJldHVybiBzaW1vbkxvZ2ljLnNob3dDb21wdXRlclN0ZXBzKCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIGVsc2UsIHN0cmljdE1vZGUgaXMgdHJ1ZSwgd2hpY2ggbWVhbnMgZ2FtZSBvdmVyICAgIFxuICAgICAgXHRcdGNvbnNvbGUubG9nKCdHYW1lIE92ZXIhJyk7XG4gICAgICBcdFx0Y29uc29sZS5sb2coJ2NvbXB1dGVyU3RlcHNbY3VycmVudFBsYXllclN0ZXBJbmRleF06ICcsIGNvbXB1dGVyU3RlcHNbY3VycmVudFBsYXllclN0ZXBJbmRleF0pO1xuICAgICAgXHRcdGNvbnNvbGUubG9nKCdwbGF5ZXJTdGVwc1tjdXJyZW50UGxheWVyU3RlcEluZGV4XTogJywgcGxheWVyU3RlcHNbY3VycmVudFBsYXllclN0ZXBJbmRleF0pO1xuICAgICAgICAgIHNpbW9uTG9naWMuZ2FtZUxvc2UoKTtcbiAgICAgICAgICAkKCcuc2ltb24tYnV0dG9ucycpXG4gICAgICAgICAgICAub2ZmKClcbiAgICAgICAgICAgIC5yZW1vdmVDbGFzcygnY2xpY2thYmxlJyk7XG4gICAgICAgICAgcmV0dXJuIHNpbW9uTG9naWMucmVzZXRHYW1lKCk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH0sXG5cblxuICAgIGNsZWFyTW92ZXM6IGZ1bmN0aW9uKCkge1xuICAgICAgY29tcHV0ZXJTdGVwcyA9IFtdO1xuICAgICAgcGxheWVyU3RlcHMgPSBbXTtcbiAgICAgIHBsYXllclNlY29uZENoYW5jZSA9IGZhbHNlO1xuICAgIH0sXG5cbiAgICByZXNldEdhbWU6IGZ1bmN0aW9uKCkge1xuICAgICAgc2ltb25Mb2dpYy5jbGVhck1vdmVzKCk7XG4gICAgICBzaW1vbkxvZ2ljLnVwZGF0ZURpc3BsYXkoJy0tJyk7XG4gICAgICAkKCcuc2ltb24tYnV0dG9ucycpXG4gICAgICAgIC5vZmYoKVxuICAgICAgICAucmVtb3ZlQ2xhc3MoJ2NsaWNrYWJsZScpO1xuICAgICAgJCgnI3Jlc2V0LWJ1dHRvbicpLm9mZignY2xpY2snKTtcbiAgICB9LFxuXG4gICAgYW5vdGhlckNoYW5jZTogZnVuY3Rpb24oKSB7XG4gICAgICAkKCcuZ2FtZS1zdGF0dXMnKVxuICAgICAgICAuZW1wdHkoKVxuICAgICAgICAuYXBwZW5kKCc8aDI+V1JPTkchIFRSWSBBR0FJTjwvaDI+Jyk7XG4gICAgICBwbGF5ZXJTdGVwcyA9IFtdO1xuICAgICAgcGxheWVyU2Vjb25kQ2hhbmNlID0gdHJ1ZTtcbiAgICB9LFxuXG4gICAgY2xlYXJBbm90aGVyQ2hhbmNlOiBmdW5jdGlvbigpIHtcbiAgICAgIHNpbW9uTG9naWMuY2xlYXJHYW1lU3RhdHVzKCk7XG4gICAgICBwbGF5ZXJTZWNvbmRDaGFuY2UgPSBmYWxzZTtcbiAgICB9LFxuXG4gICAgZ2FtZVdpbjogZnVuY3Rpb24oKSB7XG4gICAgICAkKCcuZ2FtZS1zdGF0dXMnKS5hcHBlbmQoJzxoMj5ZT1UgV0lOITwvaDI+Jyk7XG4gICAgICByZXR1cm4gc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgc2ltb25Mb2dpYy5yZXNldEdhbWUoKTtcbiAgICAgICAgc2ltb25Mb2dpYy5jbGVhckdhbWVTdGF0dXMoKTtcbiAgICAgICAgc2ltb25Mb2dpYy5zaG93Q29tcHV0ZXJTdGVwcygpO1xuICAgICAgfSwgMTAwMCk7XG4gICAgfSxcblxuICAgIGdhbWVMb3NlOiBmdW5jdGlvbigpIHtcbiAgICAgICQoJy5nYW1lLXN0YXR1cycpLmVtcHR5KCkuYXBwZW5kKCc8aDI+WU9VIExPU0UhPC9oMj4nKTtcbiAgICAgIHJldHVybiBidXR0b25Mb2dpYy5zdGFydCgpO1xuICAgIH0sXG5cbiAgICBjbGVhckdhbWVTdGF0dXM6IGZ1bmN0aW9uKCkge1xuICAgICAgJCgnLmdhbWUtc3RhdHVzJykuZW1wdHkoKTtcbiAgICB9XG4gIH07XG4gIFxuICBidXR0b25Mb2dpYyA9IHtcbiAgICBzdGFydDogZnVuY3Rpb24gKCkge1xuICAgICAgJCgnI3N0YXJ0LWJ1dHRvbicpLmNsaWNrKCAoKSA9PiB7ICAgXG4gICAgICAgIHNpbW9uTG9naWMuY2xlYXJNb3ZlcygpO1xuICAgICAgICBzaW1vbkxvZ2ljLmNsZWFyR2FtZVN0YXR1cygpO1xuICAgICAgICBzaW1vbkxvZ2ljLnNob3dDb21wdXRlclN0ZXBzKCk7XG4gICAgICAgICQoJyNzdGFydC1idXR0b24nKS5vZmYoJ2NsaWNrJyk7XG4gICAgICAgIHJldHVybiBidXR0b25Mb2dpYy5yZXNldCgpO1xuICAgICAgfSk7XG4gICAgfSxcbiAgICBcbiAgICByZXNldDogZnVuY3Rpb24oKSB7XG4gICAgICAkKCcjcmVzZXQtYnV0dG9uJykuY2xpY2soICgpID0+IHtcbiAgICAgICAgY29uc29sZS5sb2coJ3Jlc2V0IGJ1dHRvbiBjbGlja2VkJyk7XG4gICAgICAgIHNpbW9uTG9naWMucmVzZXRHYW1lKCk7XG4gICAgICAgIHNpbW9uTG9naWMuY2xlYXJHYW1lU3RhdHVzKCk7XG4gICAgICAgICQoJyNyZXNldC1idXR0b24nKS5vZmYoJ2NsaWNrJyk7XG4gICAgICAgIHJldHVybiBidXR0b25Mb2dpYy5zdGFydCgpO1xuICAgICAgfSk7XG4gICAgfSxcblxuICAgIHN0cmljdDogZnVuY3Rpb24oKSB7XG4gICAgICAkKCcjc3RyaWN0LW1vZGUtYnV0dG9uJykuY2xpY2soICgpID0+IHtcbiAgICAgICAgc3RyaWN0TW9kZSA9ICFzdHJpY3RNb2RlO1xuICAgICAgICBjb25zb2xlLmxvZygnc3RyaWN0TW9kZTogJywgc3RyaWN0TW9kZSk7XG4gICAgICAgIGJ1dHRvbkxvZ2ljLnN0cmljdExpZ2h0VG9nZ2xlKCk7XG4gICAgICB9KTtcbiAgICB9LFxuXG4gICAgc3RyaWN0TGlnaHRUb2dnbGU6IGZ1bmN0aW9uKCkge1xuICAgICAgJCgnI3N0cmljdC1tb2RlLWxpZ2h0JykudG9nZ2xlQ2xhc3MoJ29uJyk7XG4gICAgfVxuXG4gIH07XG4gIFxuICBmdW5jdGlvbiBpbml0ICgpIHtcbiAgICBidXR0b25Mb2dpYy5zdGFydCgpO1xuICAgIC8vYnV0dG9uTG9naWMucmVzZXQoKTtcbiAgICBidXR0b25Mb2dpYy5zdHJpY3QoKTtcbiAgfVxuICBcbiAgcmV0dXJuIHtcbiAgICBpbml0OiBpbml0LFxuICAgIGdldFJhbmRvbUludDogZ2V0UmFuZG9tSW50XG4gIH07XG4gIFxufSkoKTtcblxuJChkb2N1bWVudCkucmVhZHkoZnVuY3Rpb24oKSB7XG4gIHNpbW9uLmluaXQoKTtcbn0pO1xuIl0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9
