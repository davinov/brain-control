<template>
  <div class="muse-recorder">

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
import { Component, Inject, Vue } from 'vue-property-decorator';
import { MuseClient } from 'muse-js';
import { EEGRelativePowerBand, POWER_BANDS, FrequencyBand } from 'muse-js/dist/lib/process-samples';
import { Observable } from 'rxjs/Observable';
import { Subscription } from 'rxjs/Subscription';
import { bufferCount, map } from 'rxjs/operators';
import Session from './Session.vue';

export interface AveragedRelativeBandPowers {
  [index: string]: number;
}

@Component({
  components: {
    Session
  }
})
export default class MuseRecorder extends Vue {
  private museClient: MuseClient;
  private connectionStatus: boolean = false;
  private sessionInProgress: boolean = false;
  private currentSessionSubscription: Subscription;

  private currentSession: AveragedRelativeBandPowers[] = [];

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
        (arbps) => this.currentSession.push(arbps)
      );
    this.sessionInProgress = true;
  }

  private stopSession() {
    if (this.currentSessionSubscription) {
      this.currentSessionSubscription.unsubscribe();
    }
    this.sessionInProgress = false;
  }

  private beforeDestroy() {
    this.stopSession();
  }
}
</script>

<style scoped lang="scss">

</style>
