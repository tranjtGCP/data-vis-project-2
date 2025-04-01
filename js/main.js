// Array to hold information about the different time zones. Used to convert given global time to local time. 
// I used AI to generate this array as doing it manually would take forever.
const manualZones = [
  // North America
  { name: "Pacific Time (US)", latMin: 32, latMax: 49, lonMin: -125, lonMax: -116, offset: -8, label: "PST" },
  { name: "Mountain Time (US)", latMin: 31, latMax: 49, lonMin: -116, lonMax: -105, offset: -7, label: "MST" },
  { name: "Central Time (US)", latMin: 25, latMax: 49, lonMin: -105, lonMax: -90, offset: -6, label: "CST" },
  { name: "Eastern Time (US)", latMin: 25, latMax: 49, lonMin: -90, lonMax: -67, offset: -5, label: "EST" },
  { name: "Atlantic Time (Canada)", latMin: 45, latMax: 60, lonMin: -67, lonMax: -52, offset: -4, label: "AST" },
  { name: "Newfoundland Time", latMin: 46, latMax: 53, lonMin: -60, lonMax: -52, offset: -3.5, label: "NST" },
  { name: "Alaska", latMin: 55, latMax: 72, lonMin: -170, lonMax: -130, offset: -9, label: "AKST" },
  { name: "Hawaii", latMin: 18, latMax: 22, lonMin: -161, lonMax: -154, offset: -10, label: "HST" },
  { name: "Greenland", latMin: 59, latMax: 84, lonMin: -72, lonMax: -20, offset: -3, label: "WGT" },

  // Caribbean & Latin America
  { name: "Cuba", latMin: 20, latMax: 24, lonMin: -85, lonMax: -74, offset: -5, label: "CST" },
  { name: "Puerto Rico", latMin: 17, latMax: 19, lonMin: -68, lonMax: -65, offset: -4, label: "AST" },
  { name: "Argentina", latMin: -55, latMax: -20, lonMin: -75, lonMax: -53, offset: -3, label: "ART" },
  { name: "Brazil (West)", latMin: -20, latMax: 5, lonMin: -75, lonMax: -50, offset: -4, label: "AMT" },
  { name: "Brazil (East)", latMin: -30, latMax: 5, lonMin: -50, lonMax: -35, offset: -3, label: "BRT" },
  { name: "Chile", latMin: -56, latMax: -17, lonMin: -75, lonMax: -66, offset: -4, label: "CLT" },

  // Europe
  { name: "Western Europe", latMin: 35, latMax: 60, lonMin: -10, lonMax: 10, offset: 1, label: "WET" },
  { name: "Central Europe", latMin: 45, latMax: 60, lonMin: 10, lonMax: 25, offset: 2, label: "CET" },
  { name: "Eastern Europe", latMin: 45, latMax: 60, lonMin: 25, lonMax: 40, offset: 3, label: "EET" },

  // Africa
  { name: "Morocco", latMin: 27, latMax: 36, lonMin: -13, lonMax: -1, offset: 1, label: "WET" },
  { name: "West Africa", latMin: 5, latMax: 20, lonMin: -15, lonMax: 10, offset: 1, label: "WAT" },
  { name: "Central Africa", latMin: -5, latMax: 15, lonMin: 10, lonMax: 30, offset: 2, label: "CAT" },
  { name: "East Africa", latMin: -10, latMax: 15, lonMin: 30, lonMax: 45, offset: 3, label: "EAT" },
  { name: "South Africa", latMin: -35, latMax: -22, lonMin: 16, lonMax: 33, offset: 2, label: "SAST" },
  { name: "Egypt", latMin: 22, latMax: 32, lonMin: 25, lonMax: 36, offset: 2, label: "EET" },

  // Middle East
  { name: "Turkey", latMin: 36, latMax: 42, lonMin: 26, lonMax: 45, offset: 3, label: "TRT" },
  { name: "Iran", latMin: 25, latMax: 40, lonMin: 44, lonMax: 63, offset: 3.5, label: "IRST" },
  { name: "Iraq", latMin: 29, latMax: 38, lonMin: 39, lonMax: 49, offset: 3, label: "AST" },
  { name: "Israel", latMin: 29, latMax: 34, lonMin: 34, lonMax: 36, offset: 2, label: "IST" },
  { name: "Jordan", latMin: 29, latMax: 33, lonMin: 35, lonMax: 39, offset: 2, label: "EET" },
  { name: "Arabian Peninsula", latMin: 12, latMax: 32, lonMin: 45, lonMax: 60, offset: 4, label: "AST" },

  // South Asia
  { name: "Pakistan", latMin: 23, latMax: 38, lonMin: 60, lonMax: 78, offset: 5, label: "PKT" },
  { name: "India", latMin: 6, latMax: 38, lonMin: 68, lonMax: 98, offset: 5.5, label: "IST" },
  { name: "Nepal", latMin: 26, latMax: 31, lonMin: 80, lonMax: 89, offset: 5.75, label: "NPT" },
  { name: "Bangladesh", latMin: 20, latMax: 27, lonMin: 88, lonMax: 93, offset: 6, label: "BST" },
  { name: "Myanmar", latMin: 9, latMax: 28, lonMin: 93, lonMax: 101, offset: 6.5, label: "MMT" },

  // East & Southeast Asia
  { name: "Thailand", latMin: 5, latMax: 21, lonMin: 97, lonMax: 106, offset: 7, label: "THA" },
  { name: "Malaysia", latMin: 1, latMax: 7, lonMin: 100, lonMax: 120, offset: 8, label: "MYT" },
  { name: "Philippines", latMin: 5, latMax: 21, lonMin: 116, lonMax: 127, offset: 8, label: "PHT" },
  { name: "China", latMin: 20, latMax: 45, lonMin: 100, lonMax: 125, offset: 8, label: "CST" },
  { name: "Korea", latMin: 33, latMax: 43, lonMin: 125, lonMax: 130, offset: 9, label: "KST" },
  { name: "Japan", latMin: 30, latMax: 45, lonMin: 130, lonMax: 146, offset: 9, label: "JST" },

  // Indonesia
  { name: "Indonesia (West)", latMin: -7, latMax: 6, lonMin: 95, lonMax: 105, offset: 7, label: "WIB" },
  { name: "Indonesia (Central)", latMin: -7, latMax: 6, lonMin: 105, lonMax: 125, offset: 8, label: "WITA" },
  { name: "Indonesia (East)", latMin: -7, latMax: 6, lonMin: 125, lonMax: 141, offset: 9, label: "WIT" },

  // Australia & Oceania
  { name: "Western Australia", latMin: -35, latMax: -10, lonMin: 110, lonMax: 130, offset: 8, label: "AWST" },
  { name: "Central Australia", latMin: -35, latMax: -22, lonMin: 130, lonMax: 140, offset: 9.5, label: "ACST" },
  { name: "Eastern Australia", latMin: -38, latMax: -10, lonMin: 140, lonMax: 155, offset: 10, label: "AEST" },
  { name: "New Zealand", latMin: -47, latMax: -34, lonMin: 165, lonMax: 180, offset: 12, label: "NZST" },
  { name: "Fiji", latMin: -19, latMax: -16, lonMin: 176, lonMax: 180, offset: 12, label: "FJT" },
  { name: "Samoa", latMin: -14, latMax: -13, lonMin: -172, lonMax: -171, offset: 13, label: "WST" },
  { name: "Tonga", latMin: -22, latMax: -15, lonMin: -176, lonMax: -173, offset: 13, label: "TOT" },

  // Russia (subdivided)
  { name: "Kaliningrad", latMin: 53, latMax: 56, lonMin: 19, lonMax: 23, offset: 2, label: "USZ1" },
  { name: "Moscow", latMin: 54, latMax: 58, lonMin: 35, lonMax: 40, offset: 3, label: "MSK" },
  { name: "Novosibirsk", latMin: 52, latMax: 56, lonMin: 75, lonMax: 85, offset: 7, label: "NOVT" },
  { name: "Vladivostok", latMin: 43, latMax: 47, lonMin: 130, lonMax: 135, offset: 10, label: "VLAT" }
];

function getTimezoneOffset(lat, lon) {
  // Use manualZones to get the correct timezone
  for (const zone of manualZones) {
    if (
      lat >= zone.latMin && lat <= zone.latMax &&
      lon >= zone.lonMin && lon <= zone.lonMax
    ) {
      return {
        offset: zone.offset,
        label: zone.label
      };
    }
  }

  // Default rule: 15° longitude = 1 hour
  const fallbackOffset = Math.round(lon / 15);
  return {
    offset: fallbackOffset,
    label: `UTC${formatOffset(fallbackOffset)}`
  };
}

function formatOffset(offset) {
  const sign = offset >= 0 ? "+" : "−";
  const abs = Math.abs(offset);
  const hours = Math.floor(abs);
  const minutes = (abs % 1) * 60;
  return `${sign}${String(hours).padStart(2, '0')}:${minutes === 0 ? "00" : "30"}`;
}

// Initialize bar chart and map objects
let barchart, leafletMap, lineChart;

// Method to update the visualizations after brushing
function handleBrushedData(filteredData, source) {
  if (source === "barchart") {
    leafletMap.barChartFilter = d => filteredData.includes(d);
  }

  if (source === "map") {
    barchart.mapFilter = d => filteredData.includes(d);
  }

  if (source === "linechart") {
    barchart.lineChartFilter = d => filteredData.includes(d);
    leafletMap.lineChartFilter = d => filteredData.includes(d);
  }

  const fullData = window.earthquakeData;

  const finalData = fullData.filter(d => {
    const mapMatch = (!leafletMap.barChartFilter || leafletMap.barChartFilter(d)) &&
      (!leafletMap.lineChartFilter || leafletMap.lineChartFilter(d));

    const barMatch = (!barchart.mapFilter || barchart.mapFilter(d)) &&
      (!barchart.lineChartFilter || barchart.lineChartFilter(d));

    return mapMatch && barMatch;
  });

  leafletMap.updateData(finalData);
  barchart.updateData(finalData);
  lineChart.updateData(finalData);
}

d3.csv("data/2020-2025.csv") //**** TO DO  switch this to loading the quakes 'data/2024-2025.csv'
  .then((data) => {
    // console.log("number of items: " + data.length);

    // Filter data for any empty or invalid values
    data = data.filter(
      (d) =>
        d.latitude !== "" &&
        d.longitude !== "" &&
        d.depth !== "" &&
        d.mag !== "" &&
        d.time !== "" &&
        d.place !== "" &&
        d.dmin !== "" &&
        !isNaN(+d.latitude) &&
        !isNaN(+d.longitude) &&
        !isNaN(+d.depth) &&
        !isNaN(+d.mag) &&
        !isNaN(+d.dmin)
    );

    data.forEach((d) => {
      //convert from string to number
      d.latitude = +d.latitude;
      d.longitude = +d.longitude;
      d.depth = +d.depth;
      d.magnitude = +d.mag;
      d.time = d.time;
      d.place = d.place;
      d.duration = +d.dmin;

      // Get timezone offset based on latitude and longitude
      const tzOffset = getTimezoneOffset(d.latitude, d.longitude);
      const utcDate = new Date(d.time);
      const localDate = new Date(
        utcDate.getTime() + tzOffset.offset * 60 * 60 * 1000
      );

      d.localTime = localDate.toISOString().split(".")[0]; // ISO string without milliseconds
      d.localTimezone = tzOffset.label;
    });

    window.earthquakeData = data;

    // Initialize chart and then show it
    leafletMap = new LeafletMap({ parentElement: "#my-map" }, data);
    leafletMap.originalData = data;

    // Initialize chart
    barchart = new Barchart({ parentElement: "#barchart" }, data);
    document.getElementById("bar-metric").value = barchart.displayMode;
    barchart.originalData = data;
    document
      .getElementById("bar-metric")
      .addEventListener("change", function () {
        barchart.setDisplayMode(this.value);
      });

    // Show chart
    barchart.updateVis();

    // Group by local date
    const lineChartData = d3.rollups(
      earthquakeData,
      v => v.length,
      d => d3.timeFormat("%Y-%m-%d")(new Date(d.localTime)))
      .map(([dateStr, count, place]) => ({
        date: new Date(dateStr),
        value: count,
        place: place
      }));

    // console.log(lineChartData);

    // Initialize and render chart
    lineChart = new LineChart({ parentElement: "#chart" }, lineChartData);
  })
  .catch((error) => console.error(error));

// Handler for the brush reset button on the bar chart
document.getElementById("reset-brush").addEventListener("click", () => {
  leafletMap.barChartFilter = null;
  barchart.chart.select(".brush").call(barchart.brush.move, null);

  recombineFilters();
});

// When the page refresh's, set the map mode back to pan
document.addEventListener("DOMContentLoaded", () => {
  const panRadio = document.querySelector('input[name="map-mode"][value="pan"]');
  if (panRadio) {
    panRadio.checked = true;
  }
});

// Handler for the brush reset button for the map
document.getElementById("reset-map-brush").addEventListener("click", () => {
  leafletMap.activeMapBrush = null;
  leafletMap.mapBrush.setStyle({ opacity: 0, fillOpacity: 0 });

  recombineFilters();
});

// Handler for the brush reset button for the line chart
document.getElementById("reset-line-brush").addEventListener("click", () => {
  lineChart.lineChartFilter = null;
  lineChart.chart.select(".brush").call(lineChart.brush.move, null);

  recombineFilters();
});

function recombineFilters() {
  const fullData = window.earthquakeData;

  const finalData = fullData.filter(d => {
    const mapMatch = !leafletMap.activeMapBrush || leafletMap.activeMapBrush.contains([d.latitude, d.longitude]);
    const barMatch = !leafletMap.barChartFilter || leafletMap.barChartFilter(d);
    const inLine = !lineChart.lineChartFilter || lineChart.lineChartFilter(d);

    return mapMatch && barMatch & inLine;
  });

  leafletMap.updateData(finalData);
  barchart.updateData(finalData);
  lineChart.updateData(finalData);
}
