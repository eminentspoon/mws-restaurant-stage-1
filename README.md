# Mobile Web Specialist Certification Course

#### _Three Stage Course Material Project - Restaurant Reviews_

## Project Overview: Stage 3

For the **Restaurant Reviews** projects, you will incrementally convert a static webpage to a mobile-ready web application. In **Stage Three**, you will take the responsive, accessible design you built in **Stage One** and **Stage Two** and allow users to submit their own reviews as well as adding further offline functionality and hitting Lighthouse performance targets.

### Aims

#### Add Review and Favourite Restaurants Functionality

- Users are able to mark restaurants as favourites and persist this status to the server - ✓
- The restaurant favourite status is visible in the application - ✓
- A form is needed to allow users to add their own reviews for restaurants - ✓
- Review form submission works properly and persists the review to the server - ✓

#### Offline Use

- The client application continues to work offline - ✓
- JSON responses are cached to the IndexedDB store - ✓
- Any data previously accessed whilst connected is reachable when offline - ✓
- User is able to add a review to a restaurant whilst offline - ✓
- Any reviews submitted whilst offline are sent to the server when connectivity is re-established - ✓

#### Responsive Design and Accessibility

- Application maintains a responsive design on mobile, tablet and desktop viewports - ✓
- Added review form is responsive - ✓
- Added control for marking a restaurant as a favourite is responsive - ✓

#### Exceed the minimum performance requirements

- Main page - Lighthouse 'Progressive Web App' score should be 90 or better - ✓
- Restaurant page - Lighthouse 'Progressive Web App' score should be 90 or better - ✓
- Main page - Lighthouse 'Performance' score should be 90 or better - ✓
- Restaurant page - Lighthouse 'Performance' score should be 90 or better - ✓
- Main page - Lighthouse 'Accessibility' score should be 90 or better - ✓
- Restaurant page - Lighthouse 'Accessibility' score should be 90 or better - ✓

### Lighthouse results

The latest lighthouse audit figures are as follows:

|               | Main Page | Restaurant Page |
| ------------- | :-------: | :-------------: |
| PWA           |    91     |       91        |
| Performance   |    100    |       100       |
| Accessibility |    100    |       100       |

### Changes in this version

- Ability to add a favourite restaurant via the restaurant page added
- Visibility of which restaurants are favourites on the home page added
- Accessible and responsive notification system added to application to notify the result of server actions
- Notifications implemented on the restaurant page
- Notificaitons implemented on the home page
- Accessible and responsive form added to allow users to create reviews for a restaurant
- Newly created reviews are automatically added to page without rebind, including updating of appropriate aria properties
- Validation added to review form
- Basic input sanitisation added to review form
- All API calls converted to promises, removing existing callback functionality
- If a restaurant image on the site is requested but not in the cache, the default image is displayed rather than a missing image
- Offline sync functionality added to the system to handle offline reviews and offline favourite status changes  
  **Note**: I heavily trialled service worker background sync to provide this functionality. During testing, I found the timings that the sync script ran were unreliable and under some instances, when navigating, the script seemed to hang and never run despite showing as still registered. In the end, adding a listener to the online status proved to be a lot more reliable.
- Fix added to the system to handle the inconsistant typing of 'is_favorite' from the server (is a boolean on first load, after any change, it is then a string)
- Scripts generally tidied up and comments added to appropriate areas in the service worker
- Better error handling and reporting added to the system
- Non-core stylesheets deferred until after page load

### Lighthouse Targets - Testing and Notes

#### Accessibility

The full report for accessibilty targets can be found [here](https://github.com/eminentspoon/mws-restaurant-stage-1/blob/audits/accessibility.md), this also includes screenshots of the achieved targets.

#### Progressive Web Application

The full report for progressive web application targets can be found [here](https://github.com/eminentspoon/mws-restaurant-stage-1/blob/audits/pwa.md), this also includes screenshots of the achieved targets.

#### Performance

In order to properly test for the performance targets, the results were measured by hosting the application within an apache web server which had gzip compression enabled.

The full report for the performance targets can be found [here](https://github.com/eminentspoon/mws-restaurant-stage-1/blob/audits/perf.md), this also includes screenshots of the targets under different scenarios.

### Releases

- [v0.4](https://github.com/eminentspoon/mws-restaurant-stage-1/releases/tag/v0.4)

The latest version of the source for stage 3 has been prebuilt and any development files removed. If there are anyy problems running the project from the main source, this can be found in the releases area.

- [v0.3](https://github.com/eminentspoon/mws-restaurant-stage-1/releases/tag/v0.3)

The final version of the source for stage 2 has been prebuilt and any devleopment files removed. If there are any problems running the project from the main source, this can be found in the releases area.

- [v0.2](https://github.com/eminentspoon/mws-restaurant-stage-1/releases/tag/v0.2)

The final version of the source for stage 1 has been prebuilt and any development files removed. If there are any problems running the project from the main source, this can be found in the releases area.

- [v0.1](https://github.com/eminentspoon/mws-restaurant-stage-1/releases/tag/v0.1)

The initial source code first submitted for stage 1.

### Building and running the project

#### Important project prerequisites

1 - The grunt taskrunner uses ImageMagick to create images for different viewports. This will **need** to be installed for the project to be able to be built. Please see [here](https://www.imagemagick.org/script/download.php) for installation details for your platform.

2 - The project relies on the API server for [stage 3](https://github.com/eminentspoon/mws-restaurant-stage-3) to be running on port 1337 on the same machine as this site.

#### Building the project

The project has been set up as an npm project. In order to get the required dependencies, run:

```
npm install
```

Once all the required dependencies are installed, run the following command to build the project into the dist:

```
npm run build
```

This will generate the stylesheets, images and scripts into the dist folder.

```
npm run serve
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
