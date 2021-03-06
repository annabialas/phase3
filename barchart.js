// Learning materials used to make this visualization:
// Bar chart via https://bl.ocks.org/mbostock/3943967
// Implementing data using .csv via https://github.com/DeBraid/www.cacheflow.ca/blob/master/styles/js/d3kickchart.js
// Tooltips via http://bl.ocks.org/Caged/6476579
// X-axis label via http://bl.ocks.org/phoebebright/3061203

var n = 2, // number of layers
    m = 20; // number of samples per layer

var margin = {top: 20, right: 50, bottom: 165, left: 75},
    width = 900 - margin.left - margin.right,
    height = 500 - margin.top - margin.bottom;

var svg = d3.select("#chart-svg").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

d3.csv("data.csv", function (data){
    
    var headers = ["hotspots", "sweetspots"];
    
    // Re-map the data from .csv into arrays: 
    var layers = d3.layout.stack()(headers.map(function(header) {
        return data.map(function(d) {
          return {x: d.alias, y: +d[header]};
        });
    }));

    var yGroupMax = d3.max(layers, function(layer) { return d3.max(layer, function(d) { return d.y; }); });
    var yStackMax = d3.max(layers, function(layer) { return d3.max(layer, function(d) { return d.y0 + d.y; }); });

    var xScale = d3.scale.ordinal()
        .domain(layers[0].map(function(d) { return d.x; }))
        .rangeRoundBands([20, width], .3);

    var y = d3.scale.linear()
        .domain([0, yStackMax]).nice()
        .range([height, 0]);

    var color = d3.scale.ordinal()
        .domain(headers)
        .range(["#DB0000", "#59A737"]); 
      
    var xAxis = d3.svg.axis()
        .scale(xScale)
        .tickPadding(15)
        .orient("bottom");

    var yAxis = d3.svg.axis()
        .scale(y)
        .orient("left")
        .tickFormat(d3.format("1s"));

    var layer = svg.selectAll(".layer")
        .data(layers)
        .enter().append("g")
        .attr("class", "layer")
        .style("fill", function(d, i) { return color(i); });

    // Tooltip setup:
    var tip = d3.tip()
      .attr('class', 'd3-tip')
      .offset([-10, 0])
      .html(function(d){ return d.y });

    svg.call(tip);

    var rect = layer.selectAll("rect")
        .data(function(d) { return d; })
        .enter().append("rect")
        .attr("x", function(d) { return xScale(d.x); })
        .attr("y", height)
        .attr("width", xScale.rangeBand())
        .attr("height", 0)
        .attr("class", "bar")
        .on('mouseover', tip.show)
        .on('mouseout', tip.hide);

    rect.transition()
        .delay(function(d, i) { return i * 10; })
        .attr("y", function(d) { return y(d.y0 + d.y); })
        .attr("height", function(d) { return y(d.y0) - y(d.y0 + d.y); });

    // Axes:
    svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + height + ")")
        .call(xAxis)
        .selectAll("text").style("text-anchor", "end")
            .attr("dx", "-.5em")
            .attr("dy", ".15em")
            .attr("transform", function(d) {
                  return "rotate(-45)" 
                });
    
    svg.append("g")
        .attr("class", "y axis")
        .attr("transform", "translate(20,0)")
        .call(yAxis)
      .append("text")
        .attr("transform", "rotate(-90)")
        .attr({"x": -75, "y": -80})
        .attr("dy", ".75em")
        .style("text-anchor", "end")
        .text("Number of Mental States")
        .style("font-weight", "600");

    // Legend:
    var legend = svg.selectAll(".legend")
        .data(headers.slice().reverse())
            .enter().append("g")
            .attr("class", "legend")
            .attr("transform", function(d, i) { return "translate(-20," + i * 20 + ")"; });
       
        legend.append("rect")
            .attr("x", width - 18)
            .attr("width", 18)
            .attr("height", 18)
            .style("fill", color)
            .style("fill-opacity", ".7");
    
        legend.append("text")
              .attr("x", width - 24)
              .attr("y", 9)
              .attr("dy", ".35em")
              .style("text-anchor", "end")
              .text(function(d) { return d;  });


    d3.selectAll("input").on("change", change);

    // Initial transform demonstration on timeout:
    var timeout = setTimeout(function() {
      d3.select("input[value=\"grouped\"]").property("checked", true).each(change);
    }, 2000);

    function change() {
      clearTimeout(timeout);
      if (this.value === "grouped") transitionGrouped();
      else transitionStacked();
    }

    function transitionGrouped() {
      y.domain([0, yGroupMax]).nice();

      // Declare y axis again so it updates:
      var yAxis = d3.svg.axis()
          .scale(y)
          .orient("left")
          .tickFormat(d3.format(".1s"));
      // Find yAxis and update it:
      svg.selectAll("g.y.axis").call(yAxis);

      rect.transition()
          .duration(500)
          .delay(function(d, i) { return i * 10; })
          .attr("x", function(d, i, j) { return xScale(d.x) + xScale.rangeBand() / n * j; })
          .attr("width", xScale.rangeBand() / n)
        .transition()
          .attr("y", function(d) { return y(d.y); })
          .attr("height", function(d) { return height - y(d.y); });
    };

    function transitionStacked() {
      y.domain([0, yStackMax]).nice();

      // Declare y axis again so it updates:
      var yAxis = d3.svg.axis()
          .scale(y)
          .orient("left")
          .tickFormat(d3.format(".1s"));
      // Find yAxis and update it:
      svg.selectAll("g.y.axis").call(yAxis);﻿

      rect.transition()
          .duration(500)
          .delay(function(d, i) { return i * 10; })
          .attr("y", function(d) { return y(d.y0 + d.y); })
          .attr("height", function(d) { return y(d.y0) - y(d.y0 + d.y); })
        .transition()
          .attr("x", function(d) { return xScale(d.x); })
          .attr("width", xScale.rangeBand());
    };

    // X-axis label:
    svg.append("text")
          .attr("text-anchor", "middle")
          .attr("transform", "translate("+ (width/2) +","+(height+100)+")")
          .text("Rider's Alias*")
          .style("font-weight", "600");
});