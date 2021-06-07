/*

Module for building ui and registering listeners

*/

/*
Global Variables 
*/
const countries = new Object();
/*
Global Variables 
*/



/***
 * Method to show info modal
 */
function showInfoModal(){
	var modal = document.getElementById("infoModal");
	modal.style.display = "block";
	// Get the button that opens the modal
	

	// Get the <span> element that closes the modal
	var span = document.getElementsByClassName("close")[0];
	$(".close").click(function(){
		modal.style.display = "none";
	})
	// When the user clicks on <span> (x), close the modal
	span.onclick = function() {
		modal.style.display = "none";
	  }
	  
	  // When the user clicks anywhere outside of the modal, close it
	  window.onclick = function(event) {
		if (event.target == modal) {
		  modal.style.display = "none";
		}
	  }

};

/*
* Method to request available countries from WOPRVision API. 

* Function completes the above global countries with relevant information.
* Then passes countries to fill dropdown function to complete dropdown select on ui
*/

function getCountries(){
	require(["esri/request", "esri/config"],
  function(esriRequest, esriConfig){
	var url = `https://wopr.worldpop.org/api/v1.0/data`
	var requestCountries = new esriRequest({
		url: url,
		handleAs: "json"
	})
	requestCountries.then(function(data){
		let isos = Object.keys(data);
		let validIsos = []
		for (var i = 0; i < isos.length; i++){
			let country = data[isos[i]]
			if (isos[i] !== "_ssl") {
				//fill countries object with relevant information from request
				if(Object.keys(country).includes('Population')){
				var versions = Object.keys(country['Population'])
				var latestVersion = versions[versions.length - 1]
				if (Object.keys(country['Population'][latestVersion]).includes('sql')){
					countries[isos[i]] = {}
					countries[isos[i]]['version'] = latestVersion
					countries[isos[i]]['extent'] = extents[isos[i]]['extent']
					countries[isos[i]]['name'] =  extents[isos[i]]['name']
					}				
				}
			}
		}
		$('#placeHolder').remove(); //clear placeholder from dropdown ('Please wait...')
		$('#country').append($("<option disabled selected />").text('Select country')) //change placeholder
		fillDropdown(countries)

	}, function(error){
		displayError(error)
	})
  })
};


/*
* Method fills dropdown select menu with valid countries passed from getCountries()
*/
function fillDropdown(validCountries) {
		let isos_ = Object.keys(validCountries);		
		var $countryDropdown = $('#country');
		$.each(validCountries, function(i, val_data) {
			$countryDropdown.append($("<option />").val(i).text(`${val_data.name} : ${val_data.version}`)) //Add each country to menu
		});

};



/*
* Method displays error in #errorText div
*/
function displayError(error) {
	$("#error").show();
	$("#errorText").text(error + '. Please try again');
	$("#outputSummaries").hide();
}

/*
* Method takes value from age/sex slider as list and callibrates ranges * and sets info div next to slider showing selection
*
* @param {Array} value 2 element array of selection of ranges in age sex slider
* @param {String} sex Male/female selection
*/
function setRangesAndUI(value, sex) {
	var lower = value[0];
	var upper = value[1];
	var range = value.slice();//upper and lower values of range to be set
	switch (true) { //conditionals on first element
		case (value[0] === 5):
			lower = 1;
			break
		case (value[0] > 5):
			lower = value[0] - 5
	};
	switch (true) { //conditionals on second element
		case (value[1] === 5):
			upper = 4;
			break;
		case (value[1] === 0):
			upper = 1;
			break;
		case (value[1] >5):
			upper = value[1] - 1;
			break
	};
	switch (true) { //conditionals on 80+
		case (lower >= 80 && upper >= 80):
			range = `${sex} 80+ years old`;
			break
		case (lower < 80 && lower > 0 && upper >= 80):
			range = `${sex} ${lower} - 80+ years old`;
			break
		case (lower === 0 && upper > 80):
			range = `${sex} all ages`;
			break
		default:
			range = `${sex} ${lower} - ${upper} years old`
	}
	//Set div value to show selection
	if (sex === 'Females'){
		$("#femaleAgeRanges").append(`<b><p>${range}</b></p>`)
	} else {
		$("#maleAgeRanges").append(`<b><p>${range}</b></p>`)
	}
};

/*
* Method to listen for male/female sliders being deselected - Will call functions below to disable them.
*/
$(document).ready(function() {
	$(document).on("change", "input[name='femaleAgeSex']", function() {
		$("#outputSummaries").hide();
		if ($(this).is(":checked")){
			femalesSelected = true;
			enableSlider("femaleSlider");
		} else {
			femalesSelected = false;
			disableSlider("femaleSlider");
		}
	});
	$(document).on("change", "input[name='maleAgeSex']", function() {
		$("#outputSummaries").hide();
		if ($(this).is(":checked")){
			malesSelected = true;
			enableSlider("maleSlider");
		} else {
			malesSelected = false;
			disableSlider("maleSlider");
		}
	})
});



/*
* Method to disable slider within input parameter string div
*
* @param {String} divId Div that contains slider to disable
 */
function disableSlider(divId) {
	require([
		"dojo/_base/array",
		"dojo/dom",
		"dijit/registry",
		"dojo/domReady!"
	], function (array, dom, registry) {
		var _widget = registry.byNode(dom.byId(divId))
		_widget.setAttribute('disabled', true)
	});
};


/*
* Method to disable slider within input parameter string div
*
* @param {String} divId Div that contains slider to disable
 */
function enableSlider(divId) {
	require([
		"dojo/_base/array",
		"dojo/dom",
		"dijit/registry",
		"dojo/domReady!"
	], function (array, dom, registry) {
		var _widget = registry.byNode(dom.byId(divId))
		_widget.setAttribute('disabled', false)
	});
};



