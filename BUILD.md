## Building facets-overview compressed visualizations
```
npm install crisper terser polymer-bundler
```

```
bazel build facets:facets-overview_jupyter
```
```
cd bazel-bin/facets
crisper -s facets-overview-jupyter.html -h facets-overview-jupyter-split.html -j facets-js.js
terser --compress --comments -- facets-js.js > facets-js-terse.js
cp facets-js-terse.js facets-js.js
polymer-bundler --inline-scripts facets-overview-jupyter-split.html --out-file facets-overview-jupyter-split-bundled.html
gzip -c facets-overview-jupyter-split-bundled.html > facets-overview-jupyter-split-bundled.html.gz
```
