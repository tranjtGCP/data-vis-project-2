class LineChart {

  /**
   * Class constructor with basic chart configuration
   * @param {Object}
   * @param {Array}
   */
  constructor(_config, _data) {
    this.config = {
      parentElement: _config.parentElement,
      containerWidth: _config.containerWidth || 800,
      containerHeight: _config.containerHeight || 430,
      margin: _config.margin || { top: 60, right: 0, bottom: 40, left: 80 },
    };
    this.data = _data;
    this.initVis();
  }
  
  /**
   * Initialize scales/axes and append static chart elements
   */
  initVis() {
    let vis = this;

    vis.width = vis.config.containerWidth - vis.config.margin.left - vis.config.margin.right;
    vis.height = vis.config.containerHeight - vis.config.margin.top - vis.config.margin.bottom;

    vis.xScale = d3.scaleTime()
        .range([0, vis.width]);

    vis.yScale = d3.scaleLinear().domain(d3.extent(vis.data, d => d.value))
        .range([vis.height, 0])
      .nice();
    
    // function thresholdTime(n) {
    //   return (data, min, max) => {
    //     return d3.scaleUtc().domain([min, max]).ticks(n);
    //   };
    // }
    
    // vis.bins = d3.bin().value((d) => d.date)
    //             .thresholds(thresholdTime(20))
    
    // X and Y domains
    // vis.xScale.domain(d3.extent(vis.data, d => d.date));

    // Initialize axes
    vis.xAxis = d3
      .axisBottom(vis.xScale)
      .ticks(d3.timeYear.every(1))
      .tickFormat(d3.timeFormat("%Y"));

    vis.yAxis = d3
      .axisLeft(vis.yScale)
      .ticks(10)
      .tickSizeOuter(0)
      .tickPadding(10);

    // Define size of SVG drawing area
    vis.svg = d3
      .select(vis.config.parentElement)
      .attr("width", vis.config.containerWidth)
      .attr("height", vis.config.containerHeight);

    vis.svg
      .append("text")
      .attr("class", "chart-title")
      .attr("x", vis.config.containerWidth / 2)
      .attr("y", vis.config.margin.top / 2)
      .attr("text-anchor", "middle")
      .text("Number of Earthquakes Over the Years");

    // Append group element that will contain our actual chart (see margin convention)
    vis.chart = vis.svg.append('g')
        .attr('transform', `translate(${vis.config.margin.left},${vis.config.margin.top})`);

    // Append x-axis group and move it to the bottom of the chart
    vis.xAxisG = vis.chart.append('g')
        .attr('class', 'axis x-axis')
        .attr('transform', `translate(0,${vis.height})`);
    
    // Append y-axis group
    vis.yAxisG = vis.chart.append('g')
        .attr('class', 'axis y-axis');

    // We need to make sure that the tracking area is on top of other chart elements
    vis.marks = vis.chart.append('g');
    vis.trackingArea = vis.chart.append('rect')
        .attr('width', vis.width)
        .attr('height', vis.height)
        .attr('fill', 'none')
        .attr('pointer-events', 'all');

        //(event,d) => {

    // Empty tooltip group (hidden by default)
    vis.tooltip = vis.chart.append('g')
        .attr('class', 'tooltip')
        .style('display', 'none');

    vis.tooltip.append('circle')
        .attr('r', 4)
        .attr("stroke", "black")
        .attr("fill", "gold");

    // Background rectangle
    vis.tooltip.append("rect")
    .attr("class", "tooltip-bg")
    .attr("width", 160)
    .attr("height", 40)
    .attr("fill", "white")
    .attr("stroke", "#ccc")
    .attr("rx", 4)
    .attr("ry", 4);

    // First line: date
    vis.tooltip.append("text")
    .attr("class", "tooltip-date")
    .attr("x", 8)
    .attr("y", 16)
    .style("font-size", "12px")
    .style("fill", "#333");

    // Second line: value
    vis.tooltip.append("text")
    .attr("class", "tooltip-value")
    .attr("x", 8)
    .attr("y", 32)
    .style("font-size", "12px")
    .style("fill", "#333");

    // X-axis label
    vis.xAxisLabel = vis.svg.append("text")
    .attr("class", "axis-title")
    .attr("text-anchor", "middle")
    .attr("x", vis.config.containerWidth / 2)
    .attr("y", vis.config.containerHeight + 10)
    .text("Date");

    // Y-axis label
    vis.yAxisLabel = vis.svg.append("text")
    .attr("class", "axis-title")
    .attr("text-anchor", "middle")
    .attr("transform", "rotate(-90)")
    .attr("x", -vis.config.containerHeight / 2)
    .attr("y", 30)
    .text("Number of Earthquakes");

    // Draw the line chart
    this.updateVis();
  }

  /**
   * Prepare the data and scales before we render it.
   */
  updateVis() {
    let vis = this;

    vis.data.sort((a, b) => d3.ascending(a.date, b.date));

    vis.xValue = (d) => d.date;
    vis.yValue = (d) => d.value;

    vis.line = d3
      .line()
      .x((d) => vis.xScale(vis.xValue(d)))
      .y((d) => vis.yScale(vis.yValue(d)));

    console.log(vis.yValue);

    // Set the scale input domains
    vis.xScale.domain(d3.extent(vis.data, vis.xValue));
    vis.yScale.domain([0, d3.max(vis.data, vis.yValue)]).nice();

    vis.bisectDate = d3.bisector(vis.xValue).center;

    vis.trackingArea
    .on("mousemove", function(event) {
      const mouseX = d3.pointer(event)[0];
      const date = vis.xScale.invert(mouseX);
      const i = vis.bisectDate(vis.data, date);
      const d = vis.data[i];
  
      const xPos = vis.xScale(d.date);
      const yPos = vis.yScale(d.value);
  
      vis.tooltip
        .style("display", null)
        .attr("transform", `translate(${xPos},${yPos})`);
  
      vis.tooltip.select("circle")
        .attr("fill", "gold") 
        .attr("stroke", "black");
  
      vis.tooltip.select(".tooltip-date")
        .text(`Date: ${d3.timeFormat("%b %d, %Y")(d.date)}`);
      
      vis.tooltip.select(".tooltip-value")
        .text(`Number of Earthquakes: ${d.value}`);
    });

    vis.renderVis();
  }

  /**
   * Bind data to visual elements
   */
  renderVis() {
    let vis = this;

    // Add line path
    vis.marks
      .selectAll(".chart-line")
      .data([vis.data])
      .join("path")
      .attr("class", "chart-line")
      .attr("d", vis.line)
      .style("fill", "#008080");
    
    // Update the axes
    vis.xAxisG.call(vis.xAxis);
    vis.yAxisG.call(vis.yAxis);
  }
}