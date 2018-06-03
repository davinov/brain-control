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


    if (this.k1 > 0) {
      // CIRCLE-EYE: alpha (relaxation)
      let circle = {
        x: `p.y`,
        y: `-p.x`
      }
      codeLines.push(`v.x += pow(${this.formatNumberforGLSL(this.k1)}, 2.) * (${circle.x}) / pow(max(1., abs(3. * l) - 2. * tau), 3.);`);
      codeLines.push(`v.y += pow(${this.formatNumberforGLSL(this.k1)}, 2.) * (${circle.y}) / pow(max(1., abs(3. * l) - 2. * tau), 3.);`);
    }

    if (this.k5 > 0) {
      // SQUARES: Hi beta (3)
      let squares = {
        x: `sign(sin(p.y * 4.)) / 2. + (1. - ${this.formatNumberforGLSL(this.k5)}) * sin(p.y * 4.)`,
        y: `sign(-1. * sin(p.x * 4.)) / 2. - (1. - ${this.formatNumberforGLSL(this.k5)}) * sin(p.x * 4.)`
      };
      codeLines.push(`float sd = (abs(p.x) + abs(p.y)) * 2. / 3.;`);
      codeLines.push(`if ( (sd < tau) && (sd > pi / 2.) ) {`);
        codeLines.push(`v.x += pow(${this.formatNumberforGLSL(this.k5)}, 3.) * (${squares.x});`);
        codeLines.push(`v.y += pow(${this.formatNumberforGLSL(this.k5)}, 3.) * (${squares.y});`);
      codeLines.push(`}`);
    }

    if (this.k2 > 0) {
      // WHRIL: gamma
      let whirl = {
        x: `(p.y + p.x) / pow(l, 2.) * atan(l) / tau / max(pow(l, 2.), 1.)`,
        y: `(- p.x + p.y) / pow(l, 2.) * atan(l) / tau / max(pow(l, 2.), 1.)`
      };
      codeLines.push(`v.x -= pow(${this.formatNumberforGLSL(this.k2)}, 2.) * (${whirl.x});`);
      codeLines.push(`v.y -= pow(${this.formatNumberforGLSL(this.k2)}, 2.) * (${whirl.y});`);
    }

    if (this.k3 > 0) {
      // STAR: Low-beta (1)
      let star = {
        x: `((-1./ p.x / 50.) + (-1./ (p.y + p.x) / 100.)) / max(1., pow(l, 2.))`,
        y: `((-1. / p.y / 50.) + (1. / (p.x - p.y) / 100.) ) / max(1., pow(l, 2.))`
      };
      codeLines.push(`v.x -= pow(${this.formatNumberforGLSL(this.k3)}, 2.) * 4. * (${star.x});`);
      codeLines.push(`v.y += pow(${this.formatNumberforGLSL(this.k3)}, 2.) * 4. * (${star.y});`);
    }

    if (this.k4 > 0) {
      codeLines.push(`float x = sin((p.x + p.y) * 3.);`)
      codeLines.push(`float y = sin((p.x - p.y) * 3.);`)
      codeLines.push(`float cd = max(max(abs(p.x), abs(p.y)) - 0.5, 0.);`)
      // CLOVERFLIED processing units (cpu-like): Mid Beta (2)
      let cloverfield = {
        x: `4. * ((-1. / x / 50.) + (-1. / (y + x) / 100.) ) / max(1., pow(cd, 6.))`,
        y: `4. * ((-1. / y / 50.) + (1.  / (x - y) / 100.) ) / max(1., pow(cd, 6.))`
      };
      codeLines.push(`v.x += pow(${this.formatNumberforGLSL(this.k4)}, 4.) * (${cloverfield.x});`);
      codeLines.push(`v.y += pow(${this.formatNumberforGLSL(this.k4)}, 4.) * (${cloverfield.y});`);
    }

    let steadyK = Math.pow( (1 - Math.max(this.k1, this.k2, this.k3, this.k4, this.k5)) * Math.pow(this.k1 + this.k2 + this.k3 + this.k4 + this.k5, 1/3), 2);
    codeLines.push(`v.x += ${this.formatNumberforGLSL(steadyK)} * p.x / pow(l, 2.);`);
    codeLines.push(`v.y += ${this.formatNumberforGLSL(steadyK)} * p.y / pow(l, 2.);`);

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

  get colorFunction() {
    let ka = Math.pow((this.k2 - this.k1) / 2 + 0.5, 2);
    let kb = Math.pow((this.k3 + this.k4 + this.k5) / 3, 2);
    let k = ka + (kb);

    // clamp
    k = Math.min(1, k);
    k = Math.max(0, k);

    return `
      vec4 get_color(vec2 p) {
        vec2 velocity = get_velocity(p);
        float speed = (length(velocity) - u_velocity_range[0])/(u_velocity_range[1] - u_velocity_range[0]);
        float hue = 0.05 + (1. - speed) * 0.5;
        float hue1 = 1. - pow(hue, 3.) / 2. + 0.15;
        float hue2 = .5 + pow(hue, 3.) / 2.;
        hue = ${this.formatNumberforGLSL(k)} * hue1 + (1. - ${this.formatNumberforGLSL(k)}) * hue2;
        return vec4(hsv2rgb(vec3(hue, 0.9, 1.)), 1.0);
      }`;
  }

  updateColorFunction () {
    if (!this.scene)
      return;

    this.scene.setColorFunction(this.colorFunction);
  }

  @Watch('GLSLcode')
  GLSLcodeUpdated () {
    this.updateVectorField();
  }

  @Watch('colorFunction')
  colorFunctionToUpdate () {
    this.updateColorFunction();
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
