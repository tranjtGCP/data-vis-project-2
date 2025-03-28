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
    this.initVis();
  }
  
  /**
   * We initialize scales/axes and append static elements, such as axis titles.
   */
  initVis() {
    let vis = this;

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

    vis.theMap = L.map('my-map', {
      center: [0, 0],
      zoom: 2.5,
      minZoom: 2,
      maxBounds: [
        [-100, -200],
        [100, 200]

      ],
      worldCopyJump: true,
      layers: [vis.baseLayers["Satellite"]]
    });

    // Add a control button to toggle backgrounds
    let layerControl = L.control.layers(vis.baseLayers).addTo(vis.theMap);

    //Add "Color By" dropdown to change circle colors
    let colorControl = L.control({ position: "topright" });
    colorControl.onAdd = function () {
        let div = L.DomUtil.create("div", "leaflet-bar leaflet-control leaflet-control-custom");
        div.innerHTML = `
            <label for="color-select">Color By:</label>
            <select id="color-select">
                <option value="magnitude">Magnitude</option>
                <option value="year">Year</option>
                <option value="duration">Duration</option>
                <option value="depth">Depth</option>
            </select>
        `;
        setTimeout(() => {
          document.getElementById("color-select").addEventListener("change", function (event) {
            vis.colorMode = event.target.value;
            vis.updateVis();
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
        duration: d3.scaleSequential(d3.interpolateOranges)
            .domain([d3.min(vis.data, d => d.duration), d3.max(vis.data, d => d.duration)]),
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
    L.svg({clickable:true}).addTo(vis.theMap)// we have to make the svg layer clickable
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

    //these are the city locations, displayed as a set of dots 
    vis.Dots = vis.svg.selectAll('circle')
                    .data(vis.data) 
                    .join('circle')
                        .attr("fill", d => {
                          if (vis.colorMode === "year") {
                            return vis.colorScales.year(new Date(d.time).getFullYear());
                          } else {
                            return vis.colorScales[vis.colorMode](d[vis.colorMode]);
                          }
                        }) 
                        .attr("stroke", "black")
                        //Leaflet has to take control of projecting points. 
                        //Here we are feeding the latitude and longitude coordinates to
                        //leaflet so that it can project them on the coordinates of the view. 
                        //the returned conversion produces an x and y point. 
                        //We have to select the the desired one using .x or .y
                        .attr("cx", d => vis.theMap.latLngToLayerPoint([d.latitude,d.longitude]).x)
                        .attr("cy", d => vis.theMap.latLngToLayerPoint([d.latitude,d.longitude]).y) 
                        .attr("r", d => vis.radiusScale(d.magnitude))  // Scale radius based on Magnitude 
                        .on('mouseover', function(event,d) { //function to add mouseover event
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
                        .on('mouseleave', function() { //function to add mouseover event
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

                          })
    
    //handler here for updating the map, as you zoom in and out           
    vis.theMap.on("zoom", function () {
        vis.updateVis();
    });
    
    vis.theMap.on("zoomend", function () {
        vis.updateVis();
    });

    }

  updateVis() {
    let vis = this;

    // let zoomLevel = vis.theMap.getZoom(); // Get the current zoom level

    // Adjust size scaling based on zoom
    // let zoomScaleFactor = 1 / Math.pow(2, zoomLevel - 5); // Adjust scaling factor dynamically
   
   //redraw based on new zoom- need to recalculate on-screen position
    vis.Dots
      .attr("cx", d => vis.theMap.latLngToLayerPoint([d.latitude, d.longitude]).x)
      .attr("cy", d => vis.theMap.latLngToLayerPoint([d.latitude, d.longitude]).y)
      .attr("fill", d => {
        if (vis.colorMode === "year") {
          return vis.colorScales.year(new Date(d.time).getFullYear());
        } else {
          return vis.colorScales[vis.colorMode](d[vis.colorMode]);
        }
      }) 
      .attr("r", d => vis.radiusScale(d.magnitude) + 5); 

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


  renderVis() {
    let vis = this;

    //not using right now... 
 
  }
}