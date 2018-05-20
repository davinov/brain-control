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

    <div class="session__legend">
      <div
        :class="['session__legend__item', 'session__legend__item--' + serie.toLowerCase()]"
        v-for="serie in series"
        :key="serie"
      >
        <div class="session__legend__item__color"></div>
        <span>{{ serie }}</span>
      </div>
    </div>

    <button @click="saveAsJSON()" style="flex: none; height: 2em;">
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
      .domain([0, 0.5])
      .range([this.height, 0]);
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
.muse-recorder__session {
  display: flex;
  flex-direction: row;
  align-items: flex-end;
  justify-content: space-around;
}

.session__serie {
  stroke: black;
  stroke-width: 2px;
  fill: none;
}

.session__legend {
  text-align: left;
}

.session__legend__item__color {
  display: inline-block;
  width: 1em;
  height: 0.5em;
  margin-right: 0.5em;
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

.session__legend__item--delta .session__legend__item__color {
  background-color: gray;
}
.session__legend__item--theta .session__legend__item__color {
  background-color: aqua;
}
.session__legend__item--alpha .session__legend__item__color {
  background-color: blue;
}
.session__legend__item--beta .session__legend__item__color {
  background-color: red;
}
.session__legend__item--gamma .session__legend__item__color {
  background-color: orange;
}

button {
  background: none;
  color: white;
  text-decoration: underline;
  border: none;
  cursor: pointer;
}

</style>
