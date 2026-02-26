const navButtons = document.querySelectorAll("nav .navBtn");

function setActiveNav(clickedBtn) {
  navButtons.forEach((btn) => btn.classList.remove("active"));

  clickedBtn.classList.add("active");
}

navButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    setActiveNav(btn);

    const page = btn.dataset.page;
    console.log("Nav clicked:", page);
  });
});