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
import Histogram from 'goog:proto.featureStatistics.Histogram';
import RankHistogram from 'goog:proto.featureStatistics.RankHistogram';

import {OverviewDataModel} from '../../common/overview_data_model';
import * as utils from '../../common/utils';

Polymer({
  is: 'facets-overview-chart',

  properties: {
    data: {type: Object, observer: '_updateData'},
    dataModel: Object,
    feature: String,
    _maxBucketsForBarChart: {type: Number, value: 10, readOnly: true},
    _chartAlpha: {
      type: Number,
      value: 1  // Initially charts are opaque.
    },
    logScale: Boolean,
    showWeighted: Boolean,
    showPercentage: Boolean,
    chartSelection: {type: Number, observer: '_updateChartSelection'},
    // Clicking on a slice/point on a chart causes that piece of that feature to
    // be "selected". The selection is outlined and also is provided a property
    // to the client. In this way, the selection can be used to drive other
    // logic/visualization. This object is a FeatureSelection object.
    selection:
        {type: Object, observer: '_updateSelectionVisibility', notify: true},
    expandChart: Boolean,
    _selectionElem: Object,
    _minBarHeightRatio: {type: Number, value: 0.01, readOnly: true},
    _onClick: Object,
    _onClickFunction: Object,
    _onPointer: Object,
    _onPointerEnterFunction: Object,
    _onPointerExitFunction: Object,
    _tableData: Array,
    _showTable: {type: Boolean, value: false},
    _chartType: Object,
    _chartClass: {type: String, computed: '_getChartClass(_showTable)'},
    _chartSvgClass: {type: String, computed: '_getChartSvgClass(expandChart)'},
    _xAxisSvgClass: {type: String, computed: '_getXAxisSvgClass(expandChart)'},
    _tableDataClass:
        {type: String, computed: '_getTableDataClass(expandChart)'},
  },

  observers:
      ['_render(data, logScale, showWeighted, chartSelection, _showTable, ' +
       'expandChart, showPercentage, dataModel)'],
  // tslint:disable-next-line:no-any typescript/polymer temporary issue
  _updateData(this: any, chartData: utils.HistogramForDataset[]) {
    // Reset settings on new data.
    this._showTable = false;
  },
  // tslint:disable-next-line:no-any typescript/polymer temporary issue
  _updateChartSelection(this: any, chartSelection: string) {
    this._showTable = false;
  },
  _hasWeightedHistogram(chartData: utils.HistogramForDataset[]) {
    return utils.hasWeightedHistogram(chartData);
  },
  _hasQuantiles(chartData: utils.HistogramForDataset[]) {
    return utils.hasQuantiles(chartData);
  },
  _isStringChart(chartType: utils.ChartType, chartSelection: string) {
    return (chartType === utils.ChartType.CUMDIST_CHART ||
            chartType === utils.ChartType.BAR_CHART) &&
        (chartSelection !== utils.CHART_SELECTION_LIST_QUANTILES &&
         chartSelection !==
             utils.CHART_SELECTION_FEATURE_LIST_LENGTH_QUANTILES);
  },
  _disableLogCheckbox(showTable: boolean, chartSelection: string) {
    return showTable || chartSelection !== utils.CHART_SELECTION_STANDARD;
  },
  _render(
      this: any, chartData: utils.HistogramForDataset[], logScale: boolean,
      showWeighted: boolean, chartSelection: string, showData: boolean,
      expandChart: boolean, showPercentage: boolean,
      dataModel: OverviewDataModel) {
    // Remove all previously-set pointers to avoid issues with Plottable's
    // global interaction sets when these components are reused by the iron-list
    // of the table.
    if (this._onPointer) {
      this._onPointer.offPointerMove(this._onPointerEnterFunction);
      this._onPointer.offPointerMove(this._onPointerExitFunction);
    }
    if (this._onClick) {
      this._onClick.offClick(this._onClickFunction);
    }
    if (!chartData) {
      return;
    }

    this._chartAlpha = dataModel.getChartAlpha();

    // Create the appopriate chart for the provided data.
    const chartBuckets =
        chartData.map(d => this._getBuckets(d, showWeighted, chartSelection));
    this._chartType =
        utils.determineChartTypeForData(chartData, chartSelection,
        this._maxBucketsForBarChart);
    const names = chartData.map(d => d.name);
    if (chartSelection === utils.CHART_SELECTION_LIST_QUANTILES ||
        chartSelection ===
            utils.CHART_SELECTION_FEATURE_LIST_LENGTH_QUANTILES ||
        chartSelection === utils.CHART_SELECTION_QUANTILES) {
      this._renderQuantileChart(chartBuckets, names, logScale);
    } else {
      if (this._chartType === utils.ChartType.HISTOGRAM) {
        this._renderHistogramChart(
            chartBuckets, names, logScale, showPercentage);
      } else if (this._chartType === utils.ChartType.CUMDIST_CHART) {
        this._renderCdfChart(chartBuckets, names, logScale);
      } else {
        this._renderBarChart(chartBuckets, names, logScale, showPercentage);
      }
    }
  },
  _renderHistogramChart(
      // tslint:disable-next-line:no-any typescript/polymer temporary issue
      this: any, chartData: utils.GenericHistogramBucket[][], names: string[],
      logScale: boolean, showPercentage: boolean) {
    // Create the histogram rectangles for each bucket of each dataset.
    // Also calculate the average width of buckets as a sanity width for buckets
    // that terminate at an infinite value.
    const widths: number[] = [];
    const bars = new Plottable.Plots.Rectangle();
    let min = Infinity;
    let max = -Infinity;
    let maxCount = 0;
    if (showPercentage) {
      chartData = utils.convertToPercentage(chartData);
    }
    chartData.forEach((buckets, i) => {
      buckets.forEach((genericBucket: utils.GenericHistogramBucket) => {
        const b = genericBucket as Histogram.Bucket;
        const low = utils.getNumberFromField(b.getLowValue());
        const high = utils.getNumberFromField(b.getHighValue());
        const count = utils.getNumberFromField(b.getSampleCount());
        if (low < min) {
          min = low;
        }
        if (high > max) {
          max = high;
        }
        if (count > maxCount) {
          maxCount = count;
        }
        if (isFinite(low) && isFinite(high)) {
          widths.push(high - low);
        }
      });
      bars.addDataset(new Plottable.Dataset(buckets, {name: names[i]}));
    });
    let avgWidth = widths.length > 0 ?
        widths.reduce(function(a, b) { return a + b; }) / widths.length : 0;
    // If average width is 0 (there is only a single value), then use 1 as
    // the default width so that the bucket has visual appearance.
    if (avgWidth === 0) {
      avgWidth = 1;
    }

    // If the min is finite, set the min value of the domain for the x axis
    // scale.
    const xDomain: number[] = [];
    if (isFinite(min)) {
      xDomain.push(min);
      // If the max is also finite, set the max value of the domain.
      if (isFinite(max)) {
        xDomain.push(max);
      }
    }
    const xScale = new Plottable.Scales.Linear();
    if (xDomain.length > 0) {
      xScale.domain(xDomain);
    }
    const yScale = this._getScale(logScale).domain([0]);
    const xAxis = new Plottable.Axes.Numeric(xScale, 'bottom');
    const yAxis = new Plottable.Axes.Numeric(yScale, 'left');
    yAxis.formatter(this._chartAxisScaleFormatter());
    xAxis.formatter(this._chartAxisScaleFormatter());

    // Set the rectangle boundaries based on the bucket values. If the bucket
    // ends in infinity or has zero width, then use the average bucket width.
    // tslint:disable-next-line:no-any plottable typings issue
    (bars as any).x((d: Histogram.Bucket) => {
        let x = utils.getNumberFromField(d.getLowValue());
        if (x === -Infinity || x === d.getHighValue()) {
          const value = utils.getNumberFromField(d.getHighValue());
          if (!isFinite(value)) {
            // A bucket with only -Infinity values should be situated below 0.
            x = 0;
            if (value === -Infinity) {
              x -= avgWidth;
            }
          } else {
            x = value - avgWidth;
          }
        }
        return x;
      }, xScale)
      .x2((d: Histogram.Bucket) => {
        let x = utils.getNumberFromField(d.getHighValue());
        if (x === Infinity || x === d.getLowValue()) {
          const value = utils.getNumberFromField(d.getLowValue());
          if (!isFinite(value)) {
            // A bucket with only Infinity values should be situated above 0.
            x = 0;
            if (value === Infinity) {
              x += avgWidth;
            }
          } else {
            x = value + avgWidth;
          }
        }
        return x;
      })
      .y(() => 0, yScale)
      .y2((d: Histogram.Bucket) =>
          this._getCountWithFloor(d, maxCount, logScale));

    // Set the rectangle attributes.
    bars.attr(
            'fill',
            (d: {}, i: number, dataset: Plottable.Dataset) =>
                dataset.metadata().name,
            this.dataModel.getColorScale())
        .attr('opacity', this._chartAlpha);

    this._renderChart(
        bars, xAxis, yAxis, null, null,
        (p: Plottable.Point) => bars.entitiesAt(p),
        (datum: any) =>
            utils
                .roundToPlaces(utils.getNumberFromField(datum.getLowValue()), 2)
                .toLocaleString() +
            '-' +
            utils
                .roundToPlaces(
                    utils.getNumberFromField(datum.getHighValue()), 2)
                .toLocaleString() +
            ': ' +
            utils.getNumberFromField(datum.getSampleCount()).toLocaleString(),
        (datum: Histogram.Bucket) => new utils.FeatureSelection(
            this.feature, undefined,
            utils.getNumberFromField(datum.getLowValue()),
            utils.getNumberFromField(datum.getHighValue())),
        (foreground: d3.Selection<HTMLElement, {}, null, undefined>) =>
            foreground.append('rect')
                .attr('stroke', 'black')
                .attr('fill', 'none')
                .attr('stroke-width', '1px'),
        (elem: d3.Selection<HTMLElement, {}, null, undefined>,
         entity: Plottable.IEntity<any>) =>
            elem.attr(
                    'x',
                    entity.position.x -
                        (entity.selection as any)
                                ._groups[0][0]
                                .width.baseVal.value /
                            2)
                .attr(
                    'y',
                    entity.position.y -
                        (entity.selection as any)
                                ._groups[0][0]
                                .height.baseVal.value /
                            2)
                .attr(
                    'width',
                    (entity.selection as any)._groups[0][0].width.baseVal.value)
                .attr(
                    'height',
                    (entity.selection as any)
                        ._groups[0][0]
                        .height.baseVal.value));
  },
  _renderQuantileChart(
      // tslint:disable-next-line:no-any typescript/polymer temporary issue
      this: any, chartData: utils.GenericHistogramBucket[][], names: string[],
      logScale: boolean) {
    const line = new Plottable.Plots.Line();
    const points = new Plottable.Plots.Scatter();
    let min = Infinity;
    let max = -Infinity;
    chartData.forEach((buckets, datasetIndex) => {
      const quantiles: utils.QuantileInfo[] = [];
      const numQuantiles = buckets.length;
      buckets.forEach(
          (genericBucket: utils.GenericHistogramBucket,
           quantileIndex: number) => {
            const b = genericBucket as Histogram.Bucket;
            const low = utils.getNumberFromField(b.getLowValue());
            const high = utils.getNumberFromField(b.getHighValue());
            if (low < min) {
              min = low;
            }
            if (high > max) {
              max = high;
            }
            const quantile = new utils.QuantileInfo();
            quantile.bucket = b;
            quantile.datasetIndex = datasetIndex;
            quantile.quantile = quantileIndex * 100 / numQuantiles;
            quantiles.push(quantile);
          });
      // Add a final bucket to represent the 100% quantile point.
      if (buckets.length > 0) {
        const lastBucket = new Histogram.Bucket();
        lastBucket.setLowValue(
            (buckets[buckets.length - 1] as Histogram.Bucket).getHighValue());
        lastBucket.setHighValue(
            (buckets[buckets.length - 1] as Histogram.Bucket).getHighValue());
        lastBucket.setSampleCount(buckets[buckets.length - 1].getSampleCount());
        const lastQuantile = new utils.QuantileInfo();
        lastQuantile.bucket = lastBucket;
        lastQuantile.datasetIndex = datasetIndex;
        lastQuantile.quantile = 100;
        quantiles.push(lastQuantile);
      }
      line.addDataset(
          new Plottable.Dataset(quantiles, {name: names[datasetIndex]}));
      points.addDataset(
          new Plottable.Dataset(quantiles, {name: names[datasetIndex]}));
    });

    // If the min is finite, set the min value of the domain for the x axis
    // scale. Add padding around the min and max domain to frame the
    // chart well.
    const xDomainPadding = (isFinite(min) && isFinite(max)) ?
        ((max === min) ? 1 : (max - min) / 10) :
        0;
    const xDomain: number[] = [];
    if (isFinite(min)) {
      xDomain.push(min - xDomainPadding);
      // If the max is also finite, set the max value of the domain.
      if (isFinite(max)) {
        xDomain.push(max + xDomainPadding);
      }
    }
    const xScale = this._getScale(logScale);
    if (xDomain.length > 0) {
      xScale.domain(xDomain);
    }
    // Set the yScale to be able to show all quantile lines with padding above
    // and below (hence the extended domain). Pass false to _getScale as we
    // never want a log y-axis scale with quantiles as the y axis is just used
    // to evenly space the lines. The log checkbox is greyed out when quantile
    // mode is enabled. Pass false to _getScale as we
    // never want a log y-axis scale with quantiles as the y axis is just used
    // to evenly space the lines. The log checkbox is greyed out when quantile
    // mode is enabled.
    const yScale = this._getScale(false).domain([-chartData.length + .5, 1]);
    const xAxis = new Plottable.Axes.Numeric(xScale, 'bottom');
    xAxis.formatter(this._chartAxisScaleFormatter());

    line.x((d: utils.QuantileInfo) => utils.getNumberFromField(
                                        d.bucket.getLowValue()), xScale)
      .y((d: utils.QuantileInfo) => -1 * d.datasetIndex, yScale);
    points.x((d: utils.QuantileInfo) => utils.getNumberFromField(
                                          d.bucket.getLowValue()), xScale)
      .y((d: utils.QuantileInfo) => -d.datasetIndex, yScale)
      // Use a larger mark for the 50% marker.
      .size((d: utils.QuantileInfo) => d.quantile === 50 ? 15 : 8)
      .symbol((d: utils.QuantileInfo) => Plottable.SymbolFactories.cross());

    // Set the point and line attributes.
    line.attr('stroke', 'gray')
        .attr('opacity', this._chartAlpha);
    points
        .attr(
            'fill',
            (d: {}, i: number, dataset: Plottable.Dataset) =>
                dataset.metadata().name,
            this.dataModel.getColorScale())
        .attr('opacity', this._chartAlpha);

    const plots = new Plottable.Components.Group([line, points]);

    this._renderChart(
        plots, xAxis, null, null, null,
        (p: Plottable.Point) => points.entitiesAt(p),
        (datum: utils.QuantileInfo) => datum.quantile + '%: ' +
            utils
                .roundToPlaces(
                    utils.getNumberFromField(datum.bucket.getLowValue()), 2)
                .toLocaleString(),
        (datum: utils.QuantileInfo) => new utils.FeatureSelection(
            this.feature, undefined,
            utils.getNumberFromField(datum.bucket.getLowValue()),
            utils.getNumberFromField(datum.bucket.getHighValue())),
        (foreground: d3.Selection<HTMLElement, {}, null, undefined>) =>
            foreground.append('circle')
                .attr('r', 3)
                .attr('stroke', 'black')
                .attr('fill', 'none')
                .attr('stroke-width', '1px'),
        (elem: d3.Selection<HTMLElement, {}, null, undefined>,
         entity: Plottable.IEntity<any>) =>
            elem.attr('cx', entity.position.x).attr('cy', entity.position.y));
  },
  _renderBarChart(
      // tslint:disable-next-line:no-any typescript/polymer temporary issue
      this: any, chartData: utils.GenericHistogramBucket[][], names: string[],
      logScale: boolean, showPercentage: boolean) {
    // Create a list of all labels across all datasets for use on the X-axis.
    const allLabels = utils.getAllLabels(chartData);

    const xScale = new Plottable.Scales.Linear();
    const xScaleCat = new Plottable.Scales.Category();
    const yScale = this._getScale(logScale);
    xScaleCat.domain(allLabels);
    const xAxis = new Plottable.Axes.Category(xScaleCat, 'bottom');
    const yAxis = new Plottable.Axes.Numeric(yScale, 'left');
    yAxis.formatter(this._chartAxisScaleFormatter());

    if (showPercentage) {
      chartData = utils.convertToPercentage(chartData);
    }
    let maxCount = 0;
    const chartDataBuckets = chartData.map((buckets, datasetIndex) => {
      buckets.forEach((genericBucket: utils.GenericHistogramBucket) => {
        const b = genericBucket as Histogram.Bucket;
        const count = utils.getNumberFromField(b.getSampleCount());
        if (count > maxCount) {
          maxCount = count;
        }
      });
      const ret = new utils.BucketsForDataset();
      ret.name = names[datasetIndex];
      ret.rawBuckets = buckets as RankHistogram.Bucket[];
      return ret;
    });
    this._tableData = utils.getValueAndCountsArrayWithLabels(
      chartDataBuckets, allLabels);

    // Create the bars for each bucket of each dataset.
    const bars = new Plottable.Plots.Bar();
    chartData.forEach(
        (buckets, datasetIndex) => bars.addDataset(
            new Plottable.Dataset(buckets, {name: names[datasetIndex]})));

    // Set the x-position and height of each bar based on its label and count.
    bars.x((d: RankHistogram.Bucket) =>
           allLabels.indexOf(utils.getPrintableLabel(d.getLabel())), xScale)
        .y((d: RankHistogram.Bucket) =>
           this._getCountWithFloor(d, maxCount, logScale), yScale);

    // Set the bar attributes.
    bars.attr(
            'fill', (d, i, dataset) => dataset.metadata().name,
            this.dataModel.getColorScale())
        .attr('opacity', this._chartAlpha);

    this._renderChart(
        bars, xAxis, yAxis, null, null,
        (p: Plottable.Point) => bars.entitiesAt(p),
        (datum: RankHistogram.Bucket) =>
            utils.getPrintableLabel(datum.getLabel()) + ': ' +
            utils.getNumberFromField(datum.getSampleCount()).toLocaleString(),
        (datum: RankHistogram.Bucket) =>
            new utils.FeatureSelection(this.feature, datum.getLabel()),
        (foreground: d3.Selection<HTMLElement, {}, null, undefined>) =>
            foreground.append('rect')
                .attr('stroke', 'black')
                .attr('fill', 'none')
                .attr('stroke-width', '1px'),
        (elem: d3.Selection<HTMLElement, {}, null, undefined>,
         entity: Plottable.IEntity<any>) =>
            elem.attr(
                    'x',
                    entity.position.x -
                        (entity.selection as any)
                                ._groups[0][0]
                                .width.baseVal.value /
                            2)
                .attr('y', entity.position.y)
                .attr(
                    'width',
                    (entity.selection as any)._groups[0][0].width.baseVal.value)
                .attr(
                    'height',
                    (entity.selection as any)
                        ._groups[0][0]
                        .height.baseVal.value));
  },
  _renderCdfChart(
      // tslint:disable-next-line:no-any typescript/polymer temporary issue
      this: any, chartData: utils.GenericHistogramBucket[][], names: string[],
      logScale: boolean) {
    // Determine the total count of non-missing values for each dataset.
    const totals = names.map(name => {
      const commonStats =
          this.dataModel.getFeatureCommonStats(this.feature, name);
      if (commonStats != null) {
        return commonStats.getNumNonMissing() * commonStats.getAvgNumValues();
      } else {
        return 0;
      }
    });
    // Create a list of all elements across all datasets for use on the X-axis.
    // Also create a dictionary of all labels to their index, for quick lookup
    // during CDF data generation.
    const allLabels = utils.getAllLabels(chartData);
    const labelDict: {[label: string]: number} = {};
    allLabels.forEach((val, index) => {
      labelDict[val] = index;
    });

    const xScale = new Plottable.Scales.Linear().domain([0]);
    const yScale = this._getScale(logScale).domain([0]);
    const xAxis = new Plottable.Axes.Numeric(xScale, 'bottom');
    const yAxis = new Plottable.Axes.Numeric(yScale, 'left');

    // Create a line for each dataset, where the Y values are the cumulative
    // distribution ratios for each bucket.
    const lines = new Plottable.Plots.Line();
    // TODO(jwexler): Move to utils
    const chartDataPercs =
        chartData.map((buckets: utils.GenericHistogramBucket[], i: number) => {
          // percBuckets will hold buckets that contain cumulative distribution
          // ratios for each bucket. rawBuckets will hold buckets that contain
          // the raw counts for each bucket.
          const percBuckets: utils.GenericHistogramBucket[] = [];
          const rawBuckets: utils.GenericHistogramBucket[] = [];
          const sortBuckets: utils.GenericHistogramBucket[] = [];
          let lastIndex = -1;
          buckets.forEach(
            (genericBucket: utils.GenericHistogramBucket, j: number) => {
              const inner = genericBucket as RankHistogram.Bucket;
              const percBucket = inner.cloneMessage() as RankHistogram.Bucket;
              sortBuckets.push(percBucket);
            });
          // No need to sort the first dataset as the X axis starts with all
          // elements in the first dataset in order of their appearance in its
          // rank histogram.
          if (i > 0) {
            sortBuckets.sort(
              (genericBucketA: utils.GenericHistogramBucket,
               genericBucketB: utils.GenericHistogramBucket) => {
                const a = genericBucketA as RankHistogram.Bucket;
                const b = genericBucketB as RankHistogram.Bucket;
                return labelDict[utils.getPrintableLabel(a.getLabel())] -
                    labelDict[utils.getPrintableLabel(b.getLabel())];
              });
          }
          sortBuckets.forEach(
              (genericBucket: utils.GenericHistogramBucket, j: number) => {
                const percBucket = genericBucket as RankHistogram.Bucket;
                const indexOfBucketLabel =
                    labelDict[utils.getPrintableLabel(percBucket.getLabel())];
                // If the next element on the X axis is not in this dataset,
                // then add empty entries for each element in the complete
                // union of all datasets that are missing from this dataset.
                for (let i = lastIndex + 1; i < indexOfBucketLabel; i++) {
                  const emptyPercBucket = new RankHistogram.Bucket();
                  emptyPercBucket.setLabel(allLabels[i]);
                  emptyPercBucket.setLowRank(i);
                  emptyPercBucket.setHighRank(i);
                  if (percBuckets.length === 0) {
                    emptyPercBucket.setSampleCount(0);
                  } else {
                    emptyPercBucket.setSampleCount(
                      percBuckets[percBuckets.length - 1].getSampleCount());
                  }
                  percBuckets.push(emptyPercBucket);
                  const emptyRawBucket = new RankHistogram.Bucket();
                  emptyRawBucket.setLabel(allLabels[i]);
                  emptyRawBucket.setLowRank(i);
                  emptyRawBucket.setHighRank(i);
                  emptyRawBucket.setSampleCount(0);
                  rawBuckets.push(emptyRawBucket);
                }

                lastIndex = indexOfBucketLabel;
                const rawBucket = percBucket.clone();
                rawBuckets.push(rawBucket);

                if (j === 0) {
                  percBucket.setSampleCount(
                    utils.getNumberFromField(
                      percBucket.getSampleCount()) / totals[i]);
                } else {
                  const indexOfPrev =
                      indexOfBucketLabel > 0 ? indexOfBucketLabel - 1 : j - 1;
                  percBucket.setSampleCount(
                      (utils.getNumberFromField(
                        percBucket.getSampleCount()) / totals[i]) +
                      utils.getNumberFromField(
                        percBuckets[indexOfPrev].getSampleCount()));
                }
                percBucket.setLowRank(indexOfBucketLabel);
                percBucket.setHighRank(indexOfBucketLabel);
                percBuckets.push(percBucket);
              });
          const ret = new utils.BucketsForDataset();
          ret.name = names[i];
          ret.percBuckets = percBuckets as RankHistogram.Bucket[];
          ret.rawBuckets = rawBuckets as RankHistogram.Bucket[];
          return ret;
        });
    this._tableData = utils.getValueAndCountsArray(chartDataPercs);
    for (const d of chartDataPercs) {
      lines.addDataset(new Plottable.Dataset(d.percBuckets, {name: d.name}));
    }

    // Set the X and Y coordinates of each point in the line based on the
    // ratios calculated above and set the line color.
    lines.x((d: RankHistogram.Bucket) =>
            utils.getNumberFromField(d.getLowRank()), xScale)
        .y((d: RankHistogram.Bucket) =>
           utils.getNumberFromField(d.getSampleCount()), yScale);
    lines
        .attr(
            'stroke', (d, i, dataset) => dataset.metadata().name,
            this.dataModel.getColorScale())
        .attr('opacity', this._chartAlpha);

    this._renderChart(
        lines, xAxis, yAxis, null, null,
        (p: Plottable.Point) => lines.entitiesAt(p),
        (datum: RankHistogram.Bucket) =>
            utils.getPrintableLabel(datum.getLabel()) + ': ' +
            utils
                .roundToPlaces(
                    utils.getNumberFromField(datum.getSampleCount()), 4)
                .toLocaleString(),
        (datum: RankHistogram.Bucket) =>
            new utils.FeatureSelection(this.feature, datum.getLabel()),
        (foreground: d3.Selection<HTMLElement, {}, null, undefined>) =>
            foreground.append('circle')
                .attr('r', 3)
                .attr('stroke', 'black')
                .attr('fill', 'none')
                .attr('stroke-width', '1px'),
        (elem: d3.Selection<HTMLElement, {}, null, undefined>,
         entity: Plottable.IEntity<any>) =>
            elem.attr('cx', entity.position.x).attr('cy', entity.position.y));
  },
  _renderChart<T>(
      // tslint:disable-next-line:no-any typescript/polymer temporary issue
      this: any, plot: Plottable.Plot, xAxis: Plottable.Axis<T>,
      yAxis: Plottable.Axis<T>, xLabel: Plottable.Components.AxisLabel,
      yLabel: Plottable.Components.AxisLabel,
      getEntities: (point: Plottable.Point) => Plottable.Plots.IPlotEntity[],
      tooltipCallback: (datum: any) => string,
      selectionCallback: (datum: any) => utils.FeatureSelection,
      selectionCreator:
          (foreground: d3.Selection<HTMLElement, {}, null, undefined>) => {},
      selectionPositioner: (
          elem: d3.Selection<HTMLElement, {}, null, undefined>,
          entity: Plottable.IEntity<any>) => null) {
    if (this._showTable) {
      return;
    }

    // Create separate Plottable tables, with the chart and Y axis in one table
    // and the X axis in another table so they can be rendered to separate
    // SVGs with separate bounding boxes. This allows the chart to have a
    // constant size regardless of the size needed for the X axis strings.
    const nullComp: Plottable.Component|null = null;
    const chartTable = new Plottable.Components.Table(
        [[yLabel, yAxis, plot], [nullComp!, nullComp!, nullComp!]]);
    const xAxisTable = new Plottable.Components.Table(
        [[nullComp!, nullComp!], [nullComp!, xAxis]]);

    // Render the chart. Use immediate rendering mode so that the chart can be
    // rendered first and the width of the X axis component used to position
    // the Y axis component.
    Plottable.RenderController.renderPolicy(
        Plottable.RenderController.Policy.immediate);
    const chartSelection: d3.Selection<HTMLElement, {}, null, undefined> =
        d3.select(this.$.chart);
    const axisSelection: d3.Selection<HTMLElement, {}, null, undefined> =
        d3.select(this.$.xaxis);
    const tooltip: d3.Selection<HTMLElement, {}, null, undefined> =
        d3.select(this.$.tooltip);
    this.async(() => {
      // Remove the chart component but not anything else as this would disable
      // tooltips by removing the mouse dispatcher's measure rect.
      chartSelection.selectAll('.component').remove();
      axisSelection.selectAll('.component').remove();
      chartTable.renderTo(this.$.chart);

      this._selectionElem = selectionCreator(
          plot.foreground() as d3.Selection<HTMLElement, {}, null, undefined>);
      this._updateSelectionVisibility(this.selection);

      chartSelection
          .on('mouseenter',
              () => {
                // Setup Interaction.Pointer for tooltip and attach to the plot.
                this._onPointer = new Plottable.Interactions.Pointer();
                this._onPointerEnterFunction = (p: any) => {
                  // For line charts, give a tooltip for the closest point on
                  // any line. For other charts, give a tooltip for all entries
                  // in any dataset that is overlapping with the datum nearest
                  // the pointer (for overlapping histograms for example).
                  const entities = getEntities(p);
                  if (entities.length > 0) {
                    const title =
                        entities
                            .map(entity => {
                              return (entity.dataset.metadata().name == null ||
                                      this.dataModel.getDatasetNames()
                                              .length === 1) ?
                                  tooltipCallback(entity.datum) :
                                  entity.dataset.metadata().name + ': ' +
                                      tooltipCallback(entity.datum);
                            })
                            .join('\n');
                    tooltip.text(title);
                    tooltip.style('opacity', '1');
                  }
                };
                this._onPointer.onPointerMove(this._onPointerEnterFunction);
                this._onPointerExitFunction = function(p: {}) {
                  tooltip.style('opacity', '0');
                };
                this._onPointer.onPointerExit(this._onPointerExitFunction);
                this._onPointer.attachTo(plot);
                if (this.chartSelection !==
                    utils.CHART_SELECTION_LIST_QUANTILES) {
                  this._onClick = new Plottable.Interactions.Click();
                  const self = this;
                  this._onClickFunction = (p: any) => {
                    const entities = getEntities(p);
                    if (entities.length > 0) {
                      selectionPositioner(self._selectionElem, entities[0]);
                      const selection: utils.FeatureSelection|null =
                          selectionCallback(entities[0].datum);
                      self._setSelection(selection);
                    }
                  };
                  this._onClick.onClick(this._onClickFunction);
                  this._onClick.attachTo(plot);
                }
              })
          .on('mouseleave', () => {
            this._onPointer.detachFrom(plot);
            this._onClick.detachFrom(plot);
          });

      // Add padding equal to the Y axis component to the X axis table to align
      // the axes.
      if (yAxis != null) {
        xAxisTable.columnPadding(chartTable.componentAt(0, 1).width() +
            (chartTable.componentAt(0, 0) ? chartTable.componentAt(0, 0).width() :
             0));
      }
      xAxisTable.renderTo(this.$.xaxis);
    });
  },
  // tslint:disable-next-line:no-any typescript/polymer temporary issue
  _setSelection(this: any, newSelection: utils.FeatureSelection) {
    if (newSelection.equals(this.selection)) {
      newSelection.clear();
    }
    this.selection = newSelection;
    this.fire('feature-select', {selection: newSelection});
  },
  _getBuckets(
      data: utils.HistogramForDataset, showWeighted: boolean,
      chartSelection: string): utils.GenericHistogramBucket[] {
    return utils.getBuckets(data, showWeighted, chartSelection);
  },
  _getScale(logScale: boolean) {
    return logScale ?
      new Plottable.Scales.ModifiedLog() :
      new Plottable.Scales.Linear();
  },
  _chartAxisScaleFormatter() {
    // Use a short scale formatter if the value is above 1000.
    const shortScaleFormatter = Plottable.Formatters.shortScale(0);
    return (num: number) => {
      if (Math.abs(num) < 1000) {
        return String(num);
      }
      return shortScaleFormatter(num);
    };
  },
  _getCountWithFloor(
      // tslint:disable-next-line:no-any typescript/polymer temporary issue
      this: any, bucket: utils.GenericHistogramBucket, maxCount: number,
      logScale: boolean) {
    // wouldn't be visible (this only happens in linear scale), then return
    // a count that would make the bucket barely visible in the chart.
    let count = utils.getNumberFromField(bucket.getSampleCount());
    if (!logScale && count > 0 && count / maxCount < this._minBarHeightRatio) {
      count = maxCount * this._minBarHeightRatio;
    }
    return count;
  },
  // tslint:disable-next-line:no-any typescript/polymer temporary issue
  _updateSelectionVisibility(this: any, selection: utils.FeatureSelection) {
    if (!this._selectionElem) {
      return;
    }
    this._selectionElem.style('display',
      selection == null || selection.name !== this.feature ? 'none' : 'inline');
  },
  // tslint:disable-next-line:no-any typescript/polymer temporary issue
  _toggleShowTable(this: any, e: any) {
    this._showTable = !this._showTable;
  },
  _getChartClass(showData: boolean) {
    return showData ? 'hidechart' : 'showchart';
  },
  _getShowTableButtonText(showData: boolean) {
    return showData ? 'show chart' : 'show raw data';
  },
  _getChartSvgClass(expandChart: boolean) {
    return expandChart ? 'chart-big' : 'chart-small';
  },
  _getXAxisSvgClass(expandChart: boolean) {
    return expandChart ? 'xaxis-big' : 'xaxis-small';
  },
  _getTableDataClass(expandChart: boolean) {
    return expandChart ? 'data-list-big' : 'data-list-small';
  },
  // tslint:disable-next-line:no-any typescript/polymer temporary issue
  _rowClick(this: any, e: any) {
    // Set the current selection to the value represented by the table row
    // that was clicked.
    const selection =
        new utils.FeatureSelection(this.feature, e.currentTarget.dataValue);
    this._setSelection(selection);
  },
  _getEntryRowValue(entry: utils.ValueAndCounts) {
    return entry.value;
  },
  _getEntryRowClass(
      // tslint:disable-next-line:no-any typescript/polymer temporary issue
      this: any, entry: utils.ValueAndCounts,
      selection: utils.FeatureSelection) {
    // Get the CSS class(es) for a row in the table view, dependent on if the
    // row represents the current user-selection or not.
    let str = "dialog-row";
    if (selection != null && selection.name === this.feature &&
        selection.stringValue === entry.value) {
      str += " selected";
    }
    return str;
  },
  _getCountCellClass(showWeighted: boolean) {
    return 'dailog-row-entry count-cell' +
      (showWeighted ? ' weighted-cell' : '');
  },
});
