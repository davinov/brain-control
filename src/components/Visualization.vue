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
      <path
        class="brain-wire"
        :transform="originTranslation"
        :d="path2"
      ></path>
    </svg>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import { line, lineRadial, arc, curveCardinal, curveNatural, curveMonotoneX } from 'd3-shape';
import { interpolateString, interpolateNumber } from 'd3-interpolate';
import { easeQuadInOut, easeCubicOut, easeCubicIn, easeCubic } from 'd3-ease';

@Component
export default class Vizualisation extends Vue {
  k: number = 1;

  @Prop({ default: 800 })
  height: number;

  @Prop({ default: 800 })
  width: number;

  get originTranslation () {
    return `translate(${this.width / 2}, ${this.height / 2})`;
  }

  // get interpolator() {
  //   return interpolateString(
  //     this.horitzontalToCircle(),
  //     this.horizontalBrainWireFocused(),
  //     // this.flowingArcBrainWire(),
  //     // this.focusedArcBrainWire()
  //   );
  // }

  get path () {
    return line().curve(
      curveNatural
    )(
      this.horitzontalToCircle(this.k)
    ) || '';
    // return this.interpolator(this.k);
  }

  get path2 () {
    return line().curve(
      curveNatural
    )(
      this.horitzontalToCircle(this.k).map(this.symetricHorizontal).reverse()
    ) || '';
  }

  // A straight horizontal line
  horizontalBrainWireFlat () {
    return line()([
      [- this.width / 2, 0],
      [0, 0],
      [this.width / 2, 0]
    ]) || '';
  }

  // A square centered on the origin
  horizontalBrainWireFocused () {
    let radius = (this.height + this.width) / 5; 
    // return lineRadial()
    // .curve(curveCatmullRom.alpha(1))([
    //   [0, radius],
    //   [1/2 * Math.PI, radius],
    //   [Math.PI, radius],
    //   [3/2 * Math.PI, radius],
    //   [2 * Math.PI, radius],
    // ]) || '';
    return line()([
      [- radius / 2, 0],
      [0, - radius / 2],
      [radius / 2, 0]
    ]) || ''
  }

  horitzontalToCircle (k: number) {
    return [
      this.leftPoint(k),
      this.leftMiddlePoint(k),
      this.middlePoint(k),
      this.rightMiddlePoint(k),
      this.rightPoint(k),
    ];
  }

  get radius () {
    return Math.sqrt(
      Math.pow((this.width / 2), 2) + Math.pow((this.height / 2), 2)
    ) / 2;
  }

  leftPoint (k: number): [number, number] {
    return [
      interpolateNumber(- this.width / 2, - this.radius)(easeCubicIn(k))
    ,
      0
    ]
  }

  leftMiddlePoint (k: number): [number, number] {
    return [
      interpolateNumber(- this.width / 4, - this.radius * Math.SQRT2 / 2)(easeCubicIn(k))
    ,
      interpolateNumber(0, - this.radius * Math.SQRT2 / 2)(easeCubic(k))
    ]
  }

  middlePoint (k: number): [number, number] {
    return [
      0
    ,
      interpolateNumber(0, - this.radius)(easeCubicOut(k))
    ]
  }

  rightMiddlePoint (k: number): [number, number] {
    return this.symetricVertical(this.leftMiddlePoint(k));
  }

  rightPoint (k: number): [number, number] {
    return this.symetricVertical(this.leftPoint(k));
  }

  // Symetric against the vertical axis
  symetricVertical (point: [number, number]): [number, number] {
    return [
      -point[0], point[1]
    ]
  }

  // Symetric against the horizontal axis
  symetricHorizontal (point: [number, number]): [number, number] {
    return [
      point[0], -point[1]
    ]
  }


  // A circle centered on the origin
  focusedArcBrainWire () {
    let radius = (this.height + this.width) / 5; 
    return arc()({
      innerRadius: radius,
      outerRadius: radius,
      startAngle: 0,
      endAngle: 2 * Math.PI
    }) || '';
  }

  // A circle centered on the origin
  flowingArcBrainWire () {
    // let radius = (this.height + this.width) / 5; 
    return arc()({
      innerRadius: 0,
      outerRadius: this.width / 2,
      startAngle: Math.PI,
      endAngle: - Math.PI
    }) || '';
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
