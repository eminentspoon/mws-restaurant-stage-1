# Mobile Web Specialist Certification Course

---

#### _Three Stage Course Material Project - Restaurant Reviews_

## Project Overview: Stage 1

For the **Restaurant Reviews** projects, you will incrementally convert a static webpage to a mobile-ready web application. In **Stage One**, you will take a static design that lacks accessibility and convert the design to be responsive on different sized displays and accessible for screen reader use. You will also add a service worker to begin the process of creating a seamless offline experience for your users.

### Aims

#### UI compatible with a range of display sizes

* All content is responsive and displays on a range of display sizes - ✓
* Content should make use of available screen real estates and should display correctly oat all screen sizes - ✓
* An image's associated title and text renders next to the image in all viewport sizes - ✓

#### Responsive images

* Images in the size are sized appropariately to the viewport and do not crowd or overlap other elements in the browser, regardless of viewport size - ✓

#### Application elements useable in all viewports

* On the main page: restaurants and images are displayed in all viewports - ✓
* On the details page: a maap, hours and reviews are displayed in all viewports - ✓

#### Accessible images

* All content related images include appropriate alternate text that clearly describe the content of the image - ✓

#### Focus

* Focus is appropriately managed allowing users to noticeably tab through each of the important elements of the page - ✓
* Modal of interstitial windows appropriately focus lock - N/A

#### Semantic site elements

* Elements on the page use the appropriate semantic elements - ✓
* For elements in which a semantic element is not available, appropriate ARIA roles are defined - ✓

#### Visited pages available offline

* When available to the browser, a service worker caches responses to requests for site assets - ✓
* Visited pages are rendered when there is no network access - ✓

### Using the project

The project has been set up as an npm project. In order to get the required dependencies, run:

```
npm install
```

#### Project details

* Uses SASS for stylesheets
  * The reason for using SASS is it allows a more structured stylesheet layout and includes benefits such as centralised variables for things like colours.
* Uses grunt for responsive image actions
  * The reason for using grunt is it has available plugins for generating images based upon specified sizes and qualities.
* Uses live-server to run the server
  * The reason for using live-server is it automatically injects code into each page to automatically apply css changes as well as automatically refreshing whenever files change.

- Uses npm-run-all to run scripts
  * The reason for using npm-run-all is it allows multiple npm scripts to be chained in a single command.

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
npm start
```

Chains the above commands into a single action. This has the result of generating images, building any existing SASS files, setting up a watch on /sass directory for any future updates and launching live-server ready for viewing / development.

### Future Improvements

#### General

1.  Add build step to minify CSS and JS

#### Service Worker

1.  Update stale cache content on successful network request
