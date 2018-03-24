<template>
  <div class="muse-recorder__session">
    <svg
      class="session__chart"
      :width="width"
      :height="height"
    >
      <path
        :class="['session__serie', 'session__serie--' + serie.toLowerCase()]"
        v-for="serie in series"
        :key="serie"
        :d="lineForSerie(serie)"
      ></path>
    </svg>

    <button @click="saveAsJSON()">
      Export session to JSON file
    </button>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Prop } from 'vue-property-decorator';
import { AveragedRelativeBandPowers } from './MuseRecorder.vue';
import { line } from 'd3-shape';
import { scaleLinear } from 'd3-scale';
import { saveAs } from 'file-saver';

@Component
export default class Session extends Vue {
  @Prop({ default: [] })
  sessionData: AveragedRelativeBandPowers[];
  
  @Prop({ default: 800 })
  width: number;

  @Prop({ default: 500 })
  height: number;

  get series(): string[] {
    return Object.keys(this.sessionData[0] || {});
  }

  get xScale() {
    return scaleLinear()
      .domain([0, this.sessionData.length - 1])
      .range([0, this.width]);
  }

  get yScale() {
    return scaleLinear()
      .domain([0, 1])
      .range([0, this.height]);
  }

  private lineForSerie(serie: string): string | null {
    return line()(this.sessionData.map(
      (v, i) => [
        this.xScale(i),
        this.yScale(v[serie])
      ] as [number, number]
    ));
  }

  private saveAsJSON(): void {
    let blob = new Blob(
      [JSON.stringify(this.sessionData, null, 2)],
      {type: "application/json;charset=utf-8"}
    );
    let exportDate = new Date();
    let filename = `muse-session-${exportDate.toISOString()}.json` 
    saveAs(blob, filename);
  }
}
</script>

<style scoped lang="scss">
.session__serie {
  stroke: black;
  stroke-width: 2px;
  fill: none;
}

.session__serie--delta {
  stroke: gray;
}
.session__serie--theta {
  stroke: aqua;
}
.session__serie--alpha {
  stroke: blue;
}
.session__serie--beta {
  stroke: red;
}
.session__serie--gamma {
  stroke: orange;
}

</style>
