




d3.csv('data/2024-2025.csv')  //**** TO DO  switch this to loading the quakes 'data/2024-2025.csv'
.then(data => {
    console.log("number of items: " + data.length);

    // Filter data for any empty or invalid values
    data = data.filter(d =>
      d.latitude !== "" && d.longitude !== "" && d.depth !== "" &&
      d.mag !== "" && d.time !== "" && d.place !== "" && d.dmin !== "" &&
      !isNaN(+d.latitude) && !isNaN(+d.longitude) &&
      !isNaN(+d.depth) && !isNaN(+d.mag) && !isNaN(+d.dmin)
    );

    data.forEach(d => {  //convert from string to number
      d.latitude = +d.latitude; 
      d.longitude = +d.longitude;  
      d.depth = +d.depth;
      d.magnitude = +d.mag;
      d.time = d.time;
      d.place = d.place;
      d.duration = +d.dmin;
    });

    // Initialize chart and then show it
    leafletMap = new LeafletMap({ parentElement: '#my-map'}, data);


  })
  .catch(error => console.error(error));
