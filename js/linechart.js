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
    // console.log(this.data);
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

    // Initialize y axes
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
      .attr("height", 60)
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

    vis.tooltip.append("text")
      .attr("class", "tooltip-location")
      .attr("x", 8)
      .attr("y", 32)
      .style("font-size", "12px")
      .style("fill", "#333");

    // Second line: value
    vis.tooltip.append("text")
      .attr("class", "tooltip-value")
      .attr("x", 8)
      .attr("y", 48)
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

    // Add brush
    vis.brush = d3.brushX()
      .extent([[0, 0], [vis.width, vis.height]])
      .on("end", function (event) {
        if (vis.suppressBrush) return;

        const selection = event.selection;

        if (!selection) {
          handleBrushedData(window.earthquakeData, "linechart");
          return;
        }

        const [x0, x1] = selection;
        const startDate = vis.xScale.invert(x0);
        const endDate = vis.xScale.invert(x1);

        const brushed = window.earthquakeData.filter(d => {
          const time = new Date(d.localTime);
          return time >= startDate && time <= endDate;
        });

        // Save the filter function for recombination
        vis.lineChartFilter = d => {
          const time = new Date(d.localTime);
          return time >= startDate && time <= endDate;
        };

        // Clear brush rectangle visually
        vis.chart.select(".brush").call(vis.brush.move, null);

        handleBrushedData(brushed, "linechart");
      });

    vis.chart.append("g")
      .attr("class", "brush")
      .call(vis.brush);

    // Draw the line chart
    this.updateVis();
  }

  /**
   * Prepare the data and scales before we render it.
   */
  updateVis() {
    let vis = this;

    // Build the x axis ticks dynamically
    const tickCount = 5;

    vis.xAxis = d3.axisBottom(vis.xScale)
      .ticks(tickCount)
      .tickFormat(d => {
        const range = vis.xScale.domain();
        const totalDays = (range[1] - range[0]) / (1000 * 60 * 60 * 24);

        if (totalDays < 120) {
          return d3.timeFormat("%b %d, %Y")(d);
        } else {
          return d3.timeFormat("%b %Y")(d);
        }
      });

    vis.xAxisG.call(vis.xAxis);

    vis.data.sort((a, b) => d3.ascending(a.date, b.date));

    vis.xValue = (d) => d.date;
    vis.yValue = (d) => d.value;

    vis.line = d3
      .line()
      .x((d) => vis.xScale(vis.xValue(d)))
      .y((d) => vis.yScale(vis.yValue(d)));

    // console.log(vis.yValue);

    // Set the scale input domains
    vis.xScale.domain(d3.extent(vis.data, vis.xValue));
    vis.yScale.domain([0, d3.max(vis.data, vis.yValue)]).nice();

    vis.bisectDate = d3.bisector(vis.xValue).center;

    vis.chart.select(".overlay")
      .on("mousemove", function (event) {
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

        vis.tooltip.select(".tooltip-location")
          .text(`Location: ${(d.place)}`);

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

  // Method to update the data used after a brush is triggered
  updateData(filtered) {
    const countsByDate = d3.rollups(
      filtered,
      v => v.length,
      d => d3.timeFormat("%Y-%m-%d")(new Date(d.localTime))
    ).map(([dateStr, count]) => ({
      date: new Date(dateStr),
      value: count
    }));

    this.data = countsByDate;
    this.updateVis();
  }
}