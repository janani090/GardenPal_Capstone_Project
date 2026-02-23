const images = ["deer.avif", "deer2.avif", "deer3.avif"];

let currentIndex = 0;

const imgEl = document.getElementById("feedImage");
const pageButtons = document.querySelectorAll(".pageBtn");
const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");

function setActive(index) {
  currentIndex = index;
  imgEl.src = images[currentIndex];

  pageButtons.forEach(btn => btn.classList.remove("active"));
  pageButtons[currentIndex].classList.add("active");
}

pageButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    const index = Number(btn.dataset.index);
    setActive(index);
  });
});

prevBtn.addEventListener("click", () => {
  const newIndex = (currentIndex - 1 + images.length) % images.length;
  setActive(newIndex);
});

nextBtn.addEventListener("click", () => {
  const newIndex = (currentIndex + 1) % images.length;
  setActive(newIndex);
});
