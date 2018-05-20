<template>
  <div class="muse-recorder">
    <div>
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
        :k1="k1"
        :k2="k2"
        :n="n"
        :paused="paused"
      ></field-visualization>
    </div>

    <div
      class="muse-recorder__connection"
      :class="{'muse-recorder__connection--connected': connectionStatus}"
    >
      <font-awesome-icon
        class="muse-recorder__connection-icon"
        :icon="['fab', connectionStatus ? 'bluetooth-b' : 'bluetooth']"
        @click="connectionStatus ? disconnect() : connectToMuse()"
      />
    </div>

    <div
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
        <div class="muse-recorder__viz-controls">
          <button
            @click="paused = !paused"
          > Pause viz
          </button>
          <input
            type="range"
            v-model.number="k1"
            min="0"
            max="1"
            step="0.01"
          />
          <pre>k1: {{ k1 }}</pre>
          <input
            type="range"
            v-model.number="k2"
            min="0"
            max="1"
            step="0.01"
          />
          <pre>k2: {{ k2 }}</pre>
          <input
            type="range"
            v-model.number="n"
            min="0"
            max="100"
            step="1"
          />
          <pre>n: {{ n }}</pre>
        </div>
        <Session
          v-if="currentSession.length"
          :sessionData="currentSession"
        >
        </Session>
        <div v-else>
          No session data
        </div>
      </div>
    </div>

  </div>
</template>

<script lang="ts">
import _ from 'lodash';
import { Component, Inject, Vue } from 'vue-property-decorator';
import { MuseClient } from 'muse-js';
import { EEGRelativePowerBand, POWER_BANDS, FrequencyBand } from 'muse-js/dist/lib/process-samples';
import { Observable } from 'rxjs/Observable';
import { Subscription } from 'rxjs/Subscription';
import { bufferCount, map } from 'rxjs/operators';
import Session from './Session.vue';
import Visualization from './Visualization.vue';
import ParticlesVisualization from './ParticlesVisualization.vue';
import FieldVisualization from './FieldVisualization.vue';

import FontAwesomeIcon from '@fortawesome/vue-fontawesome';

import fontawesome from '@fortawesome/fontawesome';
import faBluetooth from '@fortawesome/fontawesome-free-brands/faBluetooth';
import faBluetoothB from '@fortawesome/fontawesome-free-brands/faBluetoothB';
import faPlayCircle from '@fortawesome/fontawesome-free-regular/faPlayCircle';
import faPauseCircle from '@fortawesome/fontawesome-free-regular/faPauseCircle';
import faCaretSquareDown from '@fortawesome/fontawesome-free-regular/faCaretSquareDown';
import faCaretSquareUp from '@fortawesome/fontawesome-free-regular/faCaretSquareUp';

fontawesome.library.add(
  faBluetooth, faBluetoothB,
  faPlayCircle, faPauseCircle,
  faCaretSquareDown, faCaretSquareUp
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

  private currentSession: AveragedRelativeBandPowers[] = [];

  private k1: number = 0;
  private k2: number = 0;
  private n: number = 0;
  private paused: boolean = true;
  private sessionsDetailsOpened: boolean = false;

  private created() {
    this.museClient = new MuseClient();
  }

  private async connectToMuse() {
    await this.museClient.connect();
    await this.museClient.start();

    this.startSession();

    this.museClient.connectionStatus.subscribe(
      cS => this.connectionStatus = cS
    );
  }

  private startSession() {
    this.currentSession = [];
    this.currentSessionSubscription = (this.museClient.relativeBandPowers as Observable<EEGRelativePowerBand[]>)
      .pipe(
        bufferCount(100, 10)
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
        (arbps) => {
          this.currentSession.push(Object.freeze(arbps));
          this.currentSession = _.takeRight(this.currentSession, 100);
          this.n = this.currentSession.length;
          this.k1 = (
            arbps.ALPHA - Math.min(...this.currentSession.map( d => d.ALPHA ))
          ) / (
            Math.max(...this.currentSession.map( d => d.ALPHA )) - Math.min(...this.currentSession.map( d => d.ALPHA ))
          );
          this.k2 = (
            arbps.GAMMA - Math.min(...this.currentSession.map( d => d.GAMMA ))
          ) / (
            Math.max(...this.currentSession.map( d => d.GAMMA )) - Math.min(...this.currentSession.map( d => d.GAMMA ))
          );
        }
      );
    this.sessionInProgress = true;
    this.paused = false;
  }

  private stopSession() {
    if (this.currentSessionSubscription) {
      this.currentSessionSubscription.unsubscribe();
    }
    this.sessionInProgress = false;
    this.paused = true;
  }

  private beforeDestroy() {
    this.stopSession();
  }
}
</script>

<style scoped lang="scss">
.muse-recorder__connection,
.muse-recorder__session-control {
  position: absolute;
  background: transparent;
  padding: 1em;
}

.muse-recorder__connection-icon,
.muse-recorder__session-control-icon,
.muse-recorder__session-details-icon {
  color: white;
  cursor: pointer;
}

.muse-recorder__connection {
  top: 0;
  right: 0;
  font-size: 2em;
  opacity: 1;
  transition: opacity 1s;
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
