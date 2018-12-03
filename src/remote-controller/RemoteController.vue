<template>
  <div id="muse-recorder-app">
    <div>
        <input
          type="range"
          v-model.number="alpha"
          min="0"
          max="1"
          step="0.01"
        />
        <pre>alpha: {{ alpha }}</pre>
      </div>
      <div>
        <input
          type="range"
          v-model.number="beta1"
          min="0"
          max="1"
          step="0.01"
        />
        <pre>beta1: {{ beta1 }}</pre>
      </div>
      <div>
        <input
          type="range"
          v-model.number="beta2"
          min="0"
          max="1"
          step="0.01"
        />
        <pre>beta2: {{ beta2 }}</pre>
      </div>
      <div>
        <input
          type="range"
          v-model.number="beta3"
          min="0"
          max="1"
          step="0.01"
        />
        <pre>beta3: {{ beta3 }}</pre>
      </div>
      <div>
        <input
          type="range"
          v-model.number="gamma"
          min="0"
          max="1"
          step="0.01"
        />
        <pre>gamma: {{ gamma }}</pre>
      </div>
      <div>
        <input
          type="range"
          v-model.number="n"
          min="0"
          max="100"
          step="1"
        />
        <pre>n: {{ n }}</pre>
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
#muse-recorder-app {
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  width: 100%;
  height: 100%;
  overflow: hidden;
}
</style>
