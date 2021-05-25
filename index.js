// Note that a dynamic `import` statement here is required due to
// webpack/webpack#6615, but in theory `import { greet } from './pkg';`
// will work here one day as well!
const rust = import('./pkg');

import uPlot from 'uplot'

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

let tow = new Float64Array(10000);
let sog = new Float64Array(10000);

document.querySelector('input').addEventListener('change', function() {
  var t0 = performance.now()
  var reader = new FileReader();
  reader.onload = function() {

    var arrayBuffer = this.result;
    console.log(arrayBuffer);
    var poo = rust.then(m => m.handle_sbp_file_data(new Uint8Array(arrayBuffer), tow, sog));
    console.log(poo);
    poo.then(p => {
      console.log(p);
      var t1 = performance.now();
      console.log("Call to doSomething took " + (t1 - t0) + " milliseconds.");
      const data = [
        tow.slice(0, 1000),
        sog.slice(0,1000)
      ];
      
      let u = new uPlot(opts, data, document.body);
      console.log(tow);
      console.log(sog);
    
    });


  }
  reader.readAsArrayBuffer(this.files[0]);
})




