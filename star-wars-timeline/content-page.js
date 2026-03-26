import {
  renderDesktopSidebar,
  renderContentTopBar,
  renderShellLayout,
  renderStandardFooter
} from "./modules/shell.js";

const app = document.getElementById("app");
const contentTemplate = document.getElementById("page-content");

if (app && contentTemplate) {
  const activePage = document.body.dataset.page || "";
  const content = contentTemplate.innerHTML;
  const sidebarTitle = document.body.dataset.sidebarTitle || "Sections";
  const sidebarSubtitle = document.body.dataset.sidebarSubtitle || "Jump to Section";
  const sidebarLinks = Array.from(contentTemplate.content.querySelectorAll("[data-sidebar-label]"))
    .map((element) => ({
      id: element.id,
      label: element.getAttribute("data-sidebar-label"),
      icon: element.getAttribute("data-sidebar-icon") || "article"
    }))
    .filter((item) => item.id && item.label);
  const desktopSidebar = sidebarLinks.length > 0
    ? renderDesktopSidebar(`
      <div class="px-8 mt-24 mb-10">
        <h2 class="text-[#FFE81F] font-bold font-headline tracking-tighter text-xl">${sidebarTitle}</h2>
        <p class="text-white/40 text-[10px] uppercase tracking-[0.2em] font-label mt-1">${sidebarSubtitle}</p>
      </div>
      <nav class="flex flex-col gap-1">
        ${sidebarLinks.map((item) => `
          <a class="era-nav-button flex items-center gap-4 px-8 py-4 text-white/40 hover:bg-white/5 hover:text-white transition-all group text-left" href="#${item.id}">
            <span class="material-symbols-outlined text-secondary text-lg">${item.icon}</span>
            <span class="font-medium text-sm font-body">${item.label}</span>
          </a>
        `).join("")}
      </nav>
    `)
    : "";

  app.innerHTML = renderShellLayout({
    topBar: renderContentTopBar({
      basePath: "..",
      activePage
    }),
    desktopSidebar,
    mainContent: content,
    mobileAudio: "",
    mobileBottomNav: "",
    footer: renderStandardFooter({
      basePath: "..",
      activeLink: activePage
    }),
    overlays: "",
    mainClassName: `${sidebarLinks.length > 0 ? "lg:ml-72 " : ""}pt-16 md:pt-20`
  });
}
