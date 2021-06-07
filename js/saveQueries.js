/**
 * Module to deal with the saving and downloading of dsaved queries as csv
 */

/**
 * Global variables
 */
var savedQueries = {"count": 0, items: new Array()}; //Global variable for saved queries

/**
 * Listener to save query. Event will add relevant information to   
 * savedQuries object
 */
function saveQuery(){
    if (populationEstimates.length === 1){
        var pop_lower = popTotal;
        var pop_upper = popTotal;
    } else {
        var pop_lower = rangeOfValues[0];
        var pop_upper = rangeOfValues[1];
    }
    if (malesSelected === true) {
        var male_age = $("#maleAgeRanges").text();
    } else {
        var male_age = "None selected"
    }
    if (femalesSelected === true) {
        var female_age = $("#femaleAgeRanges").text();
    } else {
        var female_age = "None selected"
    }

    let query = {'data': `${countrySelected} ${countries[countrySelected].version}`, 'mode': drawType, 'pop': popTotal, 'pop_lower': pop_lower, 'pop_upper': pop_upper, 'female_age': female_age, 'male_age': male_age, 'confidence_level': sliderValue, 'geometry': queryGeoJson}
    savedQueries.items.push(query)
    savedQueries.count += 1;
    $("#downloadSavedQueries").text(`Download (${savedQueries.count})`);
    $("#downloadSavedQueries").removeClass("uploadShapeButton-disabled");
    $("#downloadSavedQueries").addClass("buttonIcons");
    $("#clearResults").removeClass("uploadShapeButton-disabled");
    $("#clearResults").addClass("buttonIcons");
}

/**
 * Method to download saveQueries as csv
 */
function downloadSavedQueries(){
    if (savedQueries.count === 0) {
        displayError("No queries to download")
    } else {
        var jsonArray = JSON.stringify(savedQueries.items);
        var csvObj = convertToCsv(jsonArray);
        var filename = 'WOPR_results.csv';
        var file = new Blob([csvObj], {type: 'text/csv'});
        if (window.navigator.msSaveOrOpenBlob) // IE10+
            window.navigator.msSaveOrOpenBlob(file, filename);
        else { // Others
            var a = document.createElement("a"),
                    url = URL.createObjectURL(file);
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            setTimeout(function() {
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);  
            }, 0); 
        }

        }
};


/***
 * Method returns JSON obj in csv fomat string
 * 
 * @param {Array} jsonArray Array of JSON objects from savedQueries.items
 * @returns {String} csv String of above obj in csv format
 */
function convertToCsv(jsonArray){
    var array = typeof jsonArray != 'object' ? JSON.parse(jsonArray) : jsonArray;
    var str = 'sep=;\r\n data; mode; pop; pop_lower; pop_upper; female_age; male_age; confidence_level; geometry(WGS84) \r\n'; //make header for csv
    for (var i = 0; i < array.length; i++) {
        var line = '';
        for (var index in array[i]) { 
            if (line != '') line += ';'
            line += array[i][index];            
        }

        str += line + '\r\n';
    }
    return str;
}

/***
 * Method to clear saved results
 * 
 */
 function clearResults() {
    if (savedQueries.count > 0){
        savedQueries.count = 0;
        savedQueries.items = [];
        $("#downloadSavedQueries").text('Download (0)').removeClass("buttonIcons").addClass("uploadShapeButton-disabled");
        $("#clearResults").removeClass("buttonIcons").addClass("uploadShapeButton-disabled");
     }
 }
