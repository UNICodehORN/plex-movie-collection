const CONFIG_URL = "./config/config.json";
const DEFAULT_PATHS = {
    movielist: "./assets/movielist.csv",
    poster: "./assets/poster/",
    icon: "./assets/css/icons/"
};
var paths = { ...DEFAULT_PATHS };
var originalData = [];
var data = [];
var config = [];

const dataPanel = document.getElementById("data-panel");
const searchBtn = document.getElementById("submit-search");
const searchInput = document.getElementById("search");
let sortSelect = null;
let currentSort = "random";
const isGerman = (navigator.language || "en").toLowerCase().startsWith("de");

const pagination = document.getElementById("pagination");
const ITEM_PER_PAGE = 12;
let paginationData = [];
let currentPage = 1;

const SORT_OPTIONS = [
    { value: "random", label: "Zufällig" },
    { value: "newest", label: "Neuste zuerst" },
    { value: "oldest", label: "Älteste zuerst" },
    { value: "az", label: "A-Z" },
    { value: "za", label: "Z-A" },
    { value: "year-asc", label: "Erscheinungsjahr: Älteste zuerst" },
    { value: "year-desc", label: "Erscheinungsjahr: Neuste zuerst" },
    { value: "duration-asc", label: "Dauer: Kürzeste zuerst" },
    { value: "duration-desc", label: "Dauer: Längste zuerst" }
];

const T = isGerman ? {
    search: "Suchen",
    reset: "Zurücksetzen",
    sortLabel: "Sortierung",
    borrowed: "Geliehen",
    searchPlaceholder: "Film suchen..."
} : {
    search: "Search",
    reset: "Reset",
    sortLabel: "Sort",
    borrowed: "Borrowed",
    searchPlaceholder: "Search Movie..."
};

function getSortOptions() {
    return isGerman ? [
        { value: "random", label: "Zufällig" },
        { value: "newest", label: "Neuste zuerst" },
        { value: "oldest", label: "Älteste zuerst" },
        { value: "az", label: "A-Z" },
        { value: "za", label: "Z-A" },
        { value: "year-asc", label: "Erscheinungsjahr: Älteste zuerst" },
        { value: "year-desc", label: "Erscheinungsjahr: Neuste zuerst" },
        { value: "duration-asc", label: "Dauer: Kürzeste zuerst" },
        { value: "duration-desc", label: "Dauer: Längste zuerst" }
    ] : [
        { value: "random", label: "Random" },
        { value: "newest", label: "Newest first" },
        { value: "oldest", label: "Oldest first" },
        { value: "az", label: "A-Z" },
        { value: "za", label: "Z-A" },
        { value: "year-asc", label: "Release year: Oldest first" },
        { value: "year-desc", label: "Release year: Newest first" },
        { value: "duration-asc", label: "Duration: Shortest first" },
        { value: "duration-desc", label: "Duration: Longest first" }
    ];
}

const listModel = document.getElementById("btn-listModel");

function ensureModalInBody() {
    if (typeof $ === 'undefined') {
        return;
    }
    const $modal = $('#show-movie-modal');
    if ($modal.length && $modal.parent()[0] !== document.body) {
        $modal.appendTo('body');
    }
}

(function () {

    // Load data
    axios
        .get(CONFIG_URL)
        .then(configJson => {
            config = configJson.data;
            paths = { ...DEFAULT_PATHS, ...(config.paths || {}) };
            return axios.get(paths.movielist);
        })
        .then(response => {
            processData(csvToJson(response.data))
            displayFilterBtn();
            if (searchBtn) searchBtn.textContent = T.search;
            if (searchInput) searchInput.placeholder = T.searchPlaceholder;
            currentSort = sortSelect ? sortSelect.value : "random";
            data = sortMovies([...originalData], currentSort);
            getTotalPages(data);
            getPageData(1, data);
        })
        .catch(err => console.log(err));

    // listen to data panel
    dataPanel.addEventListener("click", event => {
        if (event.target.matches(".btn-show-movie")) {
            ensureModalInBody();
            showMovie(event.target.dataset.id);
        }
    });

    // listen to search btn click event
    if (searchBtn) {
        searchBtn.addEventListener("click", event => {
            event.preventDefault();

            let results = [];
            if (searchInput && searchInput.value !== "") {
                const regex = new RegExp(searchInput.value, "i");

                results = originalData.filter(movie => movie.title.match(regex));
            } else {
                results = [...originalData];
            }
            data = sortMovies(results, currentSort);
            currentPage = 1;
            getTotalPages(data);
            getPageData(1, data);
        });
    }

    // listen to sort change (delegated, since select is rendered later)
    document.addEventListener("change", event => {
        if (event.target && event.target.id === "sort-select") {
            currentSort = event.target.value;
            data = sortMovies([...data], currentSort);
            currentPage = 1;
            getTotalPages(data);
            getPageData(1, data);
        }
    });

    //listen to viewbox
    if (listModel) {
        listModel.addEventListener("click", event => {
            if (event.target.matches("#btn-listModel")) {
                displayDataListModel(data);
            }
        });
    }

    if (typeof $ !== 'undefined') {
        $(document).on('click', '[data-target="#show-movie-modal"][data-id]', function () {
            ensureModalInBody();
        });

        $(document).on('show.bs.modal', '#show-movie-modal', function () {
            ensureModalInBody();
            $('.modal-backdrop').appendTo('body');
        });
    }

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
            "filter": dataEntry.filter,
            "order": i,
            "added": dataEntry["Added"] || dataEntry["AddedAt"] || ""
        });
    }
    originalData = data;
}

function filterLabel(filter) {
    if (filter.labelOnly) return "";
    if (isGerman) return filter.label;
    if (filter.name === "borrowed") return T.borrowed;
    return filter.label;
}

function displayFilterBtn() {
    let btnHtml = ``;
    for (let i = 0; i < config.filter.length; i++) {
        if (config.filter[i]["labelOnly"] !== true) {
            let icon = config.filter[i]["icon"] !== undefined ? `<img class='icn' src='${paths.icon}${config.filter[i].icon}.svg' />` : "";
            let label = filterLabel(config.filter[i]);
            btnHtml +=
                `<button class="btn btn-primary btn-sm mb-2" style="margin-right:5px;" onclick="filterFor('${config.filter[i]["name"]}')">${icon} ${label}</button>
        `;
        }
    }
    btnHtml += `<button class="btn btn-danger btn-sm mb-2" style="margin-right:5px;" onclick="filterFor('')">${T.reset}</button>`;
    btnHtml += `<select id="sort-select" class="form-control form-control-sm mb-2 ml-2" style="width:auto; display:inline-block;"></select>`;
    $("#filter").html(btnHtml);
    sortSelect = document.getElementById("sort-select");
    displaySortDropdown();
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
    paginationData = data || paginationData;
    currentPage = 1;
    renderPagination();
}

function renderPagination() {
    const totalPages = Math.max(1, Math.ceil(paginationData.length / ITEM_PER_PAGE));
    currentPage = Math.min(Math.max(1, currentPage), totalPages);
    const pages = getPaginationRange(currentPage, totalPages);

    let pageItemContent = `<ul class="pagination justify-content-center flex-wrap">`;

    pageItemContent += `
        <li class="page-item ${currentPage === 1 ? "disabled" : ""}">
            <a class="page-link" href="#" aria-label="Previous" ${currentPage === 1 ? "" : `onclick="getPage(${currentPage - 1}); return false;"`}>
                <span aria-hidden="true">&laquo;</span>
            </a>
        </li>`;

    pages.forEach(page => {
        if (page === "...") {
            pageItemContent += `<li class="page-item disabled"><span class="page-link">…</span></li>`;
        } else if (page === currentPage) {
            pageItemContent += `<li class="page-item active" aria-current="page"><span class="page-link">${page}</span></li>`;
        } else {
            pageItemContent += `<li class="page-item"><a class="page-link" href="#" onclick="getPage(${page}); return false;">${page}</a></li>`;
        }
    });

    pageItemContent += `
        <li class="page-item ${currentPage === totalPages ? "disabled" : ""}">
            <a class="page-link" href="#" aria-label="Next" ${currentPage === totalPages ? "" : `onclick="getPage(${currentPage + 1}); return false;"`}>
                <span aria-hidden="true">&raquo;</span>
            </a>
        </li>
    </ul>`;

    pagination.innerHTML = pageItemContent;
}

function getPaginationRange(current, total) {
    if (total <= 7) {
        return Array.from({ length: total }, (_, i) => i + 1);
    }

    const range = [1];
    const start = Math.max(2, current - 1);
    const end = Math.min(total - 1, current + 1);

    if (start > 2) range.push("...");
    for (let i = start; i <= end; i++) range.push(i);
    if (end < total - 1) range.push("...");
    range.push(total);

    return range;
}

function getPage(pageNum) {
    getPageData(pageNum, data);
}

function getPageData(pageNum, movieData) {
    paginationData = movieData || paginationData;
    currentPage = pageNum;
    renderPagination();

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
                    let label = filter["icon"] !== undefined ? `<img class="icn" src="${paths.icon}${filter["icon"]}.svg"/>` : `${filter["label"]}`;
                    filterBtn += ` <button class="btn btn-label ${btnCss} mb-2" onclick="filterFor('${filter["name"]}')">${label}</button>`;
                }
            });
        htmlContent += `
        <div class="col-sm-3">
          <div class="card mb-2">
            <div class="poster-wrapper">
              <img class="card-img-top poster-img btn-show-movie" src="${paths.poster}${
            item.image
        }" alt="${item.title} Movie Poster" loading="lazy" onload="this.classList.add('loaded'); this.parentElement.classList.add('loaded')" data-toggle="modal" data-target="#show-movie-modal" data-id="${item.id}"/>
            </div>
            <!-- "More" button -->
            <div class="card-footer" style="min-height:60px">
              <a href="https://www.youtube.com/results?search_query=${item.title} ${item.year} trailer" target="_blank"><button class="btn btn-label btn-danger mb-2"><img class="icn" src="${paths.icon}yt.svg"></button></a>
              ${filterBtn}
            </div>
          </div>
        </div>
      `;
    });
    dataPanel.innerHTML = htmlContent;
}

function displaySortDropdown() {
    if (!sortSelect) return;
    sortSelect.innerHTML = getSortOptions().map(option => `<option value="${option.value}">${option.label}</option>`).join("");
    sortSelect.value = currentSort;
}

function durationToSeconds(duration) {
    if (!duration) return 0;
    const parts = String(duration).split(":").map(part => Number(part));
    if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
    if (parts.length === 2) return parts[0] * 60 + parts[1];
    return Number(duration) || 0;
}

function parseAdded(value) {
    if (!value) return 0;
    const time = Date.parse(String(value).trim());
    return isNaN(time) ? 0 : time;
}

function sortMovies(movies, sort) {
    const arr = [...movies];
    switch (sort) {
        case "random":
            shuffleArray(arr);
            break;
        case "newest":
            arr.sort((a, b) => parseAdded(b.added) - parseAdded(a.added) || (b.order || 0) - (a.order || 0));
            break;
        case "oldest":
            arr.sort((a, b) => parseAdded(a.added) - parseAdded(b.added) || (a.order || 0) - (b.order || 0));
            break;
        case "az":
            arr.sort((a, b) => String(a.title).localeCompare(String(b.title), "de", { sensitivity: "base" }));
            break;
        case "za":
            arr.sort((a, b) => String(b.title).localeCompare(String(a.title), "de", { sensitivity: "base" }));
            break;
        case "year-asc":
            arr.sort((a, b) => (Number(a.year) || 0) - (Number(b.year) || 0) || String(a.title).localeCompare(String(b.title)));
            break;
        case "year-desc":
            arr.sort((a, b) => (Number(b.year) || 0) - (Number(a.year) || 0) || String(a.title).localeCompare(String(b.title)));
            break;
        case "duration-asc":
            arr.sort((a, b) => durationToSeconds(a.duration) - durationToSeconds(b.duration));
            break;
        case "duration-desc":
            arr.sort((a, b) => durationToSeconds(b.duration) - durationToSeconds(a.duration));
            break;
        default:
            break;
    }
    return arr;
}

function filterFor(filterName) {
    let filteredEntries = [];
    if (filterName === '') {
        filteredEntries = [...originalData];
    } else {
        for (let i = 0; i < originalData.length; i++) {
            if (originalData[i]["filter"][filterName])
                filteredEntries.push(originalData[i]);
        }
    }
    data = sortMovies(filteredEntries, currentSort);
    getTotalPages(data);
    getPageData(1, data);
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
    modalImage.innerHTML = `<img src="${paths.poster}${
        movie.image
    }" class="img-fluid" alt="Responsive image">`;
    modalDescription.textContent = `${movie.description}`;
    modalLink.innerHTML = `<a href="${movie.link}" target="_blank"><button class="btn btn-info">IMDB Info</button></a>`;
}
