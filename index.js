// Note that a dynamic `import` statement here is required due to
// webpack/webpack#6615, but in theory `import { greet } from './pkg';`
// will work here one day as well!
const rust = import('./pkg');

import uPlot from 'uplot'

import { timelinePlugin, unsetSameFutureValues } from './uplotTimeline.js'
import { MapPlot } from './mapPlot.js'

const GNSS_MODES = {
  0: null,
  1: "SPS",
  2: "DGPS",
  3: "RTK Float",
  4: "RTK Fixed",
  5: "Dead Reckoning",
  6: "SBAS",
  7: "Manual",
  8: "Simulator",
  9: "Unknown"
}

const INSS_MODES = {
  0: null,
  1: "On"
}
const matchSyncKeys = (own, ext) => own == ext;
let mooSync = uPlot.sync("moo");
const cursorOpts = {
  lock: false,

  sync: {
    key: mooSync.key,
    match: [matchSyncKeys, matchSyncKeys]
  },
};

let map = new MapPlot(document.getElementById("map"));


function makeStatsPlot(data, domElement) {
  let size = document.getElementById("stats_graph").getBoundingClientRect();
  console.log(size);
  const opts = {
   // title: "Stats",
    width: size['width']-30,
    height: size['height']-50,
    cursor: {
      drag: {
        setScale: false,
        x: true,
        y: false,
      }
    },
    class: "bg-white",
    cursor: cursorOpts,
    scales: {
      x: {
        time: false,
      }
    },
    series: [
      {},
      {
        label: "sats used",
        stroke: "red"
      },
      {
        label: "sog (m/s)",
        stroke: "blue"
      }
    ],
    hooks: {
      setCursor: [
        u => {

          set_cursor(u);
        }
      ],
      setScale: [
        u => {
          set_scale(u);
        }
      ]
    }
  };

  let u = new uPlot(opts, data, domElement);


  mooSync.sub(u);
}

function makeTimelineChart(data, domElement) {
  let statesDisplay = [
    {},
    {
      "SPS": { color: "red" },
      "SBAS": { color: "purple" },
      "DGPS": { color: "cyan" },
      "RTK Float": { color: "blue" },
      "RTK Fixed": { color: "green" },
      "Dead Reckoning": { color: "black" },
      "Manual": { color: "pink" },
      "Simulator": { color: "pink" },
      "Unknown": { color: "pink" }
    },
    {
      "On": { color: "black" },
    },
  ];

  let config = {
    "mode": 1,
    "time": false,
    "size": [
      0.9,
      100
    ],
    fill: (seriesIdx, dataIdx, value) => statesDisplay[seriesIdx][value].color,
    stroke: (seriesIdx, dataIdx, value) => statesDisplay[seriesIdx][value].color,
  };

  let size = domElement.getBoundingClientRect();

  const opts = {
    width: size['width'] - 50,
    height: 200,
    title: "Modes",
    drawOrder: ["series", "axes"],
    scales: {
      x: {
        time: false,
      }
    },
    axes: [
      {},
      {},
    ],
    legend: {
      live: false,
      markers: {
        width: 0,
      }
    },
    cursor: cursorOpts,
    padding: [null, 0, null, 0],
    series: [
      {
        label: "Lib Name"
      },
      {
        label: "GNSS Mode",
        fill: "white",
        stroke: "white",
        width: 4,
      },
      {
        label: "INS Mode",
        fill: "white",
        stroke: "white",
        width: 4,
      },
    ],
    plugins: [
      timelinePlugin({
        count: data.length - 1,
        ...config,
      }),
    ],
  };

  let u = new uPlot(opts, data, domElement);
  mooSync.sub(u);
}



var dataSbp = null;

let last_idx = null;

function set_cursor(u) {
  let index_value = u.cursor.idx;

  if (index_value == last_idx || index_value == null) {
    return;
  }
  //console.log(dataSbp);
  last_idx = index_value;

  map.setMarker(dataSbp['lats'][index_value], dataSbp['lons'][index_value], dataSbp['cogs'][index_value]);
}

function set_scale(u) {
  console.log(u);
  let x_max = u.scales.x.max;
  let x_min = u.scales.x.min;
  let x_idx = [u.valToIdx(x_min), u.valToIdx(x_max)];

  map.setZoom(x_idx[0], x_idx[1]);
}


function onSbpFileData(fileData) {
  var t0 = performance.now();
  document.getElementById("filePickerSection").classList.add('hidden');
  document.getElementById("fileLoadingSection").classList.remove('hidden');

  // Add a 'sleep' here to give the UI a chance to redraw. Otherwise we won't see the spinner.
  setTimeout(function(){ 
    var sbpData = rust.then(m => m.handle_sbp_file_data(new Uint8Array(fileData)));
    console.log(sbpData);
  
    sbpData.then(sbpData => {
      document.getElementById("filepicker").classList.add('hidden');
      document.getElementById("graph_content").classList.remove("hidden");
      console.log(sbpData);
      var t1 = performance.now();
      console.log("Call to rust took " + (t1 - t0) + " milliseconds.");
  
      const data = [
        sbpData['tow'],
        sbpData['sat_useds'],
        sbpData['sog']
      ];
  
      dataSbp = sbpData;
      makeStatsPlot(data, document.getElementById("stats_graph"));
      map.init(sbpData["lats"], sbpData["lons"]);
      let timeLineData = [
        sbpData['tow'],
        sbpData['gnss_mode'].map(function (m) { return GNSS_MODES[m] }),
        sbpData['ins_mode'].map(function (i) { return INSS_MODES[i] })
      ]
      unsetSameFutureValues(timeLineData);
      makeTimelineChart(timeLineData, document.getElementById("mode_graph"));
    });
  
  }, 10);

}

window.onSbpFileData = onSbpFileData;

