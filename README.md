# Plex Movie Collection

Simple static self-hostable website to visualize the own plex movie collection. 
Allows to search for movies in the collection without need to grant access to plex server.

Movies can be filtered by special attributes (e.g. "Steelbooks").

![Screenshot of frontpage](https://github.com/UNICodehORN/plex-movie-collection/blob/main/docs/images/main.png?raw=true)
![Screenshot of detail view](https://github.com/UNICodehORN/plex-movie-collection/blob/main/docs/images/detail.png?raw=true)
![Screenshot of pagination](https://github.com/UNICodehORN/plex-movie-collection/blob/main/docs/images/pagination.png?raw=true)

## Requirements
1. Export from Plex movie collection with [WebTools-NG](https://github.com/WebTools-NG/WebTools-NG)
2. Webserver (e.g. nginx or apache)

## Setup
1. Just clone or download the files in this repo.
2. Move the files to a desired directory on your webserver.
3. Export your desired plex movie collection with [WebTools-NG](https://github.com/WebTools-NG/WebTools-NG).
4. Ensure you select all necessary fields (see movies/movielist.csv for an example export) and you also export the posters.
5. Rename your csv-export to movielist.csv and move it into the *assets* subdirectory.
6. Move all posters into *assets* subdirectory. Naming convention for posters should be "movie-name (year)/movie-name (year).jpg".
7. Open the root of your webserver where you placed the files in your browser (e.g. http://127.0.0.1/)

## Filter
In config/config.json you can define filters which are displayed as buttons at the top and allow to filter the entire collection
for some defined rules.
### Filter Parameters
#### name
Internal name of the filter, must be unique as it is used as an id.
#### label
Display name of the filter. 
Will be used for the filter button as label and for each movie as label.
#### field
Name of the field in movielist.csv where the rule should be checked.
#### rule
Currently the only rule supported is 'contains'. 
The rule triggers when *field* *contains* the *needle*.
#### needle
Case sensitive needle to use for the rule if applicable.

## Credits
The website is based on the CSS template by Li Shang [https://codepen.io/li-shang/pen/KEKowv](https://codepen.io/li-shang/pen/KEKowv).
For the export [WebTools-NG](https://github.com/WebTools-NG/WebTools-NG) is needed.
[Plex](https://plex.tv) server needed to create an export.
