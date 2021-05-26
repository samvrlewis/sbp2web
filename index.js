// Note that a dynamic `import` statement here is required due to
// webpack/webpack#6615, but in theory `import { greet } from './pkg';`
// will work here one day as well!
const rust = import('./pkg');

function pointWithin(px, py, rlft, rtop, rrgt, rbtm) {
  return px >= rlft && px <= rrgt && py >= rtop && py <= rbtm;
}

function unsetSameFutureValues(series) {
  series.forEach((values, i) => {
    if (i == 0)
      return;

    let prevVal = values[0];

    for (let i = 1; i < values.length; i++) {
      let value = values[i];

      if (value === null)
        prevVal = null;
      else {
        if (value === prevVal)
          values[i] = undefined;
        else if (value != null)
          prevVal = value;
      }
    }
  });
}

const MAX_OBJECTS = 10;
const MAX_LEVELS  = 4;

const GNSS_MODES = {
  0 : null,
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

function Quadtree(x, y, w, h, l) {
  let t = this;

  t.x = x;
  t.y = y;
  t.w = w;
  t.h = h;
  t.l = l || 0;
  t.o = [];
  t.q = null;
};

const proto = {
  split: function() {
    let t = this,
      x = t.x,
      y = t.y,
      w = t.w / 2,
      h = t.h / 2,
      l = t.l + 1;

    t.q = [
      // top right
      new Quadtree(x + w, y,     w, h, l),
      // top left
      new Quadtree(x,     y,     w, h, l),
      // bottom left
      new Quadtree(x,     y + h, w, h, l),
      // bottom right
      new Quadtree(x + w, y + h, w, h, l),
    ];
  },

  // invokes callback with index of each overlapping quad
  quads: function(x, y, w, h, cb) {
    let t            = this,
      q            = t.q,
      hzMid        = t.x + t.w / 2,
      vtMid        = t.y + t.h / 2,
      startIsNorth = y     < vtMid,
      startIsWest  = x     < hzMid,
      endIsEast    = x + w > hzMid,
      endIsSouth   = y + h > vtMid;

    // top-right quad
    startIsNorth && endIsEast && cb(q[0]);
    // top-left quad
    startIsWest && startIsNorth && cb(q[1]);
    // bottom-left quad
    startIsWest && endIsSouth && cb(q[2]);
    // bottom-right quad
    endIsEast && endIsSouth && cb(q[3]);
  },

  add: function(o) {
    let t = this;

    if (t.q != null) {
      t.quads(o.x, o.y, o.w, o.h, q => {
        q.add(o);
      });
    }
    else {
      let os = t.o;

      os.push(o);

      if (os.length > MAX_OBJECTS && t.l < MAX_LEVELS) {
        t.split();

        for (let i = 0; i < os.length; i++) {
          let oi = os[i];

          t.quads(oi.x, oi.y, oi.w, oi.h, q => {
            q.add(oi);
          });
        }

        t.o.length = 0;
      }
    }
  },

  get: function(x, y, w, h, cb) {
    let t = this;
    let os = t.o;

    for (let i = 0; i < os.length; i++)
      cb(os[i]);

    if (t.q != null) {
      t.quads(x, y, w, h, q => {
        q.get(x, y, w, h, cb);
      });
    }
  },

  clear: function() {
    this.o.length = 0;
    this.q = null;
  },
};

Object.assign(Quadtree.prototype, proto);

global.Quadtree = Quadtree;


function roundDec(val, dec) {
  return Math.round(val * (dec = 10**dec)) / dec;
}

const SPACE_BETWEEN = 1;
const SPACE_AROUND  = 2;
const SPACE_EVENLY  = 3;

const coord = (i, offs, iwid, gap) => roundDec(offs + i * (iwid + gap), 6);

function distr(numItems, sizeFactor, justify, onlyIdx, each) {
  let space = 1 - sizeFactor;

  let gap =  (
      justify == SPACE_BETWEEN ? space / (numItems - 1) :
      justify == SPACE_AROUND  ? space / (numItems    ) :
      justify == SPACE_EVENLY  ? space / (numItems + 1) : 0
  );

  if (isNaN(gap) || gap == Infinity)
      gap = 0;

  let offs = (
      justify == SPACE_BETWEEN ? 0       :
      justify == SPACE_AROUND  ? gap / 2 :
      justify == SPACE_EVENLY  ? gap     : 0
  );

  let iwid = sizeFactor / numItems;
  let _iwid = roundDec(iwid, 6);

  if (onlyIdx == null) {
      for (let i = 0; i < numItems; i++)
          each(i, coord(i, offs, iwid, gap), _iwid);
  }
  else
      each(onlyIdx, coord(onlyIdx, offs, iwid, gap), _iwid);
}


import uPlot from 'uplot'


const { round, min, max, ceil } = Math;




var dataSbp = null;

let last_idx = null;
var m = null;

function set_cursor(u) {
  let index_value = u.cursor.idx;

  if (index_value == last_idx || index_value == null) {
    return;
  }
  //console.log(dataSbp);
  last_idx = index_value;
  let pos = { lat: dataSbp['lats'][index_value], lng: dataSbp['lons'][index_value] };
  if (m != null) {
    m.setMap(null);
  }
  
  m = new google.maps.Marker({
    position: pos,
    icon: {
      path: google.maps.SymbolPath.FORWARD_OPEN_ARROW,
      scale: 4,
      rotation: dataSbp['cogs'][index_value]
    },
    draggable: true,
    map: map,
  });
}

function set_scale(u) {
  console.log(u);
  let x_max = u.scales.x.max;
  let x_min = u.scales.x.min;
  let x_idx = [u.valToIdx(x_min), u.valToIdx(x_max)];

  var bounds = new google.maps.LatLngBounds();
  for (let i=x_idx[0]; i < x_idx[1] ; i++) {
    let pos = { lat: dataSbp['lats'][i], lng: dataSbp['lons'][i] };
    bounds.extend(pos);
  }
  map.setCenter(bounds.getCenter());
  map.fitBounds(bounds);
}


document.querySelector('input').addEventListener('change', function() {
  var t0 = performance.now()
  var reader = new FileReader();
  let mooSync = uPlot.sync("moo");
  const matchSyncKeys = (own, ext) => own == ext;
const cursorOpts = {
  lock: false,

  sync: {
    key: mooSync.key,
    setSeries: true,
    match: [matchSyncKeys, matchSyncKeys]
  },
};


const opts = {
  width: 800,
  height: 400,
  cursor: {
    drag: {
      setScale: false,
      x: true,
      y: false,
    }
  },
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

function makeTimelineChart(o, d) {
  const optsd = {
    width:  1920,
    height: 300,
    title: "Timeline / Discrete",
    drawOrder: ["series", "axes"],
    scales: {
      x: {
        time:false,
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
        fill:  "#33BB55",
        stroke: "white",
        width: 4,
      },
      {
        label: "INS Mode",
        fill:  "#B56FAB",
        stroke: "white",
        width: 4,
      },
    ],
    plugins: [
      timelinePlugin({
        count: d.length - 1,
        ...o,
      }),
    ],
  };

  let u = new uPlot(optsd, d, document.body);
  mooSync.sub(u);
}



  reader.onload = function() {

    var arrayBuffer = this.result;
    console.log(arrayBuffer);
    var sbpData = rust.then(m => m.handle_sbp_file_data(new Uint8Array(arrayBuffer)));
    console.log(sbpData);
    sbpData.then(sbpData => {
      console.log(sbpData);
      var t1 = performance.now();
      console.log("Call to rust took " + (t1 - t0) + " milliseconds.");
      const data = [
        sbpData['tow'],
        sbpData['sat_useds'],
        sbpData['sog']
      ];
      dataSbp = sbpData;
      let u = new uPlot(opts, data, document.body);


      //u.addSeries([p['tow'], p['sogs']])

      mooSync.sub(u);

      let slider = document.getElementById("slider");
      var output = document.getElementById("demo");
      
      slider.oninput = function() {
        // find the tow
        let percentage = this.value;
        let elements = sbpData['tow'].length;
        let last_tow = sbpData['tow'][elements-1];
        let first_tow = sbpData['tow'][0];

        let index_value = Math.floor(sbpData['tow'].length * (percentage/10000.0));
        index_value = Math.min(index_value, sbpData['tow'].length - 1);
        index_value = Math.max(index_value, 0);
        output.innerHTML = sbpData['tow'][index_value];



        u.setCursor({
          left: u.valToPos(u.data[0][index_value], 'x'),
          top:  u.valToPos(u.data[1][index_value], 'y'),
        });
        u.cursor._lock = true;


        u.setSeries(null, {focus: true})
      } 


      let middle = Math.floor(sbpData['tow'].length/2);
      map = new google.maps.Map(document.getElementById("map"), {
        center: { lat: sbpData['lats'][middle], lng: sbpData['lons'][middle] },
        zoom: 12,
      });
      var bounds = new google.maps.LatLngBounds();

      let pathCoords = [];
      const marker_freq = 1000;
      
      for (let i=0; i < sbpData['lons'].length ; i++) {
        let pos = { lat: sbpData['lats'][i], lng: sbpData['lons'][i] };
        pathCoords.push(pos);
        bounds.extend(pos);

        if (i % marker_freq == 0)
        {

        }
      }

      const path = new google.maps.Polyline({
        path: pathCoords,
        geodesic: true,
        strokeColor: "#FF0000",
        strokeOpacity: 1.0,
        strokeWeight: 2,
      });
      path.setMap(map);

      map.setCenter(bounds.getCenter());
      map.fitBounds(bounds);
      
      //remove one zoom level to ensure no marker is on the edge.
      map.setZoom(map.getZoom());


      let data4 = [
        sbpData['tow'],
        sbpData['gnss_mode'].map(function(m) { return GNSS_MODES[m] }),
        sbpData['ins_mode'].map(function(i) { return INSS_MODES[i] })
      ]
      unsetSameFutureValues(data4);
      console.log(data4)
          
			let statesDisplay3 = [
				{},
				{
          "SPS": {color: "red"},
          "SBAS": {color: "purple"},
          "DGPS": {color: "cyan"},
          "RTK Float": {color: "blue"},
          "RTK Fixed": {color: "green"},
          "Dead Reckoning": {color: "black"},
          "Manual": {color: "pink"},
          "Simulator": {color: "pink"},
          "Unknown": {color: "pink"}
				},
				{
					"On":  {color: "black"},
				},
			];

      let config = {
        "title": "Merged same consecutive states",
        "mode": 1,
        "time": false,
        "size": [
          0.9,
          100
        ],
        fill:   (seriesIdx, dataIdx, value) =>  statesDisplay3[seriesIdx][value].color,
				stroke: (seriesIdx, dataIdx, value) =>  statesDisplay3[seriesIdx][value].color,
      };

      makeTimelineChart(config, data4);

    }

    );


  }
  reader.readAsArrayBuffer(this.files[0]);
})

let map;

function initMap() {
  
}

window.initMap = initMap;

function timelinePlugin(opts) {
  const { mode, count, fill, stroke } = opts;

  const pxRatio    = devicePixelRatio;

  const laneWidth   = 0.9;
  const laneDistr   = SPACE_BETWEEN;

  const font      = round(14 * pxRatio) + "px Arial";

  function walk(yIdx, count, dim, draw) {
    distr(count, laneWidth, laneDistr, yIdx, (i, offPct, dimPct) => {
      let laneOffPx = dim * offPct;
      let laneWidPx = dim * dimPct;

      draw(i, laneOffPx, laneWidPx);
    });
  }

  const size  = opts.size || [0.6, Infinity];
  const align = opts.align || 0;

  const gapFactor = 1 - size[0];
  const maxWidth  = (size[1] || inf) * pxRatio;

  const fillPaths = new Map();
  const strokePaths = new Map();

  function drawBoxes(ctx) {
    fillPaths.forEach((fillPath, fillStyle) => {
      ctx.fillStyle = fillStyle;
      ctx.fill(fillPath);
    });

    strokePaths.forEach((strokePath, strokeStyle) => {
      ctx.strokeStyle = strokeStyle;
      ctx.stroke(strokePath);
    });

    fillPaths.clear();
    strokePaths.clear();
  }

  function putBox(ctx, rect, xOff, yOff, lft, top, wid, hgt, strokeWidth, iy, ix, value) {
    let fillStyle = fill(iy + 1, ix, value);
    let fillPath = fillPaths.get(fillStyle);

    if (fillPath == null)
      fillPaths.set(fillStyle, fillPath = new Path2D());

    rect(fillPath, lft, top, wid, hgt);

    if (strokeWidth) {
      let strokeStyle = stroke(iy + 1, ix, value);
      let strokePath = strokePaths.get(strokeStyle);

      if (strokePath == null)
        strokePaths.set(strokeStyle, strokePath = new Path2D());

      rect(strokePath, lft + strokeWidth / 2, top + strokeWidth / 2, wid - strokeWidth, hgt - strokeWidth);
    }

    qt.add({
      x: round(lft - xOff),
      y: round(top - yOff),
      w: wid,
      h: hgt,
      sidx: iy + 1,
      didx: ix
    });
  }

  function drawPaths(u, sidx, idx0, idx1) {
    uPlot.orient(u, sidx, (series, dataX, dataY, scaleX, scaleY, valToPosX, valToPosY, xOff, yOff, xDim, yDim, moveTo, lineTo, rect) => {
      let strokeWidth = round((series.width || 0) * pxRatio);

      u.ctx.save();
      rect(u.ctx, u.bbox.left, u.bbox.top, u.bbox.width, u.bbox.height);
      u.ctx.clip();

      walk(sidx - 1, count, yDim, (iy, y0, hgt) => {
        // draw spans
        if (mode == 1) {
          for (let ix = 0; ix < dataY.length; ix++) {
            if (dataY[ix] != null) {
              let lft = round(valToPosX(dataX[ix], scaleX, xDim, xOff));

              let nextIx = ix;
              while (dataY[++nextIx] === undefined && nextIx < dataY.length) {}

              // to now (not to end of chart)
              let rgt = nextIx == dataY.length ? xOff + xDim + strokeWidth : round(valToPosX(dataX[nextIx], scaleX, xDim, xOff));

              putBox(
                u.ctx,
                rect,
                xOff,
                yOff,
                lft,
                round(yOff + y0),
                rgt - lft,
                round(hgt),
                strokeWidth,
                iy,
                ix,
                dataY[ix]
              );

              ix = nextIx - 1;
            }
          }
        }
        // draw matrix
        else {
          let colWid = valToPosX(dataX[1], scaleX, xDim, xOff) - valToPosX(dataX[0], scaleX, xDim, xOff);
          let gapWid = colWid * gapFactor;
          let barWid = round(min(maxWidth, colWid - gapWid) - strokeWidth);
          let xShift = align == 1 ? 0 : align == -1 ? barWid : barWid / 2;

          for (let ix = idx0; ix <= idx1; ix++) {
            if (dataY[ix] != null) {
              // TODO: all xPos can be pre-computed once for all series in aligned set
              let lft = valToPosX(dataX[ix], scaleX, xDim, xOff);

              putBox(
                u.ctx,
                rect,
                xOff,
                yOff,
                round(lft - xShift),
                round(yOff + y0),
                barWid,
                round(hgt),
                strokeWidth,
                iy,
                ix,
                dataY[ix]
              );
            }
          }
        }
      });

      u.ctx.lineWidth = strokeWidth;
      drawBoxes(u.ctx);

      u.ctx.restore();
    });

    return null;
  }

  function drawPoints(u, sidx, i0, i1) {
    u.ctx.save();
    u.ctx.rect(u.bbox.left, u.bbox.top, u.bbox.width, u.bbox.height);
    u.ctx.clip();

    // u.ctx.font         = font;
    // u.ctx.fillStyle    = "white";
    // u.ctx.textAlign    = mode == 1 ? "left" : "center";
    // u.ctx.textBaseline = "middle";

    // uPlot.orient(u, sidx, (series, dataX, dataY, scaleX, scaleY, valToPosX, valToPosY, xOff, yOff, xDim, yDim, moveTo, lineTo, rect) => {
    //   let strokeWidth = round((series.width || 0) * pxRatio);
    //   let textOffset = mode == 1 ? strokeWidth + 2 : 0;

    //   let y = round(yOff + yMids[sidx - 1]);

    //   for (let ix = 0; ix < dataY.length; ix++) {
    //     if (dataY[ix] != null) {
    //       let x = valToPosX(dataX[ix], scaleX, xDim, xOff) + textOffset;
    //       u.ctx.fillText(dataY[ix], x, y);
    //     }
    //   }
    // });

    u.ctx.restore();

    return false;
  }

  let qt;

  let hoverMarks = Array(count).fill(null).map(_ => {
    let mark = document.createElement("div");
    mark.classList.add("bar-mark");
    return mark;
  });

  let hovered = Array(count).fill(null);

  let yMids = Array(count).fill(0);
    let ySplits = Array(count).fill(0);

  return {
    hooks: {
      init: u => {
       let over = u.over;

       over.style.overflow = "hidden";

        hoverMarks.forEach(m => {
        over.appendChild(m);
        });
      },
      drawClear: u => {
        qt = qt || new Quadtree(0, 0, u.bbox.width, u.bbox.height);

        qt.clear();

        // force-clear the path cache to cause drawBars() to rebuild new quadtree
        u.series.forEach(s => {
          s._paths = null;
        });
      },
      setCursor: u => {
        let cx = round(u.cursor.left * pxRatio);

        for (let i = 0; i < count; i++) {
          let found = null;

          if (cx >= 0) {
            let cy = yMids[i];

            qt.get(cx, cy, 1, 1, o => {
              if (pointWithin(cx, cy, o.x, o.y, o.x + o.w, o.y + o.h))
                found = o;
            });
          }

          let h = hoverMarks[i];

          if (found) {
            if (found != hovered[i]) {
              hovered[i] = found;

              h.style.display = null;
              h.style.left    = round(found.x / pxRatio) + "px";
              h.style.top     = round(found.y / pxRatio) + "px";
              h.style.width   = round(found.w / pxRatio) + "px";
              h.style.height  = round(found.h / pxRatio) + "px";
            }
          }
          else if (hovered[i] != null) {
            h.style.display = "none";
            hovered[i] = null;
          }
        }
      },
    },
    opts: (u, opts) => {
      uPlot.assign(opts, {
        cursor: {
        //	x: false,
          y: false,
          points: {show: false}
        },
        scales: {
          x: {
            range(u, min, max) {
              if (mode == 2) {
                let colWid = u.data[0][1] - u.data[0][0];
                let scalePad = colWid/2;

                if (min <= u.data[0][0])
                  min = u.data[0][0] - scalePad;

                let lastIdx = u.data[0].length - 1;

                if (max >= u.data[0][lastIdx])
                  max = u.data[0][lastIdx] + scalePad;
              }

              return [min, max];
            }
          },
          y: {
            range: [0, 1],
          }
        }
      });

      uPlot.assign(opts.axes[0], {
        splits: mode == 2 ? (u, axisIdx, scaleMin, scaleMax, foundIncr, foundSpace) => {
          let splits = [];

          let dataIncr = u.data[0][1] - u.data[0][0];
          let skipFactor = ceil(foundIncr / dataIncr);

          for (let i = 0; i < u.data[0].length; i += skipFactor) {
            let v = u.data[0][i];

            if (v >= scaleMin && v <= scaleMax)
              splits.push(v);
          }

          return splits;
        } : null,
        grid: {
          show: mode != 2
        }
      });

      uPlot.assign(opts.axes[1], {
        splits: (u, axisIdx) => {
          walk(null, count, u.bbox.height, (iy, y0, hgt) => {
            // vertical midpoints of each series' timeline (stored relative to .u-over)
            yMids[iy] = round(y0 + hgt / 2);
            ySplits[iy] = u.posToVal(yMids[iy] / pxRatio, "y");
          });

          return ySplits;
        },
        values:     () => Array(count).fill(null).map((v, i) => u.series[i + 1].label),
        gap:        15,
        size:       70,
        grid:       {show: false},
        ticks:      {show: false},

        side:       3,
      });

      opts.series.forEach((s, i) => {
        if (i > 0) {
          uPlot.assign(s, {
          //	width: 0,
          //	pxAlign: false,
          //	stroke: "rgba(255,0,0,0.5)",
            paths: drawPaths,
            points: {
              show: drawPoints
            }
          });
        }
      });
    }
  };
}
