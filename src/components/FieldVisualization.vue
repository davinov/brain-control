<script lang="ts">
import _ from 'lodash';
import { CreateElement, VNode } from 'vue';
import { Component, Prop, Vue, Watch } from 'vue-property-decorator';
import initScene from '../lib/field-play/scene';
// import ColorModes from '../lib/field-play/programs/colorModes';

@Component
export default class FieldVizualisation extends Vue {
  private scene: any;

  @Prop({ required: true })
  public k1: number;

  @Prop({ required: true })
  public k2: number;

  @Prop({ default: false })
  public paused: boolean;

  private timeStep: number = 0.01;
  private dropProbability: number = 0.009;
  private particleCount: number = 5000 * window.devicePixelRatio;
  private fadeout: number = .998;
  // private colorMode: number = ColorModes.UNIFORM;

  mounted () {
    let canvas: HTMLCanvasElement = this.$el;
    let ctxOptions = { antialiasing: false };
    let gl = canvas.getContext('webgl', ctxOptions) ||
    canvas.getContext('experimental-webgl', ctxOptions);

    this.scene = initScene(gl);
    this.scene.setParticlesCount(this.particleCount);
    this.scene.setBackgroundColor({
      r: 0.05, g: 0, b: 0.1, a: 1
    });
    this.updateVectorField();

    this.scene.start();
  }

  beforeDestroy () {
    this.scene.dispose();
    this.$el.remove();
  }

  formatNumberforGLSL (n: number): string {
    return n.toFixed(4);
  }

  get GLSLcode () {
    let codeLines = [];

    codeLines.push(`v.x = 0.;`);
    codeLines.push(`v.y = 0.;`);
    codeLines.push(`float tau = acos(0.);`);

    if (this.k1 > 0) {
      // CIRCLE: alpha
      let circle = {
        x: `p.y`,
        y: `-p.x`
      }
      codeLines.push(`v.x += pow(${this.formatNumberforGLSL(this.k1)}, 2.) * (${circle.x}) / pow(max(1., abs(3. * length(p)) - 2. * tau), 3.);`);
      codeLines.push(`v.y += pow(${this.formatNumberforGLSL(this.k1)}, 2.) * (${circle.y}) / pow(max(1., abs(3. * length(p)) - 2. * tau), 3.);`);
    }

    if (this.k2 > 0) {
      // SQUARES: gamma
      let squares = {
        x: `sign(sin(p.y * 2.)) / 2. + (1. - ${this.formatNumberforGLSL(this.k2)}) * sin(p.y * 2.)`,
        y: `sign(sin(p.x * 2.)) / 2. + (1. - ${this.formatNumberforGLSL(this.k2)}) * sin(p.x * 2.)`
      };
      codeLines.push(`if ((abs(p.x) + abs(p.y)) < 2. * tau) {`);
        codeLines.push(`v.x += pow(${this.formatNumberforGLSL(this.k2)}, 2.) * (${squares.x});`);
        codeLines.push(`v.y += pow(${this.formatNumberforGLSL(this.k2)}, 2.) * (${squares.y});`);
      codeLines.push(`}`);
    }

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

  @Watch('GLSLcode')
  GLSLcodeUpdated () {
    this.updateVectorField();
  }

  @Watch('paused')
  togglePause () {
    if (this.scene)
      this.scene[this.paused ? 'stop' : 'start']();
  }

  render (h: CreateElement): VNode {
    return h('canvas', { class: 'brain-particles' });
  }

}
</script>

<style scoped lang="scss">
.brain-particles {
  position: absolute;
}
</style>
