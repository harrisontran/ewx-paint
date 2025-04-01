var projection = d3.geoAlbersUsa()
var painting = false;  // State is [true] if user is painting
var paintMode = 0;

// Form reading
const NULL_COLOR = "#474749"
var PAINT_COLOR = d3.select("#form-color").node().value;
var showInterstates = d3.select("#form-interstate").node().checked
var showShadow = d3.select("#form-shadow").node().checked
var showRivers = d3.select("#form-river").node().checked
var showMajorCities = d3.select("#form-major-cities").node().checked
var showMinorCities = d3.select("#form-minor-cities").node().checked

// SVG initialization
var margin = {
    top: 0,
    right: 52,
    bottom: 20,
    left: 0
}
const width = 1000 - margin.left - margin.right
const height = 600 - margin.top - margin.bottom;

const svg = d3.select("div#container-svg")
    .append("svg")
    .attr("id", "map")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .attr("transform",
        "translate(" + margin.left + "," + margin.top + ")");

const shadowGroup = svg.append("g").attr("id", "shadowLayer")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
const geoGroup = svg.append("g").attr("id", "geographyLayer")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
const outlineGroup = svg.append("g").attr("id", "outlineLayer")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
const cityGroup = svg.append("g").attr("id", "cityLayer")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
const labelGroup = svg.append("g").attr("id", "labelLayer")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");


console.log("Initialized map...")

// Draw the map
const drawMap = async function() {
    // Load .geoJSON
    const counties = await d3.json("geojson/counties_ewx.geojson");
    const interstates = await d3.json("geojson/interstates_ewx.geojson");
    const rivers = await d3.json("geojson/rivers_major_ewx.geojson");
    const cities = await d3.json("geojson/cities.geojson");



    projection = d3.geoAlbersUsa().fitSize([width, height], counties);
    var path = d3.geoPath().projection(projection);

    // County mapping
    geoGroup.selectAll("path")
        .data(counties.features)
        .enter().append("path")
        .attr("d", path)
        .attr("class", "county")
        .style("fill", NULL_COLOR)
        .on("mousedown", function(event, d) {
            painting = true
            if (event.button === 0) {
                paintMode = 0
                d3.select(this).transition().duration(100).style("fill", PAINT_COLOR)
            } else {
                paintMode = 1
                d3.select(this).transition().duration(100).style("fill", NULL_COLOR)
            }
        })
        .on("mouseenter", function(event, d) {
            if (painting) {
                if (paintMode === 0) {
                    d3.select(this).transition().duration(100).style("fill", PAINT_COLOR)
                } else {
                    d3.select(this).transition().duration(100).style("fill", NULL_COLOR)
                }
            }
        })
        .on("mouseup", function() {
            painting = false; // Disable painting once drag is complete
        })
        .on("contextmenu", function(event, d) {
            event.preventDefault();
            d3.select(this).transition().duration(100).style("fill", NULL_COLOR)
            painting = false;
        });

    // River mapping
    outlineGroup.append("path")
        .attr("d", path(rivers))
        .attr("class", "river")
        .style("visibility", function() {
            return showRivers ? "visible" : "hidden"
        })

    // Interstate mapping
    outlineGroup.append("path")
        .attr("d", path(interstates))
        .attr("class", "interstate")
        .style("visibility", function() {
            return showInterstates ? "visible" : "hidden"
        })
    console.log(cities.features)

    // Major city mapping
    cityGroup.selectAll("circle.city-major")
        .data(cities.features.filter(function(d){ return d.properties.Class === "Major"; }))
        .join("circle")
        .attr("class", "city-major")
        .attr("cx", d => projection(d.geometry.coordinates)[0])
        .attr("cy", d => projection(d.geometry.coordinates)[1])
        .attr("r", 10)
        .attr("visibility", function() {
            return showMajorCities ? "visible" : "hidden"
        })

    cityGroup.selectAll("circle.city-minor")
        .data(cities.features.filter(function(d){ return d.properties.Class === "Minor"; }))
        .join("circle")
        .attr("class", "city-minor")
        .attr("cx", d => projection(d.geometry.coordinates)[0])
        .attr("cy", d => projection(d.geometry.coordinates)[1])
        .attr("r", 7)
        .attr("visibility", function() {
            return showMinorCities ? "visible" : "hidden"
        })

    labelGroup.selectAll("text.city-major-label")
        .data(cities.features.filter(function(d){ return d.properties.Class === "Major"; }))
        .join("text")
        .attr("class", "city-major-label")
        .attr("x", d => projection(d.geometry.coordinates)[0] + 15)
        .attr("y", d => projection(d.geometry.coordinates)[1])
        .text(d => d.properties.City)
        .attr("visibility", function() {
            return showMajorCities ? "visible" : "hidden"
        })

    labelGroup.selectAll("text.city-minor-label")
        .data(cities.features.filter(function(d){ return d.properties.Class === "Minor"; }))
        .join("text")
        .attr("class", "city-minor-label")
        .attr("x", d => projection(d.geometry.coordinates)[0] + 15)
        .attr("y", d => projection(d.geometry.coordinates)[1])
        .text(d => d.properties.City)
        .attr("visibility", function() {
            return showMinorCities ? "visible" : "hidden"
        })

    // Drop shadow definitions
    filterDef = svg.append("defs").append("filter").attr("id", "dropshadow")
    filterDef.append("feDropShadow")
        .attr("dx", 10)
        .attr("dy", 10)
        .attr("stdDeviation", "3")
        .attr("flood-color", "black")
        .attr("flood-opacity", "0.9")

    shadowGroup.append("path").attr("d", path(counties)).attr("class", "shadow")
        .style("filter", "url(#dropshadow)").style("opacity", function() {
            return showShadow ? 1 : 0
        })
}

// Form handling
// Color handling
d3.select("#form-color").on("input", function() {
    PAINT_COLOR = d3.select("#form-color").node().value;
})

// Interstate toggle
d3.select("#form-interstate").on("click", function() {
    if (d3.select(this).property("checked")) {
        d3.select(".interstate").style("visibility", "visible")
    } else {
        d3.select(".interstate").style("visibility", "hidden")
    }
})

d3.select("#form-shadow").on("click", function() {
    if (d3.select(this).property("checked")) {
        d3.selectAll(".shadow").style("opacity", 1)
    } else {
        d3.selectAll(".shadow").style("opacity", 0)
    }
})

d3.select("#form-river").on("click", function() {
    if (d3.select(this).property("checked")) {
        d3.selectAll(".river").style("opacity", 1)
    } else {
        d3.selectAll(".river").style("opacity", 0)
    }
})

d3.select("#form-major-cities").on("click", function() {
    if (d3.select(this).property("checked")) {
        d3.selectAll(".city-major").attr("visibility", "visible")
        d3.selectAll(".city-major-label").attr("visibility", "visible")

        d3.select("#form-minor-cities").property("disabled", false)
    } else {
        d3.selectAll(".city-major").attr("visibility", "hidden")
        d3.selectAll(".city-major-label").attr("visibility", "hidden")

        // Also disable minor cities
        d3.select("#form-minor-cities")
        .property("checked", false)
        .property("disabled", true)
        clickMinorCities();
    }
})

d3.select("#form-minor-cities").on("click", function() {
    clickMinorCities();
})

let clickMinorCities = function() {

    if (d3.select("#form-minor-cities").property("checked")) {
        d3.selectAll(".city-minor").attr("visibility", "visible")
        d3.selectAll(".city-minor-label").attr("visibility", "visible")
    } else {
        d3.selectAll(".city-minor").attr("visibility", "hidden")
        d3.selectAll(".city-minor-label").attr("visibility", "hidden")
    }
}

drawMap();

// Downloaders
d3.select("#download-button")
    .on('click', function() {
        var scaling = (function() {
            scaleValue = d3.select("#scaling").node().value
            if (isNaN(scaleValue)) {
                return 100
            } else if (scaleValue == "") {
                return 100
            } else if (scaleValue < 25) {
                return 25
            } else if (scaleValue > 300) {
                return 300
            } else {
                return scaleValue;
            }
        })();
        saveSvgAsPng(document.getElementsByTagName("svg")[0], "EWX_Paint.png", {
            scale: scaling / 100,
            backgroundColor: "#FFFFFF00"
        });
        console.log(`Downloading at ${scaling}% scale`)
    })
