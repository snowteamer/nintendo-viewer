import { throwNewAssertionError } from "@me/tc.js";

export default class ReferenceTooltip {
  static importMetaURL = import.meta.url

  get text () { return this.div.textContent }
  set text (text) { this.div.textContent = text }

  visible = false

  div = Object.assign(document.createElement("div"), {
    className: "reference-tooltip"
  })

  constructor () {
    this.hide()
  }

  hide () {
    this.div.style.display = "none"
    this.visible = false
  }

  show (rect) {
    if (this.visible) return;
    const { div } = this
    // Position the tooltip above the link, centered horizontally
    div.style.left = `${rect.left + window.scrollX + (rect.width / 2)}px`;
    div.style.top = `${rect.top + window.scrollY}px`;
    
    div.style.display = ""
    this.visible = true
  }

  toggle () {
    if (this.visible) this.show(); else this.hide()
  }
}


document.addEventListener("DOMContentLoaded", () => {
  const tooltip = document.getElementById("tooltip-container") ?? throwNewAssertionError();
  const citationLinks = document.querySelectorAll(".citation-link");

  citationLinks.forEach(link => {
    // Show tooltip on hover
    link.addEventListener("mouseenter", () => {
      const text = link.getAttribute("data-tooltip");
      tooltip.textContent = text;
      
      // Calculate positions
      const linkRect = link.getBoundingClientRect();
      
      // Position the tooltip above the link, centered horizontally
      tooltip.style.left = `${linkRect.left + window.scrollX + (linkRect.width / 2)}px`;
      tooltip.style.top = `${linkRect.top + window.scrollY - 10}px`;
      
      // Transform ensures perfect horizontal centering and offsets the height
      tooltip.style.transform = "translate(-50%, -100%)";
      
      tooltip.classList.remove("hidden");
    });

    // Hide tooltip when leaving the link
    link.addEventListener("mouseleave", () => {
      tooltip.classList.add("hidden");
    });
  });
});
