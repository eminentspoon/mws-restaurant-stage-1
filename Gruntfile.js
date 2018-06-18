module.exports = function(grunt) {
  grunt.initConfig({
    responsive_images: {
      dev: {
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
      dev: {
        src: ["dist/img", "dist/img/static", "dist/js"]
      }
    },
    mkdir: {
      dev: {
        options: {
          create: ["dist/img", "dist/img/static", "dist/js"]
        }
      }
    },
    copy: {
      dev: {
        files: [
          {
            expand: true,
            src: ["*.{gif,jpg,png,webp}"],
            cwd: "src/img/static",
            dest: "dist/img/static"
          },
          {
            expand: true,
            src: ["*.{html,json}"],
            cwd: "src/",
            dest: "dist/"
          },
          {
            expand: true,
            flatten: true,
            src: ["idb.js"],
            cwd: "node_modules/idb/lib/",
            dest: "dist/js/"
          }
        ]
      }
    },
    uglify: {
      dev: {
        options: {},
        files: {
          "dist/sw.js": ["src/sw.js"],
          "dist/js/dbhelper.js": ["src/js/dbhelper.js"],
          "dist/js/main.js": ["src/js/main.js"],
          "dist/js/restaurant_info.js": ["src/js/restaurant_info.js"],
          "dist/js/swhelper.js": ["src/js/swhelper.js"]
        }
      }
    }
  });

  grunt.loadNpmTasks("grunt-responsive-images");
  grunt.loadNpmTasks("grunt-contrib-clean");
  grunt.loadNpmTasks("grunt-contrib-uglify-es");
  grunt.loadNpmTasks("grunt-contrib-copy");
  grunt.loadNpmTasks("grunt-mkdir");
  grunt.registerTask("default", [
    "clean",
    "mkdir",
    "responsive_images",
    "copy",
    "uglify"
  ]);
};
