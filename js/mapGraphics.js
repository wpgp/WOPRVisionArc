/*
* Module to handle the drawing/uploading of graphics to define areas of extraction
*/


/*
* Method to instantiate drawing of polygons or points on map 
* (THIS DOES NOT HANDLE THE UPLOADING OF SHAPEFILES)
*/
/*
* Global variables
*/
var polygonAdded = false; //This is to determine if geometry should be removed when new geometry (polygon) is started
var shpAdded = false
var layers;
var submitButtonActivated = false;
var fileGeoJson; //Variable to hold geojson string of uploaded file

/*
* Global variables
*/



function prepareGraphics(drawType){
	require(["esri/toolbars/draw",
        "esri/symbols/SimpleMarkerSymbol",
        "esri/symbols/SimpleLineSymbol",
        "esri/symbols/PictureFillSymbol",
        "esri/symbols/SimpleFillSymbol", 
        "esri/symbols/CartographicLineSymbol", 
        "esri/graphic", 
        "esri/Color", 
        "dojo/dom", 
        "dojo/on", 
        "dojo/domReady!"
		],
		function(
			Draw,
	        SimpleMarkerSymbol, SimpleLineSymbol,
	        PictureFillSymbol, SimpleFillSymbol, CartographicLineSymbol, 
	        Graphic, 
	        Color, dom, on
			){
			clearGraphics();
			drawToolbar = new Draw(map);
			markerSymbol = new SimpleMarkerSymbol();
			markerSymbol.setColor(new Color([194, 24, 12,0.5]));
			markerSymbol.setSize(15)
			polySymbol = new SimpleFillSymbol();
			polySymbol.setColor(new Color([194, 24, 12,0.5]))
			drawToolbar.on("draw-end", addGraphic);
			var tool = drawType.toLowerCase();
			drawToolbar.activate(tool)
			////NEED TO TRANSITION BETWEEN TOOLS AND ADD TO THE MAP

		})
};

/*
* Method to add graphic to map 
* (THIS DOES NOT HANDLE THE UPLOADING OF SHAPEFILES)
*/
function addGraphic(evt) {
	require(["esri/graphic"],
		function(Graphic){
			map.disableMapNavigation();
			if(drawType === 'point'){
				clearGraphics()
				polygonAdded = false; 
			} else if (polygonAdded == true) {
				clearGraphics();
				polygonAdded = false; 
			} else {

			}
			map.enableMapNavigation();
			if (evt.geometry.type === 'point'){
				map.graphics.add(new Graphic(evt.geometry, markerSymbol));
				if (drawType === 'point') {
					$("#submitButton").css('pointer-events', 'auto');
					activateSubmitButton();
				}
			} else {
				clearGraphics()
				map.graphics.add(new Graphic(evt.geometry, polySymbol));
				polygonAdded = true;
				$("#submitButton").css('pointer-events', 'auto');
				activateSubmitButton();
			}
		})
};


/*
* Method to clear polygons or points on map 
* 
*/
function clearGraphics(){
	map.graphics.clear();
	//$("#submitButton").css('pointer-events', 'auto');
};


/*
* Method to remove feature layer from map
*/
function removeShp() {
	map.removeLayer(map.getLayer('shpGeojson'))
	shpAdded = false;
};


/*
* Method to activate submit button
*/
function activateSubmitButton(){
	$("#submitButton").addClass("buttonIcons");
    $("#submitButton").removeClass("uploadShapeButton-disabled");
    submitButtonActivated = true;
};


/*
* Method to deactivate submit button
*/
function deactivateSubmitButton(){
	$("#submitButton").removeClass("buttonIcons");
    $("#submitButton").addClass("uploadShapeButton-disabled");
    submitButtonActivated = false;

};

function addShapefile(event) {
	require([
        "esri/config",
        "esri/InfoTemplate",
        "esri/map",
        "esri/request",
        "esri/geometry/scaleUtils",
        "esri/layers/FeatureLayer",
        "esri/renderers/SimpleRenderer",
        "esri/symbols/PictureMarkerSymbol",
        "esri/symbols/SimpleFillSymbol",
        "esri/symbols/SimpleLineSymbol",
        "esri/symbols/SimpleMarkerSymbol",
        "dojo/dom",
        "dojo/json",
        "dojo/on",
        "dojo/parser",
        "dojo/sniff",
        "dojo/_base/array",
        "esri/Color",
        "dojo/_base/lang",
        "dijit/layout/BorderContainer",
        "dijit/layout/ContentPane",
        "dojo/domReady!"
      ],
        function (
        esriConfig, InfoTemplate, Map, request, scaleUtils, FeatureLayer,
        SimpleRenderer, PictureMarkerSymbol, SimpleFillSymbol, SimpleLineSymbol, SimpleMarkerSymbol,
        dom, JSON, on, parser, sniff, arrayUtils, Color, lang
      ) {
        	
          	var portalUrl = "https://gis.worldpop.org/portal"; //Ideas from https://developers.arcgis.com/javascript/3/sandbox/sandbox.html?sample=portal_addshapefile&share=false
          	esriConfig.defaults.io.proxyUrl = "/proxy/";
	        var fileName = event.target.value.toLowerCase();

	        if (sniff("ie")) { //filename is full path in IE so extract the file name
	          var arr = fileName.split("\\");
	          fileName = arr[arr.length - 1];
	        }
	        if (/* fileName.indexOf(".zip") !== -1 || */ fileName.indexOf(".json") || fileName.indexOf(".geojson")) {//is file a zip - if not notify user
            if (fileName.endsWith('.geojson') || fileName.endsWith('.json')){
              let reader = new FileReader();
              reader.onload = function(event){
                fileGeoJson = JSON.parse(event.target.result);
                delete fileGeoJson.crs;
              }
              reader.readAsText(event.target.files[0]);
              generateFeatureCollection(fileName);
            } else {
              alert('Please use a Geojson format file in WGS84 projection')
              displayError('Please use a Geojson format file in WGS84 projection')
            }
	        	
	        }
	        else {
	          displayError('Please use a Geojson format file in WGS84 projection')
	        }

          function generateFeatureCollection (fileName) {
            var name = fileName.split(".");
            

            //Chrome and IE add c:\fakepath to the value - we need to remove it
            //See this link for more info: http://davidwalsh.name/fakepath
            var suffix = name[1]
            if (suffix == 'zip') {
            	var fileType = 'shapefile'
            } else {
            	var fileType = 'geojson'
            }
            name = name[0].replace("c:\\fakepath\\", "");
 
            $("#loading").show();

            //Define the input params for generate see the rest doc for details
            //http://www.arcgis.com/apidocs/rest/index.html?generate.
            var params = {
              'name': name,
              'targetSR': map.spatialReference,
              'maxRecordCount': 1000,
              'enforceInputFileSizeLimit': true,
              'enforceOutputJsonSizeLimit': true
            };

            //generalize features for display Here we generalize at 1:40,000 which is approx 10 meters
            //This should work well when using web mercator.
            var extent = scaleUtils.getExtentForScale(map, 40000);
            var resolution = extent.getWidth() / map.width;
            params.generalize = true;
            params.maxAllowableOffset = resolution;
            params.reducePrecision = true;
            params.numberOfDigitsAfterDecimal = 0;

            var myContent = {
              'filetype': fileType,
              'publishParameters': JSON.stringify(params),
              'f': 'json',
              'callback.html': 'textarea'
            };

            //use the rest generate operation to generate a feature collection from the zipped shapefile
            request({
              url: portalUrl + '/sharing/rest/content/features/generate',
              content: myContent,
              form: dom.byId('uploadForm'),
              handleAs: 'json',
              load: lang.hitch(this, function (response) {
                if (response.error) {
                  errorHandler(response.error);
                  return;
                }
                var layerName = response.featureCollection.layers[0].layerDefinition.name;
                addShapefileToMap(response.featureCollection);
              }),
              error: lang.hitch(this, errorHandler)
            });
          }

          function errorHandler (error) {
            displayError(error.message)
            $("#loading").hide();
          }

          function addShapefileToMap (featureCollection) {
            //add the shapefile to the map and zoom to the feature collection extent
            //If you want to persist the feature collection when you reload browser you could store the collection in
            //local storage by serializing the layer using featureLayer.toJson()  see the 'Feature Collection in Local Storage' sample
            //for an example of how to work with local storage.
            var fullExtent;
            layers = [];
            arrayUtils.forEach(featureCollection.layers, function (layer) {
              var infoTemplate = new InfoTemplate("Details", "${*}");
              var featureLayer = new FeatureLayer(layer, {
                infoTemplate: infoTemplate
              });
              //associate the feature with the popup on click to enable highlight and zoom to
              featureLayer.on('click', function (event) {
                map.infoWindow.setFeatures([event.graphic]);
              });
              //change default symbol if desired. Comment this out and the layer will draw with the default symbology
              changeRenderer(featureLayer);
              fullExtent = fullExtent ?
                fullExtent.union(featureLayer.fullExtent) : featureLayer.fullExtent;
              layers.push(featureLayer);
            });
            layers[0].id = 'shpGeojson';
            map.addLayers(layers);
            map.setExtent(fullExtent.expand(1.25), true);
            $("#loading").hide();
            $("#uploadShape").val(''); //Reset input file to nothing.
            shpAdded = true;
            activateSubmitButton();


          }

          function changeRenderer (layer) {
            //change the default symbol for the feature collection for polygons and points
            markerSymbol = new SimpleMarkerSymbol();
            markerSymbol.setColor(new Color([194, 24, 12,0.5]));
            markerSymbol.setSize(15)
            polySymbol = new SimpleFillSymbol();
            polySymbol.setColor(new Color([194, 24, 12,0.5]))
                  var symbol = null;
                  switch (layer.geometryType) {
                    case 'esriGeometryPoint':
                      /*symbol = new PictureMarkerSymbol({
                        'angle': 0,
                        'xoffset': 0,
                        'yoffset': 0,
                        'type': 'esriPMS',
                        'url': 'https://static.arcgis.com/images/Symbols/Shapes/BluePin1LargeB.png',
                        'contentType': 'image/png',
                        'width': 20,
                        'height': 20
                      });*/
                      symbol = markerSymbol;
                      break;
                    case 'esriGeometryPolygon':
                      /*symbol = new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID,
                        new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID,
                          new Color([112, 112, 112]), 1), new Color([136, 136, 136, 0.25]));*/
                          symbol = polySymbol;
                      break;
                  }
                  if (symbol) {
                    layer.setRenderer(new SimpleRenderer(symbol));
                  }
                }

              });
}

/*
* Method to take geojson or shapefile, send to WorldPop ArcGIS server, and return featurelayer to be added to the map
*
* @parameter (Event) e Event fired when file added
*/
function _addShapefile(e){
	require(['esri/request', "esri/SpatialReference", "dojo/_base/lang", "dojo/dom"], function(esriRequest, SpatialReference, lang, dom){
		var fileName = e.target.files[0].name;
		if (fileName.endsWith('.zip') || (fileName.endsWith('.json') || (fileName.endsWith('.geojson')))) {
			var name = fileName.split(".");

            // Chrome and IE add c:\fakepath to the value - we need to remove it
            // see this link for more info: http://davidwalsh.name/fakepath
            name = name[0].replace("c:\\fakepath\\", "");

            //document.getElementById('upload-status').innerHTML = '<b>Loading </b>' + name;
            $("#loading").show();

            // define the input params for generate see the rest doc for details
            // https://developers.arcgis.com/rest/users-groups-and-items/generate.htm
            var params = {
              'name': name,
              //'targetSR': new SpatialReference({wkid:3857}),
              'targetSR': map.spatialReference,
              'maxRecordCount': 1000,
              'enforceInputFileSizeLimit': true,
              'enforceOutputJsonSizeLimit': true
            };

            // generalize features to 10 meters for better performance
            params.generalize = true;
            params.maxAllowableOffset = 10;
            params.reducePrecision = true;
            params.numberOfDigitsAfterDecimal = 0;

            var myContent = {
            	'file': fileName,
              'filetype': 'shapefile',
              'publishParameters': JSON.stringify(params),
              'f': 'json',
            };
            //var portalUrl = "https://www.arcgis.com";
            //var portalUrl = "https://https://gis.worldpop.org/portal/"
            // use the REST generate operation to generate a feature collection from the zipped shapefile JQUERY????
            esriRequest({
              url: "https://gis.worldpop.org/portal/sharing/rest/content/features/generate",
              content: myContent,
              form: dom.byId('uploadForm'),
              handleAs: 'json',
              load: lang.hitch(this, function (response) {
                if (response.error) {
                  errorHandler(response.error);
                  return;
                }
                var layerName = response.featureCollection.layers[0].layerDefinition.name;
                //dom.byId('upload-status').innerHTML = '<b>Loaded: </b>' + layerName;
                //addShapefileToMap(response.featureCollection);
              }),
              error: lang.hitch(this, errorHandler)
            });
          

		} else {
			displayError("The file you have used is not valid. Please upload a shapefile (as a .zip) or .geojson file")
		}
	})
}

function errorHandler (error) {
	displayError(error.message)
}