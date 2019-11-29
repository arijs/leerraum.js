
export function getCutsHeight(rPars, getIndexHeight, lHeight, pMargin) {
	var cuts = [];
	var y = 0;
	var pcount = rPars.length;
	var cutHeight = getIndexHeight(0);
	for (var i = 0; i < pcount; i++) {
		var rLines = rPars[i];
		var lCount = rLines.length;
		var py = lCount * lHeight;
		if (y + pMargin > cutHeight - lHeight) {
			y = py + pMargin;
			cuts.push([i, 0, y, y]);
			cutHeight = getIndexHeight(cuts.length);
		} else if (y + py > cutHeight) {
			var lBefore = Math.floor(py / lHeight);
			var lAfter = lCount - lBefore;
			y = lAfter ? lAfter * lHeight + pMargin : 0;
			cuts.push([i, lBefore, y, lBefore * lHeight + y]);
			cutHeight = getIndexHeight(cuts.length);
		} else {
			y += py + pMargin;
		}
	}
	return cuts;
}

export function colsEqualizeLastPage(rPars, cuts, colsPerPage, lHeight, pMargin) {
	var totalCols = cuts.length + 1;
	var pages = [];
	var parPos = 0;
	var i, pcols, col;
	while (totalCols > colsPerPage) {
		pcols = [];
		for (i = 0; i < colsPerPage; i++) {
			col = [];
			var cut = cuts.shift();
			while (parPos < cut[0]) {
				col.push(rPars[parPos]);
				parPos++;
			}
			var parCut = rPars[parPos];
			if (cut[1] >= parCut.length) {
				col.push(parCut);
				parPos++;
			} else if (cut[1] > 0) {
				col.push(parCut.splice(0, cut[1]));
			}
			pcols.push(col);
		}
		pages.push(pcols);
		totalCols -= colsPerPage;
	}
	var lastPageHeightSum = 0;
	for (i = parPos; i < rPars.length; i++) {
		lastPageHeightSum += rPars[i].length * lHeight + pMargin;
	}
	var lastPageHeightCol = lastPageHeightSum / colsPerPage;
	var colHeight = 0;
	var parRemain = rPars.length - parPos;
	col = [];
	pcols = [];
	while (parRemain) {
		var cpar = rPars[parPos];
		var lpar = cpar.length;
		var spaceForLines = Math.round((lastPageHeightCol - colHeight) / lHeight);
		if (pcols.length + 1 >= colsPerPage || spaceForLines >= lpar) {
			col.push(cpar);
			parPos++;
			parRemain--;
			colHeight += lpar * lHeight + pMargin;
		} else {
			if (spaceForLines > 0) {
				col.push(cpar.splice(0, spaceForLines));
			}
			pcols.push(col);
			col = [];
			colHeight = 0;
		}
	}
	pcols.push(col);
	pages.push(pcols);
	return pages;
}

export function paragraphsToPageColumns(pars, getPageHeight, numCols, lHeight, pMargin) {
	function indexHeight(index) {
		var page = Math.floor(index / numCols);
		return getPageHeight(page, index);
	}
	var cuts = getCutsHeight(pars, indexHeight, lHeight, pMargin);
	return colsEqualizeLastPage(pars, cuts, numCols, lHeight, pMargin);
}
