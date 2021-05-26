// Note that a dynamic `import` statement here is required due to
// webpack/webpack#6615, but in theory `import { greet } from './pkg';`
// will work here one day as well!
const rust = import('./pkg');

import uPlot from 'uplot'






document.querySelector('input').addEventListener('change', function() {
  var t0 = performance.now()
  var reader = new FileReader();
  let mooSync = uPlot.sync("moo");
  const matchSyncKeys = (own, ext) => own == ext;
const cursorOpts = {
  lock: true,
  focus: {
    prox: 16,
  },
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
    init: [
      u => {
        u.root.querySelector(".u-over").ondblclick = e => {
          console.log("Fetching data for full range");

          u.setData(data);
        }
      }
    ]
  }
};
  reader.onload = function() {

    var arrayBuffer = this.result;
    console.log(arrayBuffer);
    var poo = rust.then(m => m.handle_sbp_file_data(new Uint8Array(arrayBuffer)));
    console.log(poo);
    poo.then(p => {
      console.log(p);
      var t1 = performance.now();
      console.log("Call to doSomething took " + (t1 - t0) + " milliseconds.");
      const data = [
        p['tow'],
        p['sat_useds']
      ];
      
      let u = new uPlot(opts, data, document.body);

      const data2 = [
        p['tow'],
        p['lats']
      ];
      
      let y = new uPlot(opts, data2, document.body);
      //u.addSeries([p['tow'], p['sogs']])

      mooSync.sub(u);
			mooSync.sub(y);

      let middle = Math.floor(p['tow'].length/2);
      console.log(middle)

      console.log({ lat: p['lats'][middle], lng: p['lons'][middle] })

      map = new google.maps.Map(document.getElementById("map"), {
        center: { lat: p['lats'][middle], lng: p['lons'][middle] },
        zoom: 12,
      });
      var bounds = new google.maps.LatLngBounds();
      for (let i=0; i < p['lons'].length ; i+= 100) {
        let m = new google.maps.Marker({
          position: { lat: p['lats'][i], lng: p['lons'][i] },
          icon: {
            path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
            scale: 4,
            rotation: p['cogs'][i]
          },
          draggable: true,
          map: map,
        });
        bounds.extend(m.getPosition());
      }

      map.setCenter(bounds.getCenter());

      map.fitBounds(bounds);
      
      //remove one zoom level to ensure no marker is on the edge.
      map.setZoom(map.getZoom()-1); 


    });


  }
  reader.readAsArrayBuffer(this.files[0]);
})

let map;

function initMap() {
  console.log("in my butt")
}

window.initMap = initMap;

