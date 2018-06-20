# Mobile Web Specialist Certification Course

---

#### _Three Stage Course Material Project - Restaurant Reviews_

## Project Overview: Stage 2

For the **Restaurant Reviews** projects, you will incrementally convert a static webpage to a mobile-ready web application. In **Stage Two**, you will take the responsive, accessible design you build in **Stage One** and connect it to an external server.

### Aims

#### Use server data instead of local memory

- Pull all data from the server rather than local file - ✓
- Use response data to generate restaurant information on main page - ✓
- Use response data to generate restaurant information on restaurant page - ✓

#### Use IndexedDB to cache JSON responses

- Update service worker to store JSON received by request using IndexedDB API - ✓
- Each page should be available offline with data pulled from IDB - ✓

#### Meet the minmum performance requirements

- Main page - Lighthouse 'Progressive Web App' score should be 90 or better - ✓
- Restaurant page - Lighthouse 'Progressive Web App' score should be 90 or better - ✓
- Main page - Lighthouse 'Performance' score should be 70 or better - ✓
- Restaurant page - Lighthouse 'Performance' score should be 70 or better - ✓
- Main page - Lighthouse 'Accessibility' score should be 90 or better - ✓
- Restaurant page - Lighthouse 'Accessibility' score should be 90 or better - ✓

### Lighthouse results

The latest lighthouse audit figures are as follows:

|               | Main Page | Restaurant Page |
| ------------- | :-------: | :-------------: |
| PWA           |    91     |       91        |
| Performance   |    73     |       78        |
| Accessibility |    100    |       100       |

### Changes in this version

- Source files moved into /src directory
- Source files now built into /dist directory
- JS files now minified
- CSS files now minified
- Applicable CSS files combined
- Image files changed to webp format
- [IndexedDB Promised](https://github.com/jakearchibald/idb) used to interact with IndexedDB
- Fetch used to interact with API
- Manifest added

### Releases

- [v0.3]()

The latest version of the source for stage 2 has been prebuilt and any devleopment files removed. If there are any problems running the project from the main source, this can be found in the releases area.

- [v0.2](https://github.com/eminentspoon/mws-restaurant-stage-1/releases/tag/v0.2)

The final version of the source for stage 1 has been prebuilt and any development files removed. If there are any problems running the project from the main source, this can be found in the releases area.

- [v0.1](https://github.com/eminentspoon/mws-restaurant-stage-1/releases/tag/v0.1)

The initial source code first submitted for stage 1.

### Building and running the project

#### Important project prerequisites

1 - **Important:** _The grunt taskrunner uses ImageMagick to create images for different viewports. This will **need** to be installed for the project to be able to be run. Please see [here](https://www.imagemagick.org/script/download.php) for installation details for your platform_.

The project has been set up as an npm project. In order to get the required dependencies, run:

```
npm install
```

Once all the required dependencies are installed, run the following command to build the project into the dist:

```
npm build
```

This will generate the stylesheets, images and scripts into the dist folder.

```
npm serve
```

This will serve the latest built source in the dist directory.

#### Project details

- Uses SASS for stylesheets
  - The reason for using SASS is it allows a more structured stylesheet layout and includes benefits such as centralised variables for things like colours.
- Uses grunt for responsive image actions, minification and combining files
  - The reason for using grunt is it has available plugins for generating images based upon specified sizes and qualities as well as minification of CSS and JS.
- Uses live-server to run the server
  - The reason for using live-server is it automatically injects code into each page to automatically apply css changes as well as automatically refreshing whenever files change.

* Uses npm-run-all to run scripts
  - The reason for using npm-run-all is it allows multiple npm scripts to be chained in a single command.

#### Available npm scripts

```
npm run build::sass
```

Builds all SASS files within /scss into /css

```
npm run watch:sass
```

Sets up the SASS watch task on the /scss directory, automatically rebuilding into /css

```
npm run grunt
```

Runs the grunt task runner to generate the responsive images from /img_src to /img

```
npm run serve
```

Launches the project using live-server on port 8000, automatically opening in the default browser. **Note:** live-server launches using 127.0.0.1 rather than localhost, this should work fine with the project.

```
npm run build
```

Chains the the build commands into a single action. This has the result of generating images, building any existing SASS files, setting up a watch on /sass directory for any future updates and launching live-server ready for viewing / development.
