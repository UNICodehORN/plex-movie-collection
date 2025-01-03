const INDEX_URL = "./posters/movielist.csv";
const POSTER_URL = "./posters/";
const data = [
];

const dataPanel = document.getElementById("data-panel");
const searchBtn = document.getElementById("submit-search");
const searchInput = document.getElementById("search");

const pagination = document.getElementById("pagination");
const ITEM_PER_PAGE = 12;
let paginationData = [];

const listModel = document.getElementById("btn-listModel");
const cardModel = document.getElementById("btn-cardModel");

(function() {

  // Load data
  axios
      .get(INDEX_URL)
      .then(response => {
        //data.push(...response.data.results);
        processData(csvToJson(response.data))
        getTotalPages(data);
        // displayDataList(data)
        getPageData(1, data);
      })
      .catch(err => console.log(err));
  getTotalPages(data);
  getPageData(1, data);

  // listen to data panel
  dataPanel.addEventListener("click", event => {
    if (event.target.matches(".btn-show-movie")) {
      showMovie(event.target.dataset.id);
    } else if (event.target.matches(".btn-add-favorite")) {
      console.log(event.target.dataset.id);
      addFavoriteItem(event.target.dataset.id);
    }
  });

  // listen to search btn click event
  searchBtn.addEventListener("click", event => {
    event.preventDefault();
    console.log("click!");

    let results = [];
    const regex = new RegExp(searchInput.value, "i");

    results = data.filter(movie => movie.title.match(regex));
    console.log(results);
    // displayDataList(results)
    getTotalPages(results);
    getPageData(1, results);
  });

  // listen to pagination click event
  pagination.addEventListener("click", event => {
    console.log(event.target.dataset.page);
    if (event.target.matches(".btn-add-favorite")) {
      getPageData(event.target.dataset.page);
    }
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
    for (let i = 1; i < rows.length-1; i++) {

      const values = rows[i].split("|");

      const obj = {};

      for (let j = 0; j < headers.length; j++) {

        const key = headers[j].substring(1, headers[j].length-1).trim();
        const value = values[j].substring(1, values[j].length-1).trim();

        obj[key] = value;
      }

      jsonData.push(obj);
    }
    return jsonData;
  }

  function processData(dataToProcess){
    for (let i =0; i < dataToProcess.length; i++){
      let title = dataToProcess[i]["Title"].replace(":", "").replace("?", "").replace("B.C.", "B.C");
      let imagePath = title+" ("+dataToProcess[i]["Year"]+")/"+title+" ("+dataToProcess[i]["Year"]+").jpg";
      imagePath = encodeURI(imagePath);
      data.push({
          "id":dataToProcess[i]["TMDB ID"],
          "title":dataToProcess[i]["Title"],
          "image": imagePath
      });
    }
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

  function getPage(pageNum){
    getPageData(pageNum, data);
  }

  function getPageData(pageNum, data) {
    paginationData = data || paginationData;
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
    data.forEach(function(item, index) {
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
              <!--<button class="btn btn-primary btn-show-movie" data-toggle="modal" data-target="#show-movie-modal" data-id="${
                item.id
              }">More</button>-->
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

  function displayDataListModel(data) {
    let htmlContent = "";
    data.forEach(function(item, index) {
      htmlContent += `
           <div class="container">
    <div class="row lst">
      <div class="col"><h6>${item.title}</h5></div>
      <div class="col"><button class="btn btn-primary btn-show-movie" data-toggle="modal" data-target="#show-movie-modal"
        data-id="${item.id}">More</button>
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

    // set request url
    const url = INDEX_URL + id;
    console.log(url);

    // send request to show api
    axios.get(url).then(response => {
      const data = response.data.results;
      console.log(data);

      // insert data into modal ui
      modalTitle.textContent = data.title;
      modalImage.innerHTML = `<img src="${POSTER_URL}${
        data.image
      }" class="img-fluid" alt="Responsive image">`;
      modalDate.textContent = `release at : ${data.release_date}`;
      modalDescription.textContent = `${data.description}`;
    });
  }

  function addFavoriteItem(id) {
    const list = JSON.parse(localStorage.getItem("favoriteMovies")) || [];
    const movie = data.find(item => item.id === Number(id));

    if (list.some(item => item.id === Number(id))) {
      alert(`${movie.title} is already in your favorite list.`);
    } else {
      list.push(movie);
      alert(`Added ${movie.title} to your favorite list!`);
    }
    localStorage.setItem("favoriteMovies", JSON.stringify(list));
  }
