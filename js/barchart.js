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
    this.displayMode = 'magnitude';
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
    vis.chartTitle = vis.svg.append("text")
    .attr("class", "chart-title")
    .attr("x", vis.config.containerWidth / 2 + 100)
    .attr("y", vis.config.margin.top / 2)
    .attr("text-anchor", "middle");

    vis.yAxisG.append("text")
    .attr("class", "axis-title")
    .attr("text-anchor", "middle")
    .attr("transform", `rotate(-90)`)
    .attr("x", -vis.height / 2)
    .attr("y", -vis.config.margin.left + 20)
    .text("Percentage of Earthquakes");

    vis.xAxisLabel = vis.xAxisG.append("text")
    .attr("class", "axis-title")
    .attr("text-anchor", "middle")
    .attr("x", vis.width / 2)
    .attr("y", 310)
  }

  /**
   * This function contains all the code to prepare the data before we render it.
   * In some cases, you may not need this function but when you create more complex visualizations
   * you will probably want to organize your code in multiple functions.
   */
  updateVis() {
    let vis = this;
  
    let accessor, min, max, binSize, labelFormatter;

    // Determine mode: magnitude or depth
    if (vis.displayMode === 'magnitude') {
      accessor = d => d.magnitude;
      min = 3;
      max = 10;
      binSize = 1;
      labelFormatter = (start, end) => `${start.toFixed(1)}–${end.toFixed(1)}`;
    } else {
      accessor = d => d.depth;
      min = 0;
      max = 700;
      binSize = 100;
      labelFormatter = (start, end) => `${start}–${end} km`;
    }

    // Create bins
    let bins = [];
    for (let i = min; i < max; i += binSize) {
      bins.push({
        range: [i, i + binSize],
        label: labelFormatter(i, i + binSize),
        count: 0
      });
    }

    // Bin the data
    vis.data.forEach(d => {
      const val = accessor(d);
      for (const bin of bins) {
        if (val >= bin.range[0] && val < bin.range[1]) {
          bin.count++;
          break;
        }
      }
    });

    const total = d3.sum(bins, d => d.count);
    bins.forEach(d => {
      d.percentage = (d.count / total) * 100;
    });

    vis.binnedData = bins;

    // Set up the colors to use for the bars
    let colorScale;
    if (vis.displayMode === 'magnitude') {
      colorScale = d3.scaleSequential()
        .domain([3, 10]) // adjust to match bin range
        .interpolator(d3.interpolateBlues);
    } else {
      colorScale = d3.scaleSequential()
        .domain([0, 700]) // depth in km
        .interpolator(d3.interpolateReds);
    }
  
    // Set domains for scales
    vis.xScale.domain(bins.map(d => d.label));
    vis.yScale.domain([0, 100]);
  
    // Update axes
    vis.xAxisG.call(vis.xAxis)
      .selectAll("text")
      .attr("transform", "rotate(-35)")
      .style("text-anchor", "end");
  
    vis.yAxisG.call(vis.yAxis);
  
    // Add invisible hitboxes for tooltips
    vis.chart.selectAll(".bar-hit")
    .data(vis.binnedData)
    .join("rect")
    .attr("class", "bar-hit")
    .attr("x", d => vis.xScale(d.label) - 2)
    .attr("y", 0)
    .attr("width", vis.xScale.bandwidth() + 4)
    .attr("height", vis.height)
    .attr("fill", "transparent")
    .on("mouseover", (event, d) => {
      const bar = vis.chart.selectAll(".bar")
        .filter(b => b.label === d.label)
        .attr("original-fill", function () {
          return d3.select(this).attr("fill");
        })
        .attr("fill", "#FFD700") // Gold highlight
        .attr("stroke", "black")
        .attr("stroke-width", "1px")
        .style("transform", "scaleY(1.1)")
        .style("transform-origin", "bottom");

      d3.select("#tooltip")
        .style("opacity", 1)
        .html(`
          <strong>${vis.displayMode === 'magnitude' ? 'Magnitude' : 'Depth'}:</strong> ${d.label}<br>
          <strong>Number of Earthquakes:</strong> ${d.count.toLocaleString()}<br>
          <strong>Percent:</strong> ${d.percentage.toFixed(1)}%
        `);
    })
    .on("mousemove", (event) => {
      d3.select("#tooltip")
        .style("left", (event.pageX + 10) + "px")
        .style("top", (event.pageY - 28) + "px");
    })
    .on("mouseout", (event, d) => {
      vis.chart.selectAll(".bar")
        .filter(b => b.label === d.label)
        .attr("fill", function () {
          return d3.select(this).attr("original-fill");
        })
        .attr("stroke", null)
        .attr("stroke-width", null)
        .style("transform", null);

      d3.select("#tooltip").style("opacity", 0);
    });

    // Bind data and create bars
    vis.chart.selectAll(".bar")
      .data(vis.binnedData)
      .join("rect")
      .attr("class", "bar")
      .attr("x", d => vis.xScale(d.label))
      .attr("y", d => vis.yScale(d.percentage))
      .attr("width", vis.xScale.bandwidth())
      .attr("height", d => vis.height - vis.yScale(d.percentage))
      .attr("fill", d => {
        const val = vis.displayMode === 'magnitude'
          ? (d.range[0] + d.range[1]) / 2
          : (d.range[0] + d.range[1]) / 2;
      
        return colorScale(val);
      })

      //Add tooltip interactivity
      .on("mouseover", (event, d) => {
        const metricLabel = vis.displayMode === 'magnitude' ? "Magnitude" : "Depth";
        d3.select("#tooltip")
          .style("opacity", 1)
          .html(`
            <strong>${metricLabel}:</strong> ${d.label}<br>
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
    
    // Update the title and x axis label
    const label = vis.displayMode === 'magnitude' ? "Magnitude" : "Depth";

    vis.chartTitle.text(`Percentage of Earthquakes by ${label} Range`);
    vis.xAxisLabel.text(`${label} Range`);
  }

  // Method to switch which data is displayed in the bar chart
  setDisplayMode(mode) {
    this.displayMode = mode;
    this.updateVis();
  }
}