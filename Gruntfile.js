module.exports = function(grunt) {
  grunt.initConfig({
    responsive_images: {
      dist: {
        options: {
          engine: "im",
          sizes: [
            {
              width: 1400,
              quality: 50,
              suffix: "-2x",
              name: "large"
            },
            {
              width: 700,
              quality: 50,
              name: "large"
            },
            {
              width: 1000,
              quality: 50,
              suffix: "-2x",
              name: "medium"
            },
            {
              width: 500,
              quality: 50,
              name: "medium"
            },
            {
              width: 800,
              quality: 50,
              suffix: "-2x",
              name: "small"
            },
            {
              width: 400,
              quality: 50,
              name: "small"
            }
          ]
        },

        files: [
          {
            expand: true,
            src: ["*.{gif,jpg,png,webp}"],
            cwd: "src/img/",
            dest: "dist/img/"
          }
        ]
      }
    },
    clean: {
      dist: {
        src: ["dist/img", "dist/img/static", "dist/js"]
      },
      tidy: {
        src: ["dist/css/*", "!dist/css/*.min.css"]
      }
    },
    mkdir: {
      dist: {
        options: {
          create: ["dist/img", "dist/img/static", "dist/js"]
        }
      }
    },
    copy: {
      dist: {
        files: [
          {
            expand: true,
            src: ["*.{gif,jpg,png,webp}"],
            cwd: "src/img/static",
            dest: "dist/img/static"
          },
          {
            expand: true,
            src: ["*.{html,json,ico}"],
            cwd: "src/",
            dest: "dist/"
          }
        ]
      }
    },
    uglify: {
      dist: {
        options: {},
        files: {
          "dist/sw.min.js": ["src/sw.js"],
          "dist/js/dbhelper.min.js": ["src/js/dbhelper.js"],
          "dist/js/main.min.js": ["src/js/main.js"],
          "dist/js/restaurant_info.min.js": ["src/js/restaurant_info.js"],
          "dist/js/notifications.min.js": ["src/js/notifications.js"],
          "dist/js/swhelper.min.js": ["src/js/swhelper.js"],
          "dist/js/idb.min.js": ["node_modules/idb/lib/idb.js"]
        }
      }
    },
    cssmin: {
      dist: {
        files: {
          "dist/css/styles.core.min.css": [
            "dist/css/styles.base.css",
            "dist/css/styles.sub.css"
          ],
          "dist/css/styles.large.min.css": ["dist/css/styles.large.css"],
          "dist/css/styles.medium.min.css": ["dist/css/styles.medium.css"]
        }
      }
    }
  });

  grunt.loadNpmTasks("grunt-responsive-images");
  grunt.loadNpmTasks("grunt-contrib-clean");
  grunt.loadNpmTasks("grunt-contrib-uglify-es");
  grunt.loadNpmTasks("grunt-contrib-cssmin");
  grunt.loadNpmTasks("grunt-contrib-copy");
  grunt.loadNpmTasks("grunt-mkdir");
  grunt.registerTask("default", [
    "clean:dist",
    "mkdir",
    "responsive_images",
    "copy",
    "uglify",
    "cssmin",
    "clean:tidy"
  ]);
};
