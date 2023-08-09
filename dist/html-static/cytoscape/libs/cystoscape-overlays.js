/**
 * cytoscape-overlays
 * https://github.com/sgratzl/cytoscape.js-overlays
 *
 * Copyright (c) 2020-2022 Samuel Gratzl <sam@sgratzl.com>
 */

(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('cytoscape-layers')) :
    typeof define === 'function' && define.amd ? define(['exports', 'cytoscape-layers'], factory) :
    (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.CytoscapeOverlays = {}, global.CytoscapeLayers));
})(this, (function (exports, cytoscapeLayers) { 'use strict';

    function toFullVisualization(o) {
        const vis = typeof o === 'function' ? o : o.vis;
        return Object.assign({
            vis,
            height: vis.defaultHeight || 5,
            width: vis.defaultWidth || 5,
            position: vis.defaultPosition || 'bottom',
        }, typeof o === 'function' ? { vis: o } : o);
    }
    function pick(o, keys) {
        const r = {};
        for (const key of keys) {
            const v = o[key];
            if (v !== undefined) {
                r[key] = v;
            }
        }
        return r;
    }
    function stackVertical(pos) {
        return pos === 'top' || pos === 'bottom';
    }
    function overlays(definitions, options = {}) {
        const layer = options.layer || cytoscapeLayers.layers(this).nodeLayer.insertAfter('canvas', options);
        const overlayObjects = definitions.map(toFullVisualization);
        const someInit = overlayObjects.filter((d) => d.vis.init != null);
        const padding = options.padding == null ? 1 : options.padding;
        const positions = [
            'bottom-left',
            'bottom-right',
            'bottom',
            'left',
            'right',
            'top',
            'top-left',
            'top-right',
        ];
        const infos = positions
            .map((pos) => {
            const subset = overlayObjects.filter((d) => d.position === pos);
            const vertical = stackVertical(pos);
            return {
                pos,
                overlays: subset,
                total: subset.reduce((acc, overlay) => acc + (vertical ? overlay.height : overlay.width) + padding, -padding),
                maxOther: subset.reduce((acc, overlay) => Math.max(acc, vertical ? overlay.width : overlay.height), 0),
            };
        })
            .filter((d) => d.total > 0);
        const renderPerNodeOptions = Object.assign({
            position: 'top-left',
        }, someInit
            ? {
                initCollection: (nodes) => {
                    for (const o of overlayObjects) {
                        if (o.vis.init) {
                            o.vis.init(nodes);
                        }
                    }
                },
            }
            : {}, pick(options, ['boundingBox', 'checkBounds', 'queryEachTime', 'selector', 'updateOn']));
        function cleanArea(ctx, bb) {
            if (!options.backgroundColor) {
                return;
            }
            ctx.fillStyle = options.backgroundColor;
            for (const info of infos) {
                switch (info.pos) {
                    case 'bottom':
                        ctx.fillRect(0, bb.h, bb.w, info.total);
                        break;
                    case 'bottom-left':
                        ctx.fillRect(-info.overlays[0].width / 2, bb.h - info.maxOther / 2, info.total, info.maxOther);
                        break;
                    case 'bottom-right':
                        ctx.fillRect(bb.w - info.total - info.overlays[0].width / 2, bb.h - info.maxOther / 2, info.total, info.maxOther);
                        break;
                    case 'left':
                        ctx.fillRect(-info.total, 0, info.total, bb.h);
                        break;
                    case 'right':
                        ctx.fillRect(bb.w, 0, info.total, bb.h);
                        break;
                    case 'top':
                        ctx.fillRect(0, -info.total, bb.w, info.total);
                        break;
                    case 'top-left':
                        ctx.fillRect(-info.overlays[0].width / 2, -info.maxOther / 2, info.total, info.maxOther);
                        break;
                    case 'top-right':
                        ctx.fillRect(bb.w - info.total - info.overlays[0].width / 2, -info.maxOther / 2, info.total, info.maxOther);
                        break;
                }
            }
        }
        function renderInfo(position, visualizations, ctx, node, bb) {
            switch (position) {
                case 'bottom':
                    ctx.translate(0, bb.h);
                    for (const overlay of visualizations) {
                        overlay.vis(ctx, node, { width: bb.w, height: overlay.height, position });
                        ctx.translate(0, overlay.height + padding);
                    }
                    break;
                case 'left':
                    for (const overlay of visualizations) {
                        ctx.translate(-overlay.width, 0);
                        overlay.vis(ctx, node, { width: overlay.width, height: bb.h, position });
                        ctx.translate(-padding, 0);
                    }
                    break;
                case 'right':
                    ctx.translate(bb.w, 0);
                    for (const overlay of visualizations) {
                        overlay.vis(ctx, node, { width: overlay.width, height: bb.h, position });
                        ctx.translate(overlay.width + padding, 0);
                    }
                    break;
                case 'top':
                    for (const overlay of visualizations) {
                        ctx.translate(0, -overlay.height);
                        overlay.vis(ctx, node, { width: bb.w, height: overlay.height, position });
                        ctx.translate(0, -padding);
                    }
                    break;
                case 'top-left':
                case 'bottom-left':
                    ctx.translate(-visualizations[0].width / 2, position === 'bottom-left' ? bb.h : 0);
                    for (const overlay of visualizations) {
                        ctx.translate(0, -overlay.height / 2);
                        overlay.vis(ctx, node, { width: overlay.width, height: overlay.height, position });
                        ctx.translate(padding + overlay.width, overlay.height / 2);
                    }
                    break;
                case 'top-right':
                case 'bottom-right':
                    ctx.translate(bb.w + visualizations[0].width / 2, position === 'bottom-right' ? bb.h : 0);
                    for (const overlay of visualizations) {
                        ctx.translate(-overlay.width, -overlay.height / 2);
                        overlay.vis(ctx, node, { width: overlay.width, height: overlay.height, position });
                        ctx.translate(-padding, overlay.height / 2);
                    }
                    break;
            }
        }
        return cytoscapeLayers.renderPerNode(layer, (ctx, node, bb) => {
            const bak = ctx.getTransform();
            cleanArea(ctx, bb);
            for (const info of infos) {
                renderInfo(info.pos, info.overlays, ctx, node, bb);
                ctx.setTransform(bak);
            }
        }, renderPerNodeOptions);
    }

    function resolveAccessor(attr) {
        return typeof attr === 'function' ? attr : (node) => node.data(attr);
    }
    function resolveScale(scale) {
        if (typeof scale === 'function') {
            return scale;
        }
        const range = scale[1] - scale[0];
        const min = scale[0];
        return (v) => (v - min) / range;
    }
    function resolveFunction(f) {
        return typeof f === 'function' ? f : () => f;
    }
    function autoResolveScale(scale, values) {
        if (typeof scale === 'function') {
            return scale;
        }
        if (!Number.isNaN(scale[0]) && !Number.isNaN(scale[1])) {
            return resolveScale(scale);
        }
        const { min, max } = values().reduce((acc, v) => {
            if (v == null || Number.isNaN(v)) {
                return acc;
            }
            acc.min = Math.min(acc.min, v);
            acc.max = Math.max(acc.max, v);
            return acc;
        }, { min: Number.POSITIVE_INFINITY, max: Number.NEGATIVE_INFINITY });
        const fixedScale = [
            Number.isNaN(scale[0]) ? min : scale[0],
            Number.isNaN(scale[1]) ? max : scale[1],
        ];
        return resolveScale(fixedScale);
    }

    const defaultColorOptions = {
        backgroundColor: '#cccccc',
        borderColor: '#a0a0a0',
    };
    function renderBar(attr, options = {}) {
        const o = Object.assign({
            scale: [0, Number.NaN],
        }, defaultColorOptions, options);
        const acc = resolveAccessor(attr);
        let scale = resolveScale(o.scale);
        const backgroundColor = resolveFunction(o.backgroundColor);
        const borderColor = resolveFunction(o.borderColor);
        const r = (ctx, node, dim) => {
            const value = acc(node);
            if (value != null && !Number.isNaN(value)) {
                ctx.fillStyle = backgroundColor(node);
                const v = scale(value);
                if (dim.position === 'left' || dim.position === 'right') {
                    ctx.fillRect(0, dim.height * (1 - v), dim.width, v * dim.height);
                }
                else {
                    ctx.fillRect(0, 0, dim.width * v, dim.height);
                }
            }
            const b = borderColor(node);
            if (b) {
                ctx.strokeStyle = b;
                ctx.strokeRect(0, 0, dim.width, dim.height);
            }
        };
        r.init = (nodes) => {
            scale = autoResolveScale(o.scale, () => nodes.map(acc));
        };
        r.defaultHeight = 5;
        r.defaultWidth = 5;
        r.defaultPosition = 'bottom';
        return r;
    }

    /**
     * @sgratzl/boxplots
     * https://github.com/sgratzl/boxplots
     *
     * Copyright (c) 2021 Samuel Gratzl <sam@sgratzl.com>
     */

    const HELPER = Math.sqrt(2 * Math.PI);
    function gaussian(u) {
      return Math.exp(-0.5 * u * u) / HELPER;
    }
    function toSampleVariance(variance, len) {
      return variance * len / (len - 1);
    }
    function nrd(iqr, variance, len) {
      let s = Math.sqrt(toSampleVariance(variance, len));
      if (typeof iqr === 'number') {
        s = Math.min(s, iqr / 1.34);
      }
      return 1.06 * s * Math.pow(len, -0.2);
    }
    function kde(stats) {
      const len = stats.items.length;
      const bandwidth = nrd(stats.iqr, stats.variance, len);
      return x => {
        let i = 0;
        let sum = 0;
        for (i = 0; i < len; i++) {
          const v = stats.items[i];
          sum += gaussian((x - v) / bandwidth);
        }
        return sum / bandwidth / len;
      };
    }
    function quantilesInterpolate(arr, length, interpolate) {
      const n1 = length - 1;
      const compute = q => {
        const index = q * n1;
        const lo = Math.floor(index);
        const h = index - lo;
        const a = arr[lo];
        return h === 0 ? a : interpolate(a, arr[Math.min(lo + 1, n1)], h);
      };
      return {
        q1: compute(0.25),
        median: compute(0.5),
        q3: compute(0.75)
      };
    }
    function quantilesType7(arr, length = arr.length) {
      return quantilesInterpolate(arr, length, (a, b, alpha) => a + alpha * (b - a));
    }
    function createSortedData(data) {
      let valid = 0;
      const {
        length
      } = data;
      const vs = data instanceof Float64Array ? new Float64Array(length) : new Float32Array(length);
      for (let i = 0; i < length; i += 1) {
        const v = data[i];
        if (v == null || Number.isNaN(v)) {
          continue;
        }
        vs[valid] = v;
        valid += 1;
      }
      const missing = length - valid;
      if (valid === 0) {
        return {
          min: Number.NaN,
          max: Number.NaN,
          missing,
          s: []
        };
      }
      const validData = valid === length ? vs : vs.subarray(0, valid);
      validData.sort((a, b) => a === b ? 0 : a < b ? -1 : 1);
      const min = validData[0];
      const max = validData[validData.length - 1];
      return {
        min,
        max,
        missing,
        s: validData
      };
    }
    function withSortedData(data) {
      if (data.length === 0) {
        return {
          min: Number.NaN,
          max: Number.NaN,
          missing: 0,
          s: []
        };
      }
      const min = data[0];
      const max = data[data.length - 1];
      return {
        min,
        max,
        missing: 0,
        s: data
      };
    }
    function computeWhiskers(s, valid, min, max, {
      eps,
      quantiles,
      coef,
      whiskersMode
    }) {
      const same = (a, b) => Math.abs(a - b) < eps;
      const {
        median,
        q1,
        q3
      } = quantiles(s, valid);
      const iqr = q3 - q1;
      const isCoefValid = typeof coef === 'number' && coef > 0;
      let whiskerLow = isCoefValid ? Math.max(min, q1 - coef * iqr) : min;
      let whiskerHigh = isCoefValid ? Math.min(max, q3 + coef * iqr) : max;
      const outlierLow = [];
      for (let i = 0; i < valid; i += 1) {
        const v = s[i];
        if (v >= whiskerLow || same(v, whiskerLow)) {
          if (whiskersMode === 'nearest') {
            whiskerLow = v;
          }
          break;
        }
        if (outlierLow.length === 0 || !same(outlierLow[outlierLow.length - 1], v)) {
          outlierLow.push(v);
        }
      }
      const reversedOutlierHigh = [];
      for (let i = valid - 1; i >= 0; i -= 1) {
        const v = s[i];
        if (v <= whiskerHigh || same(v, whiskerHigh)) {
          if (whiskersMode === 'nearest') {
            whiskerHigh = v;
          }
          break;
        }
        if ((reversedOutlierHigh.length === 0 || !same(reversedOutlierHigh[reversedOutlierHigh.length - 1], v)) && (outlierLow.length === 0 || !same(outlierLow[outlierLow.length - 1], v))) {
          reversedOutlierHigh.push(v);
        }
      }
      const outlier = outlierLow.concat(reversedOutlierHigh.reverse());
      return {
        median,
        q1,
        q3,
        iqr,
        outlier,
        whiskerHigh,
        whiskerLow
      };
    }
    function computeStats(s, valid) {
      let mean = 0;
      for (let i = 0; i < valid; i++) {
        const v = s[i];
        mean += v;
      }
      mean /= valid;
      let variance = 0;
      for (let i = 0; i < valid; i++) {
        const v = s[i];
        variance += (v - mean) * (v - mean);
      }
      variance /= valid;
      return {
        mean,
        variance
      };
    }
    function boxplot(data, options = {}) {
      const fullOptions = {
        coef: 1.5,
        eps: 10e-3,
        quantiles: quantilesType7,
        validAndSorted: false,
        whiskersMode: 'nearest',
        ...options
      };
      const {
        missing,
        s,
        min,
        max
      } = fullOptions.validAndSorted ? withSortedData(data) : createSortedData(data);
      const invalid = {
        min: Number.NaN,
        max: Number.NaN,
        mean: Number.NaN,
        missing,
        iqr: Number.NaN,
        count: data.length,
        whiskerHigh: Number.NaN,
        whiskerLow: Number.NaN,
        outlier: [],
        median: Number.NaN,
        q1: Number.NaN,
        q3: Number.NaN,
        variance: 0,
        items: [],
        kde: () => 0
      };
      const valid = data.length - missing;
      if (valid === 0) {
        return invalid;
      }
      const result = {
        min,
        max,
        count: data.length,
        missing,
        items: s,
        ...computeStats(s, valid),
        ...computeWhiskers(s, valid, min, max, fullOptions)
      };
      return {
        ...result,
        kde: kde(result)
      };
    }

    var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

    var alea$1 = {exports: {}};

    (function (module) {
      // A port of an algorithm by Johannes Baagøe <baagoe@baagoe.com>, 2010
      // http://baagoe.com/en/RandomMusings/javascript/
      // https://github.com/nquinlan/better-random-numbers-for-javascript-mirror
      // Original work is under MIT license -

      // Copyright (C) 2010 by Johannes Baagøe <baagoe@baagoe.org>
      //
      // Permission is hereby granted, free of charge, to any person obtaining a copy
      // of this software and associated documentation files (the "Software"), to deal
      // in the Software without restriction, including without limitation the rights
      // to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
      // copies of the Software, and to permit persons to whom the Software is
      // furnished to do so, subject to the following conditions:
      //
      // The above copyright notice and this permission notice shall be included in
      // all copies or substantial portions of the Software.
      //
      // THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
      // IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
      // FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
      // AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
      // LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
      // OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
      // THE SOFTWARE.

      (function (global, module, define) {
        function Alea(seed) {
          var me = this,
            mash = Mash();
          me.next = function () {
            var t = 2091639 * me.s0 + me.c * 2.3283064365386963e-10; // 2^-32
            me.s0 = me.s1;
            me.s1 = me.s2;
            return me.s2 = t - (me.c = t | 0);
          };

          // Apply the seeding algorithm from Baagoe.
          me.c = 1;
          me.s0 = mash(' ');
          me.s1 = mash(' ');
          me.s2 = mash(' ');
          me.s0 -= mash(seed);
          if (me.s0 < 0) {
            me.s0 += 1;
          }
          me.s1 -= mash(seed);
          if (me.s1 < 0) {
            me.s1 += 1;
          }
          me.s2 -= mash(seed);
          if (me.s2 < 0) {
            me.s2 += 1;
          }
          mash = null;
        }
        function copy(f, t) {
          t.c = f.c;
          t.s0 = f.s0;
          t.s1 = f.s1;
          t.s2 = f.s2;
          return t;
        }
        function impl(seed, opts) {
          var xg = new Alea(seed),
            state = opts && opts.state,
            prng = xg.next;
          prng.int32 = function () {
            return xg.next() * 0x100000000 | 0;
          };
          prng.double = function () {
            return prng() + (prng() * 0x200000 | 0) * 1.1102230246251565e-16; // 2^-53
          };

          prng.quick = prng;
          if (state) {
            if (typeof state == 'object') copy(state, xg);
            prng.state = function () {
              return copy(xg, {});
            };
          }
          return prng;
        }
        function Mash() {
          var n = 0xefc8249d;
          var mash = function (data) {
            data = String(data);
            for (var i = 0; i < data.length; i++) {
              n += data.charCodeAt(i);
              var h = 0.02519603282416938 * n;
              n = h >>> 0;
              h -= n;
              h *= n;
              n = h >>> 0;
              h -= n;
              n += h * 0x100000000; // 2^32
            }

            return (n >>> 0) * 2.3283064365386963e-10; // 2^-32
          };

          return mash;
        }
        if (module && module.exports) {
          module.exports = impl;
        } else if (define && define.amd) {
          define(function () {
            return impl;
          });
        } else {
          this.alea = impl;
        }
      })(commonjsGlobal, module,
      // present in node.js
      typeof undefined == 'function'  // present with an AMD loader
      );
    })(alea$1);

    var xor128$1 = {exports: {}};

    (function (module) {
      // A Javascript implementaion of the "xor128" prng algorithm by
      // George Marsaglia.  See http://www.jstatsoft.org/v08/i14/paper

      (function (global, module, define) {
        function XorGen(seed) {
          var me = this,
            strseed = '';
          me.x = 0;
          me.y = 0;
          me.z = 0;
          me.w = 0;

          // Set up generator function.
          me.next = function () {
            var t = me.x ^ me.x << 11;
            me.x = me.y;
            me.y = me.z;
            me.z = me.w;
            return me.w ^= me.w >>> 19 ^ t ^ t >>> 8;
          };
          if (seed === (seed | 0)) {
            // Integer seed.
            me.x = seed;
          } else {
            // String seed.
            strseed += seed;
          }

          // Mix in string seed, then discard an initial batch of 64 values.
          for (var k = 0; k < strseed.length + 64; k++) {
            me.x ^= strseed.charCodeAt(k) | 0;
            me.next();
          }
        }
        function copy(f, t) {
          t.x = f.x;
          t.y = f.y;
          t.z = f.z;
          t.w = f.w;
          return t;
        }
        function impl(seed, opts) {
          var xg = new XorGen(seed),
            state = opts && opts.state,
            prng = function () {
              return (xg.next() >>> 0) / 0x100000000;
            };
          prng.double = function () {
            do {
              var top = xg.next() >>> 11,
                bot = (xg.next() >>> 0) / 0x100000000,
                result = (top + bot) / (1 << 21);
            } while (result === 0);
            return result;
          };
          prng.int32 = xg.next;
          prng.quick = prng;
          if (state) {
            if (typeof state == 'object') copy(state, xg);
            prng.state = function () {
              return copy(xg, {});
            };
          }
          return prng;
        }
        if (module && module.exports) {
          module.exports = impl;
        } else if (define && define.amd) {
          define(function () {
            return impl;
          });
        } else {
          this.xor128 = impl;
        }
      })(commonjsGlobal, module,
      // present in node.js
      typeof undefined == 'function'  // present with an AMD loader
      );
    })(xor128$1);

    var xorwow$1 = {exports: {}};

    (function (module) {
      // A Javascript implementaion of the "xorwow" prng algorithm by
      // George Marsaglia.  See http://www.jstatsoft.org/v08/i14/paper

      (function (global, module, define) {
        function XorGen(seed) {
          var me = this,
            strseed = '';

          // Set up generator function.
          me.next = function () {
            var t = me.x ^ me.x >>> 2;
            me.x = me.y;
            me.y = me.z;
            me.z = me.w;
            me.w = me.v;
            return (me.d = me.d + 362437 | 0) + (me.v = me.v ^ me.v << 4 ^ (t ^ t << 1)) | 0;
          };
          me.x = 0;
          me.y = 0;
          me.z = 0;
          me.w = 0;
          me.v = 0;
          if (seed === (seed | 0)) {
            // Integer seed.
            me.x = seed;
          } else {
            // String seed.
            strseed += seed;
          }

          // Mix in string seed, then discard an initial batch of 64 values.
          for (var k = 0; k < strseed.length + 64; k++) {
            me.x ^= strseed.charCodeAt(k) | 0;
            if (k == strseed.length) {
              me.d = me.x << 10 ^ me.x >>> 4;
            }
            me.next();
          }
        }
        function copy(f, t) {
          t.x = f.x;
          t.y = f.y;
          t.z = f.z;
          t.w = f.w;
          t.v = f.v;
          t.d = f.d;
          return t;
        }
        function impl(seed, opts) {
          var xg = new XorGen(seed),
            state = opts && opts.state,
            prng = function () {
              return (xg.next() >>> 0) / 0x100000000;
            };
          prng.double = function () {
            do {
              var top = xg.next() >>> 11,
                bot = (xg.next() >>> 0) / 0x100000000,
                result = (top + bot) / (1 << 21);
            } while (result === 0);
            return result;
          };
          prng.int32 = xg.next;
          prng.quick = prng;
          if (state) {
            if (typeof state == 'object') copy(state, xg);
            prng.state = function () {
              return copy(xg, {});
            };
          }
          return prng;
        }
        if (module && module.exports) {
          module.exports = impl;
        } else if (define && define.amd) {
          define(function () {
            return impl;
          });
        } else {
          this.xorwow = impl;
        }
      })(commonjsGlobal, module,
      // present in node.js
      typeof undefined == 'function'  // present with an AMD loader
      );
    })(xorwow$1);

    var xorshift7$1 = {exports: {}};

    (function (module) {
      // A Javascript implementaion of the "xorshift7" algorithm by
      // François Panneton and Pierre L'ecuyer:
      // "On the Xorgshift Random Number Generators"
      // http://saluc.engr.uconn.edu/refs/crypto/rng/panneton05onthexorshift.pdf

      (function (global, module, define) {
        function XorGen(seed) {
          var me = this;

          // Set up generator function.
          me.next = function () {
            // Update xor generator.
            var X = me.x,
              i = me.i,
              t,
              v;
            t = X[i];
            t ^= t >>> 7;
            v = t ^ t << 24;
            t = X[i + 1 & 7];
            v ^= t ^ t >>> 10;
            t = X[i + 3 & 7];
            v ^= t ^ t >>> 3;
            t = X[i + 4 & 7];
            v ^= t ^ t << 7;
            t = X[i + 7 & 7];
            t = t ^ t << 13;
            v ^= t ^ t << 9;
            X[i] = v;
            me.i = i + 1 & 7;
            return v;
          };
          function init(me, seed) {
            var j,
              X = [];
            if (seed === (seed | 0)) {
              // Seed state array using a 32-bit integer.
              X[0] = seed;
            } else {
              // Seed state using a string.
              seed = '' + seed;
              for (j = 0; j < seed.length; ++j) {
                X[j & 7] = X[j & 7] << 15 ^ seed.charCodeAt(j) + X[j + 1 & 7] << 13;
              }
            }
            // Enforce an array length of 8, not all zeroes.
            while (X.length < 8) X.push(0);
            for (j = 0; j < 8 && X[j] === 0; ++j);
            if (j == 8) X[7] = -1;else X[j];
            me.x = X;
            me.i = 0;

            // Discard an initial 256 values.
            for (j = 256; j > 0; --j) {
              me.next();
            }
          }
          init(me, seed);
        }
        function copy(f, t) {
          t.x = f.x.slice();
          t.i = f.i;
          return t;
        }
        function impl(seed, opts) {
          if (seed == null) seed = +new Date();
          var xg = new XorGen(seed),
            state = opts && opts.state,
            prng = function () {
              return (xg.next() >>> 0) / 0x100000000;
            };
          prng.double = function () {
            do {
              var top = xg.next() >>> 11,
                bot = (xg.next() >>> 0) / 0x100000000,
                result = (top + bot) / (1 << 21);
            } while (result === 0);
            return result;
          };
          prng.int32 = xg.next;
          prng.quick = prng;
          if (state) {
            if (state.x) copy(state, xg);
            prng.state = function () {
              return copy(xg, {});
            };
          }
          return prng;
        }
        if (module && module.exports) {
          module.exports = impl;
        } else if (define && define.amd) {
          define(function () {
            return impl;
          });
        } else {
          this.xorshift7 = impl;
        }
      })(commonjsGlobal, module,
      // present in node.js
      typeof undefined == 'function'  // present with an AMD loader
      );
    })(xorshift7$1);

    var xor4096$1 = {exports: {}};

    (function (module) {
      // A Javascript implementaion of Richard Brent's Xorgens xor4096 algorithm.
      //
      // This fast non-cryptographic random number generator is designed for
      // use in Monte-Carlo algorithms. It combines a long-period xorshift
      // generator with a Weyl generator, and it passes all common batteries
      // of stasticial tests for randomness while consuming only a few nanoseconds
      // for each prng generated.  For background on the generator, see Brent's
      // paper: "Some long-period random number generators using shifts and xors."
      // http://arxiv.org/pdf/1004.3115v1.pdf
      //
      // Usage:
      //
      // var xor4096 = require('xor4096');
      // random = xor4096(1);                        // Seed with int32 or string.
      // assert.equal(random(), 0.1520436450538547); // (0, 1) range, 53 bits.
      // assert.equal(random.int32(), 1806534897);   // signed int32, 32 bits.
      //
      // For nonzero numeric keys, this impelementation provides a sequence
      // identical to that by Brent's xorgens 3 implementaion in C.  This
      // implementation also provides for initalizing the generator with
      // string seeds, or for saving and restoring the state of the generator.
      //
      // On Chrome, this prng benchmarks about 2.1 times slower than
      // Javascript's built-in Math.random().

      (function (global, module, define) {
        function XorGen(seed) {
          var me = this;

          // Set up generator function.
          me.next = function () {
            var w = me.w,
              X = me.X,
              i = me.i,
              t,
              v;
            // Update Weyl generator.
            me.w = w = w + 0x61c88647 | 0;
            // Update xor generator.
            v = X[i + 34 & 127];
            t = X[i = i + 1 & 127];
            v ^= v << 13;
            t ^= t << 17;
            v ^= v >>> 15;
            t ^= t >>> 12;
            // Update Xor generator array state.
            v = X[i] = v ^ t;
            me.i = i;
            // Result is the combination.
            return v + (w ^ w >>> 16) | 0;
          };
          function init(me, seed) {
            var t,
              v,
              i,
              j,
              w,
              X = [],
              limit = 128;
            if (seed === (seed | 0)) {
              // Numeric seeds initialize v, which is used to generates X.
              v = seed;
              seed = null;
            } else {
              // String seeds are mixed into v and X one character at a time.
              seed = seed + '\0';
              v = 0;
              limit = Math.max(limit, seed.length);
            }
            // Initialize circular array and weyl value.
            for (i = 0, j = -32; j < limit; ++j) {
              // Put the unicode characters into the array, and shuffle them.
              if (seed) v ^= seed.charCodeAt((j + 32) % seed.length);
              // After 32 shuffles, take v as the starting w value.
              if (j === 0) w = v;
              v ^= v << 10;
              v ^= v >>> 15;
              v ^= v << 4;
              v ^= v >>> 13;
              if (j >= 0) {
                w = w + 0x61c88647 | 0; // Weyl.
                t = X[j & 127] ^= v + w; // Combine xor and weyl to init array.
                i = 0 == t ? i + 1 : 0; // Count zeroes.
              }
            }
            // We have detected all zeroes; make the key nonzero.
            if (i >= 128) {
              X[(seed && seed.length || 0) & 127] = -1;
            }
            // Run the generator 512 times to further mix the state before using it.
            // Factoring this as a function slows the main generator, so it is just
            // unrolled here.  The weyl generator is not advanced while warming up.
            i = 127;
            for (j = 4 * 128; j > 0; --j) {
              v = X[i + 34 & 127];
              t = X[i = i + 1 & 127];
              v ^= v << 13;
              t ^= t << 17;
              v ^= v >>> 15;
              t ^= t >>> 12;
              X[i] = v ^ t;
            }
            // Storing state as object members is faster than using closure variables.
            me.w = w;
            me.X = X;
            me.i = i;
          }
          init(me, seed);
        }
        function copy(f, t) {
          t.i = f.i;
          t.w = f.w;
          t.X = f.X.slice();
          return t;
        }
        function impl(seed, opts) {
          if (seed == null) seed = +new Date();
          var xg = new XorGen(seed),
            state = opts && opts.state,
            prng = function () {
              return (xg.next() >>> 0) / 0x100000000;
            };
          prng.double = function () {
            do {
              var top = xg.next() >>> 11,
                bot = (xg.next() >>> 0) / 0x100000000,
                result = (top + bot) / (1 << 21);
            } while (result === 0);
            return result;
          };
          prng.int32 = xg.next;
          prng.quick = prng;
          if (state) {
            if (state.X) copy(state, xg);
            prng.state = function () {
              return copy(xg, {});
            };
          }
          return prng;
        }
        if (module && module.exports) {
          module.exports = impl;
        } else if (define && define.amd) {
          define(function () {
            return impl;
          });
        } else {
          this.xor4096 = impl;
        }
      })(commonjsGlobal,
      // window object or global
      module,
      // present in node.js
      typeof undefined == 'function'  // present with an AMD loader
      );
    })(xor4096$1);

    var tychei$1 = {exports: {}};

    (function (module) {
      // A Javascript implementaion of the "Tyche-i" prng algorithm by
      // Samuel Neves and Filipe Araujo.
      // See https://eden.dei.uc.pt/~sneves/pubs/2011-snfa2.pdf

      (function (global, module, define) {
        function XorGen(seed) {
          var me = this,
            strseed = '';

          // Set up generator function.
          me.next = function () {
            var b = me.b,
              c = me.c,
              d = me.d,
              a = me.a;
            b = b << 25 ^ b >>> 7 ^ c;
            c = c - d | 0;
            d = d << 24 ^ d >>> 8 ^ a;
            a = a - b | 0;
            me.b = b = b << 20 ^ b >>> 12 ^ c;
            me.c = c = c - d | 0;
            me.d = d << 16 ^ c >>> 16 ^ a;
            return me.a = a - b | 0;
          };

          /* The following is non-inverted tyche, which has better internal
           * bit diffusion, but which is about 25% slower than tyche-i in JS.
          me.next = function() {
            var a = me.a, b = me.b, c = me.c, d = me.d;
            a = (me.a + me.b | 0) >>> 0;
            d = me.d ^ a; d = d << 16 ^ d >>> 16;
            c = me.c + d | 0;
            b = me.b ^ c; b = b << 12 ^ d >>> 20;
            me.a = a = a + b | 0;
            d = d ^ a; me.d = d = d << 8 ^ d >>> 24;
            me.c = c = c + d | 0;
            b = b ^ c;
            return me.b = (b << 7 ^ b >>> 25);
          }
          */

          me.a = 0;
          me.b = 0;
          me.c = 2654435769 | 0;
          me.d = 1367130551;
          if (seed === Math.floor(seed)) {
            // Integer seed.
            me.a = seed / 0x100000000 | 0;
            me.b = seed | 0;
          } else {
            // String seed.
            strseed += seed;
          }

          // Mix in string seed, then discard an initial batch of 64 values.
          for (var k = 0; k < strseed.length + 20; k++) {
            me.b ^= strseed.charCodeAt(k) | 0;
            me.next();
          }
        }
        function copy(f, t) {
          t.a = f.a;
          t.b = f.b;
          t.c = f.c;
          t.d = f.d;
          return t;
        }
        function impl(seed, opts) {
          var xg = new XorGen(seed),
            state = opts && opts.state,
            prng = function () {
              return (xg.next() >>> 0) / 0x100000000;
            };
          prng.double = function () {
            do {
              var top = xg.next() >>> 11,
                bot = (xg.next() >>> 0) / 0x100000000,
                result = (top + bot) / (1 << 21);
            } while (result === 0);
            return result;
          };
          prng.int32 = xg.next;
          prng.quick = prng;
          if (state) {
            if (typeof state == 'object') copy(state, xg);
            prng.state = function () {
              return copy(xg, {});
            };
          }
          return prng;
        }
        if (module && module.exports) {
          module.exports = impl;
        } else if (define && define.amd) {
          define(function () {
            return impl;
          });
        } else {
          this.tychei = impl;
        }
      })(commonjsGlobal, module,
      // present in node.js
      typeof undefined == 'function'  // present with an AMD loader
      );
    })(tychei$1);

    var seedrandom$1 = {exports: {}};

    /*
    Copyright 2019 David Bau.

    Permission is hereby granted, free of charge, to any person obtaining
    a copy of this software and associated documentation files (the
    "Software"), to deal in the Software without restriction, including
    without limitation the rights to use, copy, modify, merge, publish,
    distribute, sublicense, and/or sell copies of the Software, and to
    permit persons to whom the Software is furnished to do so, subject to
    the following conditions:

    The above copyright notice and this permission notice shall be
    included in all copies or substantial portions of the Software.

    THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
    EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
    MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
    IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
    CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
    TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
    SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

    */
    (function (module) {
      (function (global, pool, math) {
        //
        // The following constants are related to IEEE 754 limits.
        //

        var width = 256,
          // each RC4 output is 0 <= x < 256
          chunks = 6,
          // at least six RC4 outputs for each double
          digits = 52,
          // there are 52 significant digits in a double
          rngname = 'random',
          // rngname: name for Math.random and Math.seedrandom
          startdenom = math.pow(width, chunks),
          significance = math.pow(2, digits),
          overflow = significance * 2,
          mask = width - 1,
          nodecrypto; // node.js crypto module, initialized at the bottom.

        //
        // seedrandom()
        // This is the seedrandom function described above.
        //
        function seedrandom(seed, options, callback) {
          var key = [];
          options = options == true ? {
            entropy: true
          } : options || {};

          // Flatten the seed string or build one from local entropy if needed.
          var shortseed = mixkey(flatten(options.entropy ? [seed, tostring(pool)] : seed == null ? autoseed() : seed, 3), key);

          // Use the seed to initialize an ARC4 generator.
          var arc4 = new ARC4(key);

          // This function returns a random double in [0, 1) that contains
          // randomness in every bit of the mantissa of the IEEE 754 value.
          var prng = function () {
            var n = arc4.g(chunks),
              // Start with a numerator n < 2 ^ 48
              d = startdenom,
              //   and denominator d = 2 ^ 48.
              x = 0; //   and no 'extra last byte'.
            while (n < significance) {
              // Fill up all significant digits by
              n = (n + x) * width; //   shifting numerator and
              d *= width; //   denominator and generating a
              x = arc4.g(1); //   new least-significant-byte.
            }

            while (n >= overflow) {
              // To avoid rounding up, before adding
              n /= 2; //   last byte, shift everything
              d /= 2; //   right using integer math until
              x >>>= 1; //   we have exactly the desired bits.
            }

            return (n + x) / d; // Form the number within [0, 1).
          };

          prng.int32 = function () {
            return arc4.g(4) | 0;
          };
          prng.quick = function () {
            return arc4.g(4) / 0x100000000;
          };
          prng.double = prng;

          // Mix the randomness into accumulated entropy.
          mixkey(tostring(arc4.S), pool);

          // Calling convention: what to return as a function of prng, seed, is_math.
          return (options.pass || callback || function (prng, seed, is_math_call, state) {
            if (state) {
              // Load the arc4 state from the given state if it has an S array.
              if (state.S) {
                copy(state, arc4);
              }
              // Only provide the .state method if requested via options.state.
              prng.state = function () {
                return copy(arc4, {});
              };
            }

            // If called as a method of Math (Math.seedrandom()), mutate
            // Math.random because that is how seedrandom.js has worked since v1.0.
            if (is_math_call) {
              math[rngname] = prng;
              return seed;
            }

            // Otherwise, it is a newer calling convention, so return the
            // prng directly.
            else return prng;
          })(prng, shortseed, 'global' in options ? options.global : this == math, options.state);
        }

        //
        // ARC4
        //
        // An ARC4 implementation.  The constructor takes a key in the form of
        // an array of at most (width) integers that should be 0 <= x < (width).
        //
        // The g(count) method returns a pseudorandom integer that concatenates
        // the next (count) outputs from ARC4.  Its return value is a number x
        // that is in the range 0 <= x < (width ^ count).
        //
        function ARC4(key) {
          var t,
            keylen = key.length,
            me = this,
            i = 0,
            j = me.i = me.j = 0,
            s = me.S = [];

          // The empty key [] is treated as [0].
          if (!keylen) {
            key = [keylen++];
          }

          // Set up S using the standard key scheduling algorithm.
          while (i < width) {
            s[i] = i++;
          }
          for (i = 0; i < width; i++) {
            s[i] = s[j = mask & j + key[i % keylen] + (t = s[i])];
            s[j] = t;
          }

          // The "g" method returns the next (count) outputs as one number.
          (me.g = function (count) {
            // Using instance members instead of closure state nearly doubles speed.
            var t,
              r = 0,
              i = me.i,
              j = me.j,
              s = me.S;
            while (count--) {
              t = s[i = mask & i + 1];
              r = r * width + s[mask & (s[i] = s[j = mask & j + t]) + (s[j] = t)];
            }
            me.i = i;
            me.j = j;
            return r;
            // For robust unpredictability, the function call below automatically
            // discards an initial batch of values.  This is called RC4-drop[256].
            // See http://google.com/search?q=rsa+fluhrer+response&btnI
          })(width);
        }

        //
        // copy()
        // Copies internal state of ARC4 to or from a plain object.
        //
        function copy(f, t) {
          t.i = f.i;
          t.j = f.j;
          t.S = f.S.slice();
          return t;
        }

        //
        // flatten()
        // Converts an object tree to nested arrays of strings.
        //
        function flatten(obj, depth) {
          var result = [],
            typ = typeof obj,
            prop;
          if (depth && typ == 'object') {
            for (prop in obj) {
              try {
                result.push(flatten(obj[prop], depth - 1));
              } catch (e) {}
            }
          }
          return result.length ? result : typ == 'string' ? obj : obj + '\0';
        }

        //
        // mixkey()
        // Mixes a string seed into a key that is an array of integers, and
        // returns a shortened string seed that is equivalent to the result key.
        //
        function mixkey(seed, key) {
          var stringseed = seed + '',
            smear,
            j = 0;
          while (j < stringseed.length) {
            key[mask & j] = mask & (smear ^= key[mask & j] * 19) + stringseed.charCodeAt(j++);
          }
          return tostring(key);
        }

        //
        // autoseed()
        // Returns an object for autoseeding, using window.crypto and Node crypto
        // module if available.
        //
        function autoseed() {
          try {
            var out;
            if (nodecrypto && (out = nodecrypto.randomBytes)) {
              // The use of 'out' to remember randomBytes makes tight minified code.
              out = out(width);
            } else {
              out = new Uint8Array(width);
              (global.crypto || global.msCrypto).getRandomValues(out);
            }
            return tostring(out);
          } catch (e) {
            var browser = global.navigator,
              plugins = browser && browser.plugins;
            return [+new Date(), global, plugins, global.screen, tostring(pool)];
          }
        }

        //
        // tostring()
        // Converts an array of charcodes to a string
        //
        function tostring(a) {
          return String.fromCharCode.apply(0, a);
        }

        //
        // When seedrandom.js is loaded, we immediately mix a few bits
        // from the built-in RNG into the entropy pool.  Because we do
        // not want to interfere with deterministic PRNG state later,
        // seedrandom will not call math.random on its own again after
        // initialization.
        //
        mixkey(math.random(), pool);

        //
        // Nodejs and AMD support: export the implementation as a module using
        // either convention.
        //
        if (module.exports) {
          module.exports = seedrandom;
          // When in node.js, try using crypto package for autoseeding.
          try {
            nodecrypto = require('crypto');
          } catch (ex) {}
        } else {
          // When included as a plain script, set up Math.seedrandom global.
          math['seed' + rngname] = seedrandom;
        }

        // End anonymous scope, and pass initial values.
      })(
      // global: `self` in browsers (including strict mode and web workers),
      // otherwise `this` in Node and other environments
      typeof self !== 'undefined' ? self : commonjsGlobal, [],
      // pool: entropy pool starts empty
      Math // math: package containing random, pow, and seedrandom
      );
    })(seedrandom$1);

    // A library of seedable RNGs implemented in Javascript.
    //
    // Usage:
    //
    // var seedrandom = require('seedrandom');
    // var random = seedrandom(1); // or any seed.
    // var x = random();       // 0 <= x < 1.  Every bit is random.
    // var x = random.quick(); // 0 <= x < 1.  32 bits of randomness.

    // alea, a 53-bit multiply-with-carry generator by Johannes Baagøe.
    // Period: ~2^116
    // Reported to pass all BigCrush tests.
    var alea = alea$1.exports;

    // xor128, a pure xor-shift generator by George Marsaglia.
    // Period: 2^128-1.
    // Reported to fail: MatrixRank and LinearComp.
    var xor128 = xor128$1.exports;

    // xorwow, George Marsaglia's 160-bit xor-shift combined plus weyl.
    // Period: 2^192-2^32
    // Reported to fail: CollisionOver, SimpPoker, and LinearComp.
    var xorwow = xorwow$1.exports;

    // xorshift7, by François Panneton and Pierre L'ecuyer, takes
    // a different approach: it adds robustness by allowing more shifts
    // than Marsaglia's original three.  It is a 7-shift generator
    // with 256 bits, that passes BigCrush with no systmatic failures.
    // Period 2^256-1.
    // No systematic BigCrush failures reported.
    var xorshift7 = xorshift7$1.exports;

    // xor4096, by Richard Brent, is a 4096-bit xor-shift with a
    // very long period that also adds a Weyl generator. It also passes
    // BigCrush with no systematic failures.  Its long period may
    // be useful if you have many generators and need to avoid
    // collisions.
    // Period: 2^4128-2^32.
    // No systematic BigCrush failures reported.
    var xor4096 = xor4096$1.exports;

    // Tyche-i, by Samuel Neves and Filipe Araujo, is a bit-shifting random
    // number generator derived from ChaCha, a modern stream cipher.
    // https://eden.dei.uc.pt/~sneves/pubs/2011-snfa2.pdf
    // Period: ~2^127
    // No systematic BigCrush failures reported.
    var tychei = tychei$1.exports;

    // The original ARC4-based prng included in this library.
    // Period: ~2^1600
    var sr = seedrandom$1.exports;
    sr.alea = alea;
    sr.xor128 = xor128;
    sr.xorwow = xorwow;
    sr.xorshift7 = xorshift7;
    sr.xor4096 = xor4096;
    sr.tychei = tychei;
    var seedrandom = sr;

    const defaultOptions = {
        scale: [0, Number.NaN],
        ...defaultColorOptions,
        outlierRadius: 2,
        get outlierBackgroundColor() {
            return this.backgroundColor;
        },
        itemRadius: 0,
        get itemBackgroundColor() {
            return this.backgroundColor;
        },
        boxPadding: 1,
    };
    function renderPoints(ctx, points, radius, x, y) {
        for (const p of points) {
            const px = x(p);
            const py = y(p);
            ctx.beginPath();
            ctx.arc(px, py, radius, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    function renderBoxplot(attr, options = {}) {
        const o = Object.assign({}, defaultOptions, options);
        const acc = resolveAccessor(attr);
        let scale01 = resolveScale(o.scale);
        const r = (ctx, node, dim) => {
            const value = acc(node);
            if (value == null) {
                return;
            }
            const b = Array.isArray(value) ? boxplot(value, o) : value;
            const scale = (v) => scale01(v) * dim.width;
            if (b == null || Number.isNaN(b.max)) {
                return;
            }
            renderBoxplotImpl(ctx, node, o, scale, b, dim);
        };
        r.init = (nodes) => {
            scale01 = autoResolveScale(o.scale, () => nodes
                .map((n) => {
                const b = acc(n);
                if (Array.isArray(b)) {
                    return b;
                }
                return [b.min, b.max];
            })
                .flat());
        };
        r.defaultHeight = 10;
        r.defaultPosition = 'bottom';
        return r;
    }
    function renderBoxplotImpl(ctx, node, o, scale, b, dim) {
        if (o.itemRadius > 0 && b.items.length > 0) {
            const rnd = seedrandom(node.id());
            ctx.fillStyle = resolveFunction(o.itemBackgroundColor)(node);
            const yDim = dim.height - o.itemRadius * 2;
            renderPoints(ctx, Array.from(b.items), o.itemRadius, (v) => scale(v), () => o.itemRadius + rnd() * yDim);
        }
        ctx.strokeStyle = resolveFunction(o.borderColor)(node);
        ctx.fillStyle = resolveFunction(o.backgroundColor)(node);
        const q1 = scale(b.q1);
        const q3 = scale(b.q3);
        const boxHeight = dim.height - 2 * o.boxPadding;
        ctx.fillRect(q1, o.boxPadding, q3 - q1, boxHeight);
        ctx.beginPath();
        const median = scale(b.median);
        const whiskerLow = scale(b.whiskerLow);
        const whiskerHigh = scale(b.whiskerHigh);
        ctx.moveTo(whiskerLow, 0);
        ctx.lineTo(whiskerLow, dim.height);
        ctx.moveTo(whiskerHigh, 0);
        ctx.lineTo(whiskerHigh, dim.height);
        ctx.moveTo(whiskerLow, dim.height / 2);
        ctx.lineTo(q1, dim.height / 2);
        ctx.moveTo(whiskerHigh, dim.height / 2);
        ctx.lineTo(q3, dim.height / 2);
        ctx.rect(q1, o.boxPadding, q3 - q1, boxHeight);
        ctx.moveTo(median, o.boxPadding);
        ctx.lineTo(median, dim.height - o.boxPadding);
        ctx.stroke();
        if (o.outlierRadius > 0 && b.outlier.length > 0) {
            ctx.fillStyle = resolveFunction(o.outlierBackgroundColor)(node);
            renderPoints(ctx, b.outlier, o.outlierRadius, (v) => scale(v), () => dim.height / 2);
        }
    }

    function ascending(a, b) {
      return a == null || b == null ? NaN : a < b ? -1 : a > b ? 1 : a >= b ? 0 : NaN;
    }

    function descending(a, b) {
      return a == null || b == null ? NaN : b < a ? -1 : b > a ? 1 : b >= a ? 0 : NaN;
    }

    function bisector(f) {
      let compare1, compare2, delta;

      // If an accessor is specified, promote it to a comparator. In this case we
      // can test whether the search value is (self-) comparable. We can’t do this
      // for a comparator (except for specific, known comparators) because we can’t
      // tell if the comparator is symmetric, and an asymmetric comparator can’t be
      // used to test whether a single value is comparable.
      if (f.length !== 2) {
        compare1 = ascending;
        compare2 = (d, x) => ascending(f(d), x);
        delta = (d, x) => f(d) - x;
      } else {
        compare1 = f === ascending || f === descending ? f : zero;
        compare2 = f;
        delta = f;
      }
      function left(a, x, lo = 0, hi = a.length) {
        if (lo < hi) {
          if (compare1(x, x) !== 0) return hi;
          do {
            const mid = lo + hi >>> 1;
            if (compare2(a[mid], x) < 0) lo = mid + 1;else hi = mid;
          } while (lo < hi);
        }
        return lo;
      }
      function right(a, x, lo = 0, hi = a.length) {
        if (lo < hi) {
          if (compare1(x, x) !== 0) return hi;
          do {
            const mid = lo + hi >>> 1;
            if (compare2(a[mid], x) <= 0) lo = mid + 1;else hi = mid;
          } while (lo < hi);
        }
        return lo;
      }
      function center(a, x, lo = 0, hi = a.length) {
        const i = left(a, x, lo, hi - 1);
        return i > lo && delta(a[i - 1], x) > -delta(a[i], x) ? i - 1 : i;
      }
      return {
        left,
        center,
        right
      };
    }
    function zero() {
      return 0;
    }

    function number(x) {
      return x === null ? NaN : +x;
    }

    const ascendingBisect = bisector(ascending);
    const bisectRight = ascendingBisect.right;
    bisector(number).center;

    function count(values, valueof) {
      let count = 0;
      if (valueof === undefined) {
        for (let value of values) {
          if (value != null && (value = +value) >= value) {
            ++count;
          }
        }
      } else {
        let index = -1;
        for (let value of values) {
          if ((value = valueof(value, ++index, values)) != null && (value = +value) >= value) {
            ++count;
          }
        }
      }
      return count;
    }

    function extent(values, valueof) {
      let min;
      let max;
      if (valueof === undefined) {
        for (const value of values) {
          if (value != null) {
            if (min === undefined) {
              if (value >= value) min = max = value;
            } else {
              if (min > value) min = value;
              if (max < value) max = value;
            }
          }
        }
      } else {
        let index = -1;
        for (let value of values) {
          if ((value = valueof(value, ++index, values)) != null) {
            if (min === undefined) {
              if (value >= value) min = max = value;
            } else {
              if (min > value) min = value;
              if (max < value) max = value;
            }
          }
        }
      }
      return [min, max];
    }

    function identity(x) {
      return x;
    }

    var array = Array.prototype;
    var slice = array.slice;

    function constant(x) {
      return () => x;
    }

    var e10 = Math.sqrt(50),
      e5 = Math.sqrt(10),
      e2 = Math.sqrt(2);
    function ticks(start, stop, count) {
      var reverse,
        i = -1,
        n,
        ticks,
        step;
      stop = +stop, start = +start, count = +count;
      if (start === stop && count > 0) return [start];
      if (reverse = stop < start) n = start, start = stop, stop = n;
      if ((step = tickIncrement(start, stop, count)) === 0 || !isFinite(step)) return [];
      if (step > 0) {
        let r0 = Math.round(start / step),
          r1 = Math.round(stop / step);
        if (r0 * step < start) ++r0;
        if (r1 * step > stop) --r1;
        ticks = new Array(n = r1 - r0 + 1);
        while (++i < n) ticks[i] = (r0 + i) * step;
      } else {
        step = -step;
        let r0 = Math.round(start * step),
          r1 = Math.round(stop * step);
        if (r0 / step < start) ++r0;
        if (r1 / step > stop) --r1;
        ticks = new Array(n = r1 - r0 + 1);
        while (++i < n) ticks[i] = (r0 + i) / step;
      }
      if (reverse) ticks.reverse();
      return ticks;
    }
    function tickIncrement(start, stop, count) {
      var step = (stop - start) / Math.max(0, count),
        power = Math.floor(Math.log(step) / Math.LN10),
        error = step / Math.pow(10, power);
      return power >= 0 ? (error >= e10 ? 10 : error >= e5 ? 5 : error >= e2 ? 2 : 1) * Math.pow(10, power) : -Math.pow(10, -power) / (error >= e10 ? 10 : error >= e5 ? 5 : error >= e2 ? 2 : 1);
    }

    function nice(start, stop, count) {
      let prestep;
      while (true) {
        const step = tickIncrement(start, stop, count);
        if (step === prestep || step === 0 || !isFinite(step)) {
          return [start, stop];
        } else if (step > 0) {
          start = Math.floor(start / step) * step;
          stop = Math.ceil(stop / step) * step;
        } else if (step < 0) {
          start = Math.ceil(start * step) / step;
          stop = Math.floor(stop * step) / step;
        }
        prestep = step;
      }
    }

    function thresholdSturges(values) {
      return Math.ceil(Math.log(count(values)) / Math.LN2) + 1;
    }

    function bin() {
      var value = identity,
        domain = extent,
        threshold = thresholdSturges;
      function histogram(data) {
        if (!Array.isArray(data)) data = Array.from(data);
        var i,
          n = data.length,
          x,
          step,
          values = new Array(n);
        for (i = 0; i < n; ++i) {
          values[i] = value(data[i], i, data);
        }
        var xz = domain(values),
          x0 = xz[0],
          x1 = xz[1],
          tz = threshold(values, x0, x1);

        // Convert number of thresholds into uniform thresholds, and nice the
        // default domain accordingly.
        if (!Array.isArray(tz)) {
          const max = x1,
            tn = +tz;
          if (domain === extent) [x0, x1] = nice(x0, x1, tn);
          tz = ticks(x0, x1, tn);

          // If the domain is aligned with the first tick (which it will by
          // default), then we can use quantization rather than bisection to bin
          // values, which is substantially faster.
          if (tz[0] <= x0) step = tickIncrement(x0, x1, tn);

          // If the last threshold is coincident with the domain’s upper bound, the
          // last bin will be zero-width. If the default domain is used, and this
          // last threshold is coincident with the maximum input value, we can
          // extend the niced upper bound by one tick to ensure uniform bin widths;
          // otherwise, we simply remove the last threshold. Note that we don’t
          // coerce values or the domain to numbers, and thus must be careful to
          // compare order (>=) rather than strict equality (===)!
          if (tz[tz.length - 1] >= x1) {
            if (max >= x1 && domain === extent) {
              const step = tickIncrement(x0, x1, tn);
              if (isFinite(step)) {
                if (step > 0) {
                  x1 = (Math.floor(x1 / step) + 1) * step;
                } else if (step < 0) {
                  x1 = (Math.ceil(x1 * -step) + 1) / -step;
                }
              }
            } else {
              tz.pop();
            }
          }
        }

        // Remove any thresholds outside the domain.
        var m = tz.length;
        while (tz[0] <= x0) tz.shift(), --m;
        while (tz[m - 1] > x1) tz.pop(), --m;
        var bins = new Array(m + 1),
          bin;

        // Initialize bins.
        for (i = 0; i <= m; ++i) {
          bin = bins[i] = [];
          bin.x0 = i > 0 ? tz[i - 1] : x0;
          bin.x1 = i < m ? tz[i] : x1;
        }

        // Assign data to bins by value, ignoring any outside the domain.
        if (isFinite(step)) {
          if (step > 0) {
            for (i = 0; i < n; ++i) {
              if ((x = values[i]) != null && x0 <= x && x <= x1) {
                bins[Math.min(m, Math.floor((x - x0) / step))].push(data[i]);
              }
            }
          } else if (step < 0) {
            for (i = 0; i < n; ++i) {
              if ((x = values[i]) != null && x0 <= x && x <= x1) {
                const j = Math.floor((x0 - x) * step);
                bins[Math.min(m, j + (tz[j] <= x))].push(data[i]); // handle off-by-one due to rounding
              }
            }
          }
        } else {
          for (i = 0; i < n; ++i) {
            if ((x = values[i]) != null && x0 <= x && x <= x1) {
              bins[bisectRight(tz, x, 0, m)].push(data[i]);
            }
          }
        }
        return bins;
      }
      histogram.value = function (_) {
        return arguments.length ? (value = typeof _ === "function" ? _ : constant(_), histogram) : value;
      };
      histogram.domain = function (_) {
        return arguments.length ? (domain = typeof _ === "function" ? _ : constant([_[0], _[1]]), histogram) : domain;
      };
      histogram.thresholds = function (_) {
        return arguments.length ? (threshold = typeof _ === "function" ? _ : Array.isArray(_) ? constant(slice.call(_)) : constant(_), histogram) : threshold;
      };
      return histogram;
    }

    function isHist(value) {
        return Array.isArray(value.bins);
    }
    function generateHist(value, scale) {
        if (isHist(value)) {
            return value.bins;
        }
        const b = bin();
        b.domain(scale);
        return b(value).map((d) => d.length);
    }
    function renderHistogram(attr, options = {}) {
        const o = Object.assign({
            scale: [Number.NaN, Number.NaN],
            maxBin: Number.NaN,
            barPadding: 0,
        }, defaultColorOptions, options);
        const acc = resolveAccessor(attr);
        let maxBin = o.maxBin;
        let scale = o.scale;
        const backgroundColor = resolveFunction(o.backgroundColor);
        const borderColor = resolveFunction(o.borderColor);
        const viz = (ctx, node, dim) => {
            const value = acc(node);
            ctx.strokeStyle = borderColor(node);
            ctx.strokeRect(0, 0, dim.width, dim.height);
            if (value == null || !Array.isArray(value)) {
                return;
            }
            const hist = generateHist(value, scale);
            ctx.fillStyle = backgroundColor(node);
            const binWidth = (dim.width - (hist.length - 1) * o.barPadding) / hist.length;
            const yScale = (v) => (v / maxBin) * dim.height;
            let offset = 0;
            for (const histBin of hist) {
                const height = yScale(histBin);
                ctx.fillRect(offset, dim.height - height, binWidth, height);
                offset += binWidth + o.barPadding;
            }
        };
        viz.init = (nodes) => {
            if (!Number.isNaN(maxBin) && !Number.isNaN(scale[0]) && !Number.isNaN(scale[1])) {
                return;
            }
            const output = nodes.reduce((out, node) => {
                const v = acc(node);
                if (v == null || !Array.isArray(v)) {
                    return out;
                }
                if (isHist(v)) {
                    out.maxBin = v.reduce((m, b) => Math.max(m, b), out.maxBin);
                    return out;
                }
                const b = bin();
                const hist = b(v);
                out.maxBin = hist.reduce((m, histBin) => Math.max(m, histBin.length), out.maxBin);
                if (hist.length > 0) {
                    out.min = Math.min(out.min, hist[0].x0);
                    out.max = Math.max(out.max, hist[hist.length - 1].x1);
                }
                return out;
            }, {
                min: Number.POSITIVE_INFINITY,
                max: Number.NEGATIVE_INFINITY,
                maxBin: 0,
            });
            if (Number.isNaN(maxBin)) {
                maxBin = output.maxBin;
            }
            scale = [Number.isNaN(scale[0]) ? output.min : scale[0], Number.isNaN(scale[1]) ? output.max : scale[0]];
        };
        viz.defaultHeight = 20;
        viz.defaultPosition = 'bottom';
        return viz;
    }

    function renderLine(ctx, value, xScale, yScale) {
        ctx.beginPath();
        let first = true;
        for (const v of value) {
            if (v.y == null || Number.isNaN(v.y)) {
                first = true;
                continue;
            }
            if (first) {
                ctx.moveTo(xScale(v.x), yScale(v.y));
                first = false;
            }
            else {
                ctx.lineTo(xScale(v.x), yScale(v.y));
            }
        }
        ctx.stroke();
    }
    function renderArea(ctx, value, xScale, yScale, height) {
        ctx.beginPath();
        let firstIndex = null;
        let lastIndex = null;
        for (const v of value) {
            if (v.y == null || Number.isNaN(v.y)) {
                if (lastIndex != null) {
                    ctx.lineTo(xScale(lastIndex), height);
                    ctx.lineTo(xScale(firstIndex), height);
                }
                lastIndex = null;
                firstIndex = null;
                continue;
            }
            lastIndex = v.x;
            if (firstIndex == null) {
                ctx.moveTo(xScale(v.x), height);
                ctx.lineTo(xScale(v.x), yScale(v.y));
                firstIndex = v.x;
            }
            else {
                ctx.lineTo(xScale(v.x), yScale(v.y));
            }
        }
        if (lastIndex != null) {
            ctx.lineTo(xScale(lastIndex), height);
            ctx.lineTo(xScale(firstIndex), height);
        }
        ctx.fill();
    }

    function renderSparkLine(attr, options = {}) {
        const o = Object.assign({
            scale: [0, Number.NaN],
            backgroundColor: '',
            padding: 1,
            borderColor: defaultColorOptions.borderColor,
            lineColor: defaultColorOptions.borderColor,
        }, options);
        const acc = resolveAccessor(attr);
        let yScale01 = resolveScale(o.scale);
        const backgroundColor = resolveFunction(o.backgroundColor);
        const lineColor = resolveFunction(o.lineColor);
        const borderColor = resolveFunction(o.borderColor);
        const r = (ctx, node, dim) => {
            const value = acc(node);
            const bc = borderColor(node);
            if (bc) {
                ctx.strokeStyle = bc;
                ctx.strokeRect(0, 0, dim.width, dim.height);
            }
            if (value == null || !Array.isArray(value) || value.length === 0) {
                return;
            }
            const step = (dim.width - 2 * o.padding) / (value.length - 1);
            const xScale = (i) => i * step + o.padding;
            const yScale = (v) => (1 - yScale01(v)) * dim.height;
            const values = value.map((y, x) => ({ x, y: y }));
            const bg = backgroundColor(node);
            if (bg) {
                ctx.fillStyle = bg;
                renderArea(ctx, values, xScale, yScale, dim.height);
            }
            const lc = lineColor(node);
            if (lc) {
                ctx.lineCap = 'round';
                ctx.strokeStyle = lc;
                renderLine(ctx, values, xScale, yScale);
            }
        };
        r.init = (nodes) => {
            yScale01 = autoResolveScale(o.scale, () => nodes.map((v) => acc(v) || []).flat());
        };
        r.defaultHeight = 20;
        r.defaultPosition = 'bottom';
        return r;
    }

    function lineSplit(x1, y1, x2, y2, centerValue) {
        const m = (y1 - y2) / (x1 - x2);
        return (centerValue - y1) / m + x1;
    }
    function splitSegments(values, centerValue) {
        const below = [];
        const above = [];
        let previousIndex = null;
        for (let i = 0; i < values.length; i++) {
            const v = values[i];
            if (v == null || Number.isNaN(v)) {
                previousIndex = null;
                if (below.length > 0 && !Number.isNaN(below[below.length - 1].y)) {
                    below.push({ x: i, y: Number.NaN });
                }
                if (above.length > 0 && !Number.isNaN(above[above.length - 1].y)) {
                    above.push({ x: i, y: Number.NaN });
                }
                continue;
            }
            if (previousIndex != null && values[previousIndex] < centerValue !== v < centerValue) {
                const xc = lineSplit(previousIndex, values[previousIndex], i, v, centerValue);
                below.push({ x: xc, y: centerValue });
                above.push({ x: xc, y: centerValue });
            }
            if (v < centerValue) {
                below.push({ x: i, y: v });
            }
            else {
                above.push({ x: i, y: v });
            }
            previousIndex = i;
        }
        return [above, below];
    }
    function renderBinarySparkLine(attr, options = {}) {
        const o = Object.assign({
            scale: [Number.NaN, Number.NaN],
            centerValue: 0,
            aboveBackgroundColor: 'green',
            belowBackgroundColor: 'red',
            aboveLineColor: '',
            belowLineColor: '',
            borderColor: defaultColorOptions.borderColor,
            centerValueColor: '',
            padding: 1,
        }, options);
        const acc = resolveAccessor(attr);
        let yScale01 = resolveScale(o.scale);
        const borderColor = resolveFunction(o.borderColor);
        const belowBackgroundColor = resolveFunction(o.belowBackgroundColor);
        const belowLineColor = resolveFunction(o.belowLineColor);
        const aboveBackgroundColor = resolveFunction(o.aboveBackgroundColor);
        const aboveLineColor = resolveFunction(o.aboveLineColor);
        const centerValueColor = resolveFunction(o.centerValueColor);
        const r = (ctx, node, dim) => {
            const value = acc(node);
            const bc = borderColor(node);
            if (bc) {
                ctx.strokeStyle = bc;
                ctx.strokeRect(0, 0, dim.width, dim.height);
            }
            if (value == null || !Array.isArray(value) || value.length === 0) {
                return;
            }
            const step = (dim.width - 2 * o.padding) / (value.length - 1);
            const xScale = (i) => i * step + o.padding;
            const yScale = (v) => (1 - yScale01(v)) * dim.height;
            const mLC = centerValueColor(node);
            const y = yScale(o.centerValue);
            if (mLC) {
                ctx.strokeStyle = mLC;
                ctx.beginPath();
                ctx.moveTo(0, y);
                ctx.lineTo(dim.width, y);
                ctx.stroke();
            }
            const values = value.map((vy, x) => ({ x, y: vy }));
            const [above, below] = splitSegments(value, o.centerValue);
            const bBG = belowBackgroundColor(node);
            const aBG = aboveBackgroundColor(node);
            if (aBG) {
                ctx.fillStyle = aBG;
                renderArea(ctx, above, xScale, yScale, y);
            }
            if (bBG) {
                ctx.fillStyle = bBG;
                renderArea(ctx, below, xScale, yScale, y);
            }
            const bLC = belowLineColor(node);
            const aLC = aboveLineColor(node);
            if (aLC || bLC) {
                ctx.lineCap = 'round';
                if (aLC === bLC) {
                    ctx.strokeStyle = aLC;
                    renderLine(ctx, values, xScale, yScale);
                }
                else if (aLC) {
                    ctx.strokeStyle = aLC;
                    renderLine(ctx, above, xScale, yScale);
                }
                else if (bLC) {
                    ctx.strokeStyle = bLC;
                    renderLine(ctx, below, xScale, yScale);
                }
            }
        };
        r.init = (nodes) => {
            yScale01 = autoResolveScale(o.scale, () => nodes.map((v) => acc(v) || []).flat());
        };
        r.defaultHeight = 20;
        r.defaultPosition = 'bottom';
        return r;
    }

    const pi$1 = Math.PI,
      tau$1 = 2 * pi$1,
      epsilon$1 = 1e-6,
      tauEpsilon = tau$1 - epsilon$1;
    function Path() {
      this._x0 = this._y0 =
      // start of current subpath
      this._x1 = this._y1 = null; // end of current subpath
      this._ = "";
    }
    Path.prototype = {
      constructor: Path,
      moveTo: function (x, y) {
        this._ += "M" + (this._x0 = this._x1 = +x) + "," + (this._y0 = this._y1 = +y);
      },
      closePath: function () {
        if (this._x1 !== null) {
          this._x1 = this._x0, this._y1 = this._y0;
          this._ += "Z";
        }
      },
      lineTo: function (x, y) {
        this._ += "L" + (this._x1 = +x) + "," + (this._y1 = +y);
      },
      quadraticCurveTo: function (x1, y1, x, y) {
        this._ += "Q" + +x1 + "," + +y1 + "," + (this._x1 = +x) + "," + (this._y1 = +y);
      },
      bezierCurveTo: function (x1, y1, x2, y2, x, y) {
        this._ += "C" + +x1 + "," + +y1 + "," + +x2 + "," + +y2 + "," + (this._x1 = +x) + "," + (this._y1 = +y);
      },
      arcTo: function (x1, y1, x2, y2, r) {
        x1 = +x1, y1 = +y1, x2 = +x2, y2 = +y2, r = +r;
        var x0 = this._x1,
          y0 = this._y1,
          x21 = x2 - x1,
          y21 = y2 - y1,
          x01 = x0 - x1,
          y01 = y0 - y1,
          l01_2 = x01 * x01 + y01 * y01;

        // Is the radius negative? Error.
        if (r < 0) throw new Error("negative radius: " + r);

        // Is this path empty? Move to (x1,y1).
        if (this._x1 === null) {
          this._ += "M" + (this._x1 = x1) + "," + (this._y1 = y1);
        }

        // Or, is (x1,y1) coincident with (x0,y0)? Do nothing.
        else if (!(l01_2 > epsilon$1)) ;

        // Or, are (x0,y0), (x1,y1) and (x2,y2) collinear?
        // Equivalently, is (x1,y1) coincident with (x2,y2)?
        // Or, is the radius zero? Line to (x1,y1).
        else if (!(Math.abs(y01 * x21 - y21 * x01) > epsilon$1) || !r) {
          this._ += "L" + (this._x1 = x1) + "," + (this._y1 = y1);
        }

        // Otherwise, draw an arc!
        else {
          var x20 = x2 - x0,
            y20 = y2 - y0,
            l21_2 = x21 * x21 + y21 * y21,
            l20_2 = x20 * x20 + y20 * y20,
            l21 = Math.sqrt(l21_2),
            l01 = Math.sqrt(l01_2),
            l = r * Math.tan((pi$1 - Math.acos((l21_2 + l01_2 - l20_2) / (2 * l21 * l01))) / 2),
            t01 = l / l01,
            t21 = l / l21;

          // If the start tangent is not coincident with (x0,y0), line to.
          if (Math.abs(t01 - 1) > epsilon$1) {
            this._ += "L" + (x1 + t01 * x01) + "," + (y1 + t01 * y01);
          }
          this._ += "A" + r + "," + r + ",0,0," + +(y01 * x20 > x01 * y20) + "," + (this._x1 = x1 + t21 * x21) + "," + (this._y1 = y1 + t21 * y21);
        }
      },
      arc: function (x, y, r, a0, a1, ccw) {
        x = +x, y = +y, r = +r, ccw = !!ccw;
        var dx = r * Math.cos(a0),
          dy = r * Math.sin(a0),
          x0 = x + dx,
          y0 = y + dy,
          cw = 1 ^ ccw,
          da = ccw ? a0 - a1 : a1 - a0;

        // Is the radius negative? Error.
        if (r < 0) throw new Error("negative radius: " + r);

        // Is this path empty? Move to (x0,y0).
        if (this._x1 === null) {
          this._ += "M" + x0 + "," + y0;
        }

        // Or, is (x0,y0) not coincident with the previous point? Line to (x0,y0).
        else if (Math.abs(this._x1 - x0) > epsilon$1 || Math.abs(this._y1 - y0) > epsilon$1) {
          this._ += "L" + x0 + "," + y0;
        }

        // Is this arc empty? We’re done.
        if (!r) return;

        // Does the angle go the wrong way? Flip the direction.
        if (da < 0) da = da % tau$1 + tau$1;

        // Is this a complete circle? Draw two arcs to complete the circle.
        if (da > tauEpsilon) {
          this._ += "A" + r + "," + r + ",0,1," + cw + "," + (x - dx) + "," + (y - dy) + "A" + r + "," + r + ",0,1," + cw + "," + (this._x1 = x0) + "," + (this._y1 = y0);
        }

        // Is this arc non-empty? Draw an arc!
        else if (da > epsilon$1) {
          this._ += "A" + r + "," + r + ",0," + +(da >= pi$1) + "," + cw + "," + (this._x1 = x + r * Math.cos(a1)) + "," + (this._y1 = y + r * Math.sin(a1));
        }
      },
      rect: function (x, y, w, h) {
        this._ += "M" + (this._x0 = this._x1 = +x) + "," + (this._y0 = this._y1 = +y) + "h" + +w + "v" + +h + "h" + -w + "Z";
      },
      toString: function () {
        return this._;
      }
    };

    const cos = Math.cos;
    const sin = Math.sin;
    const sqrt = Math.sqrt;
    const epsilon = 1e-12;
    const pi = Math.PI;
    const tau = 2 * pi;

    var symbolCircle = {
      draw(context, size) {
        const r = sqrt(size / pi);
        context.moveTo(r, 0);
        context.arc(0, 0, r, 0, tau);
      }
    };

    var symbolCross = {
      draw(context, size) {
        const r = sqrt(size / 5) / 2;
        context.moveTo(-3 * r, -r);
        context.lineTo(-r, -r);
        context.lineTo(-r, -3 * r);
        context.lineTo(r, -3 * r);
        context.lineTo(r, -r);
        context.lineTo(3 * r, -r);
        context.lineTo(3 * r, r);
        context.lineTo(r, r);
        context.lineTo(r, 3 * r);
        context.lineTo(-r, 3 * r);
        context.lineTo(-r, r);
        context.lineTo(-3 * r, r);
        context.closePath();
      }
    };

    const tan30 = sqrt(1 / 3);
    const tan30_2 = tan30 * 2;
    var symbolDiamond = {
      draw(context, size) {
        const y = sqrt(size / tan30_2);
        const x = y * tan30;
        context.moveTo(0, -y);
        context.lineTo(x, 0);
        context.lineTo(0, y);
        context.lineTo(-x, 0);
        context.closePath();
      }
    };

    var symbolSquare = {
      draw(context, size) {
        const w = sqrt(size);
        const x = -w / 2;
        context.rect(x, x, w, w);
      }
    };

    const ka = 0.89081309152928522810;
    const kr = sin(pi / 10) / sin(7 * pi / 10);
    const kx = sin(tau / 10) * kr;
    const ky = -cos(tau / 10) * kr;
    var symbolStar = {
      draw(context, size) {
        const r = sqrt(size * ka);
        const x = kx * r;
        const y = ky * r;
        context.moveTo(0, -r);
        context.lineTo(x, y);
        for (let i = 1; i < 5; ++i) {
          const a = tau * i / 5;
          const c = cos(a);
          const s = sin(a);
          context.lineTo(s * r, -c * r);
          context.lineTo(c * x - s * y, s * x + c * y);
        }
        context.closePath();
      }
    };

    const sqrt3 = sqrt(3);
    var symbolTriangle = {
      draw(context, size) {
        const y = -sqrt(size / (sqrt3 * 3));
        context.moveTo(0, y * 2);
        context.lineTo(-sqrt3 * y, -y);
        context.lineTo(sqrt3 * y, -y);
        context.closePath();
      }
    };

    const c = -0.5;
    const s = sqrt(3) / 2;
    const k = 1 / sqrt(12);
    const a = (k / 2 + 1) * 3;
    var symbolWye = {
      draw(context, size) {
        const r = sqrt(size / a);
        const x0 = r / 2,
          y0 = r * k;
        const x1 = x0,
          y1 = r * k + r;
        const x2 = -x1,
          y2 = y1;
        context.moveTo(x0, y0);
        context.lineTo(x1, y1);
        context.lineTo(x2, y2);
        context.lineTo(c * x0 - s * y0, s * x0 + c * y0);
        context.lineTo(c * x1 - s * y1, s * x1 + c * y1);
        context.lineTo(c * x2 - s * y2, s * x2 + c * y2);
        context.lineTo(c * x0 + s * y0, c * y0 - s * x0);
        context.lineTo(c * x1 + s * y1, c * y1 - s * x1);
        context.lineTo(c * x2 + s * y2, c * y2 - s * x2);
        context.closePath();
      }
    };

    function noop () {}

    function point$3(that, x, y) {
      that._context.bezierCurveTo((2 * that._x0 + that._x1) / 3, (2 * that._y0 + that._y1) / 3, (that._x0 + 2 * that._x1) / 3, (that._y0 + 2 * that._y1) / 3, (that._x0 + 4 * that._x1 + x) / 6, (that._y0 + 4 * that._y1 + y) / 6);
    }
    function Basis(context) {
      this._context = context;
    }
    Basis.prototype = {
      areaStart: function () {
        this._line = 0;
      },
      areaEnd: function () {
        this._line = NaN;
      },
      lineStart: function () {
        this._x0 = this._x1 = this._y0 = this._y1 = NaN;
        this._point = 0;
      },
      lineEnd: function () {
        switch (this._point) {
          case 3:
            point$3(this, this._x1, this._y1);
          // falls through
          case 2:
            this._context.lineTo(this._x1, this._y1);
            break;
        }
        if (this._line || this._line !== 0 && this._point === 1) this._context.closePath();
        this._line = 1 - this._line;
      },
      point: function (x, y) {
        x = +x, y = +y;
        switch (this._point) {
          case 0:
            this._point = 1;
            this._line ? this._context.lineTo(x, y) : this._context.moveTo(x, y);
            break;
          case 1:
            this._point = 2;
            break;
          case 2:
            this._point = 3;
            this._context.lineTo((5 * this._x0 + this._x1) / 6, (5 * this._y0 + this._y1) / 6);
          // falls through
          default:
            point$3(this, x, y);
            break;
        }
        this._x0 = this._x1, this._x1 = x;
        this._y0 = this._y1, this._y1 = y;
      }
    };

    function Bundle(context, beta) {
      this._basis = new Basis(context);
      this._beta = beta;
    }
    Bundle.prototype = {
      lineStart: function () {
        this._x = [];
        this._y = [];
        this._basis.lineStart();
      },
      lineEnd: function () {
        var x = this._x,
          y = this._y,
          j = x.length - 1;
        if (j > 0) {
          var x0 = x[0],
            y0 = y[0],
            dx = x[j] - x0,
            dy = y[j] - y0,
            i = -1,
            t;
          while (++i <= j) {
            t = i / j;
            this._basis.point(this._beta * x[i] + (1 - this._beta) * (x0 + t * dx), this._beta * y[i] + (1 - this._beta) * (y0 + t * dy));
          }
        }
        this._x = this._y = null;
        this._basis.lineEnd();
      },
      point: function (x, y) {
        this._x.push(+x);
        this._y.push(+y);
      }
    };
    ((function custom(beta) {
      function bundle(context) {
        return beta === 1 ? new Basis(context) : new Bundle(context, beta);
      }
      bundle.beta = function (beta) {
        return custom(+beta);
      };
      return bundle;
    }))(0.85);

    function point$2(that, x, y) {
      that._context.bezierCurveTo(that._x1 + that._k * (that._x2 - that._x0), that._y1 + that._k * (that._y2 - that._y0), that._x2 + that._k * (that._x1 - x), that._y2 + that._k * (that._y1 - y), that._x2, that._y2);
    }
    function Cardinal(context, tension) {
      this._context = context;
      this._k = (1 - tension) / 6;
    }
    Cardinal.prototype = {
      areaStart: function () {
        this._line = 0;
      },
      areaEnd: function () {
        this._line = NaN;
      },
      lineStart: function () {
        this._x0 = this._x1 = this._x2 = this._y0 = this._y1 = this._y2 = NaN;
        this._point = 0;
      },
      lineEnd: function () {
        switch (this._point) {
          case 2:
            this._context.lineTo(this._x2, this._y2);
            break;
          case 3:
            point$2(this, this._x1, this._y1);
            break;
        }
        if (this._line || this._line !== 0 && this._point === 1) this._context.closePath();
        this._line = 1 - this._line;
      },
      point: function (x, y) {
        x = +x, y = +y;
        switch (this._point) {
          case 0:
            this._point = 1;
            this._line ? this._context.lineTo(x, y) : this._context.moveTo(x, y);
            break;
          case 1:
            this._point = 2;
            this._x1 = x, this._y1 = y;
            break;
          case 2:
            this._point = 3;
          // falls through
          default:
            point$2(this, x, y);
            break;
        }
        this._x0 = this._x1, this._x1 = this._x2, this._x2 = x;
        this._y0 = this._y1, this._y1 = this._y2, this._y2 = y;
      }
    };
    ((function custom(tension) {
      function cardinal(context) {
        return new Cardinal(context, tension);
      }
      cardinal.tension = function (tension) {
        return custom(+tension);
      };
      return cardinal;
    }))(0);

    function CardinalClosed(context, tension) {
      this._context = context;
      this._k = (1 - tension) / 6;
    }
    CardinalClosed.prototype = {
      areaStart: noop,
      areaEnd: noop,
      lineStart: function () {
        this._x0 = this._x1 = this._x2 = this._x3 = this._x4 = this._x5 = this._y0 = this._y1 = this._y2 = this._y3 = this._y4 = this._y5 = NaN;
        this._point = 0;
      },
      lineEnd: function () {
        switch (this._point) {
          case 1:
            {
              this._context.moveTo(this._x3, this._y3);
              this._context.closePath();
              break;
            }
          case 2:
            {
              this._context.lineTo(this._x3, this._y3);
              this._context.closePath();
              break;
            }
          case 3:
            {
              this.point(this._x3, this._y3);
              this.point(this._x4, this._y4);
              this.point(this._x5, this._y5);
              break;
            }
        }
      },
      point: function (x, y) {
        x = +x, y = +y;
        switch (this._point) {
          case 0:
            this._point = 1;
            this._x3 = x, this._y3 = y;
            break;
          case 1:
            this._point = 2;
            this._context.moveTo(this._x4 = x, this._y4 = y);
            break;
          case 2:
            this._point = 3;
            this._x5 = x, this._y5 = y;
            break;
          default:
            point$2(this, x, y);
            break;
        }
        this._x0 = this._x1, this._x1 = this._x2, this._x2 = x;
        this._y0 = this._y1, this._y1 = this._y2, this._y2 = y;
      }
    };
    ((function custom(tension) {
      function cardinal(context) {
        return new CardinalClosed(context, tension);
      }
      cardinal.tension = function (tension) {
        return custom(+tension);
      };
      return cardinal;
    }))(0);

    function CardinalOpen(context, tension) {
      this._context = context;
      this._k = (1 - tension) / 6;
    }
    CardinalOpen.prototype = {
      areaStart: function () {
        this._line = 0;
      },
      areaEnd: function () {
        this._line = NaN;
      },
      lineStart: function () {
        this._x0 = this._x1 = this._x2 = this._y0 = this._y1 = this._y2 = NaN;
        this._point = 0;
      },
      lineEnd: function () {
        if (this._line || this._line !== 0 && this._point === 3) this._context.closePath();
        this._line = 1 - this._line;
      },
      point: function (x, y) {
        x = +x, y = +y;
        switch (this._point) {
          case 0:
            this._point = 1;
            break;
          case 1:
            this._point = 2;
            break;
          case 2:
            this._point = 3;
            this._line ? this._context.lineTo(this._x2, this._y2) : this._context.moveTo(this._x2, this._y2);
            break;
          case 3:
            this._point = 4;
          // falls through
          default:
            point$2(this, x, y);
            break;
        }
        this._x0 = this._x1, this._x1 = this._x2, this._x2 = x;
        this._y0 = this._y1, this._y1 = this._y2, this._y2 = y;
      }
    };
    ((function custom(tension) {
      function cardinal(context) {
        return new CardinalOpen(context, tension);
      }
      cardinal.tension = function (tension) {
        return custom(+tension);
      };
      return cardinal;
    }))(0);

    function point$1(that, x, y) {
      var x1 = that._x1,
        y1 = that._y1,
        x2 = that._x2,
        y2 = that._y2;
      if (that._l01_a > epsilon) {
        var a = 2 * that._l01_2a + 3 * that._l01_a * that._l12_a + that._l12_2a,
          n = 3 * that._l01_a * (that._l01_a + that._l12_a);
        x1 = (x1 * a - that._x0 * that._l12_2a + that._x2 * that._l01_2a) / n;
        y1 = (y1 * a - that._y0 * that._l12_2a + that._y2 * that._l01_2a) / n;
      }
      if (that._l23_a > epsilon) {
        var b = 2 * that._l23_2a + 3 * that._l23_a * that._l12_a + that._l12_2a,
          m = 3 * that._l23_a * (that._l23_a + that._l12_a);
        x2 = (x2 * b + that._x1 * that._l23_2a - x * that._l12_2a) / m;
        y2 = (y2 * b + that._y1 * that._l23_2a - y * that._l12_2a) / m;
      }
      that._context.bezierCurveTo(x1, y1, x2, y2, that._x2, that._y2);
    }
    function CatmullRom(context, alpha) {
      this._context = context;
      this._alpha = alpha;
    }
    CatmullRom.prototype = {
      areaStart: function () {
        this._line = 0;
      },
      areaEnd: function () {
        this._line = NaN;
      },
      lineStart: function () {
        this._x0 = this._x1 = this._x2 = this._y0 = this._y1 = this._y2 = NaN;
        this._l01_a = this._l12_a = this._l23_a = this._l01_2a = this._l12_2a = this._l23_2a = this._point = 0;
      },
      lineEnd: function () {
        switch (this._point) {
          case 2:
            this._context.lineTo(this._x2, this._y2);
            break;
          case 3:
            this.point(this._x2, this._y2);
            break;
        }
        if (this._line || this._line !== 0 && this._point === 1) this._context.closePath();
        this._line = 1 - this._line;
      },
      point: function (x, y) {
        x = +x, y = +y;
        if (this._point) {
          var x23 = this._x2 - x,
            y23 = this._y2 - y;
          this._l23_a = Math.sqrt(this._l23_2a = Math.pow(x23 * x23 + y23 * y23, this._alpha));
        }
        switch (this._point) {
          case 0:
            this._point = 1;
            this._line ? this._context.lineTo(x, y) : this._context.moveTo(x, y);
            break;
          case 1:
            this._point = 2;
            break;
          case 2:
            this._point = 3;
          // falls through
          default:
            point$1(this, x, y);
            break;
        }
        this._l01_a = this._l12_a, this._l12_a = this._l23_a;
        this._l01_2a = this._l12_2a, this._l12_2a = this._l23_2a;
        this._x0 = this._x1, this._x1 = this._x2, this._x2 = x;
        this._y0 = this._y1, this._y1 = this._y2, this._y2 = y;
      }
    };
    ((function custom(alpha) {
      function catmullRom(context) {
        return alpha ? new CatmullRom(context, alpha) : new Cardinal(context, 0);
      }
      catmullRom.alpha = function (alpha) {
        return custom(+alpha);
      };
      return catmullRom;
    }))(0.5);

    function CatmullRomClosed(context, alpha) {
      this._context = context;
      this._alpha = alpha;
    }
    CatmullRomClosed.prototype = {
      areaStart: noop,
      areaEnd: noop,
      lineStart: function () {
        this._x0 = this._x1 = this._x2 = this._x3 = this._x4 = this._x5 = this._y0 = this._y1 = this._y2 = this._y3 = this._y4 = this._y5 = NaN;
        this._l01_a = this._l12_a = this._l23_a = this._l01_2a = this._l12_2a = this._l23_2a = this._point = 0;
      },
      lineEnd: function () {
        switch (this._point) {
          case 1:
            {
              this._context.moveTo(this._x3, this._y3);
              this._context.closePath();
              break;
            }
          case 2:
            {
              this._context.lineTo(this._x3, this._y3);
              this._context.closePath();
              break;
            }
          case 3:
            {
              this.point(this._x3, this._y3);
              this.point(this._x4, this._y4);
              this.point(this._x5, this._y5);
              break;
            }
        }
      },
      point: function (x, y) {
        x = +x, y = +y;
        if (this._point) {
          var x23 = this._x2 - x,
            y23 = this._y2 - y;
          this._l23_a = Math.sqrt(this._l23_2a = Math.pow(x23 * x23 + y23 * y23, this._alpha));
        }
        switch (this._point) {
          case 0:
            this._point = 1;
            this._x3 = x, this._y3 = y;
            break;
          case 1:
            this._point = 2;
            this._context.moveTo(this._x4 = x, this._y4 = y);
            break;
          case 2:
            this._point = 3;
            this._x5 = x, this._y5 = y;
            break;
          default:
            point$1(this, x, y);
            break;
        }
        this._l01_a = this._l12_a, this._l12_a = this._l23_a;
        this._l01_2a = this._l12_2a, this._l12_2a = this._l23_2a;
        this._x0 = this._x1, this._x1 = this._x2, this._x2 = x;
        this._y0 = this._y1, this._y1 = this._y2, this._y2 = y;
      }
    };
    ((function custom(alpha) {
      function catmullRom(context) {
        return alpha ? new CatmullRomClosed(context, alpha) : new CardinalClosed(context, 0);
      }
      catmullRom.alpha = function (alpha) {
        return custom(+alpha);
      };
      return catmullRom;
    }))(0.5);

    function CatmullRomOpen(context, alpha) {
      this._context = context;
      this._alpha = alpha;
    }
    CatmullRomOpen.prototype = {
      areaStart: function () {
        this._line = 0;
      },
      areaEnd: function () {
        this._line = NaN;
      },
      lineStart: function () {
        this._x0 = this._x1 = this._x2 = this._y0 = this._y1 = this._y2 = NaN;
        this._l01_a = this._l12_a = this._l23_a = this._l01_2a = this._l12_2a = this._l23_2a = this._point = 0;
      },
      lineEnd: function () {
        if (this._line || this._line !== 0 && this._point === 3) this._context.closePath();
        this._line = 1 - this._line;
      },
      point: function (x, y) {
        x = +x, y = +y;
        if (this._point) {
          var x23 = this._x2 - x,
            y23 = this._y2 - y;
          this._l23_a = Math.sqrt(this._l23_2a = Math.pow(x23 * x23 + y23 * y23, this._alpha));
        }
        switch (this._point) {
          case 0:
            this._point = 1;
            break;
          case 1:
            this._point = 2;
            break;
          case 2:
            this._point = 3;
            this._line ? this._context.lineTo(this._x2, this._y2) : this._context.moveTo(this._x2, this._y2);
            break;
          case 3:
            this._point = 4;
          // falls through
          default:
            point$1(this, x, y);
            break;
        }
        this._l01_a = this._l12_a, this._l12_a = this._l23_a;
        this._l01_2a = this._l12_2a, this._l12_2a = this._l23_2a;
        this._x0 = this._x1, this._x1 = this._x2, this._x2 = x;
        this._y0 = this._y1, this._y1 = this._y2, this._y2 = y;
      }
    };
    ((function custom(alpha) {
      function catmullRom(context) {
        return alpha ? new CatmullRomOpen(context, alpha) : new CardinalOpen(context, 0);
      }
      catmullRom.alpha = function (alpha) {
        return custom(+alpha);
      };
      return catmullRom;
    }))(0.5);

    function sign(x) {
      return x < 0 ? -1 : 1;
    }

    // Calculate the slopes of the tangents (Hermite-type interpolation) based on
    // the following paper: Steffen, M. 1990. A Simple Method for Monotonic
    // Interpolation in One Dimension. Astronomy and Astrophysics, Vol. 239, NO.
    // NOV(II), P. 443, 1990.
    function slope3(that, x2, y2) {
      var h0 = that._x1 - that._x0,
        h1 = x2 - that._x1,
        s0 = (that._y1 - that._y0) / (h0 || h1 < 0 && -0),
        s1 = (y2 - that._y1) / (h1 || h0 < 0 && -0),
        p = (s0 * h1 + s1 * h0) / (h0 + h1);
      return (sign(s0) + sign(s1)) * Math.min(Math.abs(s0), Math.abs(s1), 0.5 * Math.abs(p)) || 0;
    }

    // Calculate a one-sided slope.
    function slope2(that, t) {
      var h = that._x1 - that._x0;
      return h ? (3 * (that._y1 - that._y0) / h - t) / 2 : t;
    }

    // According to https://en.wikipedia.org/wiki/Cubic_Hermite_spline#Representations
    // "you can express cubic Hermite interpolation in terms of cubic Bézier curves
    // with respect to the four values p0, p0 + m0 / 3, p1 - m1 / 3, p1".
    function point(that, t0, t1) {
      var x0 = that._x0,
        y0 = that._y0,
        x1 = that._x1,
        y1 = that._y1,
        dx = (x1 - x0) / 3;
      that._context.bezierCurveTo(x0 + dx, y0 + dx * t0, x1 - dx, y1 - dx * t1, x1, y1);
    }
    function MonotoneX(context) {
      this._context = context;
    }
    MonotoneX.prototype = {
      areaStart: function () {
        this._line = 0;
      },
      areaEnd: function () {
        this._line = NaN;
      },
      lineStart: function () {
        this._x0 = this._x1 = this._y0 = this._y1 = this._t0 = NaN;
        this._point = 0;
      },
      lineEnd: function () {
        switch (this._point) {
          case 2:
            this._context.lineTo(this._x1, this._y1);
            break;
          case 3:
            point(this, this._t0, slope2(this, this._t0));
            break;
        }
        if (this._line || this._line !== 0 && this._point === 1) this._context.closePath();
        this._line = 1 - this._line;
      },
      point: function (x, y) {
        var t1 = NaN;
        x = +x, y = +y;
        if (x === this._x1 && y === this._y1) return; // Ignore coincident points.
        switch (this._point) {
          case 0:
            this._point = 1;
            this._line ? this._context.lineTo(x, y) : this._context.moveTo(x, y);
            break;
          case 1:
            this._point = 2;
            break;
          case 2:
            this._point = 3;
            point(this, slope2(this, t1 = slope3(this, x, y)), t1);
            break;
          default:
            point(this, this._t0, t1 = slope3(this, x, y));
            break;
        }
        this._x0 = this._x1, this._x1 = x;
        this._y0 = this._y1, this._y1 = y;
        this._t0 = t1;
      }
    };
    (Object.create(MonotoneX.prototype)).point = function (x, y) {
      MonotoneX.prototype.point.call(this, y, x);
    };

    const symbols = {
        circle: symbolCircle,
        cross: symbolCross,
        diamond: symbolDiamond,
        square: symbolSquare,
        star: symbolStar,
        triangle: symbolTriangle,
        wye: symbolWye,
    };
    function isSymbol(s) {
        return typeof s.draw === 'function';
    }
    function isTextSymbol(s) {
        return typeof s.text === 'string';
    }
    function renderSymbol(options = {}) {
        const o = Object.assign({
            symbol: 'circle',
            color: '#cccccc',
        }, options);
        const symbol = resolveFunction(o.symbol);
        const backgroundColor = resolveFunction(o.color);
        const r = (ctx, node, dim) => {
            const bg = backgroundColor(node);
            const s = symbol(node);
            if (bg == null || s == null) {
                return;
            }
            ctx.fillStyle = bg;
            if (isSymbol(s) || typeof s === 'string') {
                const sym = isSymbol(s) ? s : symbols[s] || symbolCircle;
                ctx.translate(dim.width / 2, dim.height / 2);
                ctx.beginPath();
                sym.draw(ctx, 0.5 * (dim.width * dim.height));
                ctx.fill();
                ctx.translate(-dim.width / 2, -dim.height / 2);
            }
            else if (isTextSymbol(s)) {
                ctx.save();
                if (s.font) {
                    ctx.font = s.font;
                }
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(s.text, dim.width / 2, dim.height / 2);
                ctx.restore();
            }
            else {
                ctx.drawImage(s, 0, 0, dim.width, dim.height);
            }
        };
        r.defaultHeight = 8;
        r.defaultWidth = 8;
        r.defaultPosition = 'top-left';
        return r;
    }

    function register(cytoscape) {
        cytoscape('core', 'overlays', overlays);
    }
    if (typeof window.cytoscape !== 'undefined') {
        register(window.cytoscape);
    }

    exports.default = register;
    exports.defaultColorOptions = defaultColorOptions;
    exports.overlays = overlays;
    exports.renderBar = renderBar;
    exports.renderBinarySparkLine = renderBinarySparkLine;
    exports.renderBoxplot = renderBoxplot;
    exports.renderHistogram = renderHistogram;
    exports.renderSparkLine = renderSparkLine;
    exports.renderSymbol = renderSymbol;

    Object.defineProperty(exports, '__esModule', { value: true });

}));
//# sourceMappingURL=index.umd.js.map
