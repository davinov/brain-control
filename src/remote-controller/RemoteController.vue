<template>
  <div class="remote-controller" :class="{'flash': flash}">
    <div class="remote-controller__inputs">
      <div class="remote-controller__input-container alpha">
        <input
          type="range"
          v-model.number="alpha"
          min="0"
          max="1"
          step="0.01"
        />
        <pre>alpha: {{ alpha }}</pre>
      </div>
      <div class="remote-controller__input-container beta1">
        <input
          type="range"
          v-model.number="beta1"
          min="0"
          max="1"
          step="0.01"
        />
        <pre>beta1: {{ beta1 }}</pre>
      </div>
      <div class="remote-controller__input-container beta2">
        <input
          type="range"
          v-model.number="beta2"
          min="0"
          max="1"
          step="0.01"
        />
        <pre>beta2: {{ beta2 }}</pre>
      </div>
      <div class="remote-controller__input-container beta3">
        <input
          type="range"
          v-model.number="beta3"
          min="0"
          max="1"
          step="0.01"
        />
        <pre>beta3: {{ beta3 }}</pre>
      </div>
      <div class="remote-controller__input-container gamma">
        <input
          type="range"
          v-model.number="gamma"
          min="0"
          max="1"
          step="0.01"
        />
        <pre>gamma: {{ gamma }}</pre>
      </div>
      <div class="remote-controller__input-container n">
        <input
          type="range"
          v-model.number="n"
          min="50"
          max="100"
          step="1"
        />
        <pre>n: {{ n }}</pre>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Watch } from 'vue-property-decorator';
import io from 'socket.io-client';
import _ from 'lodash';
import { setTimeout } from 'timers';

@Component({
  components: {
    
  },
})
export default class RemoteController extends Vue {
  private socket;
  private interval;

  private alpha: number = 0.5;
  private beta1: number = 0.5;
  private beta2: number = 0.5;
  private beta3: number = 0.5;
  private gamma: number = 0.5;
  private n: number = 75;
  private lastModificationTime: number = Date.now();
  private flash: boolean = false;

  private mounted() {
    this.socket = io({
      transports: ['websocket']
    });

    this.socket.on('connect', () => {
      this.n = 75;
      this.alpha = 0.5;
      this.beta1 = 0.5;
      this.beta2 = 0.5;
      this.beta3 = 0.5;
      this.gamma = 0.5;

      this.sendControlMessage();
    });

    this.socket.on('disconnect', () => {
    });

    this.interval = setInterval( () => {
      this.randomizeIfNotModifiedForSomeTime();
    }, 1000);
  }

  get controlMessage() {
    return {
      n: this.n,
      alpha: this.alpha,
      beta1: this.beta1,
      beta2: this.beta2,
      beta3: this.beta3,
      gamma: this.gamma,
    };
  }

  @Watch('controlMessage')
  private onControlMessageModified() {
    this.lastModificationTime = Date.now();
    this.sendControlMessage()
  }

  private sendControlMessage() {
      if (!this.socket)
        return;

      this.socket.emit('control', this.controlMessage);
    }

  private randomizeIfNotModifiedForSomeTime() {
    if (Date.now() - this.lastModificationTime > 30000) {
      console.log('randomize!');

      this.flash = true;

      setTimeout( () => {
        this.flash = false;

        this.n = 75;
        this.alpha = Math.random();
        this.beta1 = Math.random();
        this.beta2 = Math.random();
        this.beta3 = Math.random();
        this.gamma = Math.random();
      }, 100);
    }
  }

  onDestroy() {
    clearInterval(this.interval);
  }
}
</script>

<style lang="scss">
.remote-controller {
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  background-color: black;
  width: 100%;
  height: 100%;
  overflow: hidden;

  &.flash {
    input[type=range]::-webkit-slider-runnable-track {
      background: white;
    }
    input[type=range]::-webkit-slider-thumb {
      opacity: 0;
    }
  }
}

.remote-controller__inputs {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  justify-content: stretch;
  overflow: hidden;
}

.remote-controller__input-container {
  flex: 1;
  overflow: hidden;
  position: relative;

  pre {
    position: absolute;
    top: 10px;
    left: 50%;
    right: 50%;

    visibility: hidden;
  }

  &:hover pre {
    // visibility: visible;
  }

  input[type=range] {
    -webkit-appearance: none;
    width: 100%;
    height: 100%;
    margin: 0;

  }

  input[type=range]:focus {
    outline: none;
  }


  input[type=range]::-webkit-slider-runnable-track {
    height: 100%;
    cursor: pointer;
    background: black;
    border: none;
    transition: background-color 0.1s;
  }

  input[type=range]::-webkit-slider-thumb {
    height: 100%;
    width: 1px;
    border: none;
    background: black;
    cursor: pointer;
    -webkit-appearance: none;
    transition: opacity 0.1s;
  }

  // input[type=range]:hover {
  //   &::-webkit-slider-runnable-track {
  //     background-color: #222;
  //   }
  // }

  &.alpha {
    input[type=range]::-webkit-slider-thumb {
      background: cyan;
      box-shadow: 0 0 7px 2px cyan;
    }
  }

  &.beta1 {
    input[type=range]::-webkit-slider-thumb {
      background: blue;
      box-shadow: 0 0 7px 2px blue;
    }
  }

  &.beta2 {
    input[type=range]::-webkit-slider-thumb {
      background: purple;
      box-shadow: 0 0 7px 2px purple;
    }
  }

  &.beta3 {
    input[type=range]::-webkit-slider-thumb {
      background: red;
      box-shadow: 0 0 7px 2px red;
    }
  }

  &.gamma {
    input[type=range]::-webkit-slider-thumb {
      background: orange;
      box-shadow: 0 0 7px 2px orange;
    }
  }

  &.n {
    input[type=range]::-webkit-slider-thumb {
      background: gray;
      box-shadow: 0 0 7px 2px gray;
    }
  }
}

</style>
