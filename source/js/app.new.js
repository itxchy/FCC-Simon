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
    connectOscillator (oscillator) {
      oscillator.connect(gainNode);
    },
    nw () {
      this.connectOscillator(nw);
    },
    ne () {
      this.connectOscillator(ne);
    },
    sw () {
      this.connectOscillator(sw);
    },
    se () {
      this.connectOscillator(se);
    }
  };

  /**
   * Methods for stopping each oscillator tone
   */
  let stopTone = {
    stop (oscillator) {
      currGain = 0;
      oscillator.disconnect(gainNode);
    },
    nw () {
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
    nw,
    ne,
    sw,
    se,
    startTone,
    stopTone
  };
})();

const simonState = (function () {
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
  }
})();

const simonLogic = (function () {
  return {
    getRandomInt (min, max) {
      return Math.floor(Math.random() * (max - min + 1) + min);      
    },
    clearMoves () {
      computerSteps = [];
      playerSteps = [];
      playerSecondChance = false;
    }
  }
})