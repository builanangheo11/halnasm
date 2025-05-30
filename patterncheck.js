const fs = require("fs");
const { JSDOM } = require("jsdom");
const { createQueryString } = require("./createQueryString");
const { queryTokenize } = require("./queryTokenize");
const { queryParse } = require("./queryParse");
const { normalizePmmlTree } = require("./normalize");
const { createMathTreeString } = require("./createMathTreeString");

function getQueryPatternFromMathML(filePath) {
  const mmlSource = fs.readFileSync(filePath, "utf-8");
  const dom = new JSDOM(mmlSource, { contentType: "text/xml" });
  global.window = dom.window;
  global.document = dom.window.document;
  const $ = require('jquery')(window);
  global.$ = $;
  require('./prototypeMethods')(dom.window);
  const mathElem = document.querySelector("math");

  if (!mathElem) throw new Error("❌ MathML内に<math>タグが見つかりません");

  const normalized = normalizePmmlTree(mathElem);
  const mathTreeString = createMathTreeString(normalized);
  const queryString = createQueryString(`<math>${normalized.innerHTML}</math>`);
  return { queryString, mathTreeString, normalized };
}

function matchPattern(queryPath, targetPath) {
  // Step 1: クエリ式の正規化・ツリー化・正規表現化
  let queryString, mathTreeString, normalized;
  try {
    console.log("🧩 Step 1: クエリ式のMathMLを読み込み＆正規化...");
    ({ queryString, mathTreeString, normalized } = getQueryPatternFromMathML(queryPath));
    console.log("✅ createQueryString 出力:\n", queryString);
    console.log("✅ createMathTreeString 出力:\n", mathTreeString);
    console.log("✅ normalized MathML:\n", normalized.outerHTML);
  } catch (err) {
    console.error("🚨 Step 1 失敗:", err.message);
    return;
  }

  // Step 2: パターンのトークン化
  let tokens;
  try {
    console.log("🧩 Step 2: パターンのトークン化...");
    tokens = queryTokenize(queryString);
    console.log("✅ トークン配列:", tokens);
  } catch (err) {
    console.error("🚨 Step 2 失敗:", err.message);
    return;
  }

  // Step 3: パターンの正規表現生成
   let parsed;
  try {
    console.log("🧩 Step 3: 正規表現構文解析...");
    parsed = queryParse(tokens);
    if (!parsed || !parsed.query) throw new Error("正規表現の構文解析に失敗しました");
    console.log("✅ 生成された正規表現:\n", parsed.query);
  } catch (err) {
    console.error("🚨 Step 3 失敗:", err.message);
    return;
  }

  // Step 4: 対象式の正規化・ツリー化・正規表現化
  let targetQueryString, targetMathTreeString, targetNormalized;
  try {
    console.log("🧩 Step 4: 対象MathMLの読み込み＆正規化...");
    ({ queryString: targetQueryString, mathTreeString: targetMathTreeString, normalized: targetNormalized } = getQueryPatternFromMathML(targetPath));
    console.log("✅ 対象式の正規表現文字列:\n", targetQueryString);
    console.log("✅ 対象式のMathTree文字列:\n", targetMathTreeString);
    console.log("✅ 対象式のnormalized MathML:\n", targetNormalized.outerHTML);
  } catch (err) {
    console.error("🚨 Step 4 失敗:", err.message);
    return;
  }

  // Step 5: マッチング判定
  try {
    console.log("🧩 Step 5: マッチング判定...");
    const regex = new RegExp(parsed.query);
    const result = regex.test(targetQueryString);
    console.log("🔍 マッチ結果:", result ? "✅ マッチしました" : "❌ マッチしませんでした");
  } catch (err) {
    console.error("🚨 Step 5 失敗:", err.message);
  }
}

// 実行例
// matchPattern("パターンのMathMLファイルパス", "対象のMathMLファイルパス");
matchPattern(__dirname + "/test.mml", __dirname + "/test_target.html");
