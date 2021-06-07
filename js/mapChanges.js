/*
* Module to make changes on map element e.g. Panning and adding image service
*/

/*
* Method to pan to selected country (Extents are defined in ./js/country_extents.js)
*
* @param {string} country ISO code of country selected. This is generated in dropdown menu in html
* @param {Object} countries Object of attributes associated with valid countries
*/
function panToCountry(country) {
	require ([
		'esri/geometry/Extent', 
  		'esri/SpatialReference'],
		function(Extent, SpatialReference){ 
			let xMin = countries[country].extent.xmin;
			let yMin = countries[country].extent.ymin;
			let xMax = countries[country].extent.xmax;
			let yMax = countries[country].extent.ymax;
			var extent = new Extent(xMin, yMin, xMax, yMax, new SpatialReference({ wkid: 3857}));
			map.setExtent(extent)
			clearGraphics();
			$(".pointOrPoly").prop('disabled', false);
		})
}


/*
* Method to add image service
*
* @param {string} countrySelected ISO code of country selected. This is generated in dropdown menu in html
* @param {Object} countries Object of attributes associated with valid countries
*/
function addImageService(countrySelected, countries){
	var version = countries[countrySelected].version.replace(".", "_")
	var imageURL = `https://gis.worldpop.org/arcgis/rest/services/grid3/${countrySelected}_population_${version}_gridded/ImageServer`;
	if (map.layerIds.includes("GRID3_Image")){
		map.removeLayer(map.getLayer("GRID3_Image")) //Remove previously added layers
	};
	require ([
		"esri/layers/ArcGISImageServiceLayer"
  		],
		function(ArcGISImageServiceLayer){ 			
			var imageServiceLayer = new ArcGISImageServiceLayer(imageURL, {
	          opacity: 0.75,
	          id: "GRID3_Image"
	        });
	        map.addLayer(imageServiceLayer);
		})
}