<script lang="ts">
import _ from 'lodash';
import { CreateElement, VNode } from 'vue';
import { Component, Prop, Vue, Watch } from 'vue-property-decorator';
import {
  Scene, Camera,
  WebGLRenderer, PerspectiveCamera
} from 'three';

import * as THREE from 'three';
import { constants } from 'zlib';

const CAMERA_DISTANCE = 200;
const BOUNDS = {
  X: CAMERA_DISTANCE * 2,
  Y: CAMERA_DISTANCE * 2
};

const CIRCLE_RADIUS = CAMERA_DISTANCE * Math.SQRT2;
const SQUARE_SIZE = CAMERA_DISTANCE;
const SQUARE_RADIUS = SQUARE_SIZE / 2;

const POINTS_COUNT = 1000
const POINTS_RENEWAL_CHANCE = 0.0001;

@Component
export default class ParticlesVizualisation extends Vue {
  private scene: Scene;
  private renderer: WebGLRenderer;
  private camera: Camera;
  private geometry: THREE.Geometry;
  private points: THREE.Points;
  private lastAnimationId: number | undefined;

  @Prop({ required: true })
  public k1: number;

  @Prop({ required: true })
  public k2: number;

  @Prop({ default: false })
  public paused: boolean;

  created () {
    this.scene = new Scene();

    this.renderer = new WebGLRenderer({
      preserveDrawingBuffer: true
    });
    this.renderer.autoClearColor = false;

    this.camera = new PerspectiveCamera( 120, window.innerWidth / window.innerHeight, 0.1, 1000 );

    // TRAIL EFFECT
    // Create a semi-transparent plane
    let fadeMaterial = new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0.04,
      depthWrite: false
    });
    let fadePlane = new THREE.PlaneBufferGeometry(1, 1);
    let fadeMesh = new THREE.Mesh(fadePlane, fadeMaterial);

    // Group the plane and the camera in cameraGroup
    let cameraGroup = new THREE.Object3D();
    cameraGroup.add(this.camera);
    cameraGroup.add(fadeMesh);
    cameraGroup.translateZ(CAMERA_DISTANCE);

    // Place the plane in front of the camera
    fadeMesh.position.z = -0.1;

    //Render the Make plane before points
    fadeMesh.renderOrder = -1;

    this.scene.add(cameraGroup);

    // POINTS
    let material = new THREE.PointsMaterial({
      size: 2,
      vertexColors: THREE.VertexColors,
      opacity: 0.6,
      transparent: true,
      map: this.createCanvasMaterial('white', 64),
      depthWrite: false
    });
    this.geometry = new THREE.Geometry();

    _.times(POINTS_COUNT, this.addRandomPoint);
    this.points = new THREE.Points(this.geometry, material);

    this.scene.add(this.points);
  }

  randomPositionOnPlane () {
    return new THREE.Vector3(
      2 * (Math.random() - 0.5) * BOUNDS.X,
      2 * (Math.random() - 0.5) * BOUNDS.Y,
      0
    )
  }

  addRandomPoint () {
    this.geometry.vertices.push(this.randomPositionOnPlane());

    this.geometry.colors.push(new THREE.Color(
      Math.random(), Math.random(), Math.random()
    ));
  }

  mounted () {
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.animate();
    this.$el.appendChild(this.renderer.domElement);
  }

  get horizontalWeigth () {
    return 1 - Math.max(this.k1, this.k2);
  }

  get circleWeigth () {
    if ((this.k1 + this.k2) === 0)
      return 0
    return this.k1;
  }

  get squareWeigth () {
    if ((this.k1 + this.k2) === 0)
      return 0
    return this.k2;
  }

  animate () {
    // Re-randomly position some of the points
    this.geometry.vertices.map((vertice) => {
      if (Math.random() <= POINTS_RENEWAL_CHANCE) {
        let v = this.randomPositionOnPlane();
        vertice.set(v.x, v.y, v.z);
      }
    });

    // Move points
    if ( !_.isNaN(this.k1) && !_.isNaN(this.k2) ) {
      this.geometry.vertices.map( (particle) => {
        let h = this.horizontalMovement(particle);
        let c = this.circularMovement(particle);
        let s = this.squareMovement(particle);

        let weightedMovementAlongAxis = (h: number, c: number, s: number): number =>
          this.circleWeigth * c + this.squareWeigth * s + this.horizontalWeigth * h

        let movement: [number, number] = [
          weightedMovementAlongAxis(h[0], c[0], s[0]),
          weightedMovementAlongAxis(h[1], c[1], s[1])
        ]
        this.moveParticle(
          particle, movement
        );
      });

      this.geometry.verticesNeedUpdate = true;
    }

    this.geometry.colors.map( (particleColor) => {
      let dX, dY, dZ;
      dX = (Math.random() - .5 ) / 5;
      dY = (Math.random() - .5 ) / 5;
      dZ = (Math.random() - .5 ) / 5;

      particleColor.add(new THREE.Color(dX, dY, dZ));
    });

    this.geometry.colorsNeedUpdate = true;
    this.renderer.render(this.scene, this.camera);
    this.continue()
  }

  createCanvasMaterial (color: string, size: number): THREE.Texture {
    let matCanvas = document.createElement('canvas');
    matCanvas.width = matCanvas.height = size;
    let matContext = matCanvas.getContext('2d');
    let texture = new THREE.Texture(matCanvas);
    if (!matContext)
      return new THREE.Texture();

    // Circle
    let center = size / 2;
    matContext.beginPath();
    matContext.arc(center, center, center, 0, 2 * Math.PI);
    matContext.closePath();
    matContext.fillStyle = color;
    matContext.fill();

    texture.needsUpdate = true;
    return texture;
  }

  moveParticle (particle: THREE.Vertex, movement: [number, number]) {
    particle.x += movement[0];
    particle.y += movement[1];

    if (particle.x > BOUNDS.X)
      particle.x = -1 * BOUNDS.X;
    if (particle.x < -1 * BOUNDS.X)
      particle.x = BOUNDS.X;
    if (particle.y > BOUNDS.Y)
      particle.y = -1 * BOUNDS.Y;
    if (particle.y < -1 * BOUNDS.Y)
      particle.y = BOUNDS.Y;
  }

  horizontalMovement (particle: THREE.Vertex): [number, number] {
    return [
      1,
      Math.sin(particle.x / 16 / Math.PI) / 2
    ];
  }

  circularMovement (particle: THREE.Vertex): [number, number] {
    let r = Math.pow( Math.pow(particle.x, 2) + Math.pow(particle.y, 2) , .5);
    let θ = Math.atan2(particle.y, particle.x);

    // Movement towards the circle
    let dr = (CIRCLE_RADIUS - r) / 250; // 250 frames to match the circle
    // Movement along the circle
    let dθ = 2 * Math.PI / 2000; // 1000 frames to complete the circle

    return [
      dr * Math.cos(θ) - r * Math.sin(θ) * dθ,
      dr * Math.cos(θ) + r * Math.cos(θ) * dθ
    ];
  }

  squareMovement (particle: THREE.Vertex) {
    let x = particle.x;
    let y = particle.y;

    let dx: number;
    let dy: number;
    let r: number;
    let dr = (x: number, y: number, r: number): [number, number] => [0, 0]

    if (x >= 0) {
      dy = 1;
      if (y >= 0) {
        r = y / (1 - x); 
        dx = -1;
      } else { // y < 0
        r = y / (x - 1); 
        dx = 1;
      }
    } else { // x < 0
      dy = -1;
      if (y > 0) {
        r = y / (x + 1); 
        dx = -1;
      } else { // y < 0
        r = y / (-1 - x); 
        dx = 1;
      }
    }

    // let dr = (SQUARE_SIZE - r) / 1000;

    return [dx, dy];
  }

  continue () {
    if (!this.paused)
      this.lastAnimationId = window.requestAnimationFrame(this.animate);
  }

  pause () {
    if (this.lastAnimationId)
      window.cancelAnimationFrame(this.lastAnimationId);
    this.lastAnimationId = undefined;
  }

  @Watch('paused')
  onPausedChanged () {
    this.paused ? this.pause() : this.continue()
  }

  render (h: CreateElement): VNode {
    return h('div', { class: 'brain-particles' });
  }

  destroyed () {
    this.pause()
    this.renderer.dispose();
    this.geometry.dispose();
  }
}
</script>

<style scoped lang="scss">
</style>
