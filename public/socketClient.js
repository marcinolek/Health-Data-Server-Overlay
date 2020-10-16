let config;
let heartbeatTimeout;

let heartRate = [];
let labels = [];
let allHeartRate = [];
let allLabels = [];
let chart;
let dates = [];
let heartAvg = [];
let max = [];
let min = [];

const modes = {
  ALL: "all",
  MIN: "min",
  MIN3: "min3",
};

let mode = modes.ALL;

function connect() {
  let socket = new WebSocket(
    "ws://" + config.websocketIp + ":" + config.websocketPort
  );

  let statusDisplay = null;
  let dataDisplay = null;
  let caloriesDisplay = null;

  let heartRateText = null;
  let caloriesText = null;

  const updateData = () => {
    const newHeartRate = allHeartRate.filter((h, idx) => {
      const d = new Date();
      switch (mode) {
        case modes.MIN: {
          return d - dates[idx] < 60 * 1000;
        }
        case modes.MIN3: {
          return d - dates[idx] < 3 * 60 * 1000;
        }
        default: {
          return true;
        }
      }
    });
    const newLabels = allLabels.filter((h, idx) => {
      const d = new Date();
      switch (mode) {
        case modes.MIN: {
          return d - dates[idx] < 60 * 1000;
        }
        case modes.MIN3: {
          return d - dates[idx] < 3 * 60 * 1000;
        }
        default: {
          return true;
        }
      }
    });
    heartRate = newHeartRate;
    labels = newLabels;
    const average = Math.floor(
      heartRate.reduce((a, b) => parseInt(a) + parseInt(b)) / heartRate.length,
      0
    );
    heartAvg = heartRate.map((h) => average);
    max = heartRate.map((h) => 150);
    min = heartRate.map((h) => 110);

    chart.data.datasets[0].data = heartRate;
    chart.data.datasets[1].data = heartAvg;
    chart.data.datasets[2].data = max;
    chart.data.datasets[3].data = min;

    chart.data.labels = labels;
    if (chart) chart.update();

    let text = `AVG: ${average}`;
    if (mode === modes.MIN) {
      text = `AVG (1 min): ${average}`;
    } else if (mode === modes.MIN3) {
      text = `AVG (3 min): ${average}`;
    }
    heartAvg = heartRate.map((h) => average);
    document.getElementById("avgLabel").textContent = text;
  };

  socket.onopen = function (event) {
    // First we get the viewport height and we multiple it by 1% to get a value for a vh unit
    let vh = window.innerHeight * 0.01;
    let vw = window.innerWidth * 0.01;
    // Then we set the value in the --vh custom property to the root of the document
    document.documentElement.style.setProperty("--vh", `${vh}px`);
    document.documentElement.style.setProperty("--vw", `${vw}px`);

    console.log("Connected to server on port: " + config.websocketPort);
    document.getElementById("bottomPart").onclick = () => {
      switch (mode) {
        case modes.ALL:
          mode = modes.MIN;
          break;
        case modes.MIN:
          mode = modes.MIN3;
          break;
        default:
          mode = modes.ALL;
          break;
      }
      updateData();
    };
    chart = new Chart("myChart", {
      type: "line",
      data: {
        labels: labels,
        datasets: [
          {
            label: "Puls",
            data: heartRate,
            borderColor: "white",
            fill: false,
          },
          {
            label: "AVG",
            borderDash: [10, 10],
            data: heartAvg,
            borderColor: "#700000",
            fill: false,
            pointRadius: 0,
          },
          {
            label: "MAX",
            borderDash: [10, 10],
            data: heartAvg,
            borderColor: "#484848",
            fill: false,
            pointRadius: 0,
          },
          {
            label: "MIN",
            borderDash: [10, 10],
            data: heartAvg,
            borderColor: "#484848",
            fill: false,
            pointRadius: 0,
          },
        ],
      },
      options: {
        legend: {
          display: false,
        },
        scales: {
          yAxes: [
            {
              ticks: {
                suggestedMin: 60,
                suggestedMax: 180,
                fontSize: 20,
              },
            },
          ],
        },
      },
    });

    // Identify as a web client to the server
    socket.send("webClient");

    statusDisplay = document.getElementById("statusDisplay");
    dataDisplay = document.getElementById("dataDisplay");
    caloriesDisplay = document.getElementById("caloriesDisplay");

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
      allHeartRate.push(data[1]);
      dates.push(new Date());
      allLabels.push("");
      updateData();
    }

    if (data[0] === "calories") {
      let calories = data[1];
      caloriesText.textContent = calories;
      /* if (calories === '0') {
          caloriesDisplay.style.display = 'none';
      } else {
          caloriesDisplay.style.display = 'inline';
      } */
    }
  };
}

// Request the config from the server
let xmlHttp = new XMLHttpRequest();
xmlHttp.open("GET", "/config", false); // false for synchronous request
xmlHttp.send(null);
config = JSON.parse(xmlHttp.responseText);
connect();
