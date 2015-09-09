/*global module:false*/
module.exports = function(grunt) {

    // Project configuration.
    grunt.initConfig({
        // Metadata.
        pkg: grunt.file.readJSON('package.json'),
        banner: '/*! <%= pkg.title || pkg.name %> - v<%= pkg.version %> - ' +
            '<%= grunt.template.today("yyyy-mm-dd") %>\n' +
            '<%= pkg.homepage ? "* " + pkg.homepage + "\\n" : "" %>' +
            '* Copyright (c) <%= grunt.template.today("yyyy") %> <%= pkg.author.name %>;' +
            ' Licensed <%= _.pluck(pkg.licenses, "type").join(", ") %> */\n',


        // Task configuration.
        concat: {
            options: {
                banner: '<%= banner %>',
                stripBanners: false
            },
            dist: {
                // the files to concatenate
                src: ['src/js/eswebservices.js', 'src/js/esanalytics.js', 'src/js/esenvironment.js', 'src/js/esfacebook.js', 'src/js/esinit.js', 'src/js/eslog.js', 'src/js/esWEBUI.js'],
                dest: 'dist/<%= pkg.name %>.js'
            }
        },
        uglify: {
            options: {
                banner: '<%= banner %>'
            },
            dist: {
                src: '<%= concat.dist.dest %>',
                dest: 'dist/<%= pkg.name %>.min.js'
            }
        },

        clean: {
            options: {
                force: true
            },
            build: ["dist", "example/lib/eswebapi/dist"],
            docs: ['docs'],
            pub_docs: ['../../docs_eswebapi/eswebapi/css/',
                '../../docs_eswebapi/eswebapi/font/',
                '../../docs_eswebapi/eswebapi/grunt-scripts/',
                '../../docs_eswebapi/eswebapi/grunt-styles/',
                '../../docs_eswebapi/eswebapi/js/',
                '../../docs_eswebapi/eswebapi/partials/',
                '../../docs_eswebapi/eswebapi/index.html'
            ]
        },

        jshint: {
            options: {
                curly: true,
                eqeqeq: true,
                immed: true,
                latedef: true,
                newcap: true,
                noarg: true,
                sub: true,
                undef: true,
                unused: true,
                boss: true,
                eqnull: true,
                globals: {
                    jQuery: true
                }
            },
            gruntfile: {
                src: 'Gruntfile.js'
            },
            lib_test: {
                src: ['lib/**/*.js', 'test/**/*.js']
            }
        },
        nodeunit: {
            files: ['test/**/*_test.js']
        },

        filerev: {
            options: {
                algorithm: 'md5',
                length: 8
            },
            scripts: {
                src: '<%= uglify.dist.dest %>',
                dest: 'dist'
            },
            templates: {
                src: 'dist/scripts/app.templates.js',
                dest: 'dist/scripts/'
            },
            css: {
                src: 'dist/styles/app.min.css',
                dest: 'dist/styles'
            }
        },

        /**
         * compile templates into one single static file
         */
        ngtemplates: {
            app: {
                src: ['src/partials/**.html'],
                dest: 'dist/<%= pkg.name %>.templates.js',
                options: {
                    module: 'es.Web.UI',
                    htmlmin: {
                        collapseBooleanAttributes: true,
                        collapseWhitespace: true,
                        removeAttributeQuotes: true,
                        removeComments: true, // Only if you don't use comment directives! 
                        removeEmptyAttributes: true,
                        removeRedundantAttributes: true,
                        removeScriptTypeAttributes: true,
                        removeStyleLinkTypeAttributes: true
                    }
                }
            }
        },

        copy: {
            sourcefiles: {
                files: [
                    // includes files within path and its sub-directories
                    {
                        expand: true,
                        src: ['dist/**'],
                        dest: 'example/lib/eswebapi/'
                    },
                ],
            },
            pub_docs: {
                files: [
                    // includes files within path and its sub-directories
                    {
                        cwd: 'docs/',
                        expand: true,
                        src: ['**'],
                        dest: '../../docs_eswebapi/eswebapi/'
                    },
                    {
                        cwd: 'src/assets',
                        expand: true,
                        src: ['*.ico'],
                        dest: '../../docs_eswebapi/eswebapi/'  
                    }
                ],
            }
        },

        connect: {
            options: {
                keepalive: true
            },
            server: {}
        },

        ngdocs: {
            options: {
                dest: 'docs',
                html5Mode: false,
                scripts: [
                    'bower_components/angular/angular.min.js',
                    'bower_components/angular-animate/angular-animate.min.js'
                ],
                title: "Entersoft AngularJS Web API Documentation",
                image: "src/assets/logo.png",
                imageLink: "http://www.entersoft.eu",
                analytics: {
                    account: 'UA-50505865-6'
                }
            },
            api: {
                src: ['src/js/*.js'],
                title: 'Entersoft WEB API documentation'
            }
        },

        prompt: {
            github: {
                options: {
                    questions: [{
                        config: 'github_userid',
                        type: 'input',
                        message: 'Github UserID',
                        validate: function(value) {
                            if (!value) {
                                return 'Should not be blank';
                            }
                            return true;
                        }
                    }, {
                        config: 'github_password',
                        type: 'password',
                        message: 'Github Password',
                        validate: function(value) {
                            if (!value) {
                                return 'Should not be blank';
                            }
                            return true;
                        }
                    }]
                }
            }
        },

        shell: {
            sourcefiles: {
                command: "git add .&&git commit -m 'auto'&&git push https://<%= github_userid %>:<%= github_password %>@github.com/entersoftsa/eswebapi.git master"
            },
            pub_docs: {
                command: "git add .&&git commit -m 'auto'&&git push https://<%= github_userid %>:<%= github_password %>@github.com/entersoftsa/eswebapi.git gh-pages",
                options: {
                    execOptions: {
                        cwd: '../../docs_eswebapi/eswebapi/'
                    }
                }
            }
        },

        watch: {
            gruntfile: {
                files: '<%= jshint.gruntfile.src %>',
                tasks: ['jshint:gruntfile']
            },
            lib_test: {
                files: '<%= jshint.lib_test.src %>',
                tasks: ['jshint:lib_test', 'nodeunit']
            }
        }
    });

    // These plugins provide necessary tasks.
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-angular-templates');
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-filerev');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-nodeunit');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-ngdocs');
    grunt.loadNpmTasks('grunt-shell');
    grunt.loadNpmTasks('grunt-prompt');

    //Step 1 task
    grunt.registerTask('fulldeploy', [
        /* compile and prepare source files */
        'clean:build',
        'concat',
        'uglify',
        'filerev:scripts',
        'ngtemplates',
        'copy:sourcefiles',

        /* compile documentation */
        'clean:docs',
        'clean:pub_docs',
        'ngdocs',
        'copy:pub_docs',

        /* prepare for github push*/
        'prompt:github',

        /* push to gihub both documentation and source files */
        'shell:pub_docs',
        'shell:sourcefiles'
    ]);

    // doc
    grunt.registerTask('0doc', ['clean:docs', 'clean:pub_docs', 'ngdocs']);

    // publish doc
    grunt.registerTask('publishdoc', ['clean:docs', 'clean:pub_docs', 'ngdocs', 'copy:pub_docs', 'prompt:github', 'shell:pub_docs']);

};
