




d3.csv('data/2024-2025.csv')  //**** TO DO  switch this to loading the quakes 'data/2024-2025.csv'
.then(data => {
    console.log("number of items: " + data.length);

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
