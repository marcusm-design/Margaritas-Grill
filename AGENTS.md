# Margaritas Grill Website

## Cursor Cloud specific instructions

### What this repo is
A **static** restaurant marketing website (HTML/CSS). The working, runnable app is the
root static site: `index.html` + `styles.css` (`script.js` is intentionally empty).

- There are **no dependencies to install** and **no build step**. There is no
  `package.json`, lockfile, or bundler config anywhere in the repo.
- Despite what `README.md` says ("Built with React + Vite", `npm install`/`npm run dev`),
  the React/Vite workflow is **not wired up**: `margaritas-grill-website/src/*.jsx` is
  source-only with no `package.json` or Vite config, and `margaritas-grill-website/index.html`
  is just another copy of the static site (no `#root`, no module script). So `npm install` /
  `npm run dev` will NOT work as-is — do not rely on them.

### Running the site (dev)
Serve the repo root with any static file server and open it in a browser, e.g.:

```bash
python3 -m http.server 5173   # then open http://localhost:5173/
```

There is no separate lint/test/build tooling configured. "End-to-end" testing means
serving the HTML and verifying the page renders and in-page nav (Home/About/Menu/Location)
scrolls correctly.

### Notes
- Google Fonts and the Google Maps `<iframe>` are loaded from CDNs; the site degrades
  gracefully (fallback fonts / no map) when offline.
