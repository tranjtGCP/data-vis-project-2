class Barchart {

  /**
   * Class constructor with basic chart configuration
   * @param {Object}
   * @param {Array}
   */
  constructor(_config, _data) {
    // Configuration object with defaults
    // Important: depending on your vis and the type of interactivity you need
    // you might want to use getter and setter methods for individual attributes
    this.config = {
      parentElement: _config.parentElement,
      containerWidth: _config.containerWidth || 800,
      containerHeight: _config.containerHeight || 400,
      margin: _config.margin || {top: 25, right: 5, bottom: 20, left: 80}
    }
    this.data = _data;
    this.initVis();
  }
  
  /**
   * This function contains all the code that gets excecuted only once at the beginning.
   * (can be also part of the class constructor)
   * We initialize scales/axes and append static elements, such as axis titles.
   * If we want to implement a responsive visualization, we would move the size
   * specifications to the updateVis() function.
   */
  initVis() {
    // We recommend avoiding simply using the this keyword within complex class code
    // involving SVG elements because the scope of this will change and it will cause
    // undesirable side-effects. Instead, we recommend creating another variable at
    // the start of each function to store the this-accessor
    let vis = this;

    vis.svg = d3.select(this.config.parentElement)
      .append("svg")
      .attr("width", this.config.containerWidth)
      .attr("height", this.config.containerHeight);

    // Calculate inner chart size. Margin specifies the space around the actual chart.
    // You need to adjust the margin config depending on the types of axis tick labels
    // and the position of axis titles (margin convetion: https://bl.ocks.org/mbostock/3019563)
    vis.width = vis.config.containerWidth - vis.config.margin.left - vis.config.margin.right;
    vis.height = vis.config.containerHeight - vis.config.margin.top - vis.config.margin.bottom;

    // Initialize scales
    vis.xScale = d3.scaleBand().range([0, vis.width]).padding(0.1);
    vis.yScale = d3.scaleLinear().range([vis.height, 0]);

    // Initialize axes
    vis.xAxis = d3.axisBottom(vis.xScale)
        .ticks(6)
        .tickSizeOuter(0);

    vis.yAxis = d3.axisLeft(vis.yScale)
        .ticks(10)
        .tickFormat(d => `${d}%`);

    // Define size of SVG drawing area
    vis.svg = d3.select(vis.config.parentElement)
        .attr('width', vis.config.containerWidth)
        .attr('height', vis.config.containerHeight);

    // Append group element that will contain our actual chart 
    // and position it according to the given margin config
    vis.chart = vis.svg.append('g')
        .attr('transform', `translate(${vis.config.margin.left},${vis.config.margin.top})`);

    // Append empty x-axis group and move it to the bottom of the chart
    vis.xAxisG = vis.chart.append('g')
        .attr('class', 'axis x-axis')
        .attr('transform', `translate(0,${vis.height})`);
    
    // Append y-axis group 
    vis.yAxisG = vis.chart.append('g')
        .attr('class', 'axis y-axis');

    // Append titles, legends and other static elements here
    vis.svg.append("text")
    .attr("class", "chart-title")
    .attr("x", vis.config.containerWidth / 2 + 100)
    .attr("y", vis.config.margin.top / 2)
    .attr("text-anchor", "middle")
    .text("Percentage of Earthquakes by Magnitude Range");

    vis.yAxisG.append("text")
    .attr("class", "axis-title")
    .attr("text-anchor", "middle")
    .attr("transform", `rotate(-90)`)
    .attr("x", -vis.height / 2)
    .attr("y", -vis.config.margin.left + 20)
    .text("Percentage of Earthquakes");

    vis.xAxisG.append("text")
    .attr("class", "axis-title")
    .attr("text-anchor", "middle")
    .attr("x", vis.width / 2)
    .attr("y", 310)
    .text("Magnitude Range");
  }

  /**
   * This function contains all the code to prepare the data before we render it.
   * In some cases, you may not need this function but when you create more complex visualizations
   * you will probably want to organize your code in multiple functions.
   */
  updateVis() {
    let vis = this;
  
    // Create bins: [3–4), [4–5), [5–6), ..., up to 10.0
    const minMag = 3;
    const maxMag = 10;
    const binSize = 1;
    const bins = [];
  
    for (let i = minMag; i < maxMag; i += binSize) {
      const label = `${i.toFixed(1)}–${(i + binSize).toFixed(1)}`;
      bins.push({ range: [i, i + binSize], label: label, count: 0 });
    }
  
    // Count how many earthquakes fall into each bin
    vis.data.forEach(d => {
      if (d.magnitude !== undefined && !isNaN(d.magnitude)) {
        for (const bin of bins) {
          if (d.magnitude >= bin.range[0] && d.magnitude < bin.range[1]) {
            bin.count++;
            break;
          }
        }
      }
    });

    // Compute total quake count
    const total = d3.sum(bins, d => d.count);

    // Add a percentage property to each bin
    bins.forEach(d => {
      d.percentage = (d.count / total) * 100;
    });
  
    vis.binnedData = bins;
  
    // Set domains for scales
    vis.xScale.domain(bins.map(d => d.label));
    vis.yScale.domain([0, 100]);
  
    // Update axes
    vis.xAxisG.call(vis.xAxis)
      .selectAll("text")
      .attr("transform", "rotate(-35)")
      .style("text-anchor", "end");
  
    vis.yAxisG.call(vis.yAxis);
  
    // Bind data and create bars
    vis.chart.selectAll(".bar")
      .data(vis.binnedData)
      .join("rect")
      .attr("class", "bar")
      .attr("x", d => vis.xScale(d.label))
      .attr("y", d => vis.yScale(d.percentage))
      .attr("width", vis.xScale.bandwidth())
      .attr("height", d => vis.height - vis.yScale(d.percentage))
      .attr("fill", "steelblue")

      //Add tooltip interactivity
      .on("mouseover", (event, d) => {
        d3.select("#tooltip")
          .style("opacity", 1)
          .html(`
            <strong>Magnitude:</strong> ${d.label}<br>
            <strong>Number of Earthquakes:</strong> ${d.count.toLocaleString()}<br>
            <strong>Percent:</strong> ${d.percentage.toFixed(1)}%
          `);
      })
      .on("mousemove", (event) => {
        d3.select("#tooltip")
          .style("left", (event.pageX + 10) + "px")
          .style("top", (event.pageY - 28) + "px");
      })
      .on("mouseout", () => {
        d3.select("#tooltip").style("opacity", 0);
      });
  }

  /**
   * This function contains the D3 code for binding data to visual elements.
   * We call this function every time the data or configurations change 
   * (i.e., user selects a different year)
   */
  renderVis() {
    let vis = this;

    // Add rectangles
    vis.chart.selectAll('.bar')
        .data(vis.data)
        .enter()
      .append('rect')
        .attr('class', 'bar')
        .attr('width', d => vis.xScale(vis.xValue(d)))
        .attr('height', vis.yScale.bandwidth())
        .attr('y', d => vis.yScale(vis.yValue(d)))
        .attr('x', 0);
    
    // Update the axes because the underlying scales might have changed
    vis.xAxisG.call(vis.xAxis);
    vis.yAxisG.call(vis.yAxis);
  }
}