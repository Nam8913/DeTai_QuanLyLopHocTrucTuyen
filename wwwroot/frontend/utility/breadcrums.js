function generateBreadcrumb() {
  const container = document.getElementById("breadcrumb-items-container");

  const path = window.location.pathname
    .split("/")
    .filter(p => p !== "" && p !== "wwwroot");

  let breadcrumbHTML = '<a href="index.html">Home</a>';
  let currentPath = "";

  path.forEach((segment, index) => {

    currentPath += segment;

    const name = segment
      .replace(".html","")
      .replace(/-/g, " ")
      .replace(/\b\w/g, c => c.toUpperCase());
    
    if(currentPath === "index.html") return;

    breadcrumbHTML += ` > <a href="${currentPath}">${name}</a>`;
  });

  container.innerHTML = breadcrumbHTML;
}

generateBreadcrumb();