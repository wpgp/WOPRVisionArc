# WOPRVisionArc

## About
WOPRVisionArc is an ArcGIS Web App Builder custom widget that replicates most of the functionality of the R-shiny-hosted woprVision (https://apps.worldpop.org/woprVision/). The widget allows this functionality to be plugged in to any ArcGIS Web Application.

## Details
- The widget automatically requests available data from the WOPR repository and makes these selections available to the user on the widget,
- When the user makes a country selection, the appropriate population image service will be selected and added to the map,
- The user can select an area to query by clicking a point, drawing a polygon, or by uploading a single polygon geojson file in WGS84 projection,
- When the user submits the query to the WorldPop REST API endpoint, an array of 10,000 population estimates will be returned for the age/sex groups selected,
- The user can select the confidence intervals relating to the probability of the population being within a specific range. If age/sex proportions are returned from the endpoint, a population pyramid will be drawn,
- The user can select queries to save and download all saved query outputs as a csv at the end of the session.

## Installation
All of the files in this repository should be downloaded/unzipped and placed in the 'widgets' folder of the web app being developed. The widget will then be available to be selected as an onscreen widget in the Web App Builder installation GUI. No changes should be required in these files.

For more information on deploying custom widgets in ArcGIS Web App Builder, please see https://developers.arcgis.com/web-appbuilder/guide/xt-deploy-app.htm
For information on creating ArcGIS Web Apps, please see https://developers.arcgis.com/web-appbuilder/guide/xt-deploy-app.htm and https://doc.arcgis.com/en/web-appbuilder/.
