var mapMain;

// @formatter:off
require([
        "esri/map",
        "esri/toolbars/draw",
        "esri/graphic",
        "esri/graphicsUtils",

        "esri/symbols/SimpleMarkerSymbol",
        "esri/symbols/SimpleLineSymbol",
        "esri/symbols/SimpleFillSymbol",

        "esri/Color",
        "esri/tasks/Geoprocessor",
        "esri/tasks/FeatureSet",
        "esri/tasks/LinearUnit",
        "esri/tasks/PrintTemplate",
        "esri/dijit/Print",

        "dojo/ready",
        "dojo/parser",
        "dojo/on",
        "dojo/_base/array"],

    function (Map, Draw, Graphic, graphicsUtils, 
             SimpleMarkerSymbol, SimpleLineSymbol, SimpleFillSymbol,
             Color, Geoprocessor, FeatureSet, LinearUnit, PrintTemplate, Print,
             ready, parser, on, array) {
                
// @formatter:on

        // Wait until DOM is ready *and* all outstanding require() calls have been resolved
        ready(function () {

            // Parse DOM nodes decorated with the data-dojo-type attribute
            parser.parse();

            // 9no. STEP create an array of JSON objects that will be used to create print templates

            var myLayouts = [{

                "name" : "Letter ANSI A Landscape",
        
                "label" : "Landscape (PDF)",
        
                "format" : "pdf",
        
                "options" : {
        
                "legendLayers" : [], // empty array means no legend
        
                "scalebarUnit" : "Miles",
        
                "titleText" : "Landscape PDF"
        
                }
        
            }, {
        
                "name" : "Letter ANSI A Portrait",
        
                "label" : "Portrait (JPG)",
        
                "format" : "jpg",
        
                "options" : {
        
                "legendLayers" : [],
        
                "scaleBarUnit" : "Miles",
        
                "titleText" : "Portrait JPG"
        
                }
        
            }];
        
          
            // create the print templates, could also use dojo.map
        
            var myTemplates = [];
        
            dojo.forEach(myLayouts, function(lo) {
        
                var t = new PrintTemplate();
        
                t.layout = lo.name;
        
                t.label = lo.label;
        
                t.format = lo.format;
        
                t.layoutOptions = lo.options;
        
                myTemplates.push(t);
        
            });
        
   
   
            // Create the map
            mapMain = new Map("divMap", {
                basemap: "topo",
                center: [-122.45, 37.75],
                zoom: 12
            });

            // 1ero. Step: Construct the Geoprocessor
             var gpViewshed = new Geoprocessor("https://sampleserver6.arcgisonline.com/arcgis/rest/services/Elevation/ESRI_Elevation_World/GPServer/Viewshed");


            mapMain.on("load", function () {

         
            // 8vo.Step: Set the spatial reference for output geometries
                gpViewshed.outSpatialReference = mapMain.spatialReference;
            
           
            // 10mo. Step Add a print Widget that uses the prepared templates

            var widgetPrint = new Print({
                map : mapMain,
                url : "https://sampleserver6.arcgisonline.com/arcgis/rest/services/Utilities/PrintingTools/GPServer/Export%20Web%20Map%20Task",
            },  divPrint);
                widgetPrint.startup();
    

            // Collect the input observation point
            var tbDraw = new Draw(mapMain);
            tbDraw.on("draw-end", calculateViewshed);
            tbDraw.activate(Draw.POINT);
            
       
            
            function calculateViewshed(evt) {

                // clear the graphics layer
                mapMain.graphics.clear();

                // marker symbol for drawing viewpoint
                var smsViewpoint = new SimpleMarkerSymbol();
                smsViewpoint.setSize(12);
                smsViewpoint.setOutline(new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID, new Color([255, 255, 255]), 1));
                smsViewpoint.setColor(new Color([0, 0, 0]));

                // add viewpoint to the map
                var graphicViewpoint = new Graphic(evt.geometry, smsViewpoint);
                mapMain.graphics.add(graphicViewpoint);

                // 2do. Step: Prepare the first input parameter
                var fsInputPoint = new FeatureSet();
                fsInputPoint.features.push(graphicViewpoint);



                // 3er. Step: Prepare the second input parameter en 8km o 5miles
                var luDistance = new LinearUnit();
                luDistance.distance = 5;
                luDistance.units = "esriMiles";


                //4to. Step: Build the input parameters into a JSON-formatted object
                var gpParams = {
                    "Input_Observation_Point" : fsInputPoint,
                    "Viewshed_Distance" : luDistance
                };


                // 5to. Step: Wire and execute the Geoprocessor
                 gpViewshed.on("execute-complete", displayViewshed);
                 gpViewshed.execute(gpParams);
            }

            function displayViewshed(results, messages) {

                // polygon symbol for drawing results
                var sfsResultPolygon = new SimpleFillSymbol();
                sfsResultPolygon.setOutline(new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID, new Color([255, 165, 0, 0.5]), 1));
                sfsResultPolygon.setColor(new Color([255, 125, 0, 0.5]));


                // 6to Step: Extract the array of features from the results
                var pvresult = results.results[0];
                var gpFeatureRecordSetlayer = pvresult.value;
                var arrayFeatures = gpFeatureRecordSetlayer.features;

         

                // loop through results
                array.forEach(arrayFeatures, function (feature) {
                
                // 7mo. Step: Symbolize and add each graphic to the map's graphics layer
                feature.setSymbol(sfsResultPolygon);
                mapMain.graphics.add(feature);
            });

      
            // update the map extent
            var extentViewshed = graphicsUtils.graphicsExtent(mapMain.graphics.graphics);
            mapMain.setExtent(extentViewshed, true);
        }
        });
    });
});

