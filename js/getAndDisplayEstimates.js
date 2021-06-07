/*
* Module to make requests to server for data and display visualisations
*/

//const toGeoJSON = require("./js/esri2geo");

/*
*Global variables
 */
var populationEstimates; //This will eventually be globally available array of population estimates
var ageSexProportions; //This will eventually be globally available array of agesex proportions
var popTotal; //Sum of age groups
var ageSexRanges = 'm0,m1,m5,m10,m15,m20,m25,m30,m35,m40,m45,m50,m55,m60,m65,m70,m75,m80,f0,f1,f5,f10,f15,f20,f25,f30,f35,f40,f45,f50,f55,f60,f65,f70,f75,f80'; //Global variable for age and sex groups selected
var lowerIndex, upperIndex, rangeOfValues //Globals for confidence interval values
var queryGeoJson; //Global variable for 

/****
 * Method to handle request to server using relevant geometry selection
 */
function submitRequest() {
	$('#loading').show()
	require(["esri/request"], 
		function(esriRequest){
			var url;
			if (drawType === 'uploadShape'){
				url = makeShapefileUrl();
			} else if (drawType === 'polygon'){
				url = makePolygonGeoJsonURL();
			} else {
				url = makePointURL();
			}
			var request = new esriRequest({
		        url: url,
		        handleAs: "json",
				usePost: true
		      });
			request.then(
				function(data){
          			getCompletedTask(data.taskid)
				},
				function(error){
					displayError(`ERROR ${error}. Please try again`);
					$("#loading").hide();
				})
		})
}


/***
 * Method converts uploaded feature layer to GeoJSON and returns appropriate geojson-appended url for request.
 * 
 * @returns {String} url Url to API endpoint
 */
function makeShapefileUrl(){
	var ageSexRanges = makeAgeSexRangeString(maleValue, femaleValue);
	if (ageSexRanges === 'm0,m1,m5,m10,m15,m20,m25,m30,m35,m40,m45,m50,m55,m60,m65,m70,m75,m80,f0,f1,f5,f10,f15,f20,f25,f30,f35,f40,f45,f50,f55,f60,f65,f70,f75,f80'){
		var requestType = 'polytotal';
	} else {
		var requestType = 'polyagesex';
	}
	let iso = countrySelected
	let ver = countries[iso].version.slice(1);
	if (requestType === 'polyagesex'){
		var url = `https://api.worldpop.org/v1/wopr/${requestType}?iso3=${iso}&ver=${ver}&agesex=${ageSexRanges}&geojson=${JSON.stringify(fileGeoJson).replace('%22', '"')}`;
	} else {
		var url = `https://api.worldpop.org/v1/wopr/${requestType}?iso3=${iso}&ver=${ver}&geojson=${JSON.stringify(fileGeoJson).replace('%22', '"')}`;
	}
	queryGeoJson = JSON.stringify(fileGeoJson);
	return url;
}


/* 
* Function gets geometry from graphic on map, converts coordinates to WGS84, makes a GEOJSON element
* and then builds the appropriate url to request for polygons.
*
* @return {str} url to request from backend with geojson appended
*/
function makePolygonGeoJsonURL(){
	var ageSexRanges = makeAgeSexRangeString(maleValue, femaleValue);
	if (ageSexRanges === 'm0,m1,m5,m10,m15,m20,m25,m30,m35,m40,m45,m50,m55,m60,m65,m70,m75,m80,f0,f1,f5,f10,f15,f20,f25,f30,f35,f40,f45,f50,f55,f60,f65,f70,f75,f80'){
		var requestType = 'polytotal';
	} else {
		var requestType = 'polyagesex';
	}
	var polygonCoordinates = new Array();
	require(["esri/geometry/webMercatorUtils"], 
		function(webMercatorUtils){
			var mercatorCoordinates = map.graphics.graphics[0].geometry.rings
			for (var i=0; i < mercatorCoordinates[0].length; i++) {
				let geom = mercatorCoordinates[0][i]//.toJson().geometry;
				var wgs84Point = webMercatorUtils.xyToLngLat(geom[0], geom[1]);
				polygonCoordinates.push(wgs84Point)
			}	
	})
	let geoJson = JSON.parse(geoJsonTemplate); //copy template without reference
	geoJson.features[0].geometry.coordinates.push(polygonCoordinates)
	let iso = countrySelected
	let ver = countries[iso].version.slice(1);
	queryGeoJson = JSON.stringify(geoJson)
	if (requestType === 'polyagesex'){
		var url = `https://api.worldpop.org/v1/wopr/${requestType}?iso3=${iso}&ver=${ver}&agesex=${ageSexRanges}&geojson=${JSON.stringify(geoJson)}`;
	} else {
		var url = `https://api.worldpop.org/v1/wopr/${requestType}?iso3=${iso}&ver=${ver}&geojson=${JSON.stringify(geoJson)}`;
	}
	return url;
}


/**
 *  Method to make url for point query
 * @returns {String} url for point query
 */
function makePointURL(){
	try {
		var pointCoordinates;
		ageSexRanges = makeAgeSexRangeString(maleValue, femaleValue);
		if (ageSexRanges === 'm0,m1,m5,m10,m15,m20,m25,m30,m35,m40,m45,m50,m55,m60,m65,m70,m75,m80,f0,f1,f5,f10,f15,f20,f25,f30,f35,f40,f45,f50,f55,f60,f65,f70,f75,f80'){
			var requestType = 'pointtotal';
		} else {
			var requestType = 'pointagesex';
		}
		require(["esri/geometry/webMercatorUtils"], 
			function(webMercatorUtils){
				let geom = map.graphics.graphics[0].geometry
				pointCoordinates = webMercatorUtils.xyToLngLat(geom.x, geom.y)			
		})
		let iso = countrySelected
		let ver = countries[iso].version.slice(1);
		let geoJson = {"type": "Feature", "geometry": {"type": "Point", "coordinates": [pointCoordinates[1], pointCoordinates[0]]}, "properties": {}}
		queryGeoJson = JSON.stringify(geoJson);
		if (requestType === 'pointagesex'){
			var url = `https://api.worldpop.org/v1/wopr/${requestType}?iso3=${iso}&ver=${ver}&agesex=${ageSexRanges}&lat=${pointCoordinates[1]}&lon=${pointCoordinates[0]}`;
		} else {
			var url = `https://api.worldpop.org/v1/wopr/${requestType}?iso3=${iso}&ver=${ver}&lat=${pointCoordinates[1]}&lon=${pointCoordinates[0]}`
		}	
		return url

		} catch(err) {
			displayError(`Please define valid geometry on map: ${err}`)
			$("#loading").hide();
		}
	
}


/*
* Method makes string array of age/sex values
*
* @param {Array} maleValue Array of male ages selected in slider
* @param {Array} femaleValue Array of female ages selected in slider
*
* @returns {String} ageSexRanges String of all sex/ages selected i.e. 'm0, f0, m25, f80+'
 */
function makeAgeSexRangeString(maleValue, femaleValue) {
	let ageSexRanges = '';
	if ($('#maleAgeSex').is(":checked")) {
		for (var i = maleValue[0]; i <= maleValue[1]; i+=5){
			switch (true){
				case (i === 0):
					ageSexRanges += `m${i},`
					break
				case (i === 5):
					ageSexRanges += 'm1,'
					break
				case (i > 5):
					ageSexRanges += `m${i - 5},`
			}			
		}
	}

	if ($("#femaleAgeSex").is(":checked")) {
		for (var i = femaleValue[0]; i <= femaleValue[1]; i+=5){
			switch (true){
				case (i === 0):
					ageSexRanges += `f${i},`
					break
				case (i === 5):
					ageSexRanges += 'f1,'
					break
				case (i > 5):
					ageSexRanges += `f${i - 5},`
			}
		}
	}
	ageSexRanges = ageSexRanges.slice(0, -1);
	return ageSexRanges
}

/*
 * Method to retrieve completed task
* 
* @parameter {string} id Task ID 
 */
function getCompletedTask(id) {
	var taskUrl = `https://api.worldpop.org/v1/tasks/${id}`;
	$.get(taskUrl, function(data){
		if (data.status === "started" && data.error === false ){
			getCompletedTask(id)
		} else if (data.error === true) {
			displayError(data.error_message)
			$("#loading").hide()
		} else { //Successful return of data
			if (data.data) {
				if ('total' in data.data) {
					displayPopulationEstimates(data);
			} else {
				displayError(data.error_message);
				$("#loading").hide()
			}
			} else {
				displayError(data.error_message)
				$("#loading").hide()
			}
		}
	})
}


/*
* Method unpacks returned esitmates and displays information in dom
*
* @param {Object} data Data returned from successful query 
 */
function displayPopulationEstimates(data) {
	$("#loading").hide();
	$("#outputSummaries").show();
	populationEstimates = data.data.total;
	var confidenceValue = parseInt(sliderValue)
	showRangeWithinConfidenceInterval(populationEstimates, confidenceValue); //fill div with esimates and confidence interval
	getAgeSexProportions(data.data.agesexid); //Request age/sex proportions and show pop pyramid
};

/*
*Method to fill div with esimates and confidence interval
*
* @param {Array} popEstimates Array returned of pop esitmate request
* @param {Integer} confidenceIntervals Value from confidence interval slider (50% - 99%) 
 */
function showRangeWithinConfidenceInterval(popEstimates, confidenceIntervals){	
	let upper = ((100 - confidenceIntervals)/2)/100
	let lower = 1 - upper 
	var mean = arrMean(popEstimates); //Ave of array
	if (popEstimates.length === 1){
		$("#populationMeanDescription").html(`<p>Population Estimate: <b>${popEstimates[0].toLocaleString()} people</b></p><p>${sliderValue}% probability: <b>Unknown</b></p><p class="small">*Statistical uncertainty not measured for this point.</p>`)
	} else if (populationEstimates.length > 1){
		//let rangeOfValues = ss.quantile(popEstimates, [lower, higher])
		popEstimates.sort(function(a, b){return a - b});
		lowerIndex = Math.round(lower * (popEstimates.length +1));
		upperIndex = Math.round(upper * (popEstimates.length + 1));
		rangeOfValues = [popEstimates[upperIndex],popEstimates[lowerIndex]]
		$("#populationMeanDescription").html(`<p>Population Estimate: <b>${Math.round(mean).toLocaleString()} people</b></p><p>${sliderValue}% probability: <b>${rangeOfValues[0].toLocaleString()} - ${rangeOfValues[1].toLocaleString()} people</b></p>`)
	}
	
}


/*
*Method to GET age/sex proportions using admin id
*
* @param {Integer} id admin unit id corresponding to the spatial request
 */
function getAgeSexProportions(id){
	var url = `https://api.worldpop.org/v1/wopr/proportionsagesex?iso3=${countrySelected}&ver=${countries[countrySelected].version.slice(1)}&id=${id}`
	$.get(url, function(data){
		ageSexProportions = data;
	}).done(function(data){
		let id = Object.keys(data.data)[0]
		makePyramid(data.data[id]);
	})
};

/*
* Method returns mean of input Array
*
* @param {Array} popEstimates Array of 10000 population estimates
*
*@returns {Float} mean Mean of array
 */
function arrMean(popEstimates) {
	//popEstimates should be array of integers
	var mean = popEstimates.reduce((a, b) => a + b, 0) / popEstimates.length;
	return mean
};


/*
*Method creates population pyramid in dom
*
* @param {Object} ageSex Object of agesex (key) and pop totals (value) for each group in selection
 */
function makePyramid(ageSex){
    popTotal = arrMean(populationEstimates);
	if (ageSex == null){
		$("#myChart").remove();
		$("#graphContainer").text('No Age/Sex proportions available for this location')
	} else {
		$("#myChart").remove();
		$("#graphContainer").text('');
		$("#graphContainer").append('<canvas id="myChart" width="300" height="300"></canvas>');
		var canvas = document.getElementById('myChart')
		var ctx = document.getElementById('myChart').getContext('2d');
		ctx.clearRect(0, 0, canvas.width, canvas.height);
		var males = new Array();
		var females = new Array();
		var ageSexSelections = makeAgeSexRangeString(maleValue, femaleValue).split(',')
		if ($("#femaleAgeSex").is(':checked')){
			femaleCheckBox = true
		} else {
			femaleCheckBox = false
		}
		if ($("#maleAgeSex").is(':checked')){
			maleCheckBox = true
		} else {
			maleCheckBox = false
		}
		for (var key in ageSex){
			if (ageSex.hasOwnProperty(key)){
				if (key.slice(0,1) === "m"){
					if (ageSexSelections.includes(key) && maleCheckBox === true){ //Is this age/sex group in list of selections?
						males.push(ageSex[key] * -100)
					} else {
						males.push(0.00001); ///Minimal amount to draw bins
					}
					
				} else {
					if (ageSexSelections.includes(key) && femaleCheckBox === true){ //Is this age/sex group in list of selections?
						females.push(ageSex[key] * 100);
					} else {
						females.push(0.00001); ///Minimal amount to draw bins
					}
					
				}
			}
		}
		males.reverse();
		females.reverse();
		new Chart(ctx, {
		type: 'horizontalBar',
		data: {
			labels: ['80+', '75-79', '70-74', '65-69', '60-64', '55-59', '50-54', '45-49', '40-44', '35-39', '30-34', '25-29', '20-24', '15-19', '10-14', '5-9', '1-4', '0-1'],
			datasets: [
			{
				data: females,
				label: "Female",
				backgroundColor: 'rgba(170, 59, 51, 0.9)',//["#3e95cd", "#8e5ea2","#3cba9f","#e8c3b9","#c45850"],
				borderWidth: 1,
				borderColor: 'gray',
				hoverBackgroundColor: 'rgba(170, 59, 51, 1)',
				hoverBorderWith: 2,
				hoverBorderColor: 'rgba(232, 24, 0, 1)'
			},
			{
				data: males,
				label: "Male",
				backgroundColor: 'rgba(251, 173, 28, 0.9)',//["blue", "#8e5ea2","#3cba9f","#e8c3b9","#c45850"]
				borderWidth: 1,
				borderColor: 'gray',
				hoverBackgroundColor: 'rgba(251, 173, 28, 1)',
				hoverBorderWith: 2,
				hoverBorderColor: 'rgba(232, 24, 0, 1)'
		}

				]
		},
		options: {
				title: {
				display: true,
				text: 'Population pyramid'
			},
			scales: {
				xAxes: [{
					stacked: true,
					ticks: {
						callback: function(value, index, values){
							if (value < 0){
								value *= -1
							}
							//value = Math.round((value/popTotal) * 100)
							value = Math.round(value)
							return value + '%'//Math.round((value/popTotal) * 100) + '%';
						},
						fontSize: 10
					},
					scaleLabel: {
						labelString: 'Proportion of total population',
						display: true
					}
				}],
				yAxes: [{
					stacked: true,
					ticks: {
						fontSize: 8
					},
					scaleLabel: {
						labelString: 'Demographic groups',
						display: true
					}
				}]
			},
			tooltips: {
				callbacks: {
					title: function(tooltipItem, data){
						return 'Population estimates ' + tooltipItem[0].label + ' years old:'
					},
					label: function(tooltipItem, data){
						return data['datasets'][tooltipItem.datasetIndex].label + ": " + Math.round((Math.abs(data['datasets'][tooltipItem.datasetIndex]['data'][tooltipItem.index])/100) * popTotal).toLocaleString();
					}
				}
			}
		}
	})


	}
    
}    


