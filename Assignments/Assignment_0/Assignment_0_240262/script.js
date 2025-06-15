const h = new Date().getHours();
const greeting = h < 12 ? "Good Morning" : h < 18 ? "Good Afternoon" : "Good Evening";
const today = new Date().toLocaleDateString("en-GB");
document.getElementById("badge").innerHTML = `${greeting}<br>${today}`;

const obs = new IntersectionObserver((e) => {
  e.forEach((i) => {
    if (i.isIntersecting) i.target.classList.add("play");
  });
}, { threshold: 0.25 });

document.querySelectorAll(".animate").forEach((el) => obs.observe(el));

(function () {
  const hr = new Date().getHours();
  let bg = "day.jpg";

  if (hr >= 5 && hr < 10)
    bg = "dawn.jpeg";
  else if (hr >= 10 && hr < 17)
    bg = "bgd.webp";
  else if (hr >= 17 && hr < 20)
    bg = "background.jpg";
  else
    bg = "night.webp";

  document.body.style.backgroundImage = `url('${bg}')`;
})();
