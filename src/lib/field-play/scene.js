/**
 * This file is based on https://github.com/mapbox/webgl-wind
 * by Vladimir Agafonkin
 *
 * Released under ISC License, Copyright (c) 2016, Mapbox
 * https://github.com/mapbox/webgl-wind/blob/master/LICENSE
 *
 * Adapted to field maps by Andrei Kashcha
 * Copyright (C) 2017
 */
import util from './gl-utils';
import bus from './bus';
import appState from './appState';

import createScreenProgram from './programs/screenProgram';
import createDrawParticlesProgram from './programs/drawParticlesProgram';
import createVectorFieldEditorState from './editor/vectorFieldState';
import createInputsModel from './createInputsModel';

const INITIAL_SPEED = 1;

function integrationTimeStepFromSpeed(speed) {
  return speed * 0.004;
}

function fadeOutFromSpeed(speed) {
  return 1 - speed * 0.002;
}

/**
 * Kicks offs the app rendering. Initialized before even vue is loaded.
 *
 * @param {WebGLRenderingContext} gl
 */
export default function initScene(gl) {
  // Canvas size management
  var canvasRect = { width: 0, height: 0, top: 0, left: 0 };
  setWidthHeight(window.innerWidth, window.innerHeight);
  // window.addEventListener('resize', onResize, true);
  onResize();

  // TODO: It feels like bounding box management needs to be moved out from here.
  // TODO: bbox needs to be a class with width/height properties.
  var bbox = appState.getBBox() || {};
  var currentPanZoomTransform = {
    scale: 0.1,
    x: window.innerWidth / 2,
    y: window.innerHeight / 2
  };

  // How many particles do we want?
  var particleCount = appState.getParticleCount();

  gl.disable(gl.DEPTH_TEST);
  gl.disable(gl.STENCIL_TEST);

  // Context variable is a way to share rendering state between multiple programs. It has a lot of stuff on it.
  // I found that it's the easiest way to work in state-full world of WebGL.
  // Until I discover a better way to write WebGL code.
  var ctx = {
    gl,
    bbox,
    canvasRect,

    inputs: null,

    framebuffer: gl.createFramebuffer(),

    // This is used only to render full-screen rectangle. Main magic happens inside textures.
    quadBuffer: util.createBuffer(gl, new Float32Array([0, 0, 1, 0, 0, 1, 0, 1, 1, 0, 1, 1])),

    colorMode: appState.getColorMode(),
    colorFunction: appState.getColorFunction(),

    // This defines texture unit for screen rendering. First few indices are taken by textures
    // that compute particles position/color
    // TODO: I need to find a better way to manage this.
    screenTextureUnit: 3,

    speed: INITIAL_SPEED,
    integrationTimeStep: integrationTimeStepFromSpeed(INITIAL_SPEED),

    // On each frame the likelihood for a particle to reset its position is this:
    dropProbability: appState.getDropProbability(),

    // current frame number. Reset every time when new shader is compiled
    frame: 0,

    // TOREMOVE
    // Information about mouse cursor. Could be useful to simplify
    // exploration
    cursor: {
      // Where mouse was last time clicked (or tapped)
      clickX: 0, clickY: 0,
      // where mouse was last time moved. If this is a touch device
      // this is the same as clickX, clickY
      hoverX: 0, hoverY: 0
    },

    // Texture size to store particles' positions
    particleStateResolution: 0,

    // How quickly we should fade previous frame (from 0..1)
    fadeOpacity: fadeOutFromSpeed(INITIAL_SPEED),

    backgroundColor: { r: 0, g: 0, b: 0, a: 1 },

    // Ignore this one for a moment. Yes, the app support web audio API,
    // but it's rudimentary, so... shhh! it's a secret.
    // Don't shhh on me!
    audioTexture: null
  };

  // Frame management
  var lastAnimationFrame;
  var lastAnimationFrameTime;
  var isPaused = false;

  var inputsModel = createInputsModel(ctx);

  // screen rendering;
  var screenProgram = createScreenProgram(ctx);
  var drawProgram = createDrawParticlesProgram(ctx);
  // var cursorUpdater = createCursorUpdater(ctx);
  var vectorFieldEditorState = createVectorFieldEditorState(drawProgram);

  // particles
  updateParticlesCount(particleCount);

  var api = {
    start: nextFrame,
    stop,
    dispose,

    setPaused,

    getParticlesCount,
    setParticlesCount,

    setFadeOutSpeed,
    getFadeOutSpeed,

    setDropProbability,
    getDropProbability,

    getSpeed,
    setSpeed,

    setColorMode,
    getColorMode,

    setColorFunction,
    getColorFunction,

    vectorFieldEditorState,
    updateColorVariable,

    inputsModel,

    setBackgroundColor,

    getCanvasRect() {
      // We trust they don't do anything bad with this ...
      return canvasRect;
    },

    getBoundingBox() {
      // again, we trust. Maybe to much?
      return ctx.bbox;
    }
  }

  restoreBBox();

  setTimeout(() => {
    bus.fire('scene-ready', api);
  })

  return api;

  function assignIfPossible(change, key, newBoundingBox) {
    var value = Number.parseFloat(change[key]);
    if (Number.isFinite(value)) {
      newBoundingBox[key] = value;
    }
  }


  function setColorMode(x) {
    var mode = parseInt(x, 10);
    ctx.colorMode = mode;
    drawProgram.updateColorMode(mode);
  }

  function getColorMode() {
    return ctx.colorMode;
  }

  function setColorFunction(code) {
    ctx.colorFunction = code;
    drawProgram.updateColorMode(ctx.colorMode);
  }

  function updateColorVariable(value) {
    drawProgram.updateColorVariable(value);
  }

  function getColorFunction() {
    return ctx.colorFunction;
  }

  function getSpeed() {
    return ctx.speed;
  }

  function setSpeed(x) {
    var f = parseFloat(x);
    if (Number.isFinite(f)) {
      ctx.speed = f;
      ctx.integrationTimeStep = integrationTimeStepFromSpeed(speed);
      ctx.fadeOpacity = fadeOutFromSpeed(speed);
      bus.fire('integration-timestep-changed', ctx.integrationTimeStep);
    }
  }

  function setPaused(shouldPause) {
    isPaused = shouldPause;
    nextFrame();
  }

  // Main screen fade out configuration
  function setFadeOutSpeed(x) {
    var f = parseFloat(x);
    if (Number.isFinite(f)) {
      ctx.fadeOpacity = f;
      appState.setFadeout(f);
    }
  }

  function getFadeOutSpeed() {
    return appState.getFadeout();
  }

  // Number of particles configuration
  function getParticlesCount() {
    return appState.getParticleCount();
  }

  function setParticlesCount(newParticleCount) {
    if (!Number.isFinite(newParticleCount)) return;
    if (newParticleCount === particleCount) return;
    if (newParticleCount < 1) return;

    updateParticlesCount(newParticleCount);

    particleCount = newParticleCount;
    appState.setParticleCount(newParticleCount);
  }

  // drop probability
  function setDropProbability(x) {
    var f = parseFloat(x);
    if (Number.isFinite(f)) {
      // TODO: Do I need to worry about duplication/clamping?
      appState.setDropProbability(f);
      ctx.dropProbability = f;
    }
  }

  function getDropProbability() {
    return appState.getDropProbability();
  }

  function onResize() {
    setWidthHeight(window.innerWidth, window.innerHeight);

    if (screenProgram) {
      screenProgram.updateScreenTextures();
      updateBoundingBox();
    }
  }

  function setWidthHeight(w, h) {
    var dx = Math.max(w * 0.02, 30);
    var dy = Math.max(h * 0.02, 30);
    let x = w + 2 * dx;
    let y = h + 2 * dy;
    canvasRect.width = window.devicePixelRatio * x;
    canvasRect.height = window.devicePixelRatio * y;
    canvasRect.top = - dy;
    canvasRect.left = - dx;


    let canvas = gl.canvas;
    canvas.style.width = x + 'px';
    canvas.style.height = y + 'px';
    canvas.style.left = (-dx) + 'px';
    canvas.style.top = (-dy) + 'px';
    canvas.width = canvasRect.width;
    canvas.height = canvasRect.height;
  }

  function dispose() {
    stop();
    window.removeEventListener('resize', onResize, true);
    vectorFieldEditorState.dispose();
  }

  function nextFrame() {
    if (lastAnimationFrame) return;

    if (isPaused) return;

    lastAnimationFrame = requestAnimationFrame(draw);
    lastAnimationFrameTime = Date.now();
  }

  function stop() {
    cancelAnimationFrame(lastAnimationFrame);
    lastAnimationFrame = 0;
    lastAnimationFrameTime = undefined;
  }

  function draw() {
    lastAnimationFrame = 0;

    // Adjust integration time step if we missed frames
    if (lastAnimationFrameTime) {
      let timeSinceLastFrame = Date.now() - lastAnimationFrameTime;
      let performanceRatio = (1000 / 30) / timeSinceLastFrame;
      let correctedSpeed = ctx.speed / Math.min(performanceRatio, 1);
      ctx.integrationTimeStep = integrationTimeStepFromSpeed(correctedSpeed);
      ctx.fadeOpacity = fadeOutFromSpeed(correctedSpeed);
      // bus.fire('integration-timestep-changed', ctx.integrationTimeStep);
    }
    drawScreen();

    nextFrame();
  }

  function drawScreen() {
    screenProgram.fadeOutLastFrame()
    drawProgram.drawParticles();
    screenProgram.renderCurrentScreen();
    drawProgram.updateParticlesPositions();
  }

  function updateParticlesCount(numParticles) {
    // we create a square texture where each pixel will hold a particle position encoded as RGBA
    ctx.particleStateResolution = Math.ceil(Math.sqrt(numParticles));
    drawProgram.updateParticlesCount();
  }

  function restoreBBox() {
    var {width, height} = canvasRect;

    let sX = Math.PI * Math.E;
    let sY = Math.PI * Math.E;
    let tX = 0;
    let tY = 0;

    var w2 = sX * width / 2;
    var h2 = sY * width / 2;
    updateBoundingBox();
  }

  function updateBoundingBox() {
    screenProgram.boundingBoxUpdated = true;

    currentPanZoomTransform = {
      scale: 0.1,
      x: window.innerWidth / 2,
      y: window.innerHeight / 2
    };

    var {width, height} = canvasRect;
    width /= window.devicePixelRatio;
    height /= window.devicePixelRatio;

    var minX = clientX(0);
    var minY = clientY(0);
    var maxX = clientX(width);
    var maxY = clientY(height);

    // we divide by width to keep aspect ratio
    // var ar = width/height;
    var p = 10000;
    bbox.minX = Math.round(p * minX/width)/p;
    bbox.minY = Math.round(p * -minY/width)/p;
    bbox.maxX = Math.round(p * maxX/width)/p;
    bbox.maxY = Math.round(p * -maxY/ width)/p;

    bus.fire('bbox-change', bbox);

    function clientX(x) {
      return (x - currentPanZoomTransform.x)/currentPanZoomTransform.scale;
    }

    function clientY(y) {
      return (y - currentPanZoomTransform.y)/currentPanZoomTransform.scale;
    }
  }

  // backgroundColor should be an object with r, g, b, a properties (range: 0-1)
  function setBackgroundColor(backgroundColor) {
    ctx.backgroundColor = backgroundColor; 
  }
}
