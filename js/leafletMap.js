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


    //ESRI
    vis.esriUrl = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
    vis.esriAttr = 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community';

    //TOPO
    vis.topoUrl ='https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png';
    vis.topoAttr = 'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)'

    //Thunderforest Outdoors- requires key... so meh... 
    vis.thOutUrl = 'https://{s}.tile.thunderforest.com/outdoors/{z}/{x}/{y}.png?apikey={apikey}';
    vis.thOutAttr = '&copy; <a href="http://www.thunderforest.com/">Thunderforest</a>, &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

    //Stamen Terrain
    vis.stUrl = 'https://stamen-tiles-{s}.a.ssl.fastly.net/terrain/{z}/{x}/{y}{r}.{ext}';
    vis.stAttr = 'Map tiles by <a href="http://stamen.com">Stamen Design</a>, <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a> &mdash; Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

    //this is the base map layer, where we are showing the map background
    //**** TO DO - try different backgrounds 
    vis.base_layer = L.tileLayer(vis.esriUrl, {
      id: 'esri-image',
      attribution: vis.esriAttr,
      ext: 'png'
    });

    vis.theMap = L.map('my-map', {
      center: [0, 0],
      zoom: 1.5,
      minZoom: 1.38,
      worldCopyJump: true,
      layers: [vis.base_layer]
    });

    //if you stopped here, you would just have a map

    //initialize svg for d3 to add to map
    L.svg({clickable:true}).addTo(vis.theMap)// we have to make the svg layer clickable
    vis.overlay = d3.select(vis.theMap.getPanes().overlayPane)
    vis.svg = vis.overlay.select('svg').attr("pointer-events", "auto")  
    
    // Define a scale for earthquake magnitude to radius
    const radiusScale = d3.scaleLinear()
    .domain([d3.min(vis.data, d => d.mag), d3.max(vis.data, d => d.mag)])
    .range([3, 10]); // Adjust range as needed

    // Define a color scale for earthquake magnitude
    const colorScale = d3.scaleLinear()
    .domain([d3.min(vis.data, d => d.mag), d3.max(vis.data, d => d.mag)])
    .range(["lightblue", "darkblue"]); // Different shades of blue

    // Define time format functions
    const formatDate = d3.timeFormat("%B %d, %Y");
    const formatTime = d3.timeFormat("%H:%M:%S");

    //these are the city locations, displayed as a set of dots 
    vis.Dots = vis.svg.selectAll('circle')
                    .data(vis.data) 
                    .join('circle')
                        .attr("fill", d => colorScale(d.magnitude))  // color by magnitude 
                        .attr("stroke", "black")
                        //Leaflet has to take control of projecting points. 
                        //Here we are feeding the latitude and longitude coordinates to
                        //leaflet so that it can project them on the coordinates of the view. 
                        //the returned conversion produces an x and y point. 
                        //We have to select the the desired one using .x or .y
                        .attr("cx", d => vis.theMap.latLngToLayerPoint([d.latitude,d.longitude]).x)
                        .attr("cy", d => vis.theMap.latLngToLayerPoint([d.latitude,d.longitude]).y) 
                        .attr("r", d => radiusScale(d.magnitude))  // Scale radius based on Magnitude 
                        .on('mouseover', function(event,d) { //function to add mouseover event
                            d3.select(this).transition() //D3 selects the object we have moused over in order to perform operations on it
                              .duration('150') //how long we are transitioning between the two states (works like keyframes)
                              .attr("fill", "red") //change the fill
                              .attr('r', radiusScale(d.magnitude) + 2); //increase radius on hover

                            // Convert the time string into a Date object and format it
                            let dateObj = new Date(d.time);
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
                                        <strong>Date:</strong> ${formattedDate} <br>
                                        <strong>Time:</strong> ${formattedTime} UTC
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
                              .attr("fill", "steelblue") //change the fill  TO DO- change fill again
                              .attr('r', d => radiusScale(d.magnitude)) //change radius

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

    let zoomLevel = vis.theMap.getZoom(); // Get the current zoom level

    // Adjust size scaling based on zoom
    let zoomScaleFactor = 1 / Math.pow(2, zoomLevel - 5); // Adjust scaling factor dynamically
   
   //redraw based on new zoom- need to recalculate on-screen position
    vis.Dots
      .attr("cx", d => vis.theMap.latLngToLayerPoint([d.latitude, d.longitude]).x)
      .attr("cy", d => vis.theMap.latLngToLayerPoint([d.latitude, d.longitude]).y)
      //.attr("fill", d => colorScale(d.magnitude))  //---- TO DO- color by magnitude 
      .attr("r", d => radiusScale(d.magnitude) * zoomScaleFactor) ; 

  }


  renderVis() {
    let vis = this;

    //not using right now... 
 
  }
}