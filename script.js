const header = document.querySelector("[data-header]");
const reveals = document.querySelectorAll(".reveal");
const counter = document.querySelector("[data-counter]");
const themeToggle = document.querySelector(".theme-toggle");

const savedTheme = localStorage.getItem("llmvf-theme");
const preferredTheme = window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
const initialTheme = savedTheme || preferredTheme;
document.documentElement.dataset.theme = initialTheme;

const updateThemeToggle = (theme) => {
  if (!themeToggle) return;
  const nextLabel = theme === "dark" ? "낮 모드로 전환" : "밤 모드로 전환";
  themeToggle.setAttribute("aria-label", nextLabel);
  themeToggle.querySelector("span").textContent = theme === "dark" ? "☀" : "☾";
};

updateThemeToggle(initialTheme);

themeToggle?.addEventListener("click", () => {
  const nextTheme = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
  document.documentElement.dataset.theme = nextTheme;
  localStorage.setItem("llmvf-theme", nextTheme);
  updateThemeToggle(nextTheme);
});

document.querySelector("[data-year]").textContent = new Date().getFullYear();

window.addEventListener(
  "scroll",
  () => header.classList.toggle("scrolled", window.scrollY > 20),
  { passive: true }
);

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("visible");
      observer.unobserve(entry.target);
    });
  },
  { threshold: 0.12 }
);

reveals.forEach((element, index) => {
  element.style.transitionDelay = `${Math.min(index % 4, 3) * 70}ms`;
  observer.observe(element);
});

if (counter && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
  const target = Number(counter.dataset.counter);
  const started = performance.now();
  const tick = (now) => {
    const progress = Math.min((now - started) / 1200, 1);
    counter.textContent = Math.round(target * (1 - Math.pow(1 - progress, 3)));
    if (progress < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
} else if (counter) {
  counter.textContent = counter.dataset.counter;
}
