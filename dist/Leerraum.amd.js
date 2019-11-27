define('Leerraum', ['exports'], function (exports) { 'use strict';

function memoize(f) {
    var memo = {};
    return function (a) {
        if (memo[a] !== undefined) {
            return memo[a];
        }
        else {
            memo[a] = f(a);
            return memo[a];
        }
    };
}
function zip(a, b) {
    return a.map(function (e, i) {
        return [e, b[i]];
    });
}
// Streams
function cons(a, stream) {
    return function (index) {
        if (index == 0)
            { return a; }
        else
            { return stream(index - 1); }
    };
}
function skip(skipBy, stream) {
    return function (index) {
        return stream(index + skipBy);
    };
}
function map(f) {
    return function (stream) {
        return function (index) {
            return f(stream(index));
        };
    };
}
// BBoxes
function bboxesIntersect(bbox1, bbox2) {
    return !(bbox1.x + bbox1.width < bbox2.x || bbox1.y + bbox1.height < bbox2.y ||
        bbox2.x + bbox2.width < bbox1.x || bbox2.y + bbox2.height < bbox1.y);
}
function bboxEq(bbox1, bbox2) {
    var e = 0.001;
    return bbox1.x >= bbox2.x - e && bbox1.x <= bbox2.x + e &&
        bbox1.y >= bbox2.y - e && bbox1.y <= bbox2.y + e &&
        bbox1.width >= bbox2.width - e && bbox1.width <= bbox2.width + e &&
        bbox1.height >= bbox2.height - e && bbox1.height <= bbox2.height + e;
}
function mergeBBoxes(bbox1, bbox2) {
    var xmin = Math.min(bbox1.x, bbox2.x), ymin = Math.min(bbox1.y, bbox2.y), xmax = Math.max(bbox1.x + bbox1.width, bbox2.x + bbox2.width), ymax = Math.max(bbox1.y + bbox1.height, bbox2.y + bbox2.height);
    return { x: xmin, y: ymin, width: xmax - xmin, height: ymax - ymin };
}
function bboxForPoints(points) {
    var xmax = Number.MIN_VALUE, ymax = Number.MIN_VALUE, xmin = Number.MAX_VALUE, ymin = Number.MAX_VALUE;
    for (var _i = 0, points_1 = points; _i < points_1.length; _i++) {
        var point = points_1[_i];
        xmax = Math.max(xmax, point.x);
        xmin = Math.min(xmin, point.x);
        ymax = Math.max(ymax, point.y);
        ymin = Math.min(ymin, point.y);
    }
    return { x: xmin, y: xmin, width: xmax - xmin, height: ymax - ymin };
}

/*!
 * Knuth and Plass line breaking algorithm in JavaScript
 *
 * Licensed under the new BSD License.
 * Copyright 2009-2010, Bram Stein
 * All rights reserved.
 */
var linebreak = require('./linebreak').linebreak();
function justify(measureText, hypher, spans, options) {
    var nodes = [];
    spans.forEach(function (span, spanIndex, spanArray) {
        var words = span.text.split(/\s/), spaceWidth = measureText(span.fontFamily, span.fontSize, ' '), o = {
            space: {
                width: options && options.space.width || 3,
                stretch: options && options.space.stretch || 6,
                shrink: options && options.space.shrink || 9
            }
        }, hyphenWidth = measureText(span.fontFamily, span.fontSize, '-'), hyphenPenalty = 100, spaceStretch = (spaceWidth * o.space.width) / o.space.stretch, spaceShrink = (spaceWidth * o.space.width) / o.space.shrink;
        words.forEach(function (word, index, array) {
            var hyphenated = span.hyphenate ? hypher.hyphenate(word) : [word];
            if (hyphenated.length > 1 && word.length > 4) {
                hyphenated.forEach(function (part, partIndex, partArray) {
                    nodes.push({ style: span, value: linebreak.box(measureText(span.fontFamily, span.fontSize, part), part) });
                    if (partIndex !== partArray.length - 1) {
                        nodes.push({ style: span, value: linebreak.penalty(hyphenWidth, hyphenPenalty, 1) });
                    }
                });
            }
            else {
                nodes.push({ style: span, value: linebreak.box(measureText(span.fontFamily, span.fontSize, word), word) });
            }
            if (spanIndex === spanArray.length - 1 && index === array.length - 1) {
                nodes.push({ style: span, value: linebreak.glue(0, linebreak.infinity, 0) });
                nodes.push({ style: span, value: linebreak.penalty(0, -linebreak.infinity, 1) });
            }
            // don't add space after a span
            else if (index !== array.length - 1) {
                nodes.push({ style: span, value: linebreak.glue(spaceWidth, spaceStretch, spaceShrink) });
            }
        });
    });
    return nodes;
}
function left(measureText, hypher, spans, options) {
    var nodes = [];
    spans.forEach(function (span, spanIndex, spanArray) {
        var words = span.text.split(/\s/), spaceWidth = measureText(span.fontFamily, span.fontSize, ' '), o = {
            space: {
                width: options && options.space.width || 3,
                stretch: options && options.space.stretch || 6,
                shrink: options && options.space.shrink || 9
            }
        }, hyphenWidth = measureText(span.fontFamily, span.fontSize, '-'), hyphenPenalty = 100;
        words.forEach(function (word, index, array) {
            var hyphenated = span.hyphenate ? hypher.hyphenate(word) : [word];
            if (hyphenated.length > 1 && word.length > 4) {
                hyphenated.forEach(function (part, partIndex, partArray) {
                    nodes.push({ style: span, value: linebreak.box(measureText(span.fontFamily, span.fontSize, part), part) });
                    if (partIndex !== partArray.length - 1) {
                        nodes.push({ style: span, value: linebreak.penalty(hyphenWidth, hyphenPenalty, 1) });
                    }
                });
            }
            else {
                nodes.push({ style: span, value: linebreak.box(measureText(span.fontFamily, span.fontSize, word), word) });
            }
            if (spanIndex === spanArray.length - 1 && index === array.length - 1) {
                nodes.push({ style: span, value: linebreak.glue(0, linebreak.infinity, 0) });
                nodes.push({ style: span, value: linebreak.penalty(0, -linebreak.infinity, 1) });
            }
            // don't add space after a span
            else if (index !== array.length - 1) {
                nodes.push({ style: span, value: linebreak.glue(0, 12, 0) });
                nodes.push({ style: span, value: linebreak.penalty(0, 0, 0) });
                nodes.push({ style: span, value: linebreak.glue(spaceWidth, -12, 0) });
            }
        });
    });
    return nodes;
}
function center(measureText, hypher, spans, options) {
    var nodes = [];
    // Although not specified in the Knuth and Plass whitepaper, this box is necessary
    // to keep the glue from disappearing.
    if (spans.length > 0) {
        nodes.push({ style: spans[0], value: linebreak.box(0, '') });
        nodes.push({ style: spans[0], value: linebreak.glue(0, 12, 0) });
    }
    spans.forEach(function (span, spanIndex, spanArray) {
        var words = span.text.split(/\s/), spaceWidth = measureText(span.fontFamily, span.fontSize, ' '), o = {
            space: {
                width: options && options.space.width || 3,
                stretch: options && options.space.stretch || 6,
                shrink: options && options.space.shrink || 9
            }
        }, hyphenWidth = measureText(span.fontFamily, span.fontSize, '-'), hyphenPenalty = 100;
        words.forEach(function (word, index, array) {
            var hyphenated = hypher.hyphenate(word);
            if (hyphenated.length > 1 && word.length > 4) {
                hyphenated.forEach(function (part, partIndex, partArray) {
                    nodes.push({ style: span, value: linebreak.box(measureText(span.fontFamily, span.fontSize, part), part) });
                    if (partIndex !== partArray.length - 1) {
                        nodes.push({ style: span, value: linebreak.penalty(hyphenWidth, hyphenPenalty, 1) });
                    }
                });
            }
            else {
                nodes.push({ style: span, value: linebreak.box(measureText(span.fontFamily, span.fontSize, word), word) });
            }
            if (spanIndex === spanArray.length - 1 && index === array.length - 1) {
                nodes.push({ style: span, value: linebreak.glue(0, 12, 0) });
                nodes.push({ style: span, value: linebreak.penalty(0, -linebreak.infinity, 0) });
            }
            // don't add space after a span
            else if (index !== array.length - 1) {
                nodes.push({ style: span, value: linebreak.glue(0, 12, 0) });
                nodes.push({ style: span, value: linebreak.penalty(0, 0, 0) });
                nodes.push({ style: span, value: linebreak.glue(spaceWidth, -24, 0) });
                nodes.push({ style: span, value: linebreak.box(0, '') });
                nodes.push({ style: span, value: linebreak.penalty(0, linebreak.infinity, 0) });
                nodes.push({ style: span, value: linebreak.glue(0, 12, 0) });
            }
        });
    });
    return nodes;
}

var idRenderer = function (_, __) {
    return [[], []];
};
function landscape(f) {
    return { width: f.height, height: f.width };
}
// https://github.com/devongovett/pdfkit/blob/master/lib/page.coffee
var formats = {
    '4A0': { width: 4767.87, height: 6740.79 },
    '2A0': { width: 3370.39, height: 4767.87 },
    A0: { width: 2383.94, height: 3370.39 },
    A1: { width: 1683.78, height: 2383.94 },
    A2: { width: 1190.55, height: 1683.78 },
    A3: { width: 841.89, height: 1190.55 },
    A4: { width: 595.28, height: 841.89 },
    A5: { width: 419.53, height: 595.28 },
    A6: { width: 297.64, height: 419.53 },
    A7: { width: 209.76, height: 297.64 },
    A8: { width: 147.40, height: 209.76 },
    A9: { width: 104.88, height: 147.40 },
    A10: { width: 73.70, height: 104.88 },
    B0: { width: 2834.65, height: 4008.19 },
    B1: { width: 2004.09, height: 2834.65 },
    B2: { width: 1417.32, height: 2004.09 },
    B3: { width: 1000.63, height: 1417.32 },
    B4: { width: 708.66, height: 1000.63 },
    B5: { width: 498.90, height: 708.66 },
    B6: { width: 354.33, height: 498.90 },
    B7: { width: 249.45, height: 354.33 },
    B8: { width: 175.75, height: 249.45 },
    B9: { width: 124.72, height: 175.75 },
    B10: { width: 87.87, height: 124.72 },
    C0: { width: 2599.37, height: 3676.54 },
    C1: { width: 1836.85, height: 2599.37 },
    C2: { width: 1298.27, height: 1836.85 },
    C3: { width: 918.43, height: 1298.27 },
    C4: { width: 649.13, height: 918.43 },
    C5: { width: 459.21, height: 649.13 },
    C6: { width: 323.15, height: 459.21 },
    C7: { width: 229.61, height: 323.15 },
    C8: { width: 161.57, height: 229.61 },
    C9: { width: 113.39, height: 161.57 },
    C10: { width: 79.37, height: 113.39 },
    RA0: { width: 2437.80, height: 3458.27 },
    RA1: { width: 1729.13, height: 2437.80 },
    RA2: { width: 1218.90, height: 1729.13 },
    RA3: { width: 864.57, height: 1218.90 },
    RA4: { width: 609.45, height: 864.57 },
    SRA0: { width: 2551.18, height: 3628.35 },
    SRA1: { width: 1814.17, height: 2551.18 },
    SRA2: { width: 1275.59, height: 1814.17 },
    SRA3: { width: 907.09, height: 1275.59 },
    SRA4: { width: 637.80, height: 907.09 },
    EXECUTIVE: { width: 521.86, height: 756.00 },
    FOLIO: { width: 612.00, height: 936.00 },
    LEGAL: { width: 612.00, height: 1008.00 },
    LETTER: { width: 612.00, height: 792.00 },
    TABLOID: { width: 792.00, height: 1224.00 }
};

var linebreak$1 = require('./typeset/linebreak').linebreak();
// Combinators -------------------------------------------------------------------- 
function combine(renderers) {
    return function (measures, bboxes) {
        var rendered_bboxes = [];
        var temp_bboxes = [];
        var text_nodes = [];
        for (var _i = 0, renderers_1 = renderers; _i < renderers_1.length; _i++) {
            var _a = renderers_1[_i], streamf = _a[0], renderer = _a[1];
            var _b = renderer(measures, map(streamf)(bboxes)), rendered_bboxes_ = _b[0], rendered_nodes_ = _b[1];
            temp_bboxes = temp_bboxes.concat(rendered_bboxes_);
            text_nodes = text_nodes.concat(rendered_nodes_);
        }
        // rendered_bboxes_/temp_bboxes may span multiple bboxes from the original bboxes stream; however, other renderers rely
        // on the fact that the rendered bboxes are always contained in their original bbox. this is why we need to
        // find out which rendered box intersects with which original bbox here.
        // this is O(n^2); could be simplified and sped up if renderers return original bbox index along with rendered bboxes.
        var intersect_map = {};
        for (var _c = 0, temp_bboxes_1 = temp_bboxes; _c < temp_bboxes_1.length; _c++) {
            var bbox = temp_bboxes_1[_c];
            var index = 0, bbox_ = void 0, intersected = false;
            while (bbox_ = bboxes(index)) {
                if (bboxesIntersect(bbox, bbox_)) {
                    if (intersect_map[index] === undefined) {
                        intersect_map[index] = [];
                    }
                    intersect_map[index].push(bbox);
                    intersected = true;
                }
                else if (intersected) {
                    break;
                }
                index++;
            }
        }
        // we need to return the rendered bboxes in the same order as the bbox stream, so we sort by bbox stream index here
        var intersect_indices = Object.keys(intersect_map).sort();
        for (var _d = 0, intersect_indices_1 = intersect_indices; _d < intersect_indices_1.length; _d++) {
            var intersect_index = intersect_indices_1[_d];
            var intersect_list = intersect_map[intersect_index];
            var rendered_bbox = intersect_list[0];
            for (var index = 1; index < intersect_list.length; index++) {
                rendered_bbox = mergeBBoxes(rendered_bbox, intersect_list[index]);
            }
            rendered_bboxes.push(rendered_bbox);
        }
        return [rendered_bboxes, text_nodes];
    };
}
function vertically(renderers) {
    return function (measures, bboxes) {
        var text_nodes = [];
        var bboxes_ = bboxes;
        var rendered_bboxes = [];
        for (var _i = 0, renderers_2 = renderers; _i < renderers_2.length; _i++) {
            var renderer = renderers_2[_i];
            var _a = renderer(measures, bboxes_), rendered_bboxes_ = _a[0], rendered_nodes_ = _a[1];
            if (rendered_bboxes_.length > 0) {
                var last_bbox = null;
                var rendered_bbox = rendered_bboxes_[rendered_bboxes_.length - 1];
                var index = 0;
                while ((last_bbox = bboxes_(index)) !== null) {
                    if (bboxesIntersect(last_bbox, rendered_bbox))
                        { break; }
                    index++;
                }
                if (last_bbox != null) {
                    var rest_bbox = {
                        x: last_bbox.x,
                        y: rendered_bbox.y + rendered_bbox.height,
                        width: last_bbox.width,
                        height: last_bbox.y + last_bbox.height - (rendered_bbox.y + rendered_bbox.height)
                    };
                    if (rest_bbox.height > 0) {
                        bboxes_ = cons(rest_bbox, skip(index + 1, bboxes_));
                    }
                    else {
                        bboxes_ = skip(index + 1, bboxes_);
                    }
                }
            }
            rendered_bboxes = rendered_bboxes.concat(rendered_bboxes_);
            text_nodes = text_nodes.concat(rendered_nodes_);
        }
        return [rendered_bboxes, text_nodes];
    };
}
// Renderers ---------------------------------------------------------------------- 
// TODO: letter spacing
function renderParagraph(paragraph) {
    return function (measures, bboxes) {
        var text_nodes = [];
        var text_y = 0;
        var y;
        var old_bbox = null;
        var current_bbox, current_bbox_index;
        var rendered_bboxes = [];
        var getBBoxForTextY = function (leading, y) {
            var top = 0, index = 0, bbox = null;
            while ((bbox = bboxes(index)) !== null) {
                if (y - top < bbox.height) {
                    return [bbox, index];
                }
                top += Math.floor(bbox.height / leading) * leading;
                index++;
            }
            return [null, index];
        };
        var linelength = function (line) {
            var _a = getBBoxForTextY(paragraph.leading, text_y + (line + 1) * paragraph.leading), bbox = _a[0], _ = _a[1];
            var indent = (paragraph.leftIndentation ? paragraph.leftIndentation(line) : 0) +
                (paragraph.rightIndentation ? paragraph.rightIndentation(line) : 0);
            return bbox !== null ? bbox.width - indent : null;
        };
        var align;
        switch (paragraph.align) {
            case 'left':
            default:
                align = left;
                break;
            case 'center':
                align = center;
                break;
            case 'justify':
                align = justify;
                break;
        }
        var nodes = align(measures.measure, paragraph.hypher /*|| hypher_en */, paragraph.spans, null);
        var breaks = linebreak$1(nodes.map(function (n) { return n.value; }), memoize(linelength), { tolerance: paragraph.tolerance || 10 });
        var lines = [];
        var lineStart = 0;
        // typeset: Iterate through the line breaks, and split the nodes at the
        // correct point.
        for (var i = 1; i < breaks.length; i += 1) {
            var point = breaks[i].position, r = breaks[i].ratio;
            for (var j = lineStart; j < nodes.length; j += 1) {
                // typeset: After a line break, we skip any nodes unless they are boxes or forced breaks.
                if (nodes[j].value.type === 'box' || (nodes[j].value.type === 'penalty' && nodes[j].value.penalty === -linebreak$1.infinity)) {
                    lineStart = j;
                    break;
                }
            }
            lines.push({ ratio: r, nodes: nodes.slice(lineStart, point + 1), position: point });
            lineStart = point;
        }
        y = 0;
        lines.forEach(function (line, lineIndex) {
            var _a;
            var x = 0;
            var x_offset = 0;
            var x_indent = paragraph.leftIndentation ? paragraph.leftIndentation(lineIndex) : 0;
            y += paragraph.leading;
            text_y += paragraph.leading;
            _a = getBBoxForTextY(paragraph.leading, text_y), current_bbox = _a[0], current_bbox_index = _a[1];
            if (old_bbox !== null && !bboxEq(current_bbox, old_bbox)) {
                y = paragraph.leading;
            }
            old_bbox = current_bbox;
            line.nodes.forEach(function (node, index, array) {
                // workaround for pdfkit's blatant disregard of baselines :)
                var asc = measures.fontMetrics(node.style.fontFamily).ascender;
                var y_offset = -asc / 1000 * node.style.fontSize;
                var x_ = current_bbox.x + x, y_ = current_bbox.y + y;
                if (node.value.type === 'box') {
                    // try to left align glyph edges
                    if (x === 0) {
                        var leftBearing = node.value.value[0] ? measures.glyphMetrics(node.style.fontFamily, node.value.value[0]).leftBearing : 0;
                        x_offset = -leftBearing / 1000 * node.style.fontSize;
                    }
                    text_nodes.push({
                        type: 'text',
                        x: x_ + x_offset + x_indent,
                        y: y_ + y_offset,
                        span: node.style,
                        text: node.value.value,
                    });
                    x += node.value.width;
                }
                else if (node.value.type === 'glue') {
                    x += node.value.width + line.ratio * (line.ratio < 0 ? node.value.shrink : node.value.stretch);
                }
                else if (node.value.type === 'penalty' && node.value.penalty === 100 && index === array.length - 1) {
                    text_nodes.push({
                        type: 'text',
                        x: x_ + x_offset + x_indent,
                        y: y_ + y_offset,
                        span: node.style,
                        text: '-',
                    });
                }
            });
        });
        for (var index = 0; index < current_bbox_index; index++) {
            rendered_bboxes.push(bboxes(index));
        }
        if (current_bbox !== null && current_bbox !== undefined) {
            rendered_bboxes.push({
                x: current_bbox.x,
                y: current_bbox.y,
                width: current_bbox.width,
                height: Math.min(current_bbox.height, y + (paragraph.paragraphLeading || 0))
            });
        }
        return [rendered_bboxes, text_nodes];
    };
}
function renderText(text) {
    return vertically(text.map(function (p) { return renderParagraph(p); }));
}
function renderColumns(gap, columns) {
    var xs = [];
    var acc = 0;
    for (var _i = 0, columns_1 = columns; _i < columns_1.length; _i++) {
        var _a = columns_1[_i], width = _a[0], renderer = _a[1];
        xs.push([[acc, width], renderer]);
        acc += width + gap;
    }
    var split = function (_a) {
        var x = _a[0], width = _a[1];
        return function (bbox) {
            return { x: bbox.x + x, y: bbox.y, width: width, height: bbox.height };
        };
    };
    return combine(xs.map(function (_a) {
        var x = _a[0], r = _a[1];
        return [split(x), r];
    }));
}
function renderTable(gap, cols, cells) {
    return vertically(cells.map(function (row) { return renderColumns(gap, zip(cols, row)); }));
}
function renderPolygon(points, style) {
    return function (_, bboxes) {
        var ref = bboxes(0), bbox = bboxForPoints(points);
        return [[{ x: ref.x + bbox.x, y: ref.y + bbox.x, width: bbox.width, height: bbox.height }],
            [{ type: 'polygon', x: ref.x, y: ref.y, points: points.map(function (p) { return { x: p.x + ref.x, y: p.y + ref.y }; }), style: style }]];
    };
}
// Misc --------------------------------------------------------------------------- 
function pdfKitDocMeasures(doc) {
    return {
        measure: function (fontFamily, fontSize, text) {
            return doc.font(fontFamily)._font.widthOfString(text, fontSize);
        },
        fontMetrics: function (fontFamily) {
            return {
                ascender: doc.font(fontFamily)._font.ascender
            };
        },
        glyphMetrics: function (fontFamily, glyph) {
            return {
                leftBearing: doc.font(fontFamily)._font.font.layout(glyph).glyphs[0]._metrics.leftBearing
            };
        }
    };
}
function jsPdfDocMeasures(doc) {
    return {
        measure: function (fontFamily, fontSize, text) {
            var ff = String(fontFamily).split('\t');
            return doc.setFont(ff[0], ff[1]).getStringUnitWidth(text) * fontSize;
        },
        fontMetrics: function (fontFamily) {
            return {
                ascender: 0
            };
        },
        glyphMetrics: function (fontFamily, glyph) {
            return {
                leftBearing: 0
            };
        }
    };
}
// PDF output --------------------------------------------------------------------- 
function setStyle(doc, style) {
    if (style.lineWidth !== undefined)
        { doc.lineWidth(style.lineWidth); }
    if (style.strokeColor !== undefined)
        { doc.strokeColor(style.strokeColor); }
    if (style.fillColor !== undefined)
        { doc.fillColor(style.fillColor); }
    if (style.strokeOpacity !== undefined)
        { doc.strokeOpacity(style.fillColor); }
    if (style.fillOpacity !== undefined)
        { doc.fillOpacity(style.fillColor); }
    if (style.lineJoin !== undefined)
        { doc.lineJoin(style.lineJoin); }
    if (style.lineCap !== undefined)
        { doc.lineCap(style.lineCap); }
}
function renderToPages(doc, format, layers, background) {
    var page_count = 0;
    for (var _i = 0, layers_1 = layers; _i < layers_1.length; _i++) {
        var layer = layers_1[_i];
        for (var _a = 0, layer_1 = layer; _a < layer_1.length; _a++) {
            var node = layer_1[_a];
            var page = Math.floor(node.y / format.height);
            page_count = Math.max(page_count, page);
        }
    }
    var pages = Array(page_count + 1).fill([]);
    if (background) {
        for (var page = 0; page <= page_count; page++) {
            for (var _b = 0, _c = background(page); _b < _c.length; _b++) {
                var layer = _c[_b];
                for (var _d = 0, layer_2 = layer; _d < layer_2.length; _d++) {
                    var node = layer_2[_d];
                    pages[page].push(node);
                }
            }
        }
    }
    for (var _e = 0, layers_2 = layers; _e < layers_2.length; _e++) {
        var layer = layers_2[_e];
        for (var _f = 0, layer_3 = layer; _f < layer_3.length; _f++) {
            var node = layer_3[_f];
            var page = Math.floor(node.y / format.height);
            pages[page].push(node);
        }
    }
    for (var page = 0; page <= page_count; page++) {
        if (page != 0) {
            doc.addPage();
        }
        for (var _g = 0, _h = pages[page]; _g < _h.length; _g++) {
            var node = _h[_g];
            doc.save();
            switch (node.type) {
                case 'text':
                    doc.save();
                    setStyle(doc, node.span.style || {});
                    doc.font(node.span.fontFamily).fontSize(node.span.fontSize)._fragment(node.text, node.x, node.y - page * format.height, node.span.options || {});
                    doc.restore();
                    break;
                case 'polygon':
                    doc.save();
                    setStyle(doc, node.style || {});
                    if (node.style.fillColor && node.style.strokeColor) {
                        doc.polygon.apply(doc, node.points.map(function (_a) {
                            var x = _a.x, y = _a.y;
                            return [x, y];
                        }));
                        doc.fillAndStroke();
                    }
                    else if (node.style.fillColor) {
                        doc.polygon.apply(doc, node.points.map(function (_a) {
                            var x = _a.x, y = _a.y;
                            return [x, y];
                        }));
                        doc.fill();
                    }
                    else if (node.style.strokeColor) {
                        doc.polygon.apply(doc, node.points.map(function (_a) {
                            var x = _a.x, y = _a.y;
                            return [x, y];
                        }));
                        doc.stroke();
                    }
                    doc.restore();
                    break;
            }
        }
    }
}
function renderToPDF(filename, format, renderers, background, PDFDocument, fs) {
    var doc = new PDFDocument({
        layout: 'portrait',
        size: [format.width, format.height]
    });
    var measures = pdfKitDocMeasures(doc);
    var ws = fs.createWriteStream(filename);
    doc.pipe(ws);
    var background_ = undefined;
    if (background) {
        background_ = function (page) {
            return background(page).map(function (r) { return r.renderer(measures, r.bboxes)[1]; });
        };
    }
    renderToPages(doc, format, renderers.map(function (r) { return r.renderer(measures, r.bboxes)[1]; }), background_);
    doc.end();
    return ws;
}
function withMargins(format, marginTop, marginRight, marginBottom, marginLeft) {
    return function (index) {
        return { tag: 'new_page', x: marginLeft, y: index * format.height + marginTop, width: format.width - (marginLeft + marginRight), height: format.height - (marginTop + marginBottom) };
    };
}
function columnsWithMargins(format, gap, marginTop, marginRight, marginBottom, marginLeft) {
    return function (index) {
        if (index % 2 === 0) {
            return { tag: 'new_page', x: marginLeft, y: Math.floor(index / 2) * format.height + marginTop, width: format.width / 2 - gap / 2 - marginLeft, height: format.height - (marginTop + marginBottom) };
        }
        else {
            return { x: gap / 2 + format.width / 2, y: Math.floor(index / 2) * format.height + marginTop, width: format.width / 2 - gap / 2 - marginRight, height: format.height - (marginTop + marginBottom) };
        }
    };
}
var pageBreak = function (_, bboxes) {
    var index = 0, rendered_bboxes = [];
    while (bboxes(index).tag !== 'new_page') {
        rendered_bboxes.push(bboxes(index));
        index++;
    }
    return [rendered_bboxes, []];
};

exports.columnsWithMargins = columnsWithMargins;
exports.combine = combine;
exports.formats = formats;
exports.idRenderer = idRenderer;
exports.jsPdfDocMeasures = jsPdfDocMeasures;
exports.landscape = landscape;
exports.pageBreak = pageBreak;
exports.pdfKitDocMeasures = pdfKitDocMeasures;
exports.renderColumns = renderColumns;
exports.renderParagraph = renderParagraph;
exports.renderPolygon = renderPolygon;
exports.renderTable = renderTable;
exports.renderText = renderText;
exports.renderToPDF = renderToPDF;
exports.renderToPages = renderToPages;
exports.vertically = vertically;
exports.withMargins = withMargins;

Object.defineProperty(exports, '__esModule', { value: true });

});
