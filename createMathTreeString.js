/*
 *
 */
const { alias } = require("./constants");

var createMathTreeString = function(n)
{
  var oneNode = function(n)
  {
    if (!n || !n.localName) return '';

    // munderover
    if (n.localName.match(/munderover/)) {
      return '/' + alias[n.localName] +
        '/{' + oneNode(n.childNodes[0]) + '/}' +
        '/{' + oneNode(n.childNodes[1]) + '/}' +
        '/{' + oneNode(n.childNodes[2]) + '/}';
    }
    // msubsup
    else if (n.localName.match(/msubsup/)) {
      return '/' + alias[n.localName] +
        '/{' + oneNode(n.childNodes[1]) + '/}' +
        '/{' + oneNode(n.childNodes[2]) + '/}';
    }
    // mfrac, mroot, munder, mover
    else if (n.localName.match(/mfrac|mroot|munder|mover/)) {
      let args = [];
      for (let i = 0; i < n.childNodes.length; i++) {
        const child = n.childNodes[i];
        if (!child.localName) continue; // テキストノード除外
        const childStr = oneNode(child);
        if (childStr === '') continue;  // 空文字も除外
        args.push(childStr);
        if (args.length === 2) break;
      }
      while (args.length < 2) args.push('');
      return '/' + alias[n.localName] +
        '/{' + args[0] + '/}' +
        '/{' + args[1] + '/}';
    }
    // msqrt, mtd
    else if (n.localName.match(/msqrt|mtd/)) {
      // 有効なElementノードのみ処理
      for (let i = 0; i < n.childNodes.length; i++) {
        const child = n.childNodes[i];
        if (child.localName) {
          return '/' + alias[n.localName] + '/{' + oneNode(child) + '/}';
        }
      }
      return '/' + alias[n.localName] + '/{/' + '}';
    }
    // msub, msup
    else if (n.localName.match(/msub|msup/)) {
      // 2番目の有効なElementノードのみ
      let count = 0;
      for (let i = 0; i < n.childNodes.length; i++) {
        const child = n.childNodes[i];
        if (!child.localName) continue;
        count++;
        if (count === 2) {
          return '/' + alias[n.localName] + '/{' + oneNode(child) + '/}';
        }
      }
      return '/' + alias[n.localName] + '/{/' + '}';
    }
    // mtable, mtr
    else if (n.localName.match(/mtable|mtr/)) {
      var mtableXStr = '/' + alias[n.localName];
      for (var i = 0; i < n.childNodes.length; i++) {
        const child = n.childNodes[i];
        if (!child.localName) continue;
        mtableXStr += '/{' + oneNode(child) + '/}';
      }
      return mtableXStr;
    }
    // mrow, math
    else if (n.localName === 'mrow' || n.localName === 'math') {
      var mrowXStr = '';
      for (var i = 0; i < n.childNodes.length; i++) {
        const child = n.childNodes[i];
        if (!child.localName) continue;
        mrowXStr += oneNode(child);
      }
      return mrowXStr;
    }
    // mi, mn, mo
    else if (n.localName.match(/mi|mn|mo/)) {
      //console.log('mi/mn/mo childNodes:', n.childNodes);

  let value = '';
  for (let i = 0; i < n.childNodes.length; i++) {
    let value = n.textContent ? n.textContent.trim() : '';
  if (value === '') return '';
  if (value.match(/[{}\\:]/)) {
    return '\\' + value;
  } else {
    return value;
  }
}
    }
    
    // その他
    else {
      if (!n.childNodes) return '';
      for (let i = 0; i < n.childNodes.length; i++) {
        const child = n.childNodes[i];
        if (child.localName) return oneNode(child);
      }
      return '';
    }
  };

  return oneNode(n);
};
module.exports = { createMathTreeString };

// createMathTreeStringT も同様に修正（テキストノード除外）
var createMathTreeStringT = function(n)
{
  var oneNode = function(n)
  {
    var mrowXStr = '';
    if (n.localName === 'mi' || n.localName === 'mn' || n.localName === 'mo') {
      if (!n.firstChild || !n.firstChild.nodeValue) return '';
      if (n.firstChild.nodeValue === '>') {
        return '<' + n.localName + '>' + '&lt;' + '</' + n.localName + '>';
      } else if (n.firstChild.nodeValue === '<') {
        return '<' + n.localName + '>' + '&gt;' + '</' + n.localName + '>';
      } else {
        return '<' + n.localName + '>' + n.firstChild.nodeValue + '</' + n.localName + '>';
      }
    } else {
      mrowXStr += '<' + n.localName;
      if (n.localName === 'math') {
        mrowXStr += ' mathsize="250%" xmlns="http://www.w3.org/1998/Math/MathML"';
      }
      mrowXStr += '>';
      for (var i = 0; i < n.childNodes.length; i++) {
        const child = n.childNodes[i];
        if (!child.localName) continue;
        mrowXStr += oneNode(child);
      }
      mrowXStr += '</' + n.localName + '>';
      return mrowXStr;
    }
  };
  return oneNode(n);
};
