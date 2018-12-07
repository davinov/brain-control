<template>
  <div class="remote-controller">
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

@Component({
  components: {
    
  },
})
export default class RemoteController extends Vue {
  private socket;

  private alpha: number = 0;
  private beta1: number = 0;
  private beta2: number = 0;
  private beta3: number = 0;
  private gamma: number = 0;
  private n: number = 0;

  private mounted() {
    this.socket = io({
      transports: ['websocket']
    });

    this.socket.on('connect', () => {
      this.n = 100;
      this.gamma = 1;

      this.sendControlMessage();
    });

    this.socket.on('disconnect', () => {
    });
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
  private sendControlMessage() {
    if (!this.socket)
      return;

    this.socket.emit('control', this.controlMessage);
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
    transition: background-color 0.5s;
  }

  input[type=range]::-webkit-slider-thumb {
    height: 100%;
    width: 1px;
    border: none;
    background: white;
    cursor: pointer;
    -webkit-appearance: none;
  }

  // input[type=range]:hover {
  //   &::-webkit-slider-runnable-track {
  //     background-color: #222;
  //   }
  // }

  &.alpha {
    input[type=range]::-webkit-slider-thumb {
      background: cyan;
    }
  }

  &.beta1 {
    input[type=range]::-webkit-slider-thumb {
      background: blue;
    }
  }

  &.beta2 {
    input[type=range]::-webkit-slider-thumb {
      background: purple;
    }
  }

  &.beta3 {
    input[type=range]::-webkit-slider-thumb {
      background: red;
    }
  }

  &.gamma {
    input[type=range]::-webkit-slider-thumb {
      background: orange;
    }
  }

  &.n {
    input[type=range]::-webkit-slider-thumb {
      background: gray;
    }
  }
}

</style>
