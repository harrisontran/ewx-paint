var projection = d3.geoAlbersUsa()
var painting = false; // State is [true] if user is painting
var paintMode = 0;

// Form reading
const NULL_COLOR = "#474749"
var PAINT_COLOR = d3.select("#form-color").node().value;
var showInterstates = d3.select("#form-interstate").node().checked
var showShadow = d3.select("#form-shadow").node().checked
var showRivers = d3.select("#form-river").node().checked

// SVG initialization
var margin = {
    top: 0,
    right: 0,
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
const labelGroup = svg.append("g").attr("id", "labelLayer")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
const cityGroup = svg.append("g").attr("id", "cityLayer")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");


console.log("Initialized map...")

// Draw the map
const drawMap = async function() {
    // Load .geoJSON
    const counties = await d3.json("geojson/counties_ewx.geojson");
    const interstates = await d3.json("geojson/interstates_ewx.geojson");
    const rivers = await d3.json("geojson/rivers_major_ewx.geojson");

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