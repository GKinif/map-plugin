(function() {
    this.MapObject = function() {
        this.svg = null;
        this.g = null;
        this.topo = null;
        this.projection = null;
        this.path = null;
        this.zoom = d3.behavior.zoom();
        this.groups = [];
        this.width = null;
        this.height = null;
        // Define option defaults
        var defaults = {
            mapid: 'map',
            countryTextSize: 1,
            lineWidth: 1,
            projection: 'equirectangular',
            center: [1, 1], // bug when set to 0, 0
            scaleExtent: [1, 9],
            translate: null,
            scale: null,
            topojson: null,
        };

        // Create options by extending defaults with the passed in arugments
        if (arguments[0] && typeof arguments[0] === "object") {
            if (typeof arguments[0] === "object") {
                this.options = extendDefaults(defaults, arguments[0]);
            }
        } else {
            this.options = defaults;
        }

        // register zoom event
        this.zoom.on("zoom", function(){move(this.zoom, this.g, this.height, this.width);});
        
    };

    /* Public Method ================================================================= */
    /**
     * load the data from topojson file, store them in this.topo and then launch this.init()
     * @param  {String} file        topojson file location
     * @param  {String} jsonfeature feature name in topojson file
     */
    MapObject.prototype.load = function(file, jsonfeature) {
        var thismap = this;
        d3.json(file, function(error, world) {
            // this.topo => features from topojson file;
            thismap.topo = topojson.feature(world, world.objects[jsonfeature]).features;
            thismap.init();
        });
    };

    /**
     * Initialize projection and other map parameters, then launch this.drawmap()
     */
    MapObject.prototype.init = function() {
        this.zoom.scaleExtent(this.options.scaleExtent); // zoom limit
            
        this.width = d3.select('#'+this.options.mapid).node().innerWidth;
        this.height = d3.select('#'+this.options.mapid).node().innerHeight;
        d3.select('svg').remove();

        if (this.options.translate == null) {
            this.options.translate = [(this.width/2), (this.height/2)]; // center the map in the container
        };
        if (this.options.scale == null) {
            this.options.scale = this.width / 2 / Math.PI; // scale the map to fit the width of container
        };

        this.projection = setProjection(
            this.options.projection,
            this.options.center,
            this.options.translate,
            this.options.scale
            );

        this.path = d3.geo.path().projection(this.projection).bind(this);

        this.svg = d3.select("#"+this.options.mapid).append("svg")
            .attr("width", this.width)
            .attr("height", this.height)
            .call(this.zoom); // enable zoomable on svg

        this.g = this.svg.append("g");

        drawMap(this.topo, this.path, this.g, this.options.mapid);

    };

    MapObject.prototype.addEvent = function() {

    };
    /* Private Method ================================================================ */
    // 
    /**
     * Utility method to extend defaults with user options
     * @param  {Object} source     defaults options
     * @param  {Object} properties options from user
     * @return {Object}            return options objects
     */
    function extendDefaults(source, properties) {
        var property;
        for (property in properties) {
            if (source.hasOwnProperty(property)) {
                source[property] = properties[property];
            }
        }
        return source;
    };

    /**
     * Return a d3.geo.projection acording to type
     * @param {String} type equirectangular/mercator
     * @return {d3.geo.projection}
     */
    function setProjection(type, center, translate, scale) {
        var projection;
        if (type === 'equirectangular') {
            projection = d3.geo.equirectangular();
        } else if (type === 'mercator') {
            projection : d3.geo.mercator();
        }
        projection.center(center) // bug when set to 0, 0
            .translate(translate) // center the map in the container
            .scale(scale); // scale the map to fit the width of container
        return projection;
    };

    function drawMap(topo, path, container, mapid) {
        // Draw countries geometry on map
        var countries = container.append('g').attr('id', mapid + '_countries').selectAll('.' + mapid + '_country').data(topo);

        countries.enter().append("path")
            .attr("class", mapid + '_country')
            .attr("d", path);
        
    };

    function move(zoom, target, height, width) {
        var t = d3.event.translate;
        var s = d3.event.scale; 
        var h = height/4;
        console.log(t);
        t[0] = Math.min(
            (width/height)  * (s - 1), 
            Math.max( width * (1 - s), t[0] )
        );

        t[1] = Math.min(
            h * (s - 1) + h * s, 
            Math.max(height  * (1 - s) - h * s, t[1])
        );

        zoom.translate(t);
        traget.attr("transform", "translate(" + t + ")scale(" + s + ")");
    };
}());


