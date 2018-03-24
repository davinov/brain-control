<template>
  <div class="muse-recorder__controls">
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
</template>

<script lang="ts">
import { Component, Inject, Vue } from 'vue-property-decorator';
import { MuseClient } from 'muse-js';

@Component
export default class MuseRecorder extends Vue {
  private museClient: MuseClient;
  private connectionStatus: boolean = false;

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
}
</script>

<style scoped lang="scss">

</style>
