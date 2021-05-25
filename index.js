// Note that a dynamic `import` statement here is required due to
// webpack/webpack#6615, but in theory `import { greet } from './pkg';`
// will work here one day as well!
const rust = import('./pkg');

document.querySelector('input').addEventListener('change', function() {
  var t0 = performance.now()
  var reader = new FileReader();
  reader.onload = function() {

    var arrayBuffer = this.result;
    console.log(arrayBuffer);
    var poo = rust.then(m => m.handle_sbp_file_data(new Uint8Array(arrayBuffer)));
    console.log(poo);
    poo.then(p => {
      console.log(p);
      var t1 = performance.now();
      console.log("Call to doSomething took " + (t1 - t0) + " milliseconds.");
    
    });

  }
  reader.readAsArrayBuffer(this.files[0]);
})