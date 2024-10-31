"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.SerializeAddon = void 0;
function constrain(value, low, high) {
    return Math.max(low, Math.min(value, high));
}
var BaseSerializeHandler = (function () {
    function BaseSerializeHandler(_buffer) {
        this._buffer = _buffer;
    }
    BaseSerializeHandler.prototype.serialize = function (startRow, endRow) {
        var cell1 = this._buffer.getNullCell();
        var cell2 = this._buffer.getNullCell();
        var oldCell = cell1;
        this._beforeSerialize(endRow - startRow, startRow, endRow);
        for (var row = startRow; row < endRow; row++) {
            var line = this._buffer.getLine(row);
            if (line) {
                for (var col = 0; col < line.length; col++) {
                    var c = line.getCell(col, oldCell === cell1 ? cell2 : cell1);
                    if (!c) {
                        console.warn("Can't get cell at row=" + row + ", col=" + col);
                        continue;
                    }
                    this._nextCell(c, oldCell, row, col);
                    oldCell = c;
                }
            }
            this._rowEnd(row, row === endRow - 1);
        }
        this._afterSerialize();
        return this._serializeString();
    };
    BaseSerializeHandler.prototype._nextCell = function (cell, oldCell, row, col) { };
    BaseSerializeHandler.prototype._rowEnd = function (row, isLastRow) { };
    BaseSerializeHandler.prototype._beforeSerialize = function (rows, startRow, endRow) { };
    BaseSerializeHandler.prototype._afterSerialize = function () { };
    BaseSerializeHandler.prototype._serializeString = function () { return ''; };
    return BaseSerializeHandler;
}());
function equalFg(cell1, cell2) {
    return cell1.getFgColorMode() === cell2.getFgColorMode()
        && cell1.getFgColor() === cell2.getFgColor();
}
function equalBg(cell1, cell2) {
    return cell1.getBgColorMode() === cell2.getBgColorMode()
        && cell1.getBgColor() === cell2.getBgColor();
}
function equalFlags(cell1, cell2) {
    return cell1.isInverse() === cell2.isInverse()
        && cell1.isBold() === cell2.isBold()
        && cell1.isUnderline() === cell2.isUnderline()
        && cell1.isBlink() === cell2.isBlink()
        && cell1.isInvisible() === cell2.isInvisible()
        && cell1.isItalic() === cell2.isItalic()
        && cell1.isDim() === cell2.isDim();
}
var StringSerializeHandler = (function (_super) {
    __extends(StringSerializeHandler, _super);
    function StringSerializeHandler(_buffer1, _terminal) {
        var _this = _super.call(this, _buffer1) || this;
        _this._buffer1 = _buffer1;
        _this._terminal = _terminal;
        _this._rowIndex = 0;
        _this._allRows = new Array();
        _this._allRowSeparators = new Array();
        _this._currentRow = '';
        _this._nullCellCount = 0;
        _this._cursorStyle = _this._buffer1.getNullCell();
        _this._cursorStyleRow = 0;
        _this._cursorStyleCol = 0;
        _this._backgroundCell = _this._buffer1.getNullCell();
        _this._firstRow = 0;
        _this._lastCursorRow = 0;
        _this._lastCursorCol = 0;
        _this._lastContentCursorRow = 0;
        _this._lastContentCursorCol = 0;
        _this._thisRowLastChar = _this._buffer1.getNullCell();
        _this._thisRowLastSecondChar = _this._buffer1.getNullCell();
        _this._nextRowFirstChar = _this._buffer1.getNullCell();
        return _this;
    }
    StringSerializeHandler.prototype._beforeSerialize = function (rows, start, end) {
        this._allRows = new Array(rows);
        this._lastContentCursorRow = start;
        this._lastCursorRow = start;
        this._firstRow = start;
    };
    StringSerializeHandler.prototype._rowEnd = function (row, isLastRow) {
        var _a;
        if (this._nullCellCount > 0 && !equalBg(this._cursorStyle, this._backgroundCell)) {
            this._currentRow += "\u001B[" + this._nullCellCount + "X";
        }
        var rowSeparator = '';
        if (!isLastRow) {
            if (row - this._firstRow >= this._terminal.rows) {
                (_a = this._buffer1.getLine(this._cursorStyleRow)) === null || _a === void 0 ? void 0 : _a.getCell(this._cursorStyleCol, this._backgroundCell);
            }
            var currentLine = this._buffer1.getLine(row);
            var nextLine = this._buffer1.getLine(row + 1);
            if (!nextLine.isWrapped) {
                rowSeparator = '\r\n';
                this._lastCursorRow = row + 1;
                this._lastCursorCol = 0;
            }
            else {
                rowSeparator = '';
                var thisRowLastChar = currentLine.getCell(currentLine.length - 1, this._thisRowLastChar);
                var thisRowLastSecondChar = currentLine.getCell(currentLine.length - 2, this._thisRowLastSecondChar);
                var nextRowFirstChar = nextLine.getCell(0, this._nextRowFirstChar);
                var isNextRowFirstCharDoubleWidth = nextRowFirstChar.getWidth() > 1;
                var isValid = false;
                if (nextRowFirstChar.getChars() &&
                    isNextRowFirstCharDoubleWidth ? this._nullCellCount <= 1 : this._nullCellCount <= 0) {
                    if ((thisRowLastChar.getChars() || thisRowLastChar.getWidth() === 0) &&
                        equalBg(thisRowLastChar, nextRowFirstChar)) {
                        isValid = true;
                    }
                    if (isNextRowFirstCharDoubleWidth &&
                        (thisRowLastSecondChar.getChars() || thisRowLastSecondChar.getWidth() === 0) &&
                        equalBg(thisRowLastChar, nextRowFirstChar) &&
                        equalBg(thisRowLastSecondChar, nextRowFirstChar)) {
                        isValid = true;
                    }
                }
                if (!isValid) {
                    rowSeparator = '-'.repeat(this._nullCellCount + 1);
                    rowSeparator += '\x1b[1D\x1b[1X';
                    if (this._nullCellCount > 0) {
                        rowSeparator += '\x1b[A';
                        rowSeparator += "\u001B[" + (currentLine.length - this._nullCellCount) + "C";
                        rowSeparator += "\u001B[" + this._nullCellCount + "X";
                        rowSeparator += "\u001B[" + (currentLine.length - this._nullCellCount) + "D";
                        rowSeparator += '\x1b[B';
                    }
                    this._lastContentCursorRow = row + 1;
                    this._lastContentCursorCol = 0;
                    this._lastCursorRow = row + 1;
                    this._lastCursorCol = 0;
                }
            }
        }
        this._allRows[this._rowIndex] = this._currentRow;
        this._allRowSeparators[this._rowIndex++] = rowSeparator;
        this._currentRow = '';
        this._nullCellCount = 0;
    };
    StringSerializeHandler.prototype._diffStyle = function (cell, oldCell) {
        var sgrSeq = [];
        var fgChanged = !equalFg(cell, oldCell);
        var bgChanged = !equalBg(cell, oldCell);
        var flagsChanged = !equalFlags(cell, oldCell);
        if (fgChanged || bgChanged || flagsChanged) {
            if (cell.isAttributeDefault()) {
                if (!oldCell.isAttributeDefault()) {
                    sgrSeq.push(0);
                }
            }
            else {
                if (fgChanged) {
                    var color = cell.getFgColor();
                    if (cell.isFgRGB()) {
                        sgrSeq.push(38, 2, (color >>> 16) & 0xFF, (color >>> 8) & 0xFF, color & 0xFF);
                    }
                    else if (cell.isFgPalette()) {
                        if (color >= 16) {
                            sgrSeq.push(38, 5, color);
                        }
                        else {
                            sgrSeq.push(color & 8 ? 90 + (color & 7) : 30 + (color & 7));
                        }
                    }
                    else {
                        sgrSeq.push(39);
                    }
                }
                if (bgChanged) {
                    var color = cell.getBgColor();
                    if (cell.isBgRGB()) {
                        sgrSeq.push(48, 2, (color >>> 16) & 0xFF, (color >>> 8) & 0xFF, color & 0xFF);
                    }
                    else if (cell.isBgPalette()) {
                        if (color >= 16) {
                            sgrSeq.push(48, 5, color);
                        }
                        else {
                            sgrSeq.push(color & 8 ? 100 + (color & 7) : 40 + (color & 7));
                        }
                    }
                    else {
                        sgrSeq.push(49);
                    }
                }
                if (flagsChanged) {
                    if (cell.isInverse() !== oldCell.isInverse()) {
                        sgrSeq.push(cell.isInverse() ? 7 : 27);
                    }
                    if (cell.isBold() !== oldCell.isBold()) {
                        sgrSeq.push(cell.isBold() ? 1 : 22);
                    }
                    if (cell.isUnderline() !== oldCell.isUnderline()) {
                        sgrSeq.push(cell.isUnderline() ? 4 : 24);
                    }
                    if (cell.isBlink() !== oldCell.isBlink()) {
                        sgrSeq.push(cell.isBlink() ? 5 : 25);
                    }
                    if (cell.isInvisible() !== oldCell.isInvisible()) {
                        sgrSeq.push(cell.isInvisible() ? 8 : 28);
                    }
                    if (cell.isItalic() !== oldCell.isItalic()) {
                        sgrSeq.push(cell.isItalic() ? 3 : 23);
                    }
                    if (cell.isDim() !== oldCell.isDim()) {
                        sgrSeq.push(cell.isDim() ? 2 : 22);
                    }
                }
            }
        }
        return sgrSeq;
    };
    StringSerializeHandler.prototype._nextCell = function (cell, oldCell, row, col) {
        var isPlaceHolderCell = cell.getWidth() === 0;
        if (isPlaceHolderCell) {
            return;
        }
        var isEmptyCell = cell.getChars() === '';
        var sgrSeq = this._diffStyle(cell, this._cursorStyle);
        var styleChanged = isEmptyCell ? !equalBg(this._cursorStyle, cell) : sgrSeq.length > 0;
        if (styleChanged) {
            if (this._nullCellCount > 0) {
                if (!equalBg(this._cursorStyle, this._backgroundCell)) {
                    this._currentRow += "\u001B[" + this._nullCellCount + "X";
                }
                this._currentRow += "\u001B[" + this._nullCellCount + "C";
                this._nullCellCount = 0;
            }
            this._lastContentCursorRow = this._lastCursorRow = row;
            this._lastContentCursorCol = this._lastCursorCol = col;
            this._currentRow += "\u001B[" + sgrSeq.join(';') + "m";
            var line = this._buffer1.getLine(row);
            if (line !== undefined) {
                line.getCell(col, this._cursorStyle);
                this._cursorStyleRow = row;
                this._cursorStyleCol = col;
            }
        }
        if (isEmptyCell) {
            this._nullCellCount += cell.getWidth();
        }
        else {
            if (this._nullCellCount > 0) {
                if (equalBg(this._cursorStyle, this._backgroundCell)) {
                    this._currentRow += "\u001B[" + this._nullCellCount + "C";
                }
                else {
                    this._currentRow += "\u001B[" + this._nullCellCount + "X";
                    this._currentRow += "\u001B[" + this._nullCellCount + "C";
                }
                this._nullCellCount = 0;
            }
            this._currentRow += cell.getChars();
            this._lastContentCursorRow = this._lastCursorRow = row;
            this._lastContentCursorCol = this._lastCursorCol = col + cell.getWidth();
        }
    };
    StringSerializeHandler.prototype._serializeString = function () {
        var rowEnd = this._allRows.length;
        if (this._buffer1.length - this._firstRow <= this._terminal.rows) {
            rowEnd = this._lastContentCursorRow + 1 - this._firstRow;
            this._lastCursorCol = this._lastContentCursorCol;
            this._lastCursorRow = this._lastContentCursorRow;
        }
        var content = '';
        for (var i = 0; i < rowEnd; i++) {
            content += this._allRows[i];
            if (i + 1 < rowEnd) {
                content += this._allRowSeparators[i];
            }
        }
        var realCursorRow = this._buffer1.baseY + this._buffer1.cursorY;
        var realCursorCol = this._buffer1.cursorX;
        var cursorMoved = (realCursorRow !== this._lastCursorRow || realCursorCol !== this._lastCursorCol);
        var moveRight = function (offset) {
            if (offset > 0) {
                content += "\u001B[" + offset + "C";
            }
            else if (offset < 0) {
                content += "\u001B[" + -offset + "D";
            }
        };
        var moveDown = function (offset) {
            if (offset > 0) {
                content += "\u001B[" + offset + "B";
            }
            else if (offset < 0) {
                content += "\u001B[" + -offset + "A";
            }
        };
        if (cursorMoved) {
            moveDown(realCursorRow - this._lastCursorRow);
            moveRight(realCursorCol - this._lastCursorCol);
        }
        return content;
    };
    return StringSerializeHandler;
}(BaseSerializeHandler));
var SerializeAddon = (function () {
    function SerializeAddon() {
    }
    SerializeAddon.prototype.activate = function (terminal) {
        this._terminal = terminal;
    };
    SerializeAddon.prototype._getString = function (buffer, scrollback) {
        var maxRows = buffer.length;
        var handler = new StringSerializeHandler(buffer, this._terminal);
        var correctRows = (scrollback === undefined) ? maxRows : constrain(scrollback + this._terminal.rows, 0, maxRows);
        var result = handler.serialize(maxRows - correctRows, maxRows);
        return result;
    };
    SerializeAddon.prototype.serialize = function (scrollback) {
        if (!this._terminal) {
            throw new Error('Cannot use addon until it has been loaded');
        }
        if (this._terminal.buffer.active.type === 'normal') {
            return this._getString(this._terminal.buffer.active, scrollback);
        }
        var normalScreenContent = this._getString(this._terminal.buffer.normal, scrollback);
        var alternativeScreenContent = this._getString(this._terminal.buffer.alternate, undefined);
        return normalScreenContent
            + '\u001b[?1049h\u001b[H'
            + alternativeScreenContent;
    };
    SerializeAddon.prototype.dispose = function () { };
    return SerializeAddon;
}());
exports.SerializeAddon = SerializeAddon;
//# sourceMappingURL=SerializeAddon.js.map