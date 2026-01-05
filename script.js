const popularBooks = document.getElementById("popularBooks")
const recommendBooks = document.getElementById("recommendBooks")
const savedBooks = document.getElementById("savedBooks")
const categoryBooks = document.getElementById("categoryBooks")

const popPrev = document.getElementById("popPrev")
const popNext = document.getElementById("popNext")
const recPrev = document.getElementById("recPrev")
const recNext = document.getElementById("recNext")

const searchInput = document.getElementById("searchInput")

const homePage = document.getElementById("homePage")
const savedPage = document.getElementById("savedPage")
const categoriesPage = document.getElementById("categoriesPage")
const reviewsPage = document.getElementById("reviewsPage")
const settingsPage = document.getElementById("settingsPage")
const profilePage = document.getElementById("profilePage")

const reviewsList = document.getElementById("reviewsList")

const menuItems = document.querySelectorAll(".menu-item")
const categoryCards = document.querySelectorAll(".category-card")

const panel = document.getElementById("bookPanel")
const overlay = document.getElementById("overlay")
const closePanel = document.getElementById("closePanel")

const panelCover = document.getElementById("panelCover")
const panelTitle = document.getElementById("panelTitle")
const panelAuthor = document.getElementById("panelAuthor")
const panelDescription = document.getElementById("panelDescription")
const panelReadLink = document.getElementById("panelReadLink")
const panelRating = document.getElementById("panelRating")
const panelReviews = document.getElementById("panelReviews")

let saved = JSON.parse(localStorage.getItem("savedBooks")) || []
let reviews = JSON.parse(localStorage.getItem("reviews")) || []

let settings = JSON.parse(localStorage.getItem("settings")) || {
  darkMode: false,
  showRatings: true,
  defaultPage: "home",
  username: "Farid Rasul"
}

applySettings()

fetchSlider("bestseller books", popularBooks, popPrev, popNext)
fetchSlider("recommended books", recommendBooks, recPrev, recNext)

searchInput.addEventListener("keydown", e => {
  if (e.key === "Enter") {
    const q = searchInput.value.trim()
    if (!q) return
    fetchSlider(q, popularBooks, popPrev, popNext)
  }
})

function fetchSlider(query, container, prevBtn, nextBtn) {
  let offset = 0
  let maxOffset = 0
  const step = 360
  container.innerHTML = ""
  fetch(`https://www.googleapis.com/books/v1/volumes?q=${query}&maxResults=40`)
    .then(r => r.json())
    .then(d => {
      if (!d.items) return
      d.items.forEach(b => container.appendChild(createBookCard(b)))
      setTimeout(() => {
        maxOffset = Math.max(container.scrollWidth - container.parentElement.offsetWidth, 0)
        update()
      })
      nextBtn.onclick = () => {
        if (offset < maxOffset) {
          offset = Math.min(offset + step, maxOffset)
          update()
        }
      }
      prevBtn.onclick = () => {
        offset = Math.max(offset - step, 0)
        update()
      }
      function update() {
        container.style.transform = `translateX(-${offset}px)`
      }
    })
}

function createBookCard(book) {
  const info = book.volumeInfo
  const liked = saved.includes(book.id)
  const card = document.createElement("div")
  card.className = "book-card"
  card.innerHTML = `
    <button class="like-btn ${liked ? "active" : ""}" data-id="${book.id}">♥</button>
    <img src="${info.imageLinks?.thumbnail || ""}">
    <h4>${info.title || ""}</h4>
    <p>${info.authors?.[0] || ""}</p>
  `
  return card
}

document.addEventListener("click", e => {
  if (e.target.classList.contains("like-btn")) {
    const id = e.target.dataset.id
    saved.includes(id) ? saved = saved.filter(x => x !== id) : saved.push(id)
    localStorage.setItem("savedBooks", JSON.stringify(saved))
    e.target.classList.toggle("active")
    return
  }
  const card = e.target.closest(".book-card")
  if (card) openBookPanel(card.querySelector(".like-btn").dataset.id)
})

function renderSaved() {
  savedBooks.innerHTML = ""
  saved.forEach(id => {
    fetch(`https://www.googleapis.com/books/v1/volumes/${id}`)
      .then(r => r.json())
      .then(b => savedBooks.appendChild(createBookCard(b)))
  })
}

categoryCards.forEach(c => c.onclick = () => fetchCategoryBooks(c.dataset.category))

function fetchCategoryBooks(cat) {
  categoryBooks.innerHTML = ""
  fetch(`https://www.googleapis.com/books/v1/volumes?q=subject:${cat}&maxResults=40`)
    .then(r => r.json())
    .then(d => {
      if (!d.items) return
      d.items.forEach(b => categoryBooks.appendChild(createBookCard(b)))
    })
}

function renderReviews() {
  reviewsList.innerHTML = ""
  saved.forEach(id => {
    fetch(`https://www.googleapis.com/books/v1/volumes/${id}`)
      .then(r => r.json())
      .then(b => {
        const info = b.volumeInfo
        const data = reviews.find(x => x.id === id) || { rating: 0, text: "" }
        const card = document.createElement("div")
        card.className = "review-card"
        card.innerHTML = `
          <div class="review-book" data-id="${id}">
            <img src="${info.imageLinks?.thumbnail || ""}">
            <div>
              <h4>${info.title}</h4>
              <p>${info.authors?.[0] || ""}</p>
            </div>
          </div>
          <div class="stars">
            ${[1,2,3,4,5].map(i =>
              `<span data-star="${i}" class="${i <= data.rating ? "active" : ""}">★</span>`
            ).join("")}
          </div>
          <textarea placeholder="Write your thoughts about this book...">${data.text}</textarea>
        `
        card.querySelector(".review-book").onclick = () => openBookPanel(id)
        card.querySelectorAll(".stars span").forEach(s =>
          s.onclick = () => {
            saveReview(id, s.dataset.star, card.querySelector("textarea").value)
            renderReviews()
          }
        )
        card.querySelector("textarea").oninput = e =>
          saveReview(id, data.rating, e.target.value)
        reviewsList.appendChild(card)
      })
  })
}

function saveReview(id, rating, text) {
  const i = reviews.findIndex(r => r.id === id)
  const obj = { id, rating: Number(rating), text }
  i > -1 ? reviews[i] = obj : reviews.push(obj)
  localStorage.setItem("reviews", JSON.stringify(reviews))
}

function openBookPanel(id) {
  panel.classList.add("active")
  overlay.classList.add("active")
  fetch(`https://www.googleapis.com/books/v1/volumes/${id}`)
    .then(r => r.json())
    .then(b => {
      const i = b.volumeInfo
      panelCover.src = i.imageLinks?.thumbnail || ""
      panelTitle.innerText = i.title || ""
      panelAuthor.innerText = i.authors?.[0] || ""
      panelDescription.innerText = i.description || ""
      panelReadLink.href = i.previewLink || "#"
      panelRating.innerText = i.averageRating ? `⭐ ${i.averageRating}` : ""
      renderPanelReviews(id)
    })
}

function renderPanelReviews(id) {
  panelReviews.innerHTML = ""
  reviews.filter(r => r.id === id).forEach(r => {
    const d = document.createElement("div")
    d.innerHTML = `<p>⭐ ${r.rating}</p><p>${r.text}</p>`
    panelReviews.appendChild(d)
  })
}

closePanel.onclick = () => {
  panel.classList.remove("active")
  overlay.classList.remove("active")
}
overlay.onclick = closePanel.onclick

function applySettings() {
  document.body.classList.toggle("dark", settings.darkMode)
}

function initSettings() {
  const dark = document.getElementById("darkModeToggle")
  const show = document.getElementById("showRatingsToggle")
  const def = document.getElementById("defaultPageSelect")
  const user = document.getElementById("usernameInput")
  const clear = document.getElementById("clearDataBtn")

  dark.checked = settings.darkMode
  show.checked = settings.showRatings
  def.value = settings.defaultPage
  user.value = settings.username

  dark.onchange = () => {
    settings.darkMode = dark.checked
    applySettings()
    localStorage.setItem("settings", JSON.stringify(settings))
  }

  show.onchange = () => {
    settings.showRatings = show.checked
    localStorage.setItem("settings", JSON.stringify(settings))
  }

  def.onchange = () => {
    settings.defaultPage = def.value
    localStorage.setItem("settings", JSON.stringify(settings))
  }

  user.oninput = () => {
    settings.username = user.value
    localStorage.setItem("settings", JSON.stringify(settings))
  }

  clear.onclick = () => {
    localStorage.removeItem("savedBooks")
    localStorage.removeItem("reviews")
    saved = []
    reviews = []
  }
}

function updateProfileStats() {
  const statSaved = document.getElementById("statSaved")
  const statReviews = document.getElementById("statReviews")
  if (statSaved) statSaved.innerText = saved.length
  if (statReviews) statReviews.innerText = reviews.length
}

menuItems.forEach(item => {
  item.onclick = () => {
    menuItems.forEach(i => i.classList.remove("active"))
    item.classList.add("active")

    homePage.style.display = "none"
    savedPage.style.display = "none"
    categoriesPage.style.display = "none"
    reviewsPage.style.display = "none"
    settingsPage.style.display = "none"
    profilePage.style.display = "none"

    if (item.dataset.page === "saved") {
      savedPage.style.display = "block"
      renderSaved()
    } else if (item.dataset.page === "categories") {
      categoriesPage.style.display = "block"
    } else if (item.dataset.page === "reviews") {
      reviewsPage.style.display = "block"
      renderReviews()
    } else if (item.dataset.page === "settings") {
      settingsPage.style.display = "block"
      initSettings()
    } else if (item.dataset.page === "profile") {
      profilePage.style.display = "block"
      updateProfileStats()
    } else {
      homePage.style.display = "block"
    }
  }
})
