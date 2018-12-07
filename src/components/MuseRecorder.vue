<template>
  <div class="muse-recorder">
    <div class="muse-recorder__viz-container">
      <!-- <visualization
        :k1="k1"
        :k2="k2"
      ></visualization> -->
      <!-- <particles-visualization
        :k1="k1"
        :k2="k2"
        :paused="paused"
      ></particles-visualization> -->
      <field-visualization
        :alpha="alpha"
        :beta1="beta1"
        :beta2="beta2"
        :beta3="beta3"
        :gamma="gamma"
        :n="n"
        :paused="paused"
      ></field-visualization>
    </div>

    <div
      class="muse-recorder__greeting"
      :class="{'muse-recorder__greeting--connected': connectionStatus && !paused}"
      v-if="n == 0"
    >
      <div class="muse-recorder__greeting-title">
        <div style="font-size: 6em;">Do you feel in control</div>
        <div style="font-size: 4em;">of what's happenning</div>
        <div style="font-size: 8em;">in your brain?</div>
      </div>
      <div class="muse-recorder__greeting-tuto">
        <div class="muse-recorder__greeting-tuto-intro">
          Turn on the headband, adjust it on your forehead, wait 10s and observe...
        </div>
        <div
          class="muse-recorder__greeting-tuto-button"
          @click="connectToMuse()"
        >
          Start <font-awesome-icon icon="play" style="font-size:smaller"/>
        </div>
        <div class="muse-recorder__greeting-tuto-outro">
          When your finished or before passing the headband to someone else, hit STOP <font-awesome-icon icon="stop" style="font-size:smaller"/>
        </div>
        <hr>
        <div
          class="muse-recorder__greeting-tuto-button"
          @click="connectToRemoteController()"
        >
          Connect to tablet <font-awesome-icon icon="play" style="font-size:smaller"/>
        </div>
      </div>
    </div>

    <!-- <div
      class="muse-recorder__connection"
      :class="{'muse-recorder__connection--connected': connectionStatus}"
    >
      <font-awesome-icon
        class="muse-recorder__connection-icon"
        :icon="['fab', connectionStatus ? 'bluetooth-b' : 'bluetooth']"
        @click="connectionStatus ? disconnect() : connectToMuse()"
      />
    </div> -->

    <!-- <div
      class="muse-recorder__session-details"
      v-if="sessionsDetailsOpened"
    >
      <Session
        v-if="currentSession.length"
        :sessionData="currentSession"
      >
      </Session>
      <div v-else>
        No session data
      </div>
    </div>

    <div
      class="muse-recorder__chart-toggle"
      v-if="sessionInProgress"
      @click="sessionsDetailsOpened = !sessionsDetailsOpened"
    >
      <font-awesome-icon :icon="['fas', sessionsDetailsOpened ? 'times' : 'chart-line']"  />
    </div>

    <div
      class="muse-recorder__stop-button"
      v-if="sessionInProgress"
      @click="stopSession()"
    >
      Stop <font-awesome-icon icon="stop" />
    </div>


    <div
      class="muse-recorder__viz-controls"
      v-if="vizControlsDisplayed"
    >
      <div></div>
      <button
        @click="paused = !paused"
      > Play/pause viz
      </button>
      <div>
        <input
          type="range"
          v-model.number="alpha"
          min="0"
          max="1"
          step="0.01"
        />
        <pre>alpha: {{ alpha }}</pre>
      </div>
      <div>
        <input
          type="range"
          v-model.number="beta1"
          min="0"
          max="1"
          step="0.01"
        />
        <pre>beta1: {{ beta1 }}</pre>
      </div>
      <div>
        <input
          type="range"
          v-model.number="beta2"
          min="0"
          max="1"
          step="0.01"
        />
        <pre>beta2: {{ beta2 }}</pre>
      </div>
      <div>
        <input
          type="range"
          v-model.number="beta3"
          min="0"
          max="1"
          step="0.01"
        />
        <pre>beta3: {{ beta3 }}</pre>
      </div>
      <div>
        <input
          type="range"
          v-model.number="gamma"
          min="0"
          max="1"
          step="0.01"
        />
        <pre>gamma: {{ gamma }}</pre>
      </div>
      <div>
        <input
          type="range"
          v-model.number="n"
          min="0"
          max="100"
          step="1"
        />
        <pre>n: {{ n }}</pre>
      </div>
      <button
        @click="reload()"
      > Not working? Reload the page
      </button>
      <div>
        <input type="checkbox"
          v-model="partyMode"
        ></input> Party mode
      </div>
    </div>

    <div
      class="muse-recorder__viz-controls-toggle"
      @click="toggleVizControlsDisplayed"
    >
      <font-awesome-icon
        :icon="['fas', vizControlsDisplayed ? 'times' : 'sliders-h']"
      />
    </div> -->

    <!-- <div
      class="muse-recorder__session-control"
      v-if="true || connectionStatus"
    >
      <div class="muse-recorder__main-controls">
        <font-awesome-icon
          class="muse-recorder__session-control-icon"
          :icon="['far', sessionInProgress ? 'pause-circle' : 'play-circle']"
          @click="sessionInProgress ? stopSession() : startSession()"
        />
        <font-awesome-icon
          class="muse-recorder__session-details-icon"
          :icon="['far', sessionsDetailsOpened ? 'caret-square-down' : 'caret-square-up']"
          @click="sessionsDetailsOpened = !sessionsDetailsOpened"
        />
      </div>
      <div
        class="muse-recorder__session-details"
        v-if="sessionsDetailsOpened"
      >
        <Session
          v-if="currentSession.length"
          :sessionData="currentSession"
        >
        </Session>
        <div v-else>
          No session data
        </div>
      </div>
    </div> -->


    <!-- <div
      class="muse-recorder__info-panel"
      v-if="infoPanelOpened"
    >
      <div>
        <div
          class="muse-recorder__greeting-tuto-button"
          @click="infoPanelOpened = false"
        >
          Close
        </div>
        <p>
          <strong>What is this installation?</strong>
        </p>
        <p>
          This installation uses a headband to listen to your brain elcetrical rhythms.<br/>
          It then computes the power of particular frequencies and translates them into a particles visualization.
        </p>
        <p>
          These rhythms, called "Alpha", "Beta" and "Gamma" waves are the object of many scientific research to date.
          What they represent in terms of "state of mind" is not that easy to determine, and a scientific consensus about them is not yet reached.<br/>
          Still, there is many knowledge and information about them in books and on the web, which I used to create this art: <br/>
          <ul>
            <li>alpha waves are up in calm state</li>
            <li>beta waves are present when you're awake, and are divised in three:
              <ul>
                <li>low-beta indicates regular awakeness, a "fast idle" mind</li>
                <li>mid-beta could appear when engaging or actively figuring something out</li>
                <li>high-beta would be the sign of highly complex thought, integrating new experiences, high anxiety or excitement</li>
              </ul>
            </li>
            <li>it's speculated that gamma rhythms modulate perception and consciousness, and that a greater presence of gamma relates to expanded consciousness and spiritual emergence</li>
          </ul>
          Treat these interpretations with caution: they are not scientifcally endorsed and perception could vary a lot from one individual to another.
        </p>
        <p>
          It's easy for some people to control their brainwaves in a way, while it's quite difficult to impossible for others.
          Take some time to try to calm yourself or concentrate on something, or just let your mind wander and see what happens.
          One simple exercise some manage very well is to close your eyes for a few seconds and empty your mind: for some people ths triggers a load of alpha waves, which make the light blue swirling vortex appear.
        </p>
        <p>
          It's very important to reset the device with the Stop button each time the headband changes heads.
          The levels can be different among people, so the system auto-calibrates in some seconds on the beginning of each session.
          Hitting stop/start reset this calibration.
        </p>
        <p>
          I've been able to create this based on these amazing libraries:
          <ul>
              <li>muse-js by Uri Shaked</li>
              <li>field-play by Andrei Kashcha</li>
              <li>DSP.js by Corban Brook</li>
          </ul>
        </p>
        <p>
          Intrigued? A question? Wanna talk about it or just need some help?<br/>
          Find David at Barrio Wonderever or contact me on Twitter or GitHub @davinov
        </p>
        <p>
          If you have Muse headband and a web-bluetooth enabled browser (Chrome on Android or Mac), you can reproduce at home with https://david.nowinsky.net/brain-control<br/>
          Source code is available on https://github.com/davinov/brain-control
        </p>
        <div
          class="muse-recorder__greeting-tuto-button"
          @click="infoPanelOpened = false"
        >
          Close
        </div>
      </div>
    </div>

    <div
      class="muse-recorder__info-toggle"
      @click="infoPanelOpened = !infoPanelOpened"
    >
      <font-awesome-icon
        :icon="['fas', infoPanelOpened ? 'times' : 'info-circle']"
      />
    </div>

    <div
      class="muse-recorder__screenshot-panel"
      v-if="screenshotPanelOpened"
    >
      <div v-if="!screenshotSent">
        <input
          type="text"
          placeholder="Your e-mail"
          v-model="screenshotEmail"
        />
        <button
          @click="saveScreenshot()"
        >Send me the picture after Nowhere!</button>
      </div>
      <div v-else>Saved! I will send you this after Nowhere.</div>
    </div>


    <div
      class="muse-recorder__screenshot-toggle"
      @click="toggleScreenshotPanel()"
      v-if="n != 0"
    >
      <font-awesome-icon
        :icon="['fas', screenshotPanelOpened ? 'times' : 'camera']"
      />
    </div> -->

  </div>
</template>

<script lang="ts">
import _ from 'lodash';
import { Component, Inject, Vue } from 'vue-property-decorator';
import { MuseClient } from 'muse-js';
import { EEGRelativePowerBand, POWER_BANDS, FrequencyBand } from 'muse-js';
import { Observable } from 'rxjs/Observable';
import { Subscription } from 'rxjs/Subscription';
import { bufferCount, map } from 'rxjs/operators';
import Session from './Session.vue';
import Visualization from './Visualization.vue';
import ParticlesVisualization from './ParticlesVisualization.vue';
import FieldVisualization from './FieldVisualization.vue';
import FontAwesomeIcon from '@fortawesome/vue-fontawesome';
import { saveAs } from 'file-saver';
import io from 'socket.io-client';

import fontawesome from '@fortawesome/fontawesome';
import faBluetooth from '@fortawesome/fontawesome-free-brands/faBluetooth';
import faBluetoothB from '@fortawesome/fontawesome-free-brands/faBluetoothB';
import faPlayCircle from '@fortawesome/fontawesome-free-regular/faPlayCircle';
import faPauseCircle from '@fortawesome/fontawesome-free-regular/faPauseCircle';
import faCaretSquareDown from '@fortawesome/fontawesome-free-regular/faCaretSquareDown';
import faCaretSquareUp from '@fortawesome/fontawesome-free-regular/faCaretSquareUp';
import faPlay from '@fortawesome/fontawesome-free-solid/faPlay';
import faStop from '@fortawesome/fontawesome-free-solid/faStop';
import faChartLine from '@fortawesome/fontawesome-free-solid/faChartLine';
import faInfoCircle from '@fortawesome/fontawesome-free-solid/faInfoCircle';
import faSyncAlt from '@fortawesome/fontawesome-free-solid/faSyncAlt';
import faSlidersH from '@fortawesome/fontawesome-free-solid/faSlidersH';
import faTimes from '@fortawesome/fontawesome-free-solid/faTimes';
import faCamera from '@fortawesome/fontawesome-free-solid/faCamera';

fontawesome.library.add(
  faBluetooth, faBluetoothB,
  faPlayCircle, faPauseCircle,
  faCaretSquareDown, faCaretSquareUp,
  faPlay, faStop,
  faChartLine, faInfoCircle, faSyncAlt, faSlidersH, faTimes, faCamera
);



export interface AveragedRelativeBandPowers {
  [index: string]: number;
}

@Component({
  components: {
    Session,
    Visualization,
    ParticlesVisualization,
    FieldVisualization,
    FontAwesomeIcon,
  }
})
export default class MuseRecorder extends Vue {
  private museClient: MuseClient;
  private connectionStatus: boolean = false;
  private sessionInProgress: boolean = false;
  private currentSessionSubscription: Subscription;
  private vizControlsDisplayed: boolean = false;
  private infoPanelOpened: boolean = false;
  private screenshotPanelOpened: boolean = false;
  private screenshotEmail: string = "";
  private screenshotSent: boolean = false;

  private currentSession: AveragedRelativeBandPowers[] = [];

  private alpha: number = 0;
  private beta1: number = 0;
  private beta2: number = 0;
  private beta3: number = 0;
  private gamma: number = 0;
  private n: number = 0;
  private paused: boolean = true;
  private sessionsDetailsOpened: boolean = false;

  private partyMode: boolean = true;
  private partyScales = {
    ALPHA: [.20, .33],
    BETA_1: [.15, .25],
    BETA_2: [.15, .25],
    BETA_3: [.15, .25],
    GAMMA: [.10, .20]
  }

  private socket;

  private created() {
    this.museClient = new MuseClient();
  }

  private async connectToRemoteController() {
    this.socket = io('http://127.0.0.1:3000/', {
      reconnectionAttempts: 2
    });

    this.socket.on('connect', () => {
      this.n = 100;
      this.alpha = 1;
      this.paused = false;
    });

    this.socket.on('control', (controlValues) => {
      this.n = controlValues.n;
      this.alpha = controlValues.alpha;
      this.beta1 = controlValues.beta1;
      this.beta2 = controlValues.beta2;
      this.beta3 = controlValues.beta3;
      this.gamma = controlValues.gamma;
    });

    this.socket.on('disconnect', () => {
      this.paused = true;
      this.n = 0;
    })
  }

  private async connectToMuse() {
    if (!this.connectionStatus) {
      await this.museClient.connect();
      await this.museClient.start();
      this.museClient.connectionStatus.subscribe(
        cS => this.connectionStatus = cS
      );
    }

    this.startSession();
  }

  private startSession() {
    function clamp (v) {
      return Math.max(Math.min(1, v), 0);
    }

    this.currentSession = [];
    if (this.currentSessionSubscription) {
      this.currentSessionSubscription.unsubscribe();
    }

    // @ts-ignore
    this.currentSessionSubscription = (this.museClient.relativeBandPowers as Observable<EEGRelativePowerBand[]>)
      .pipe(
        bufferCount(100, 25)
      ,
        map( (sessions: EEGRelativePowerBand[][]): EEGRelativePowerBand[] =>
          Object.keys(POWER_BANDS).map( (k): EEGRelativePowerBand => {
            return {
              band: POWER_BANDS[k],
              power: sessions.map(
                  (session: EEGRelativePowerBand[]): number => {
                    let bandSession = session.find( r => r.band.id == POWER_BANDS[k].id );
                    if (bandSession) {
                      return bandSession.power;
                    } else {
                      return NaN;
                    }
                  }
                ).reduce(
                  ((sumOfSessions, bandSessionValue) =>
                    sumOfSessions += bandSessionValue
                  ), 0
                ) / sessions.length
            };
          })
        )
      ,
        map( (rbps: EEGRelativePowerBand[]): AveragedRelativeBandPowers => {
          let arbps: AveragedRelativeBandPowers = {};
          rbps.forEach( (rbp) => arbps[rbp.band.id] = rbp.power );
          return arbps;
        })
      ).subscribe(
        (arbps: AveragedRelativeBandPowers) => {
          if ( _.some(arbps, v => _.isNaN(v) ) )
            return;
          this.currentSession.push(Object.freeze(arbps));
          this.currentSession = _.takeRight(this.currentSession, 100);
          this.n = Math.min(this.currentSession.length * 5, 100);

          if (this.partyMode) {
            this.alpha = clamp(
              ( arbps.ALPHA - this.partyScales.ALPHA[0] ) / ( this.partyScales.ALPHA[1] - this.partyScales.ALPHA[0])
            );
            this.beta1 = clamp(
              ( arbps.BETA_1 - this.partyScales.BETA_1[0] ) / ( this.partyScales.BETA_1[1] - this.partyScales.BETA_1[0])
            );
            this.beta2 = clamp(
              ( arbps.BETA_2 - this.partyScales.BETA_2[0] ) / ( this.partyScales.BETA_2[1] - this.partyScales.BETA_2[0])
            );
            this.beta3 = clamp(
              ( arbps.BETA_3 - this.partyScales.BETA_3[0] ) / ( this.partyScales.BETA_3[1] - this.partyScales.BETA_3[0])
            );
            this.gamma = clamp(
              ( arbps.GAMMA - this.partyScales.GAMMA[0] ) / ( this.partyScales.GAMMA[1] - this.partyScales.GAMMA[0])
            );
          } else {
            this.alpha = (
              arbps.ALPHA - Math.min(...this.currentSession.map( d => d.ALPHA ))
            ) / (
              Math.max(...this.currentSession.map( d => d.ALPHA )) - Math.min(...this.currentSession.map( d => d.ALPHA ))
            );
            this.gamma = (
              arbps.GAMMA - Math.min(...this.currentSession.map( d => d.GAMMA ))
            ) / (
              Math.max(...this.currentSession.map( d => d.GAMMA )) - Math.min(...this.currentSession.map( d => d.GAMMA ))
            );
            this.beta1 = (
              arbps.BETA_1 - Math.min(...this.currentSession.map( d => d.BETA_1 ))
            ) / (
              Math.max(...this.currentSession.map( d => d.BETA_1 )) - Math.min(...this.currentSession.map( d => d.BETA_1 ))
            );
            this.beta2 = (
              arbps.BETA_2 - Math.min(...this.currentSession.map( d => d.BETA_2 ))
            ) / (
              Math.max(...this.currentSession.map( d => d.BETA_2 )) - Math.min(...this.currentSession.map( d => d.BETA_2 ))
            );
            this.beta3 = (
              arbps.BETA_3 - Math.min(...this.currentSession.map( d => d.BETA_3 ))
            ) / (
              Math.max(...this.currentSession.map( d => d.BETA_3 )) - Math.min(...this.currentSession.map( d => d.BETA_3 ))
            );
          }
        }
      );
    this.sessionInProgress = true;
    this.paused = false;
  }

  private toggleScreenshotPanel () {
    this.screenshotEmail = '';
    this.screenshotSent = false;
    this.screenshotPanelOpened = !this.screenshotPanelOpened;
  }

  private stopSession() {
    if (this.currentSessionSubscription) {
      this.currentSessionSubscription.unsubscribe();
    }
    this.sessionInProgress = false;
    this.paused = true;
    this.n = 0;
  }

  private toggleVizControlsDisplayed() {
    this.vizControlsDisplayed = !this.vizControlsDisplayed;
  }

  private reload() {
    window.location.reload();
  }

  private saveScreenshot() {
    let canvas = this.$el.querySelector('canvas');
    if (!canvas) { return }

    canvas.toBlob( (blob) => {
      if (!blob) { return }
      saveAs(blob, `${this.screenshotEmail || 'anonymous'}-${Date().toString()}.png`);
      this.screenshotSent = true;
      this.screenshotEmail = '';

      setTimeout( () => {
        this.screenshotPanelOpened = false
      }, 6000)

    });
  }

  private beforeDestroy() {
    this.stopSession();
  }
}
</script>

<style scoped lang="scss">
.muse-recorder {
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.muse-recorder__viz-container {
  position: absolute;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.muse-recorder__connection,
.muse-recorder__session-control,
.muse-recorder__greeting,
.muse-recorder__viz-controls-toggle,
.muse-recorder__viz-controls,
.muse-recorder__stop-button,
.muse-recorder__chart-toggle,
.muse-recorder__session-details,
.muse-recorder__info-toggle,
.muse-recorder__info-panel,
.muse-recorder__screenshot-toggle,
.muse-recorder__screenshot-panel {
  position: absolute;
  background: transparent;
  padding: 1em;
  box-sizing: border-box;
}

.muse-recorder__greeting {
  padding: 0;
  color: white;
  text-align: center;
  margin: auto;
  height: 100%;
  width: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  font-family: 'Rajdhani', sans-serif;
  transition: opacity 10s;
}

.muse-recorder__greeting-title {
  font-weight: 300;
  filter: blur(1.5px);
  opacity: 0.7;
}

.muse-recorder__greeting-tuto {
  font-size: 20px;
  margin-top: 2em;
  margin-left: auto;
  margin-right: auto;
  font-weight: bold;
  color: gray;
  padding: 20px;
  border-radius: 0.1em;
  background-color: transparentize(white, 0.9);
}

.muse-recorder__greeting-tuto-button {
  cursor: pointer;
  font-size: larger;
  padding: 0.5em 1em;
  margin: 1em auto;
  border: solid gray 1px;
  width: auto;
  font-weight: bolder;
  max-width: 100px;
  text-transform: uppercase;
  text-align: center; 

  &:focus,
  &:active,
  &:hover {
    background-color: gray;
    color: black;
  }
}

.muse-recorder__greeting--connected {
  opacity: 0;
}

.muse-recorder__connection-icon,
.muse-recorder__session-control-icon,
.muse-recorder__session-details-icon,
.muse-recorder__viz-controls-toggle,
.muse-recorder__stop-button,
.muse-recorder__chart-toggle,
.muse-recorder__info-toggle,
.muse-recorder__screenshot-toggle {
  color: gray;
  cursor: pointer;
}

.muse-recorder__connection {
  top: 0;
  right: 0;
  font-size: 2em;
  opacity: 1;
  transition: opacity 1s;
}

.muse-recorder__viz-controls-toggle {
  top: 0;
  right: 0;
}

.muse-recorder__chart-toggle {
  bottom: 0;
  left: 0;
}

.muse-recorder__info-toggle {
  top: 0;
  left: 0;
}

.muse-recorder__screenshot-toggle {
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
}

.muse-recorder__session-details,
.muse-recorder__viz-controls,
.muse-recorder__info-panel,
.muse-recorder__screenshot-panel {
  display: flex;
  background: transparentize(white, 0.9);
  color: lightgray;
}

.muse-recorder__info-panel {
  background: transparentize(black, 0.3);
  padding-top: 50px;
  text-align: left;
  font-size: 20px;
  font-family: 'Rajdhani', sans-serif;
  font-weight: bold;
  max-height: 100%;
  overflow-y: auto;
  overflow-x: hidden;
}

.muse-recorder__screenshot-panel {
  bottom: 0;
  left: 0;
  right: 0;
  padding: 50px;
  text-align: center;

  > div {
    flex: 1;
    display: flex;
    justify-content: space-around;

    > input {
      font-size: 1.5em;
      flex: 1;
      margin-right: 30px;
    }
  }
}


.muse-recorder__viz-controls {
  right: 0;
  top: 0;
  bottom: 0;
  min-width: 150px;
  flex-direction: column;
  justify-content: space-around;
}

.muse-recorder__stop-button {
  color: lightgray;
  bottom: 0;
  right: 0;
  font-family: 'Rajdhani', sans-serif;
  font-size: larger;
  font-weight: bold;
  text-transform: uppercase;
}

.muse-recorder__connection--connected {
  opacity: 0;

  &:hover {
    opacity: 1;
  }

  .muse-recorder__session-control-icon {
    color: blue;
  }
}

.muse-recorder__session-control {
  bottom: 0;
  left: 0;
  right: 0;
  opacity: 0;
  transition: opacity 1s;
  display: flex;
  flex-direction: column;
  background: transparentize(black, 0.5);
  color: white;

  .muse-recorder__session-control-icon {
    flex: 1;
  }

  &:hover {
    opacity: 1;
  }
}

.muse-recorder__main-controls {
  display: flex;
}

.muse-recorder__session-details {
  bottom: 0;
  background: transparentize(black, 0.5);
  margin: auto;
}

.muse-recorder__viz-controls {
  display: flex;
  justify-content: space-between;

  > * {
    flex-grow: 0;
    flex-shrink: 0;
  }

  pre {
    width: 150px;
    overflow: hidden;
  }
}
</style>
