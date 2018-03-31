<template>
  <svg
    class="brain-visualization"
    :height="height"
    :width="width"
  >
    <g
      class="brain-wires"
      v-for="(wire, i) in brainWires(tk1, tk2)"
      :key="i"
    >
      <path
        v-for="(path, i) in wire"
        :key="i"
        class="brain-wire"
        :transform="originTranslation"
        :d="path"
      ></path>
    </g>
  </svg>
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from 'vue-property-decorator';
import { line, lineRadial, arc, curveCardinal, curveNatural, curveMonotoneX, curveBasis } from 'd3-shape';
import { interpolateString, interpolateNumber, interpolate } from 'd3-interpolate';
import { easeCubicOut, easeCubicIn, easeCubic, easeCircle } from 'd3-ease';

@Component
export default class Vizualisation extends Vue {
  @Prop({ default: 1 })
  k1: number;

  @Prop({ default: 1 })
  k2: number;

  tk1: number = this.k1;
  tk2: number = this.k2;

  @Watch('k1')
  animateK1 (targetVal: number) {
    let duration = 1000;
    let start = Date.now();
    let interpolator = interpolateNumber(this.tk1 as number, targetVal);
    let animate = () => {
      let t = (Date.now() - start) / duration;
      if (t >= 1) {
        this.tk1 = targetVal;
      } else {
        requestAnimationFrame(animate);
        this.tk1 = interpolator(t);
      }
    }
    animate();
  }

  @Watch('k2')
  animateK2 (targetVal: number) {
    let duration = 1000;
    let start = Date.now();
    let interpolator = interpolateNumber(this.tk2 as number, targetVal);
    let animate = () => {
      let t = (Date.now() - start) / duration;
      if (t >= 1) {
        this.tk2 = targetVal;
      } else {
        requestAnimationFrame(animate);
        this.tk2 = interpolator(t);
      }
    }
    animate();
  }

  @Prop({ default: 800 })
  height: number;

  @Prop({ default: 800 })
  width: number;

  get originTranslation () {
    return `translate(${this.width / 2}, ${this.height / 2})`;
  }

  brainWires (k1: number, k2: number) {
    return [0, 1/4, 1/2, 3/4, 1].map(y => this.brainWire(
      k1 + easeCircle(y) * (k2 - k1)
    , y))
  }

  // A brain wire is made of two vertically symetric pathes
  brainWire (k: number, y: number) {
    let curve = line().curve(
      curveCardinal.tension(y)
    );

    return [
      curve(this.wirePoints(k, y))
    ,
      curve(
        this.wirePoints(k, y).map(this.horizontalSymetry).reverse()
      )
    ]
  }

  wirePoints (k: number, y: number) {
    return [
      this.leftPoint(k, y),
      this.leftMiddlePoint(k, y),
      this.middlePoint(k, y),
      this.rightMiddlePoint(k, y),
      this.rightPoint(k, y),
    ].map(this.verticalTranslation(- y * this.radius));
  }

  get radius () {
    return Math.sqrt(
      Math.pow((this.width / 2), 2) + Math.pow((this.height / 2), 2)
    ) / 2;
  }

  leftPoint (k: number, y: number): [number, number] {
    return [
      interpolateNumber(- this.width / 2, - this.radius)(easeCubicIn(k))
    ,
      interpolateNumber(0, this.radius)( y * k )
    ]
  }

  leftMiddlePoint (k: number, y: number): [number, number] {
    let circleOrSquareRatio = interpolateNumber(Math.SQRT2 / 2, 1);

    return [
      interpolateNumber(- this.width / 4, - this.radius * circleOrSquareRatio(y))(easeCubicIn(k))
    ,
      interpolateNumber(0, - this.radius * circleOrSquareRatio(y))(easeCubic(k)) + interpolateNumber(0, this.radius)( y * k )
    ]
  }

  middlePoint (k: number, y: number): [number, number] {
    return [
      0
    ,
      interpolateNumber(0, - this.radius)(easeCubicOut(k)) + interpolateNumber(0, this.radius)( y * k )
    ]
  }

  rightMiddlePoint (k: number, y: number): [number, number] {
    return this.verticalSymetry(this.leftMiddlePoint(k, y));
  }

  rightPoint (k: number, y: number): [number, number] {
    return this.verticalSymetry(this.leftPoint(k, y));
  }

  verticalSymetry (point: [number, number]): [number, number] {
    return [
      -point[0], point[1]
    ]
  }

  horizontalSymetry (point: [number, number]): [number, number] {
    return [
      point[0], -point[1]
    ]
  }

  verticalTranslation (dy: number) {
    return function(point: [number, number]): [number, number] {
      return [
        point[0], dy + point[1]
      ]
    }
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
  fill: none;
}
</style>
