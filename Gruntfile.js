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
            cwd: "img_src/",
            dest: "img/"
          }
        ]
      }
    },
    clean: {
      dev: {
        src: ["img"]
      }
    },
    mkdir: {
      dev: {
        options: {
          create: ["img"]
        }
      }
    }
  });

  grunt.loadNpmTasks("grunt-responsive-images");
  grunt.loadNpmTasks("grunt-contrib-clean");
  grunt.loadNpmTasks("grunt-contrib-copy");
  grunt.loadNpmTasks("grunt-mkdir");
  grunt.registerTask("default", ["clean", "mkdir", "responsive_images"]);
};
