const INDEX_URL = "./assets/movielist.csv";
const CONFIG_URL = "./config/config.json";
const POSTER_URL = "./assets/poster/";
const ICON_URL = "./assets/css/icons/";
var originalData = [];
var data = [];
var config = [];

const dataPanel = document.getElementById("data-panel");
const searchBtn = document.getElementById("submit-search");
const searchInput = document.getElementById("search");

const pagination = document.getElementById("pagination");
const ITEM_PER_PAGE = 12;
let paginationData = [];

const listModel = document.getElementById("btn-listModel");

(function () {

    // Load data
    axios
        .get(INDEX_URL)
        .then(response => {
            axios
                .get(CONFIG_URL)
                .then(configJson => {
                    config = configJson.data;
                    processData(csvToJson(response.data))
                    getTotalPages(data);
                    displayFilterBtn();
                    displayRandom();
                })
                .catch(err => console.log(err));
        })
        .catch(err => console.log(err));

    // listen to data panel
    dataPanel.addEventListener("click", event => {
        if (event.target.matches(".btn-show-movie")) {
            showMovie(event.target.dataset.id);
        }
    });

    // listen to search btn click event
    searchBtn.addEventListener("click", event => {
        event.preventDefault();

        let results = [];
        if (searchInput.value !== "") {
            const regex = new RegExp(searchInput.value, "i");

            results = data.filter(movie => movie.title.match(regex));
            data = results;
        } else {
            data = originalData;
        }
        getTotalPages(data);
        getPageData(1, data);
    });

    //listen to viewbox
    listModel.addEventListener("click", event => {
        if (event.target.matches("#btn-listModel")) {
            displayDataListModel(data);
        }
    });

})();

function csvToJson(csvString) {
    const rows = csvString.split("\n");

    const headers = rows[0].split("|");

    const jsonData = [];
    for (let i = 1; i < rows.length - 1; i++) {

        const values = rows[i].split("|");

        const obj = {};

        for (let j = 0; j < headers.length; j++) {

            const key = headers[j].substring(1, headers[j].length - 1).trim();
            const value = values[j].substring(1, values[j].length - 1).trim();

            obj[key] = value;
        }

        jsonData.push(obj);
    }
    return jsonData;
}

function processData(dataToProcess) {
    for (let i = 0; i < dataToProcess.length; i++) {
        let dataEntry = dataToProcess[i];
        let title = dataEntry["Title"].replace(":", "").replace("?", "").replace("B.C.", "B.C");
        let imagePath = title + " (" + dataEntry["Year"] + ")/" + title + " (" + dataEntry["Year"] + ").jpg";
        imagePath = encodeURI(imagePath);
        if (dataEntry["Audio Stream Display Title"].toLowerCase().includes("deutsch (truehd 7.1)")) gerAtmos = true;
        dataEntry = applyFilterToData(dataEntry)
        data.push({
            "id": dataEntry["TMDB ID"],
            "title": dataEntry["Title"],
            "duration": dataEntry["Duration"],
            "link": dataEntry["IMDB Link"],
            "year": dataEntry["Year"],
            "description": dataEntry["Summary"],
            "image": imagePath,
            "filter": dataEntry.filter
        });
    }
    originalData = data;
}

function displayFilterBtn() {
    let btnHtml = ``;
    for (let i = 0; i < config.filter.length; i++) {
        if (config.filter[i]["labelOnly"] !== true) {
            let icon = config.filter[i]["icon"] !== undefined ? `<img class='icn' src='${ICON_URL}${config.filter[i].icon}.svg' />` : "";
            btnHtml +=
                `<button class="btn btn-primary mb-2" style="margin-right:10px;" onclick="filterFor('${config.filter[i]["name"]}')">${icon} ${config.filter[i]["label"]}</button>
        `;
        }
    }
    btnHtml += `<button class="btn btn-danger mb-2" style="margin-right:10px;" onclick="filterFor('')">Reset</button>`;
    $("#filter").html(btnHtml);
}

function applyFilterToData(dataEntry) {
    let filters = config.filter;
    let modifiedDataEntry = dataEntry;
    modifiedDataEntry["filter"] = [];
    for (let i = 0; i < filters.length; i++) {
        if (filterRuleTriggers(filters[i], dataEntry)) {
            modifiedDataEntry["filter"][filters[i]['name']] = true;
        }
    }
    return modifiedDataEntry;
}

function filterRuleTriggers(filter, dataEntry) {
    return filter.rule === "contains" && dataEntry[filter.field] !== undefined && dataEntry[filter.field].includes(filter.needle);
}

function getTotalPages(data) {
    let totalPages = Math.ceil(data.length / ITEM_PER_PAGE) || 1;
    let pageItemContent = "";
    for (let i = 0; i < totalPages; i++) {
        pageItemContent += `
          <a class="lst" href="#" onclick="getPage(${i + 1})" data-page="${i + 1}">${i +
        1}</a>
      `;
    }
    pagination.innerHTML = pageItemContent;
}

function getPage(pageNum) {
    getPageData(pageNum, data);
}

function getPageData(pageNum, movieData) {
    paginationData = movieData || paginationData;
    let offset = (pageNum - 1) * ITEM_PER_PAGE;
    let pageData = paginationData.slice(offset, offset + ITEM_PER_PAGE);
    displayDataList(pageData);
}

function getPageDatalistModel(pageNum) {
    paginationData = data || paginationData;
    let offset = (pageNum - 1) * ITEM_PER_PAGE;
    let pageData = paginationData.slice(offset, offset + ITEM_PER_PAGE);
    displayDataListModel(pageData);
}

function displayDataList(data) {
    let htmlContent = "";
    data.forEach(function (item, index) {
        let filterBtn = ``;
        config.filter.forEach(
            function (filter) {
                if (item["filter"][filter["name"]]) {
                    let btnCss = "btn-info";
                    if (filter["btn-css"] !== undefined) btnCss = filter["btn-css"];
                    let label = filter["icon"] !== undefined ? `<img class="icn" src="${ICON_URL}${filter["icon"]}.svg"/>` : `${filter["label"]}`;
                    filterBtn += ` <button class="btn btn-label ${btnCss} mb-2" onclick="filterFor('${filter["name"]}')">${label}</button>`;
                }
            });
        htmlContent += `
        <div class="col-sm-3">
          <div class="card mb-2">
            <img class="card-img-top btn-show-movie" src="${POSTER_URL}${
            item.image
        }" alt="${item.title} Movie Poster" data-toggle="modal" data-target="#show-movie-modal" data-id="${item.id}"/>
            <!-- "More" button -->
            <div class="card-footer" style="min-height:60px">
              <a href="https://www.youtube.com/results?search_query=${item.title} ${item.year} trailer" target="_blank"><button class="btn btn-label btn-danger mb-2"><img class="icn" src="${ICON_URL}yt.svg"></button></a>
              ${filterBtn}
            </div>
          </div>
        </div>
      `;
    });
    dataPanel.innerHTML = htmlContent;
}

function filterFor(filterName) {
    let filteredEntries = [];
    if (filterName === '') {
        filteredEntries = originalData;
    } else {
        for (let i = 0; i < originalData.length; i++) {
            if (originalData[i]["filter"][filterName])
                filteredEntries.push(originalData[i]);
        }
    }
    data = filteredEntries;
    getTotalPages(filteredEntries);
    getPageData(1, filteredEntries);
}

function displayRandom() {
    data = [...originalData];
    shuffleArray(data);
    getPageData(1, data);
    data = originalData;
}

function shuffleArray(array) {
    for (let i = array.length - 1; i >= 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

function displayDataListModel(data) {
    let htmlContent = "";
    data.forEach(function (item, index) {
        htmlContent += `
           <div class="container">
    <div class="row lst">
      <div class="col"><h6>${item.title}</h5></div>
      <div class="col"><button class="btn btn-primary btn-show-movie" data-toggle="modal" data-target="#show-movie-modal"
        data-id="${item.id}">Info</button>
      <!-- favorite button -->
      <button class="btn btn-info btn-add-favorite" data-id="${
            item.id
        }">+</button></div>
    </div>
  </div>
     
      
      `;
    });
    dataPanel.innerHTML = htmlContent;
}

function showMovie(id) {
    // get elements
    const modalTitle = document.getElementById("show-movie-title");
    const modalImage = document.getElementById("show-movie-image");
    const modalDate = document.getElementById("show-movie-date");
    const modalDescription = document.getElementById("show-movie-description");
    const modalLink = document.getElementById("show-movie-link");


    // send request to show api
    let movie = [];
    for (let i = 0; i < data.length; i++) {
        if (data[i]["id"] === id) {
            movie = data[i];
            break;
        }
    }
    console.log("id: "+id);
    console.log(data);
    console.log("found movie:");
    console.log(movie);

    // insert data into modal ui
    modalTitle.textContent = `${movie.title} (${movie.year}) - ${movie.duration}`;
    modalImage.innerHTML = `<img src="${POSTER_URL}${
        movie.image
    }" class="img-fluid" alt="Responsive image">`;
    modalDescription.textContent = `${movie.description}`;
    modalLink.innerHTML = `<a href="${movie.link}" target="_blank"><button class="btn btn-info">IMDB Info</button></a>`;
}
