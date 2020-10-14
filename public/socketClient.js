let config;
let heartbeatTimeout;

function connect() {
  let socket = new WebSocket(
    "ws://" + config.websocketIp + ":" + config.websocketPort
  );

    let statusDisplay = null;
    let dataDisplay = null;
    let caloriesDisplay = null;

  let heartRateText = null;
  let caloriesText = null;

  socket.onopen = function (event) {
    console.log("Connected to server on port: " + config.websocketPort);

        // Identify as a web client to the server
        socket.send('webClient');

        statusDisplay = document.getElementById('statusDisplay');
        dataDisplay = document.getElementById('dataDisplay');
        caloriesDisplay = document.getElementById('caloriesDisplay');

    heartRateText = document.getElementById("heartRate");
    caloriesText = document.getElementById("calories");

    document.getElementById("hrImage").src =
      typeof config.hrImage === "undefined" ? "hrImage.png" : config.hrImage;
    document.getElementById("calImage").src =
      typeof config.calImage === "undefined" ? "calImage.png" : config.calImage;
  };

  socket.onclose = function (event) {
    console.log("Disconnected from server");
    setTimeout(function () {
      connect();
    }, 1000);
  };

  socket.onerror = function (event) {
    console.log("WebSocket error");
    // TODO: Does this mean the socket is disconnected?
    // setTimeout(function() {
    //     connect();
    // }, 1000);
  };

  socket.onmessage = function (event) {
    console.log(event.data);

    statusDisplay.style.display = "none";
    dataDisplay.style.display = "block";
    clearTimeout(heartbeatTimeout);
    heartbeatTimeout = setTimeout(function () {
      console.log("Disconnected from watch");
      statusDisplay.style.display = "block";
      dataDisplay.style.display = "none";
    }, 60000); // 60 seconds

    let data = event.data.split(":");

    if (data[0] === "heartRate") {
      heartRateText.textContent = data[1];
    }

        if (data[0] === 'calories') {
            let calories = data[1];
            caloriesText.textContent = calories;
            if (calories === '0') {
                caloriesDisplay.style.display = 'none';
            } else {
                caloriesDisplay.style.display = 'inline';
            }
        }
    };
}

// Request the config from the server
let xmlHttp = new XMLHttpRequest();
xmlHttp.open("GET", "/config", false); // false for synchronous request
xmlHttp.send(null);
config = JSON.parse(xmlHttp.responseText);
connect();
