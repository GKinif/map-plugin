(function() {

    // Custom configuration
    var countryTextSize = 1;
    var lineWidth = 1.5;

    d3.select(window).on("resize", throttle);

    var width = window.innerWidth;
    var height = window.innerHeight;

    var zoom = d3.behavior.zoom()
        .scaleExtent([1, 9]) // zoom limit
        .on("zoom", move);
        
    // Variables to store data from json ( if needed )
    var stories;

    var topo, names, projection, path, svg, graticule, modal;

    var g, // main group containing other groups
        group_line,
        group_graticule, // group for the grid
        group_stories, // group for stories images
        group_country, // group for countries shapes
        group_country_name, // group for countries names
        group_routes, // group for routes used by refugees
        group_death; // group to display death area

    var switch_graticule = true;

    setup(width,height);

    d3.json("data/ne_50m_admin_0_countries.json", function(error, world) {
        topo = topojson.feature(world, world.objects.ne_50m_admin_0_countries).features;

        // topo = countries;
        drawMap(topo);

    });

    // DRAW MAP ================================================================================
    /**
     * - Setup the projection (type, center and scale)
     * - Init path and graticule
     * - Add svg node to #map
     * - Create ClipPath and marker
     * - Setup and order groups
     * @param  {Integer} width  width of the container
     * @param  {Integer} height height of the container
     */
    function setup(width, height) {
        // create projection
        projection = d3.geo.equirectangular()
            .center([1, 1 ]) // bug when set to 0, 0
            .translate([(width/2), (height/2)]) // center the map in the container
            .scale( width / 2 / Math.PI); // scale the map to fit the width of container

        path = d3.geo.path().projection(projection);
        graticule = d3.geo.graticule();

        // append svg node to div #map
        svg = d3.select("#map").append("svg")
            .attr("width", width)
            .attr("height", height)
            .call(zoom) // enable zoomable on svg
            ;

        
        // setuping group layer on map, last come on top of the map
        g = svg.append("g");
        group_country = g.append('g').attr('id', 'group_country');
        group_graticule = g.append('g').attr('id', 'group_graticule');
        group_country_name = g.append('g').attr('id', 'group_country_name');

    };

    /**
     * Draw the map inside the svg element using the information from topo
     * @param {topojson.features} topo: countries features from tje topojson file
     */
    function drawMap(topo) {
        // Draw country geometry on map
        var country = group_country.selectAll(".country").data(topo);
        country.enter().append("path")
            .attr("class", "country")
            .attr("d", path);

        // draw grid on map
        group_graticule.append("path")
            .datum(graticule)
            .attr("class", "graticule")
            .attr("d", path);

        
        // Draw elements
        drawCountryName(topo);


    };
    /**
     * Redraw the map when the window size change
     */
    function redrawMap() {
        width = d3.select('#map').node().offsetWidth;
        height = d3.select('#map').node().offsetHeight;
        d3.select('svg').remove();
        setup(width,height);
        drawMap(topo);
    };

    // DRAW LAYER ON MAP =====================================================================
    /**
     * Draw the name for each country coming from the topojson file
     * Name are placed on the centroid of each country
     * @param  {topojson.features} topo countries features from topojson file
     */
    function drawCountryName(topo) {
        // Show country name on map 
        var countryName = group_country_name.selectAll(".country_name").data(topo);
        
        countryName.enter().append('text')
            .attr('x', function (d) { return path.centroid(d)[0] - d.properties.name.length/2; })
            .attr('y', function (d) { return path.centroid(d)[1]; })
            .attr('class', 'country_name')
            .text( function (d) { return d.properties.name } )
            .style('font-size', function (d) { return Math.sqrt(path.area(d))*0.1*countryTextSize + 'px'; })
            .style('display', function (d) { return ( path.area(d) < 50 )?'none':'block'; });
    };


    // ==========================================================================================================
    /**
     * Function called when the user pan/zoom the map
     * Translate and scale the map according on the zoom
     * Adjust the size of svg element according to zoom
     */
    function move() {

        var t = d3.event.translate;
        var s = d3.event.scale; 
        var h = height/4;

        t[0] = Math.min(
            (width/height)  * (s - 1), 
            Math.max( width * (1 - s), t[0] )
        );

        t[1] = Math.min(
            h * (s - 1) + h * s, 
            Math.max(height  * (1 - s) - h * s, t[1])
        );

        zoom.translate(t);
        g.attr("transform", "translate(" + t + ")scale(" + s + ")");

        //adjust the country hover stroke width based on zoom level
        d3.selectAll(".country").style("stroke-width", 1.5 / s);
        //adjust the graticule stroke width based on zoom level
        d3.selectAll(".graticule").style("stroke-width", 1.5 / s);
        //adjust the line stroke width based on zoom level



    };



    var throttleTimer;
    /**
     * Set an interval before the map redraw when window size change
     */
    function throttle() {
        window.clearTimeout(throttleTimer);
        throttleTimer = window.setTimeout(function() {
            redrawMap();
        }, 200);
    };



})();