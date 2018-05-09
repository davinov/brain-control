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
        :paused="paused"
      ></field-visualization>
    </div>

    <div class="muse-recorder__controls">
      <button
        @click="paused = !paused"
      > Pause
      </button>
      <input
        type="range"
        v-model.number="k1"
        min="0"
        max="1"
        step="0.01"
      />
      <pre>{{ k1 }}</pre>
      <input
        type="range"
        v-model.number="k2"
        min="0"
        max="1"
        step="0.01"
      />
      <pre>{{ k2 }}</pre>
    </div>

    <div class="muse-recorder__connection">
      <div
        v-if="connectionStatus"
      > Connected to muse
      </div>

      <button
        v-else
        @click="connectToMuse()"
      > Connect
      </button>
    </div>

    <div class="muse-recorder__sessions">
      <button
        v-if="connectionStatus && !sessionInProgress"
        @click="startSession()"
      > Start a new session
      </button>
      <button
        v-if="sessionInProgress"
        @click="stopSession()"
      > Stop the session
      </button>
      <Session
        v-if="currentSession.length"
        :sessionData="currentSession"
      >
      </Session>
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

export interface AveragedRelativeBandPowers {
  [index: string]: number;
}

@Component({
  components: {
    Session,
    Visualization,
    ParticlesVisualization,
    FieldVisualization,
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
  private paused: boolean = false;

  private created() {
    this.museClient = new MuseClient();
  }

  private async connectToMuse() {
    await this.museClient.connect();
    await this.museClient.start();

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
.muse-recorder__controls {
  position: absolute;
  background: white;
}
</style>
