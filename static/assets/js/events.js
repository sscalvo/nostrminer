var best        = 0;
let max_cores = navigator.hardwareConcurrency;
let max_zeros = 20;
let default_numCores = Math.ceil(max_cores / 2);
let default_difficulty = 6;
let default_character = '0';
var workers = {};
window.hashPerCore = 0;
window.numCores = default_numCores; //used by <select onchange> events & start_mining()
window.difficulty = default_difficulty; //used by <select onchange> events & start_mining()
window.character = default_character; //used by <select onchange> events & start_mining()

(function init(){
    populateSelect("cores", max_cores, default_numCores, [...Array(max_cores+1).keys()].slice(1));
    populateSelect("zeros", max_zeros, default_difficulty, [...Array(max_zeros+1).keys()].slice(1));
    populateSelect("lead_char", default_difficulty, '0', ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'a', 'b', 'c', 'd', 'e', 'f']);
    calculateHashRate(populateInfoLabels );
})();

function populateInitialKeys(initial_privKey, initial_pubKey){
    console.log("populateInitialKeys " + initial_privKey + " " + initial_pubKey);
    document.getElementById("initial_priv").textContent = initial_privKey;
    document.getElementById("initial_pub").textContent = initial_pubKey;
}

function populateSelect(id, max, preselected, values){
    let selectTag = document.getElementById(id);
    values.forEach(function(v) {
        let opt = document.createElement("option");
        opt.value = v; // the index
        opt.innerHTML = v;
        if(v == preselected){
            opt.selected = true;
        }
        selectTag.append(opt);
        // console.log(opt);
    });

}


function secondsToHms(x) {
    x = Number(x);
    var d = Math.floor(x / (24*3600));
    var h = Math.floor(x % (3600*24) / 3600 );
    var m = Math.floor(x % 3600 / 60);
    var s = Math.floor(x % 3600 % 60);
    var dDisplay = d > 0 ? d + (d == 1 ? " day" : " days") + (h>0 || m > 0 || s > 0 ? ", ":"") : "";
    var hDisplay = h > 0 ? h + (h == 1 ? " hr" : " hrs") + (m > 0 || s > 0 ? ", ":"") : "";
    var mDisplay = m > 0 ? m + (m == 1 ? " min" : " mins") + (s > 0 ? ", ":"") : "";
    var sDisplay = s > 0 ? s + (s == 1 ? " sec" : " secs") : "";
    return dDisplay + hDisplay + mDisplay + sDisplay;
}

function expected_time(hashPerCore, numCores, difficulty){
    seconds = 1+ Math.pow(16, difficulty) / (hashPerCore * numCores * 2 ); // 1+ to avoid sub-zero values, 2 is average luck
    human_time = secondsToHms(seconds);
    // console.log("Current conf: numCores " + numCores + ", difficulty: " + difficulty + ", seconds: " + seconds + " (" + human_time + ")");
    return human_time;
}

// used as a callback in calculateHashRate()
function populateInfoLabels(hashPerCore, numCores, character, difficulty, initial_privKey, initial_pubKey){ 
    window.numCores = numCores;
    window.character = character;
    window.difficulty = difficulty;
    // console.log("populateInfoLabels " + hashPerCore + " " +  numCores + " " + character + " " + difficulty)
    document.getElementById("spanHashRate").textContent = hashPerCore;
    // document.getElementById("spanExpected").textContent = expected_time(hashPerCore, numCores, difficulty);
    document.getElementById("configurator-form").style.visibility = "visible"; // show control panel
    document.querySelectorAll('#configurator')[0].style.setProperty("--content", "''"); //hide animation
}

function calculateHashRate(callback ){
    // worker name, fill with, num zeros, feedback, are we estimating?
    var estimator_name = 'estimator';
    var worker_estimator = new Worker('./assets/js/bundle.js?v=111', {name: `'${estimator_name}'|0|20|5000|1`});
    // {'millis': (curTime - initTime),  'iterations': iterations, 'hashPerCore': parseInt(iterations*1000/(curTime - initTime))});
    worker_estimator.addEventListener("message", function receiveMsg(msg) {
        // While calculating hash rate, bundle.js also sends other messages. In order to filter the approppiate message, 
        // in bundle.js we hardcoded the name of the sender to "estimation_finished" :
        if (msg.data.who == "estimation_finished"){
            window.hashPerCore = msg.data.hashPerCore; // save it to the global 
            callback(msg.data.hashPerCore, default_numCores, window.character, default_difficulty, msg.data.initial_privKey, msg.data.initial_pubKey); //  actual function is populateInfoLabels()
        }
  });
}
  
function addKeysToTable(leadingZeros, pubKey, privKey, iterations){
    var table = document.getElementById("dataTable");
    // GET TOTAL NUMBER OF ROWS 
    var x =table.rows.length;
    var id = "hash-" +  (x-1);
    // var row = table.insertRow(x);
    var row = table.insertRow(1);
    row.id=id;
    var cell1 = row.insertCell(0); //   <th id="tdZeros">Leading zeros</th>
    var cell2 = row.insertCell(1); //   <th id="tdPubKey">Public Key</th>
    var cell3 = row.insertCell(2); //   <th id="tdPrivKey">Private Key</th>
    var cell4 = row.insertCell(3); //   <th id="tdIterations">Iterations</th>
    var cell5 = row.insertCell(4); //   <th id="tdTime">Time</th>
    var cell6 = row.insertCell(5); //   <th id="tdExtra-1">QR</th>
    cell1.outerHTML = `<td id="numZeros">${leadingZeros}</td>`;
    cell2.outerHTML = `<td id="pubKey" class="text-truncate txt-overflow-ellipsis" style="max-width: 150px;"><i  onclick="copyTextToClipboard('${pubKey}')" class="far fa-copy fa-fw" style="cursor:pointer;color:var(--bs-blue);"></i>&nbsp;<span id="initial_priv">${pubKey}</span></td>`;
    cell3.outerHTML = `<td id="privKey" class="text-truncate txt-overflow-ellipsis" style="max-width: 150px;"><i  onclick="copyTextToClipboard('${privKey}')" class="far fa-copy fa-fw" style="cursor:pointer;color:var(--bs-blue);"></i>&nbsp;<span id="initial_pub">${privKey}</span></td>`;
    cell4.outerHTML = `<td id="iterations">${iterations}</td>`;
    // cell5.outerHTML = `<td id="time">3d 4h</td>`;
    // cell6.outerHTML = `<td ><i class="fas fa-qrcode fa-fw" style="color: var(--bs-blue);"></i></td>`; 

    const cells = document.querySelectorAll('#tblHistoric td');
    for (const cell of cells) {
        cell.classList.add('txt-overflow-ellipsis');
        cell.classList.add('text-truncate');
        cell.style.setProperty('max-width', '150px');
    }


}

function startMining(){
  // just in case, shut down any previous existing worker
  if(workers != null && Object.keys(workers).length != 0){ // TODO no estoy seguro de la condicion
      for (var worker in workers){ 
        console.log("Shutting down existing workers")
        workers[worker].terminate();
      }
  }
  let startTime = Date.now();
  var spanElapsed = document.getElementById('spanElapsed');
  let intervalId = setInterval(() => {
    const elapsedTime = Date.now() - startTime;
    spanElapsed.innerHTML = secondsToHms(elapsedTime/1000) ;
  }, 1000);

  // Original code in: D:\js\miner_browser\index.html
  // User-configurable parameters
  var fw = 0; // in future we allow 0..f values
  var nz = document.getElementById("zeros").value;
  var cores = document.getElementById("cores").value;
  // Non-user parameters
  var total_iterations = 0; //counter to provide feedback to user
  var feedback = 10000; // how often (iterations) do we provide feedback?
  var workers = {};
  var worker_iterations = {};
  // for (let i = 0; i < 1; i++) {
  for (let i = 0; i < cores; i++) { // worker name|PoW character|difficulty|feedback freq.|estimation
    var wi = new Worker('./assets/js/bundle.js?v=211', {name: `${i}|${window.character}|${nz}|${feedback}|0`});
    workers[i] = wi;
    wi.addEventListener("message", function handleMessageFromWorker(msg) {
        total_iterations += feedback;
        var count_found = parseInt(msg.data.count); // number of zeros found
        if(count_found >= nz){ // Success!
            for (var worker in workers){ 
              workers[worker].terminate();
            }
            // worker_iterations[msg.data.who] = msg.data.iterations;
            // addSuccessKeys(33, msg.data.pubKey, msg.data.privKey, total_iterations); 
            clearInterval(intervalId);
            // console.log(`-----FIN!: ${msg.data.who} ha encontrado ${msg.data.iterations} pub con dificultad ${msg.data.count} (>= ${nz}): ${msg.data.pubKey}`);
            addKeysToTable(msg.data.count, msg.data.pubKey.slice(2), msg.data.privKey.slice(2), msg.data.iterations); 
        }else{
            if(count_found > best){
                best = count_found;
                // worker_iterations[msg.data.who] = (worker_iterations[msg.data.who] | 0) + feedback;
                // console.log(`CONTINUAMOS: ${msg.data.who} ha encontrado ${msg.data.iterations} pub con dificultad ${msg.data.count} (< ${nz}): ${msg.data.pubKey} Nuevo best: ${best}`);
                addKeysToTable(msg.data.count, msg.data.pubKey.slice(2), msg.data.privKey.slice(2), msg.data.iterations); 
            }
        }
        
    });
}
}



// COPY TO CLIPBOARD
function fallbackCopyTextToClipboard(text) {
    var textArea = document.createElement("textarea");
    textArea.value = text;
    
    // Avoid scrolling to bottom
    textArea.style.top = "0";
    textArea.style.left = "0";
    textArea.style.position = "fixed";
  
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
  
    try {
      var successful = document.execCommand('copy');
      var msg = successful ? 'successful' : 'unsuccessful';
      alert('Copied to clipboard ' + msg);
    } catch (err) {
      console.error('Fallback: Oops, unable to copy', err);
    }
  
    document.body.removeChild(textArea);
  }
  function copyTextToClipboard(text) {
    if (!navigator.clipboard) {
      fallbackCopyTextToClipboard(text);
      return;
    }
    navigator.clipboard.writeText(text).then(function() {
      alert('Copied to clipboard ' + text);
    }, function(err) {
      console.error('Async: Could not copy text: ', err);
    });
  }
  

