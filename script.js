import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";

// Set SVG dimensions
const height = 600;
const width = 960;
//const padding = 60;

// Create SVG element in the main container
const svg = d3
  .select(".main-container")
  .append("svg")
  .attr("height", height)
  .attr("width", width);

// Create tooltip div
const tooltip = d3
  .select("body")
  .append("div")
  .attr("class", "tooltip")
  .attr("id", "tooltip")
  .style("opacity", 0);

// Define color scale for education percentages
const color = d3
  .scaleThreshold()
  .domain([3, 12, 21, 30, 39, 48, 57, 66])
  .range(d3.schemeBlues[8]);

// Define x scale for legend
const xScale = d3.scaleLinear().domain([3, 66]).range([14, 300]);

// Prepare data for legend rectangles
const data = color.range().map((d) => {
  d = color.invertExtent(d);
  if (d[0] == null) d[0] = xScale.domain()[0];
  if (d[1] == null) d[1] = xScale.domain()[1];

  return d;
});

// Define x-axis for legend
const xAxis = d3
  .axisBottom(xScale)
  .tickSize(12)
  .tickValues(color.domain())
  .tickFormat((d) => d + "%");

// Create legend group and append rectangles for color scale
const group = svg
  .append("g")
  .attr("id", "legend")
  .attr("transform", `translate(500,20)`);

group
  .selectAll("rect")
  .data(data)
  .enter()
  .append("rect")
  .attr("height", 8)
  .attr("width", (d) => xScale(d[1] - d[0]))
  .attr("x", (d) => {
    return xScale(d[0]);
  })
  .attr("fill", (d) => {
    return color(d[0]);
  });
// Add x-axis to legend
group.append("g").attr("transform", `translate(0,0)`).call(xAxis);
svg.selectAll(".x.axis path").style("display", "none");

// Set up geo path and projection
const path = d3.geoPath();
const projection = d3
  .geoMercator()
  .scale(150)
  .translate([width / 2, height / 2]);
const pathGenerator = d3.geoPath().projection(projection);

// Load education and county data
d3.json(
  "https://cdn.freecodecamp.org/testable-projects-fcc/data/choropleth_map/for_user_education.json"
).then((dataEdu) => {
  d3.json(
    "https://cdn.freecodecamp.org/testable-projects-fcc/data/choropleth_map/counties.json"
  ).then(function (data) {
    // Convert TopoJSON to GeoJSON for counties and states
    const countries = topojson.feature(data, data.objects.counties);

    const state = topojson.feature(data, data.objects.states);
    // const state = topojson.mesh(data, data.objects.states, function (a, b) {
    //   return a !== b;
    // });
    //console.log(state);

    // Draw counties
    svg
      .append("g")
      .selectAll("path")
      .data(countries.features)
      .enter()
      .append("path")
      .attr("class", "county")
      // Set data-fips attribute for each county
      .attr(
        "data-fips",
        (d) => dataEdu.filter((edu) => edu.fips === d.id)[0].fips
      )
      // Set data-education attribute for each county
      .attr(
        "data-education",
        (d) => dataEdu.filter((edu) => edu.fips === d.id)[0].bachelorsOrHigher
      )
      .attr("d", path)
      // Set fill color based on education data
      .attr("fill", (d) => {
        const edu = dataEdu.filter((edu) => edu.fips === d.id);

        return color(edu[0].bachelorsOrHigher);
      })
      // Tooltip mouseover event
      .on("mouseover", (event, d) => {
        const edu = dataEdu.filter((edu) => edu.fips === d.id)[0];
        tooltip.transition().duration(200).style("opacity", 0.9);
        tooltip
          .html(`${edu.area_name}, ${edu.state}: ${edu.bachelorsOrHigher}%`)
          .style("left", event.pageX + 15 + "px")
          .style("top", event.pageY - 50 + "px")
          .attr(
            "data-education",
            dataEdu.filter((edu) => edu.fips === d.id)[0].bachelorsOrHigher
          );
      })
      // Tooltip mouseout event
      .on("mouseout", function () {
        tooltip.transition().duration(500).style("opacity", 0);
      });
    // Draw state borders
    svg
      .append("g")
      .selectAll("path")
      .data(state.features)
      .enter()
      .append("path")
      .attr("d", path)
      .attr("fill", "none")
      .attr("stroke", "white");
  });
});
