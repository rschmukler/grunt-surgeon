/*
 * grunt-surgeon
 * https://github.com/rschmukler/grunt-surgeon
 *
 * Copyright (c) 2013 Ryan Schmukler
 * Licensed under the MIT license.
 */

'use strict';

var request = require('superagent');


module.exports = function(grunt) {
  var read = grunt.file.read;

  // Please see the Grunt documentation for more information regarding task
  // creation: http://gruntjs.com/creating-tasks

  grunt.registerMultiTask('surgeon', 'Compile parts of files and insert them into a bigger file', function() {
    // Merge task-specific and/or target-specific options with these defaults.
    var options = this.data,
        spawned = false;

    if(!options.file) {
      spawned = true;
      options.file = grunt.option('file');
    }

    grunt.verbose.writeln("Running Surgeon on file: " + options.file);
    if(!this.target) {
      grunt.log.error('Invalid target specified');
      return false;
    }
    if(!options.outputFile) {
      grunt.log.error('No output file specified');
      return false;
    }
    if(!options.compileFunction) {
      grunt.log.error('No compile function specified');
      return false;
    }

    var includeText = "";
    if(options.includes && options.includes.length) {
      options.includes.forEach(function(file) {
        includeText += (read(file, {encoding: 'utf-8'}) + '\n');
      });
    }

    //Read the file and compile the new output
    var outContents = read(options.outputFile, {encoding: 'utf-8'}).split('\n');

    var newContents = options.compileFunction(options.file, includeText).split('\n');


    // Iterate over the file to find the surgeon signature
    var i, numLinesToRemove;

    var fingerprint = new RegExp('SurgeonFile: ' + options.file);

    for(i = 0; i < outContents.length; ++i) {
      if(fingerprint.test(outContents[i])) {
        grunt.verbose.writeln('Found surgeon fingerprint');
        var lineString = outContents[i].match(/numLines: (\d+)/)[1];
        numLinesToRemove = parseInt(lineString, 10);
        break;
      }
    }
    var spliceArgs = [i, numLinesToRemove].concat(newContents);
    outContents.splice.apply(outContents, spliceArgs);
    grunt.file.write(options.outputFile, outContents.join('\n'), {encoding: 'utf-8'});
    if(!spawned) {
      console.log("Sending file via livereload!");
      request.post('http://localhost:35729/changed').send({files: [options.file]}).end();
    }
  });
};
