<template>
  <div>
    <input
      type="range"
      v-model="k"
      min="0"
      max="1"
      step="0.01"
    />
    <pre>{{ k }}</pre>
    <svg
      class="brain-visualization"
      :height="height"
      :width="width"
    >
      <path
        class="brain-wire"
        :transform="originTranslation"
        :d="path"
      ></path>
    </svg>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import { line, lineRadial } from 'd3-shape';
import { interpolateString } from 'd3-interpolate';

@Component
export default class Vizualisation extends Vue {
  k: number = 0;

  @Prop({ default: 800 })
  height: number;

  @Prop({ default: 800 })
  width: number;

  get originTranslation () {
    return `translate(${this.width / 2}, ${this.height / 2})`;
  }

  get interpolator() {
    return interpolateString(
      this.flowingBrainWire(),
      this.focusedBrainWire()
    );
  }

  get path () {
    return this.interpolator(this.k);
  }

  // A straight horizontal line
  flowingBrainWire () {
    return line()([
      [0, 0],
      [this.width / 2, 0],
      [0, 0],
      [- this.width / 2, 0],
      [0, 0],
    ]) || '';
  }

  // A square centered on the origin
  focusedBrainWire () {
    let radius = (this.height + this.width) / 5; 
    return lineRadial()([
      [0, radius],
      [1/2 * Math.PI, radius],
      [Math.PI, radius],
      [3/2 * Math.PI, radius],
      [2 * Math.PI, radius],
    ]) || '';
  }
}
</script>

<style scoped lang="scss">
.brain-visualization {
  background-color: black;
}

.brain-wire {
  stroke: white;
  stroke-width: 3px;
}
</style>
