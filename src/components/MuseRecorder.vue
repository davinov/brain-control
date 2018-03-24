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

    <div class="muse-recorder__recordings">
      <button
        v-if="connectionStatus && !recordingInProgress"
        @click="startRecording()"
      > Start a new recording
      </button>
      <button
        v-if="recordingInProgress"
        @click="stopRecording()"
      > Stop the recording
      </button>
      <Recording
        :recordingData="currentRecording"
      >
      </Recording>
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
import Recording from './Recording.vue';

export interface AveragedRelativeBandPowers {
  [index: string]: number;
}

@Component({
  components: {
    Recording
  }
})
export default class MuseRecorder extends Vue {
  private museClient: MuseClient;
  private connectionStatus: boolean = false;
  private recordingInProgress: boolean = false;
  private currentRecordingSubscription: Subscription;

  private currentRecording: AveragedRelativeBandPowers[] = [];

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

  private startRecording() {
    this.currentRecording = [];
    this.currentRecordingSubscription = (this.museClient.relativeBandPowers as Observable<EEGRelativePowerBand[]>)
      .pipe(
        bufferCount(100, 10)
      ,
        map( (recordings: EEGRelativePowerBand[][]): EEGRelativePowerBand[] =>
          Object.keys(POWER_BANDS).map( (k): EEGRelativePowerBand => {
            return {
              band: POWER_BANDS[k],
              power: recordings.map(
                  (recording: EEGRelativePowerBand[]): number => {
                    let bandRecording = recording.find( r => r.band.id == POWER_BANDS[k].id );
                    if (bandRecording) {
                      return bandRecording.power;
                    } else {
                      return NaN;
                    }
                  }
                ).reduce(
                  ((sumOfRecordings, bandRecordingValue) =>
                    sumOfRecordings += bandRecordingValue
                  ), 0
                ) / recordings.length
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
        (arbps) => this.currentRecording.push(arbps)
      );
    this.recordingInProgress = true;
  }

  private stopRecording() {
    this.currentRecordingSubscription.unsubscribe();
    this.recordingInProgress = false;
  }

  private beforeDestroy() {
    this.stopRecording();
  }
}
</script>

<style scoped lang="scss">

</style>
