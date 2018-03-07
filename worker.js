/**
 * @license
 * Copyright 2017 Google Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
importScripts('https://cdnjs.cloudflare.com/ajax/libs/d3/4.13.0/d3.min.js');
var readFiles = function (files,whendone) {
    var count = files.length;
    var datasetsList = [];
    var readFile = function (file) {
        var reader = new FileReaderSync();
        var result=reader.readAsBinaryString(file);
        var parsedData = d3.csvParse(result);
            parsedData.forEach(function (row) {
                parsedData.columns.forEach(function (column) {
                    if (!row[column]) {
                        delete row[column];
                    }
                    var coercedNum = +row[column];
                    if (!isNaN(coercedNum)) {
                        row[column] = coercedNum;
                    }
                });
            });
            datasetsList.push({ data: parsedData, name: file.name });
            if (!--count) {
                whendone(datasetsList);
            }
        
    };

    for (var i = 0; i < count; i++) {
        readFile(files[i]);
    }
}
self.addEventListener('message', function (e) {
    var files = e.data;
    readFiles(files, function (datasetsList) { // done
        postMessage(datasetsList);
    });
}, false);