<script lang="ts">
import _ from 'lodash';
import { CreateElement, VNode } from 'vue';
import { Component, Prop, Vue, Watch } from 'vue-property-decorator';
import initScene from '../lib/field-play/scene';
import ColorModes from '../lib/field-play/programs/colorModes';

import { easeExpInOut } from 'd3-ease';

function scale(x: number): number {
  return easeExpInOut(x);
}

@Component
export default class FieldVizualisation extends Vue {
  private scene: any;

  @Prop({ required: true })
  public alpha: number;

  @Prop({ required: true })
  public beta1: number;

  @Prop({ required: true })
  public beta2: number;

  @Prop({ required: true })
  public beta3: number;

  @Prop({ required: true })
  public gamma: number;

  get k1(): number {
    return scale(this.alpha);
  };

  get k2(): number {
    return scale(this.gamma);
  };

  get k3(): number {
    return scale(this.beta1);
  };
  get k4(): number {
    return scale(this.beta2);
  };
  get k5(): number {
    return scale(this.beta3);
  };

  @Prop({ required: true })
  public n: number;

  @Prop({ default: false })
  public paused: boolean;

  get actuallyPaused (): boolean {
    return this.paused && this.n > 0;
  }

  private timeStep: number = 0.01;
  private dropProbability: number = 0.009;
  private fadeout: number = .998;

  get particleCount (): number {
    return Math.max(
      this.n * (window.innerHeight * window.innerWidth) / 5000 * Math.pow(window.devicePixelRatio, 2)
    , 1);
  }

  mounted () {
    let canvas: HTMLCanvasElement = this.$el as HTMLCanvasElement;
    let ctxOptions = { antialias: true, alpha: false };
    let gl = canvas.getContext('webgl', ctxOptions) ||
    canvas.getContext('experimental-webgl', ctxOptions);

    this.scene = initScene(gl);
    this.scene.setParticlesCount(this.particleCount);
    this.scene.setBackgroundColor({
      r: 0.05, g: 0, b: 0.1, a: 1
    });
    this.scene.setDropProbability(0.001)
    this.updateVectorField();
    this.updateColorFunction();
    this.scene.setColorMode(ColorModes.VELOCITY);

    if (!this.actuallyPaused)
      this.scene.start();
  }

  beforeDestroy () {
    this.scene.dispose();
    this.$el.remove();
  }

  formatNumberforGLSL (n: number): string {
    if (_.isNaN(n))
      return '0.'
    return n.toFixed(4);
  }

  get GLSLcode () {
    let codeLines: string[] = [];

    codeLines.push(`v.x = 0.;`);
    codeLines.push(`v.y = 0.;`);
    codeLines.push(`float tau = acos(0.);`);
    codeLines.push(`float pi = tau / 2.;`);
    codeLines.push(`float l = length(p);`)

    codeLines.push(`if (u_k1 > .0) {`)
      let circle = {
        x: `p.y`,
        y: `-p.x`
      }
      codeLines.push(`v.x += pow(u_k1, 2.) * (${circle.x}) / pow(max(1., abs(3. * l) - 2. * tau), 3.);`);
      codeLines.push(`v.y += pow(u_k1, 2.) * (${circle.y}) / pow(max(1., abs(3. * l) - 2. * tau), 3.);`);
    codeLines.push(`}`);

    // SQUARES: Hi beta (3)
    codeLines.push(`if (u_k5 > .0) {`)
      let squares = {
        x: `sign(sin(p.y * 4.)) / 2. + (1. - u_k5) * sin(p.y * 4.)`,
        y: `sign(-1. * sin(p.x * 4.)) / 2. - (1. - u_k5) * sin(p.x * 4.)`
      };
      codeLines.push(`float sd = (abs(p.x) + abs(p.y)) * 2. / 3.;`);
      codeLines.push(`if ( (sd < tau) && (sd > pi / 2.) ) {`);
        codeLines.push(`v.x += pow(u_k5, 3.) * (${squares.x});`);
        codeLines.push(`v.y += pow(u_k5, 3.) * (${squares.y});`);
      codeLines.push(`}`);
    codeLines.push(`}`);

    // WHRIL: gamma
    codeLines.push(`if (u_k2 > .0) {`)
      let whirl = {
        x: `(p.y + p.x) / pow(l, 2.) * atan(l) / tau / max(pow(l, 2.), 1.)`,
        y: `(- p.x + p.y) / pow(l, 2.) * atan(l) / tau / max(pow(l, 2.), 1.)`
      };
      codeLines.push(`v.x -= pow(u_k2, 2.) * (${whirl.x});`);
      codeLines.push(`v.y -= pow(u_k2, 2.) * (${whirl.y});`);
    codeLines.push(`}`);

    // explode idle: Low-beta (1)
    codeLines.push(`if (u_k3 > .0) {`)
      codeLines.push(`v.x += u_k3 * p.x / pow(l, 2.);`);
      codeLines.push(`v.y += u_k3 * p.y / pow(l, 2.);`);
    codeLines.push(`}`);

    codeLines.push(`if (u_k4 > .0) {`)
      codeLines.push(`float x = sin((p.x + p.y) * 3.);`)
      codeLines.push(`float y = sin((p.x - p.y) * 3.);`)
      codeLines.push(`float cd = max(max(abs(p.x), abs(p.y)) - 0.5, 0.);`)
      // CLOVERFLIED processing units (cpu-like): Mid Beta (2)
      let cloverfield = {
        x: `4. * ((-1. / x / 50.) + (-1. / (y + x) / 100.) ) / max(1., pow(cd, 6.))`,
        y: `4. * ((-1. / y / 50.) + (1.  / (x - y) / 100.) ) / max(1., pow(cd, 6.))`
      };
      codeLines.push(`v.x += pow(u_k4, 4.) * (${cloverfield.x});`);
      codeLines.push(`v.y += pow(u_k4, 4.) * (${cloverfield.y});`);
    codeLines.push(`}`);

    codeLines.push(`v.x /= 2.;`);
    codeLines.push(`v.y /= 2.;`);

    return `
    vec2 get_velocity(vec2 p) {
      vec2 v = vec2(0., 0.);

      ${codeLines.join('\n')}

      return v;
    }`
  }

  updateVectorField () {
    if (!this.scene)
      return;

    this.scene.vectorFieldEditorState.setCode(this.GLSLcode);
  }

  updateVariable (varName, value) {
    if (!this.scene)
      return;

    this.scene.vectorFieldEditorState.updateVariable(varName, value);
  }

  updateColorVariable (value) {
    if (!this.scene)
      return;

    this.scene.updateColorVariable(value);
  }

  get kColor () {
    let ka = Math.pow((this.k2 - this.k1) / 2 + 0.5, 2);
    let kb = Math.pow((this.k3 + this.k4 + this.k5) / 3, 2);
    let k = ka + kb;

    // clamp
    k = Math.min(1, k);
    k = Math.max(0, k);

    return k;
  }

  get colorFunction() {
    return `
      vec4 get_color(vec2 p) {
        vec2 velocity = get_velocity(p);
        float speed = (length(velocity) - u_velocity_range[0])/(u_velocity_range[1] - u_velocity_range[0]);
        float hue = 0.05 + (1. - speed) * 0.5;
        float hue1 = 1. - pow(hue, 3.) / 2. + 0.15;
        float hue2 = .5 + pow(hue, 3.) / 2.;
        hue = u_k * hue1 + (1. - u_k) * hue2;
        return vec4(hsv2rgb(vec3(hue, 0.9, 1.)), 1.0);
      }`;
  }

  updateColorFunction () {
    if (!this.scene)
      return;

    this.scene.setColorFunction(this.colorFunction);
  }

  @Watch('k1')
  k1Updated () {
    this.updateVariable('k1', this.k1);
  }
  @Watch('k2')
  k2Updated () {
    this.updateVariable('k2', this.k2);
  }
  @Watch('k3')
  k3Updated () {
    this.updateVariable('k3', this.k3);
  }
  @Watch('k4')
  k4Updated () {
    this.updateVariable('k4', this.k4);
  }
  @Watch('k5')
  k5Updated () {
    this.updateVariable('k5', this.k5);
  }

  @Watch('kColor')
  kColorUpdated () {
    this.updateColorVariable(this.kColor);
  }

  @Watch('actuallyPaused')
  togglePause () {
    if (this.scene)
      this.scene[this.actuallyPaused ? 'stop' : 'start']();
  }

  @Watch('particleCount')
  updateParticleCount () {
    if (this.scene)
      this.scene.setParticlesCount(this.particleCount);
  }

  render (h: CreateElement): VNode {
    return h('canvas', { class: 'brain-particles' });
  }

}
</script>

<style scoped lang="scss">
.brain-particles {
  position: absolute;
  filter: blur(1.1px) contrast(1.6);
}
</style>
