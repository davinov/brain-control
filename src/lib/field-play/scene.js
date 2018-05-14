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
import makePanzoom from 'panzoom';
import bus from './bus';
import appState from './appState';
import wglPanZoom from './wglPanZoom';

import createScreenProgram from './programs/screenProgram';
import createDrawParticlesProgram from './programs/drawParticlesProgram';
import createCursorUpdater from './utils/cursorUpdater';
import createVectorFieldEditorState from './editor/vectorFieldState';
import createInputsModel from './createInputsModel';

/**
 * Kicks offs the app rendering. Initialized before even vue is loaded.
 *
 * @param {WebGLRenderingContext} gl
 */
export default function initScene(gl) {
  // Canvas size management
  var canvasRect = { width: 0, height: 0, top: 0, left: 0 };
  setWidthHeight(window.innerWidth, window.innerHeight);
  window.addEventListener('resize', onResize, true);

  // TODO: It feels like bounding box management needs to be moved out from here.
  // TODO: bbox needs to be a class with width/height properties.
  var bbox = appState.getBBox() || {};
  var currentPanZoomTransform = {
    scale: 1,
    x: 0,
    y: 0
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

    integrationTimeStep: appState.getIntegrationTimeStep(),

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
    fadeOpacity: appState.getFadeout(),

    backgroundColor: { r: 0, g: 0, b: 0, a: 1 },

    // Ignore this one for a moment. Yes, the app support web audio API,
    // but it's rudimentary, so... shhh! it's a secret.
    // Don't shhh on me!
    audioTexture: null
  };

  // Frame management
  var lastAnimationFrame;
  var isPaused = false;

  var inputsModel = createInputsModel(ctx);

  // screen rendering;
  var screenProgram = createScreenProgram(ctx);
  var drawProgram = createDrawParticlesProgram(ctx);
  var cursorUpdater = createCursorUpdater(ctx);
  var vectorFieldEditorState = createVectorFieldEditorState(drawProgram);

  // particles
  updateParticlesCount(particleCount);

  var api = {
    start: nextFrame,
    stop,
    dispose,

    resetBoundingBox,
    moveBoundingBox,
    applyBoundingBox,

    setPaused,

    getParticlesCount,
    setParticlesCount,

    setFadeOutSpeed,
    getFadeOutSpeed,

    setDropProbability,
    getDropProbability,

    getIntegrationTimeStep,
    setIntegrationTimeStep,

    setColorMode,
    getColorMode,

    vectorFieldEditorState,

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

  var panzoom = initPanzoom();
  restoreBBox();

  setTimeout(() => {
    bus.fire('scene-ready', api);
  })

  return api;

  function moveBoundingBox(changes) {
    if (!changes) return;
    var parsedBoundingBox = Object.assign({}, ctx.bbox);

    assignIfPossible(changes, 'minX', parsedBoundingBox);
    assignIfPossible(changes, 'minY', parsedBoundingBox);
    assignIfPossible(changes, 'maxX', parsedBoundingBox);
    assignIfPossible(changes, 'maxY', parsedBoundingBox);

    // for Y axis changes we need to preserve aspect ration, which means
    // we also need to change X...
    if (changes.minY !== undefined || changes.maxY !== undefined) {
      // adjust values for X
      var heightChange = Math.abs(parsedBoundingBox.minY - parsedBoundingBox.maxY)/Math.abs(ctx.bbox.minY - ctx.bbox.maxY);
      var cx = (ctx.bbox.maxX + ctx.bbox.minX)/2;
      var prevWidth = (ctx.bbox.maxX - ctx.bbox.minX)/2;
      parsedBoundingBox.minX = cx - prevWidth * heightChange;
      parsedBoundingBox.maxX = cx + prevWidth * heightChange;

    }

    applyBoundingBox(parsedBoundingBox);
  }

  function assignIfPossible(change, key, newBoundingBox) {
    var value = Number.parseFloat(change[key]);
    if (Number.isFinite(value)) {
      newBoundingBox[key] = value;
    }
  }


  function setColorMode(x) {
    var mode = parseInt(x, 10);
    appState.setColorMode(mode);
    ctx.colorMode = appState.getColorMode();
    drawProgram.updateColorMode(mode);
  }

  function getColorMode() {
    return appState.getColorMode();
  }

  function getIntegrationTimeStep() {
    return appState.getIntegrationTimeStep();
  }

  function setIntegrationTimeStep(x) {
    var f = parseFloat(x);
    if (Number.isFinite(f)) {
      ctx.integrationTimeStep = f;
      appState.setIntegrationTimeStep(f);
      bus.fire('integration-timestep-changed', f);
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

    screenProgram.updateScreenTextures();

    updateBoundingBox(currentPanZoomTransform);
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
    panzoom.dispose();
    window.removeEventListener('resize', onResize, true);
    cursorUpdater.dispose();
    vectorFieldEditorState.dispose();
  }

  function nextFrame() {
    if (lastAnimationFrame) return;

    if (isPaused) return;

    lastAnimationFrame = requestAnimationFrame(draw);
  }

  function stop() {
    cancelAnimationFrame(lastAnimationFrame);
    lastAnimationFrame = 0;
  }

  function draw() {
    lastAnimationFrame = 0;

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

  function initPanzoom() {
    let initializedPanzoom = makePanzoom(gl.canvas, {
      realPinch: true,
      zoomSpeed: 0.025,
      controller: wglPanZoom(gl.canvas, updateBoundingBox)
    });

    return initializedPanzoom;
  }

  function restoreBBox() {
    var {width, height} = canvasRect;

    let sX = Math.PI * Math.E;
    let sY = Math.PI * Math.E;
    let tX = 0;
    let tY = 0;

    var w2 = sX * width / 2;
    var h2 = sY * width / 2;
    panzoom.showRectangle({
      left: -w2 + tX,
      top: -h2 - tY,
      right: w2 + tX,
      bottom: h2 - tY ,
    });
  }

  function updateBoundingBox(transform) {
    screenProgram.boundingBoxUpdated = true;

    currentPanZoomTransform.x = transform.x;
    currentPanZoomTransform.y = transform.y;
    currentPanZoomTransform.scale = transform.scale;

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
      return (x - transform.x)/transform.scale;
    }

    function clientY(y) {
      return (y - transform.y)/transform.scale;
    }
  }

  function resetBoundingBox() {
    var w = Math.PI * Math.E * 0.5;
    var h = Math.PI * Math.E * 0.5;

    applyBoundingBox({
      minX: -w,
      minY: -h,
      maxX: w,
      maxY: h
    })
  }

  function applyBoundingBox(boundingBox) {
    restoreBBox();
    // a hack to trigger panzoom event
    panzoom.moveBy(0, 0, false);
  }

  // backgroundColor should be an object with r, g, b, a properties (range: 0-1)
  function setBackgroundColor(backgroundColor) {
    ctx.backgroundColor = backgroundColor; 
  }
}
