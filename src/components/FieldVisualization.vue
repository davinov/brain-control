<script lang="ts">
import _ from 'lodash';
import { CreateElement, VNode } from 'vue';
import { Component, Prop, Vue, Watch } from 'vue-property-decorator';
import initScene from '../lib/field-play/scene';
// import ColorModes from '../lib/field-play/programs/colorModes';
import wrapVectorField from '../lib/field-play/wrapVectorField';

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
    // this.scene.setBackgroundColor({
    //   r: 0.05, g: 0, b: 0.1, a: 1
    // });
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
    // return `
    //   v.x = ${this.formatNumberforGLSL(this.k1 / 5)} * p.y;
    //   v.y = ${this.formatNumberforGLSL(this.k2 / 5)} * p.x;
    // `;
    // CIRCLE: alpha
    let circle = {
      x: `p.y`,
      y: `-p.x`
    }
    // SQUARES: gamma
    let squares = {
      x: `sign(cos(p.y * 2.)) / 2. + (1. - ${this.formatNumberforGLSL(this.k2)}) * cos(p.y * 2.)`,
      y: `sign(sin(p.x * 2.)) / 2. + (1. - ${this.formatNumberforGLSL(this.k2)}) * sin(p.x * 2.)`
    };
    return `
      v.x = (pow(${this.formatNumberforGLSL(this.k1)}, 2.) * (${circle.x})) + (pow(${this.formatNumberforGLSL(this.k2)}, 2.) * (${squares.x}));
      v.y = (pow(${this.formatNumberforGLSL(this.k1)}, 2.) * (${circle.y})) + (pow(${this.formatNumberforGLSL(this.k2)}, 2.) * (${squares.y}));
    `;
  }

  updateVectorField () {
    if (!this.scene)
      return;

    this.scene.vectorFieldEditorState.setCode(wrapVectorField(this.GLSLcode));
  }

  @Watch('GLSLcode')
  GLSLcodeUpdated () {
    this.updateVectorField();
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
