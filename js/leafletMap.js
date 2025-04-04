class LeafletMap {

  /**
   * Class constructor with basic configuration
   * @param {Object}
   * @param {Array}
   */
  constructor(_config, _data) {
    this.config = {
      parentElement: _config.parentElement,
    }
    this.data = _data;
    this.activeMapBrush = null; // Current rectangular bounds
    this.originalData = [...this.data]; // Store full data once
    this.originalFiltered = _data;
    this.initVis();
  }

  /**
   * We initialize scales/axes and append static elements, such as axis titles.
   */
  initVis() {
    let vis = this;

    // Initialize the brush mode
    vis.brushMode = false;

    document.querySelectorAll("input[name='map-mode']").forEach(input => {
      input.addEventListener("change", (e) => {
        vis.brushMode = e.target.value === "brush";
        vis.theMap.dragging.enable();  // always re-enable panning
        if (vis.brushMode) {
          vis.theMap.dragging.disable();  // disable pan if brushing
        }
      });
    });

    // Handler to show step through arrows for map
    document.getElementById("animate").addEventListener("click", () => {
      vis.minDate = vis.originalFiltered.sort()[vis.originalFiltered.length - 1];
      vis.currDate = vis.minDate;
      vis.maxDate = vis.originalFiltered.sort()[0];

      // vis.startTime = 0;
      // vis.endTime = 0;

      if (document.getElementById("animate").checked) {
        document.getElementById("animateControlsDiv").style.visibility = "visible";
        vis.data = [];
        vis.data.push(vis.minDate);
        this.updateVis();

        vis.startTime = new Date(vis.minDate.time);
        vis.endTime = new Date(vis.currDate.time);

        document.getElementById("currentView").innerHTML = "Start Date: " + vis.startTime.getMonth() + "/" + vis.startTime.getDate() + "/" + vis.startTime.getFullYear();
        document.getElementById("currentView2").innerHTML = "End Date: " + vis.endTime.getMonth() + "/" + vis.endTime.getDate() + "/" + vis.endTime.getFullYear();

        // Step backward click
        document.getElementById("step-backward").addEventListener("click", () => {

          document.getElementById("hint").style.visibility = "hidden";

          vis.endTime.setDate(vis.endTime.getDate() - 1);
          vis.currDate.time = vis.endTime.setDate(vis.endTime.getDate());

          if (vis.endTime < new Date(vis.minDate.time)) {
            vis.endTime.setDate(new Date(vis.minDate.time).getDate());
            vis.currDate.time = vis.endTime.setDate(vis.endTime.getDate() + 1);
            document.getElementById("step-backward").disabled = true;
          }
          else {
            document.getElementById("step-backward").disabled = false;
            document.getElementById("step-forward").disabled = false;
          }

          const timeframeToShow = vis.originalFiltered.filter(d => {
            const time = new Date(d.localTime);
            return time >= vis.startTime && time <= vis.endTime;
          });

          vis.data = timeframeToShow;
          document.getElementById("currentView").innerHTML = "Start Date: " + vis.startTime.getMonth() + "/" + vis.startTime.getDate() + "/" + vis.startTime.getFullYear();
          document.getElementById("currentView2").innerHTML = "End Date: " + vis.endTime.getMonth() + "/" + vis.endTime.getDate() + "/" + vis.endTime.getFullYear();
          vis.updateVis();
        });

        // Step forward click
        document.getElementById("step-forward").addEventListener("click", () => {

          document.getElementById("hint").style.visibility = "hidden";

          vis.endTime.setDate(vis.endTime.getDate() + 1);
          vis.currDate.time = vis.endTime.setDate(vis.endTime.getDate() + 1);

          if (vis.endTime >= new Date(vis.maxDate.time)) {
            vis.endTime.setDate(new Date(vis.maxDate.time).getDate());
            document.getElementById("step-forward").disabled = true;
          }
          else {
            document.getElementById("step-forward").disabled = false;
            document.getElementById("step-backward").disabled = false;
          }

          const timeframeToShow = vis.originalFiltered.filter(d => {
            const time = new Date(d.localTime);
            return time >= vis.startTime && time <= vis.endTime;
          });

          vis.data = timeframeToShow;
          document.getElementById("currentView").innerHTML = "Start Date: " + vis.startTime.getMonth() + "/" + vis.startTime.getDate() + "/" + vis.startTime.getFullYear();
          document.getElementById("currentView2").innerHTML = "End Date: " + vis.endTime.getMonth() + "/" + vis.endTime.getDate() + "/" + vis.endTime.getFullYear();
          vis.updateVis();
        });
      }
      else {
        document.getElementById("animateControlsDiv").style.visibility = "hidden";
        vis.data = this.originalFiltered;

        this.updateVis();
      }



    });

    // Define multiple map backgrounds
    vis.baseLayers = {
      "Satellite": L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", {
        attribution: "Tiles &copy; Esri",
      }),
      "Topographic": L.tileLayer("https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png", {
        attribution: "Map data: &copy; OpenStreetMap contributors, SRTM | Map style: &copy; OpenTopoMap",
      }),
      "Street Map": L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap contributors",
      })
    };

    vis.theMap = L.map("my-map", {
      center: [0, 0],
      zoom: 1.5,
      minZoom: 1,
      maxZoom: 4.5,
      maxBounds: [
        [-100, -200],
        [100, 200],
      ],
      worldCopyJump: true,
      layers: [vis.baseLayers["Satellite"]],
    });

    // Add a control button to toggle backgrounds
    let layerControl = L.control.layers(vis.baseLayers).addTo(vis.theMap);

    //Add "Color By" dropdown to change circle colors
    let colorControl = L.control({ position: "bottomright" });
    colorControl.onAdd = function () {
      let div = L.DomUtil.create("div", "leaflet-bar leaflet-control leaflet-control-custom");
      div.innerHTML = `
            <label for="color-select">Color By:</label>
            <select id="color-select">
                <option value="magnitude">Magnitude</option>
                <option value="year">Year</option>
                <option value="depth">Depth</option>
            </select>
        `;
      setTimeout(() => {
        document.getElementById("color-select").addEventListener("change", function (event) {
          vis.colorMode = event.target.value;
          vis.updateLegend();
          recombineFilters();
        });
      }, 0);
      return div;
    };
    colorControl.addTo(vis.theMap);

    // Initialize selected color mode
    vis.colorMode = "magnitude";

    // Define color scales
    vis.colorScales = {
      magnitude: d3.scaleSequential(d3.interpolateBlues)
        .domain([d3.min(vis.data, d => d.magnitude), d3.max(vis.data, d => d.magnitude)]),
      year: d3.scaleOrdinal(d3.schemeCategory10) // Distinct colors per year
        .domain([...new Set(vis.data.map(d => new Date(d.time).getFullYear()))]),
      depth: d3.scaleSequential(d3.interpolateReds)
        .domain([d3.min(vis.data, d => d.depth), d3.max(vis.data, d => d.depth)])
    };

    // Function to force the layer selector to stay open
    function keepLayerControlOpen() {
      let controlElement = document.querySelector(".leaflet-control-layers");
      if (controlElement) {
        controlElement.classList.add("leaflet-control-layers-expanded");
      }
    }

    // Ensure the background selection box stays expanded
    setTimeout(keepLayerControlOpen, 500);

    // Keep the selector open when interacting with the map
    vis.theMap.on("mouseout", keepLayerControlOpen);
    vis.theMap.on("zoomstart", keepLayerControlOpen);
    vis.theMap.on("zoomend", keepLayerControlOpen);
    vis.theMap.on("movestart", keepLayerControlOpen);
    vis.theMap.on("moveend", keepLayerControlOpen);
    vis.theMap.on("baselayerchange", keepLayerControlOpen);

    // Keep menu open when the user hovers over it and moves back to the map
    let controlElement = document.querySelector(".leaflet-control-layers");

    // Create color legend control
    vis.legendControl = L.control({ position: "bottomright" });

    vis.legendControl.onAdd = function () {
      const div = L.DomUtil.create("div", "info legend");
      div.innerHTML = "<div id='legend-content'></div>";

      // Prevent Leaflet from reacting to clicks on the dropdown
      L.DomEvent.disableClickPropagation(div);

      return div;
    };

    vis.legendControl.addTo(vis.theMap);

    controlElement.addEventListener("mouseenter", function () {
      keepLayerControlOpen();
    });

    controlElement.addEventListener("mouseleave", function () {
      setTimeout(keepLayerControlOpen, 300); // Delay to ensure it stays open
    });

    // Initialize the index for cycling through backgrounds
    vis.currentLayerIndex = 0;
    vis.layerNames = Object.keys(vis.baseLayers);

    //if you stopped here, you would just have a map

    //initialize svg for d3 to add to map
    L.svg({ clickable: true }).addTo(vis.theMap)// we have to make the svg layer clickable
    vis.overlay = d3.select(vis.theMap.getPanes().overlayPane)
    vis.svg = vis.overlay.select('svg').attr("pointer-events", "auto")

    // Define a scale for earthquake magnitude to radius
    vis.radiusScale = d3.scaleLinear()
      .domain([d3.min(vis.data, d => d.mag), d3.max(vis.data, d => d.mag)])
      .range([3, 20]); // Adjust range as needed

    // Define a color scale for earthquake magnitude
    vis.colorScale = d3.scaleLinear()
      .domain([d3.min(vis.data, d => d.mag), d3.max(vis.data, d => d.mag)])
      .range(["lightblue", "darkblue"]); // Different shades of blue

    // Define time format functions
    const formatDate = d3.timeFormat("%B %d, %Y");
    const formatTime = d3.timeFormat("%H:%M:%S");

    //Create the circles 
    vis.updateVis();

    //handler here for updating the map, as you zoom in and out           
    vis.theMap.on("zoom", function () {
      vis.updateVis();
    });

    vis.theMap.on("zoomend", function () {
      vis.updateVis();
    });

    // Add invisible rectangle for brushing
    vis.mapBrush = L.rectangle([[0, 0], [0, 0]], {
      color: "#3388ff",
      weight: 1,
      fillOpacity: 0.1,
      interactive: false
    }).addTo(vis.theMap);

    vis.mapBrush.setStyle({ opacity: 0, fillOpacity: 0 });

    // Handlers for panning and brushing
    vis.theMap.on('mousedown', function (e) {
      if (!vis.brushMode) return;
      vis.isBrushing = true;
      vis.brushStart = e.latlng;

      // Set initial bounds to a single point so it becomes visible
      vis.mapBrush.setStyle({ opacity: 1, fillOpacity: 0.2 });
      vis.mapBrush.setBounds(L.latLngBounds(vis.brushStart, vis.brushStart));
    });

    vis.theMap.on('mousemove', function (e) {
      if (!vis.brushMode || !vis.isBrushing || !vis.mapBrush) return;
      const bounds = L.latLngBounds(vis.brushStart, e.latlng);
      vis.mapBrush.setBounds(bounds);
    });

    vis.theMap.on('mouseup', function (e) {
      if (!vis.brushMode || !vis.isBrushing || !vis.mapBrush) return;
      vis.isBrushing = false;

      const bounds = vis.mapBrush.getBounds();
      vis.activeMapBrush = bounds;

      vis.triggerCombinedBrush();

      // Hide the brush rectangle
      vis.mapBrush.setStyle({ opacity: 0, fillOpacity: 0 });
    });

    // Default: scroll zoom enabled
    let zoomLocked = false;

    const lockBtn = document.getElementById("map-zoom-lock");
    lockBtn.addEventListener("click", () => {
      zoomLocked = !zoomLocked;

      if (zoomLocked) {
        vis.theMap.scrollWheelZoom.disable();
        lockBtn.innerText = "🔒";
        lockBtn.classList.add("locked");
      } else {
        vis.theMap.scrollWheelZoom.enable();
        lockBtn.innerText = "🔓";
        lockBtn.classList.remove("locked");
      }
    });

    vis.updateLegend();

  }

  updateVis() {
    let vis = this;

    // Remove existing SVG circles
    vis.svg.selectAll(".quake-circle").remove();

    // Define time format functions
    const formatDate = d3.timeFormat("%B %d, %Y");
    const formatTime = d3.timeFormat("%H:%M:%S");

    // Rebind filtered data
    vis.Dots = vis.svg.selectAll(".quake-circle")
      .data(vis.data)
      .enter()
      .append("circle")
      .attr("class", "quake-circle")
      .attr("cx", d => vis.theMap.latLngToLayerPoint([d.latitude, d.longitude]).x)
      .attr("cy", d => vis.theMap.latLngToLayerPoint([d.latitude, d.longitude]).y)
      .attr("fill", d => {
        if (vis.colorMode === "year") {
          return vis.colorScales.year(new Date(d.time).getFullYear());
        } else {
          return vis.colorScales[vis.colorMode](d[vis.colorMode]);
        }
      })
      .attr("r", d => vis.radiusScale(d.magnitude))
      .attr("stroke", "black")
      .on('mouseover', function (event, d) { //function to add mouseover event
        d3.select(this).transition() //D3 selects the object we have moused over in order to perform operations on it
          .duration('150') //how long we are transitioning between the two states (works like keyframes)
          .attr("fill", d => {
            if (vis.colorMode === "year") {
              return vis.colorScales.year(new Date(d.time).getFullYear());
            } else {
              return vis.colorScales[vis.colorMode](d[vis.colorMode]);
            }
          })
          .attr('r', vis.radiusScale(d.magnitude) + 10); //increase radius on hover

        // Convert the time string into a Date object and format it
        let dateObj = new Date(d.localTime);
        let formattedDate = formatDate(dateObj);
        let formattedTime = formatTime(dateObj);

        //create a tool tip
        d3.select('#tooltip')
          .style('opacity', 1)
          .style('z-index', 1000000)
          // Format number with million and thousand separator
          //***** TO DO- change this tooltip to show useful information about the quakes
          .html(`
                <div class="tooltip-label">
                    <strong>Magnitude:</strong> ${d.magnitude} <br>
                    <strong>Depth:</strong> ${d3.format(',')(d.depth)} km <br>
                    <Strong>Place:</strong> ${d.place} <br>
                    <strong>Local Date:</strong> ${formattedDate} <br>
                    <strong>Local Time:</strong> ${formattedTime} (${d.localTimezone})
                </div>
            `);

      })
      .on('mousemove', (event) => {
        //position the tooltip
        d3.select('#tooltip')
          .style('left', (event.pageX + 10) + 'px')
          .style('top', (event.pageY + 10) + 'px');
      })
      .on('mouseleave', function () { //function to add mouseover event
        d3.select(this).transition() //D3 selects the object we have moused over in order to perform operations on it
          .duration('150') //how long we are transitioning between the two states (works like keyframes)
          .attr("fill", d => {
            if (vis.colorMode === "year") {
              return vis.colorScales.year(new Date(d.time).getFullYear());
            } else {
              return vis.colorScales[vis.colorMode](d[vis.colorMode]);
            }
          })
          .attr('r', d => vis.radiusScale(d.magnitude)) //change radius

        d3.select('#tooltip').style('opacity', 0);//turn off the tooltip

      });

    // console.log("🔄 Map rendering", vis.data.length, "points");
    // console.log("🧪 Max magnitude: ", d3.max(vis.data, d => d.magnitude));
  }

  // Function to cycle through background layers
  toggleMapBackground() {
    let vis = this;

    vis.currentLayerIndex = (vis.currentLayerIndex + 1) % vis.layerNames.length;
    let newLayerName = vis.layerNames[vis.currentLayerIndex];

    // Remove only tile layers (preserve other map elements)
    vis.theMap.eachLayer(layer => {
      if (layer instanceof L.TileLayer) {
        vis.theMap.removeLayer(layer);
      }
    });

    // Ensure the new layer is added correctly
    vis.baseLayers[newLayerName].addTo(vis.theMap);
  }

  updateLegend() {
    let vis = this;
    const legendDiv = document.getElementById("legend-content");
    if (!legendDiv) return;

    // Clear existing legend
    legendDiv.innerHTML = "";

    const colorMode = vis.colorMode;
    const scale = vis.colorScales[colorMode];

    // Custom breaks for linear/sequential scales
    if (colorMode === "magnitude" || colorMode === "duration" || colorMode === "depth") {
      const min = scale.domain()[0];
      const max = scale.domain()[1];
      const steps = 6;
      const stepSize = (max - min) / steps;

      for (let i = 0; i < steps; i++) {
        const val = min + i * stepSize;
        const nextVal = val + stepSize;
        const color = scale(val);

        legendDiv.innerHTML += `
          <div style="display: flex; align-items: center; margin-bottom: 4px;">
            <div style="width: 20px; height: 12px; background:${color}; margin-right: 6px;"></div>
            <span>${val.toFixed(1)} – ${nextVal.toFixed(1)}</span>
          </div>
        `;
      }
    }

    // Ordinal scale (e.g., year)
    if (colorMode === "year") {
      const years = scale.domain().sort();
      years.forEach(year => {
        const color = scale(year);
        legendDiv.innerHTML += `
          <div style="display: flex; align-items: center; margin-bottom: 4px;">
            <div style="width: 20px; height: 12px; background:${color}; margin-right: 6px;"></div>
            <span>${year}</span>
          </div>
        `;
      });
    }
  }

  // Method to update the dataset to be used
  updateData(filteredData) {
    this.data = filteredData;
    this.originalFiltered = filteredData;
    document.getElementById("animate").checked = false;
    document.getElementById("animateControlsDiv").style.visibility = "hidden";
    this.updateVis();
  }



  triggerCombinedBrush() {
    const bounds = this.activeMapBrush;
    const isMapBrushed = bounds && bounds.isValid();

    const filtered = this.originalData.filter(d => {
      const inMap = isMapBrushed
        ? bounds.contains([d.latitude, d.longitude])
        : true;

      const inBar = typeof this.barChartFilter === "function"
        ? this.barChartFilter(d)
        : true;

      return inMap && inBar;
    });

    handleBrushedData(filtered, "map");
  }
}