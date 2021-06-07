//GLOBAL VARIABLES TO BE USED FROM OTHER MODULES
var map; //Map element
var sliderValue = 95; //Confidence interval slider set to default value of 95%
var countrySelected //Global variable for current country selected in drop down
var drawType //User selection to draw on map (Point polygon or geojson/shp)
var maleValue = [0,85];
var femaleValue = [0,85];
var femalesSelected = true; //Global variables indicating if slider checkbox checked. If not checked, ages for this sex will not be requested
var malesSelected = true; //Global variables indicating if slider checkbox checked. If not checked, ages for this sex will not be requested


//GLOBAL VARIABLES TO BE USED FROM OTHER MODULES


define(['dojo/_base/declare', 
  'jimu/BaseWidget',
  'esri/config', 
  'esri/request',
  'esri/geometry/Extent', 
  'esri/SpatialReference',
  "dijit/form/HorizontalSlider",
  "dijit/form/HorizontalRule",
  "dijit/form/HorizontalRuleLabels",
  "dojo/dom-construct",
  "dojo/dom",
  'jimu/loaderplugins/jquery-loader!./js/jquery-3.6.0.min',
  './js/makeUi',
  './js/country_extents',
  './js/mapChanges',
  './js/mapGraphics',
  './js/geoJSON_template',
  './js/getAndDisplayEstimates',
  'dojox/form/HorizontalRangeSlider',
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
  "dojo/domReady!",
  "./js/Chart.bundle",
  "./js/saveQueries"
  ],
  function(declare, 
    BaseWidget, 
    esriConfig, 
    esriRequest, 
    Extent, 
    SpatialReference, 
    HorizontalSlider, 
    HorizontalRule, 
    HorizontalRuleLabels,
    domConstruct, 
    dom,
    $, 
    ui, 
    countryExtents,
    mapChanges,
    mapGraphics,
    geoJSON_template,
    getAndDisplayEstimates,
    HorizontalRangeSlider,
    dom, 
    JSON, 
    on, 
    parser, 
    sniff, 
    arrayUtils, 
    Color, 
    lang,
    Chart,
    saveQueries) {
    //To create a widget, you need to derive from BaseWidget.
    return declare([BaseWidget], {
      // Custom widget code goes here
      baseClass: '.jimu-widget-woprvision',

      //methods to communication with app container:

      postCreate: function() {
        this.inherited(arguments);
      },

      startup: function() {
        this.inherited(arguments);
        map = this.map;
        esriConfig.defaults.io.corsEnabledServers.push("https://api.worldpop.org"); //ALLOW CORS REQUEST TO WORLDPOP AND WOPR
        esriConfig.defaults.io.corsEnabledServers.push("https://wopr.worldpop.org/api/v1.0/data"); //ALLOW CORS REQUEST TO WORLDPOP AND WOPR
        esriConfig.defaults.io.corsEnabledServers.push("https://gis.worldpop.org");
        esriConfig.defaults.io.proxyUrl = "/proxy/";
        this._makeUi(); // Add additional tools to interface and register listeners
        $(document).ready(function(){
          //Elements to be hidden on start up and used later
          $("#loading").hide();
          $("#outputSummaries").hide();
          $("#error").hide();
          });
        this._registerListeners(); //Activate listeners for user interaction
        
      },

      /*
      * All methods called within this method are defined in ./js/makeUi.js to create elements on ui.
      */
      _makeUi: function() { 
        getCountries();
        this._makeMaleSlider(); //Slider to choose male age groups. Method in this module
        this._makeFemaleSlider(); //Slider to choose female age groups. Method in this module
        this._makeConfidenceSlider(); ////Slider to choose confidence intervals. Method in this module
      },

      /* 
      *Method to make confidence interval slider to be displayed in #outputSummaries
      */
      _makeConfidenceSlider: function() {
        var rulesNode = domConstruct.create("div", {}, dom.byId("confidenceSlider"), "first");
        var sliderRules = new HorizontalRule({
          container: "bottomDecoration",
          count: 11,
          style: "height: 2px;"
        }, rulesNode);
        var labelsNode = domConstruct.create("div", {}, dom.byId("confidenceSlider"), "first");
        var sliderLabels = new HorizontalRuleLabels({
          container: "bottomDecoration",
          labelStyle: "margin-top: 5px; font-size: 1em",
          labels: ['50%', '60%',  '70%',  '80%', '90%', "99%"]
        }, labelsNode);
        var slider = new HorizontalSlider({
          minimum: 50,
          maximum: 100, 
          value: 95,
          intermediateChanges: false,
          style: "width: 200px",
          showButtons: false,
          discreteValues: 11,
          onChange: function(value){
            sliderValue = value
            if (sliderValue === 100) {
              sliderValue = 99;
            }
            if (populationEstimates != undefined && populationEstimates.length > 0) {
              showRangeWithinConfidenceInterval(populationEstimates, sliderValue)
            }
          }
        }, "confidenceSlider")
        slider.startup();
        sliderRules.startup();
        },

      /*
      * Method to register listeners for user interaction. Relevant methods are then called depending on the event
      */
      _registerListeners: function() {

        /*
        *Method to listen for changes to #country select changes. Calls functions from ./js/mapChanges.js
        */
        $(document).ready(function() {
          $("#infoBtn").click(function(){
            showInfoModal(); //Defined in ./js/MakeUi.js
          })
          $("#submitButton").click(function(){
            $("#error").hide();
            submitRequest() //Post request for estimates. Define in ./js/getAndDisplayEstimates.js
          });
          $("#country").change(function(){
            $("#error").hide();
            countrySelected =  $(this).children("option:selected").val();
            panToCountry(countrySelected) // method in ./js/mapChanges.js to pan to selected country
            addImageService(countrySelected, countries) // method in ./js/mapChanges.js to add image service        
        });
        $("#drawSelect").change(function() {
          $("#error").hide();
          if (shpAdded === true) {
            removeShp();
          };

          if (submitButtonActivated == true) {
            deactivateSubmitButton();
          }
          drawType = $('input[name="geomDraw"]:checked').val();
          if (drawType == "uploadShape") {
            clearGraphics();
            $("#uploadShapeButton").addClass("buttonIcons");
            $("#uploadShapeButton").removeClass("uploadShapeButton-disabled");
            $('input[type="file"]').change(function(e) {
              addShapefile(e); //Call function to post shapefile to server to be converted to featurelayer (./js/mapGraphics.js)
            });
          } else {
            $("#uploadShapeButton").addClass("uploadShapeButton-disabled");
            $("#uploadShapeButton").removeClass("buttonIcons");
            prepareGraphics(drawType);
          }
        })

        });
        $("#saveQuery").click(function(){
          saveQuery();
        });
        $("#downloadSavedQueries").click(function(){
          downloadSavedQueries()
        })
        $("#clearResults").click(function(){
          clearResults(); //Remove saved restults - defined in saveQueries.js
        })
      },

      /*
      *Method to age age/sex range selection sliders for males
      */
      _makeMaleSlider: function() {
        var rulesNode = domConstruct.create("div", {}, dom.byId("maleSlider"), "first");
        var sliderRules = new HorizontalRule({
          container: "bottomDecoration",
          count: 18,
          style: "height: 2px;"
        }, rulesNode);
        var labelsNode = domConstruct.create("div", {}, dom.byId("maleSlider"), "first");
        var sliderLabels = new HorizontalRuleLabels({
          container: "bottomDecoration",
          labelStyle: "padding-top: 5px; font-size: 0.75em",
          labels: ['0', '20',  '40',  '60', '80']
        }, labelsNode);
        var slider = new HorizontalRangeSlider({
          minimum: 0,
          maximum: 85, 
          value: [0, 85],
          intermediateChanges: false,
          style: "width: 100px",
          showButtons: false,
          discreteValues: 18,
          onChange: function(value){
            maleValue = value.slice();
            $("#outputSummaries").hide();
            $("#maleAgeRanges").empty() 
            setRangesAndUI(maleValue, 'Males'); //Method to set description of range chosed on slider --> Defined in makeUi.js
          }
        }, "maleSlider")
        slider.startup();
        sliderRules.startup();

      },

      /*
      * Method to age age/sex range selection sliders for females
      */
      _makeFemaleSlider: function() {
        var rulesNode = domConstruct.create("div", {}, dom.byId("femaleSlider"), "first");
        var sliderRules = new HorizontalRule({
          container: "bottomDecoration",
          count: 18,
          style: "height: 2px;"
        }, rulesNode);
        var labelsNode = domConstruct.create("div", {}, dom.byId("femaleSlider"), "first");
        var sliderLabels = new HorizontalRuleLabels({
          container: "bottomDecoration",
          labelStyle: "padding-top: 5px; font-size: 0.75em",
          labels: ['0', '20',  '40',  '60', '80']
        }, labelsNode);
        var slider = new HorizontalRangeSlider({
          minimum: 0,
          maximum: 85, 
          value: [0, 85],
          intermediateChanges: false,
          style: "width: 100px",
          showButtons: false,
          discreteValues: 18,
          onChange: function(value){
            femaleValue = value.slice();
            $("#outputSummaries").hide();
            $("#femaleAgeRanges").empty();
            setRangesAndUI(femaleValue, 'Females'); //Method to set description of range chosed on slider --> Defined in makeUi.js
            
          }
        }, "femaleSlider")
        slider.startup();
        sliderRules.startup();

      }
    });
  });
