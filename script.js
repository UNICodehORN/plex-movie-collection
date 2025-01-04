const INDEX_URL = "./assets/movielist.csv";
const POSTER_URL = "./assets/";
var originalData = [];
var data = [];

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
            //data.push(...response.data.results);
            processData(csvToJson(response.data))
            getTotalPages(data);
            // displayDataList(data)
            displayRandom();
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
        let title = dataToProcess[i]["Title"].replace(":", "").replace("?", "").replace("B.C.", "B.C");
        let imagePath = title + " (" + dataToProcess[i]["Year"] + ")/" + title + " (" + dataToProcess[i]["Year"] + ").jpg";
        imagePath = encodeURI(imagePath);
        let steelbook = false;
        let fourK = false;
        let gerAtmos = false;
        let mediaBook = false;
        let threeD = false;
        if (dataToProcess[i]["Part File Combined"].toLowerCase().includes("steelbook")) steelbook = true;
        if (dataToProcess[i]["Part File Combined"].toLowerCase().includes("mediabook")) mediaBook = true;
        if (dataToProcess[i]["Part File Combined"].toLowerCase().includes("-uhd")) fourK = true;
        if (dataToProcess[i]["Part File Combined"].toLowerCase().includes("-3d")) threeD = true;
        if (dataToProcess[i]["Audio Stream Display Title"].toLowerCase().includes("deutsch (truehd 7.1)")) gerAtmos = true;

        data.push({
            "id": dataToProcess[i]["TMDB ID"],
            "title": dataToProcess[i]["Title"],
            "duration": dataToProcess[i]["Duration"],
            "link": dataToProcess[i]["IMDB Link"],
            "year": dataToProcess[i]["Year"],
            "description": dataToProcess[i]["Summary"],
            "image": imagePath,
            "fourK": fourK,
            "steelbook": steelbook,
            "mediabook": mediaBook,
            "gerAtmos": gerAtmos,
            "threeD": threeD,
        });
    }
    originalData = data;
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
        let steelbook = ``;
        if (item.steelbook) steelbook = `<button class="btn btn-info">Steelbook</button>`;
        let fourK = ``;
        if (item.fourK) fourK = `<button class="btn btn-info">4K</button>`;
        let gerAtmos = ``;
        if (item.gerAtmos) gerAtmos = `<button class="btn btn-info">Dolby Atmos</button>`;
        let mediaBook = ``;
        if (item.mediabook) mediaBook = `<button class="btn btn-info">Mediabook</button>`;
        let threeD = ``;
        if (item.threeD) threeD = `<button class="btn btn-info">3D</button>`;
        htmlContent += `
        <div class="col-sm-3">
          <div class="card mb-2">
            <img class="card-img-top " src="${POSTER_URL}${
            item.image
        }" alt="Card image cap">
            <div class="card-body movie-item-body">
              <h6 class="card-title">${item.title}</h5>
            </div>
            <!-- "More" button -->
            <div class="card-footer">
              ${steelbook}
              ${mediaBook}
              ${fourK}
              ${threeD}
              ${gerAtmos}
              <button class="btn btn-primary btn-show-movie" data-toggle="modal" data-target="#show-movie-modal" data-id="${item.id}">More</button>
                <!-- favorite button -->
              <!--<button class="btn btn-info btn-add-favorite" data-id="${
            item.id
        }">+</button>-->
            </div>
          </div>
        </div>
      `;
    });
    dataPanel.innerHTML = htmlContent;
}

function searchSteelbooks() {
    let steelbooks = [];
    for (let i = 0; i < originalData.length; i++) {
        if (originalData[i]["steelbook"])
            steelbooks.push(originalData[i]);
    }
    data = steelbooks;
    getTotalPages(steelbooks);
    getPageData(1, steelbooks);
}

function searchFourK() {
    let fourK = [];
    for (let i = 0; i < originalData.length; i++) {
        if (originalData[i]["fourK"])
            fourK.push(originalData[i]);
    }
    data = fourK;
    getTotalPages(fourK);
    getPageData(1, fourK);
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

function searchAtmos() {
    let atmos = [];
    for (let i = 0; i < originalData.length; i++) {
        if (originalData[i]["gerAtmos"])
            atmos.push(originalData[i]);
    }
    data = atmos;
    getTotalPages(atmos);
    getPageData(1, atmos);
}

function searchThreeD() {
    let threeD = [];
    for (let i = 0; i < originalData.length; i++) {
        if (originalData[i]["threeD"])
            threeD.push(originalData[i]);
    }
    data = threeD;
    getTotalPages(threeD);
    getPageData(1, threeD);
}

function searchMediabook() {
    let mediabook = [];
    for (let i = 0; i < originalData.length; i++) {
        if (originalData[i]["mediabook"])
            mediabook.push(originalData[i]);
    }
    data = mediabook;
    getTotalPages(mediabook);
    getPageData(1, mediabook);
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

    // insert data into modal ui
    modalTitle.textContent = `${movie.title} (${movie.year}) - ${movie.duration}`;
    modalImage.innerHTML = `<img src="${POSTER_URL}${
        movie.image
    }" class="img-fluid" alt="Responsive image">`;
    modalDescription.textContent = `${movie.description}`;
    modalLink.innerHTML = `<a href="${movie.link}" target="_blank"><button class="btn btn-info">IMDB Info</button></a>`;
}
