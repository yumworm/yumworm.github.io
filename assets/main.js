(() => {
  // On GitHub Pages the username is the subdomain (<user>.github.io), so
  // renaming the account needs no code changes. The fallback is for local previews.
  const FALLBACK_USER = "yumworm";

  const host = location.hostname.toLowerCase();
  const user = host.endsWith(".github.io") ? host.slice(0, -".github.io".length) : FALLBACK_USER;
  const list = document.getElementById("repos");

  const el = (tag, className, text) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
  };

  const timeAgo = (iso) => {
    const seconds = (Date.now() - new Date(iso)) / 1000;
    const units = [
      ["year", 31536000],
      ["month", 2592000],
      ["week", 604800],
      ["day", 86400],
      ["hour", 3600],
      ["minute", 60],
    ];
    const fmt = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
    for (const [unit, size] of units) {
      if (seconds >= size) return fmt.format(-Math.floor(seconds / size), unit);
    }
    return "just now";
  };

  const repoItem = (repo, index) => {
    const item = el("li");
    item.style.setProperty("--i", index);
    const link = el("a", "repo");
    link.href = repo.html_url;

    const name = el("span", "name", repo.name);
    name.append(el("span", "arrow", "↗"));
    name.lastChild.setAttribute("aria-hidden", "true");
    link.append(name);
    if (repo.description) link.append(el("span", "desc", repo.description));

    const meta = [repo.language, repo.stargazers_count && `★ ${repo.stargazers_count}`, `updated ${timeAgo(repo.pushed_at)}`];
    link.append(el("span", "meta", meta.filter(Boolean).join(" · ")));
    item.append(link);
    return item;
  };

  const showStatus = (text) => {
    const item = el("li", "meta", `${text} `);
    const link = el("a", null, "See GitHub");
    link.href = `https://github.com/${user}?tab=repositories`;
    item.append(link);
    list.replaceChildren(item);
  };

  fetch(`https://api.github.com/users/${user}/repos?sort=pushed&per_page=100`, {
    headers: { Accept: "application/vnd.github+json" },
  })
    .then((res) => {
      if (!res.ok) throw new Error(`GitHub API ${res.status}`);
      return res.json();
    })
    .then((repos) => {
      const shown = repos.filter((r) => !r.fork && r.name.toLowerCase() !== `${user}.github.io`);
      if (!shown.length) return showStatus("Nothing public yet.");
      list.replaceChildren(...shown.map((repo, i) => repoItem(repo, i)));
    })
    .catch(() => showStatus("Couldn't reach GitHub right now."));
})();
