<template>
  <svg
    class="brain-visualization"
    :height="height"
    :width="width"
  >
    <defs>
      <filter id="goo">
        <feGaussianBlur in="SourceGraphic" stdDeviation="10" result="blur" />
        <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 20 -18" result="goo" />
        <feComposite in="SourceGraphic" in2="goo" operator="atop"/>
      </filter>
    </defs>
    <g
      class="brain-wires"
    >
      <path
        filter="url(#goo)"
        v-for="(wire, i) in brainWires(tk1, tk2)"
        :key="i"
        class="brain-wire"
        :transform="originTranslation"
        :d="wire"
        :fill="colors[i]"
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

  colors = ['#00f', '#0f0', '#f00'];
  // colors = ['cyan', 'magenta', 'yellow'];

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
    return `translate(${this.width / 2}, ${this.height})`;
  }

  brainWires (k1: number, k2: number) {
    return [-1/2, 0, 1/2].map(y => this.brainWire(k1, k2, y))
  }

  brainWire (k1: number, k2: number, y: number) {
    let curve = line().curve(
      curveCardinal.tension(y)
    );

    return curve(this.wirePoints(k1, k2, y));
  }

  wirePoints (k1: number, k2: number, y: number) {
    let k = k1 + easeCircle(y) * (k2 - k1);

    let masterPoints = [
      this.leftPoint(k, y),
      this.leftMiddlePoint(k, y),
      this.middlePoint(k, y),
      this.rightMiddlePoint(k, y),
      this.rightPoint(k, y),
    ]

    let wireWidth = 100;

    let points = masterPoints.map(
      (p): [number, number] => [p[0], p[1] + wireWidth / 2]
    ).concat(
      masterPoints.reverse().map(
        (p): [number, number] => [p[0], - p[1] - wireWidth / 2]
      )
    );

    points.push(points[0]);

    return points.map(this.verticalTranslation(- this.width / 2 - (1 - Math.max(k1, k2)) * 2 * y * this.radius));
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
  mix-blend-mode: screen;
}
</style>
