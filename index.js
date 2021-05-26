// Note that a dynamic `import` statement here is required due to
// webpack/webpack#6615, but in theory `import { greet } from './pkg';`
// will work here one day as well!
const rust = import('./pkg');

import uPlot from 'uplot'


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
      stroke: "red"
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
        sbpData['sat_useds']
      ];
      dataSbp = sbpData;
      let u = new uPlot(opts, data, document.body);

      const data2 = [
        sbpData['tow'],
        sbpData['sog']
      ];
      
      let y = new uPlot(opts, data2, document.body);
      //u.addSeries([p['tow'], p['sogs']])

      mooSync.sub(u);
			mooSync.sub(y);

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

    }

    );


  }
  reader.readAsArrayBuffer(this.files[0]);
})

let map;

function initMap() {
  
}

window.initMap = initMap;

