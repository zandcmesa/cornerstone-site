var DIR = Folder("~").fsName + "/sermon-bumper";
var LOGF = new File(DIR + "/render.log");
function log(s) { LOGF.open("a"); LOGF.write(String(s) + "\n"); LOGF.close(); }
function find(name, type) { for (var i = 1; i <= app.project.numItems; i++) { var it = app.project.item(i); if (it.name == name && (!type || it instanceof type)) return it; } return null; }
function layersNamed(c, name) { var out = []; for (var i = 1; i <= c.numLayers; i++) if (c.layer(i).name == name) out.push(c.layer(i)); return out; }
function readJson(path) { var f = new File(path); f.encoding = "UTF-8"; f.open("r"); var t = f.read(); f.close(); return eval("(" + t + ")"); }
function setText(compName, text) { var c = find(compName, CompItem); var p = c.layer(1).property("Source Text"); p.expression = ""; var td = p.value; td.text = text; p.setValue(td); }
function setScale(compName, s) { var c = find(compName, CompItem); var p = c.layer(1).property("ADBE Transform Group").property("ADBE Scale"); p.expression = ""; p.setValue([s, s, 100]); }
function stripEffects(comp, layerName) { var ls = layersNamed(comp, layerName); for (var i = 0; i < ls.length; i++) { var fx = ls[i].property("ADBE Effect Parade"); for (var e = fx.numProperties; e >= 1; e--) { var nm = fx.property(e).name; if (/Set Matte|Compound Blur|Motion Tile|Transform/.test(nm)) { log("strip " + comp.name + "/" + layerName + ": " + nm); fx.property(e).remove(); } } } }

try {
  LOGF.open("w"); LOGF.write(""); LOGF.close();
  var d = readJson(DIR + "/sermon.json");
  var lines = d.lines || [], n = Math.max(1, lines.length), ROW = 283;
  log("title lines: " + lines.join(" | ") + " size=" + d.size + " series=" + d.series);
  var scene1 = find("Scene_01", CompItem);
  for (var w = 0; w < 4; w++) {
    var nm = "TextS1_0" + (w + 1), txt = w < lines.length ? lines[w] : "";
    setText(nm, txt); setScale(nm, 289 * d.size / 143);
    var ls = layersNamed(scene1, nm);
    for (var k = 0; k < ls.length; k++) {
      var L = ls[k], t = L.property("ADBE Transform Group"), pos = t.property("ADBE Position"), op = t.property("ADBE Opacity");
      pos.expression = ""; op.expression = "";
      var centerY = L.parent ? 50 : 1048, v = pos.value;
      pos.setValue([v[0], centerY - (n - 1) * ROW / 2 + w * ROW, 0]);
      op.setValue(txt ? 100 : 0);
    }
  }
  setText("TextS1_05", d.series || "");
  var sl = layersNamed(scene1, "TextS1_05"); for (var s = 0; s < sl.length; s++) { var sop = sl[s].property("ADBE Transform Group").property("ADBE Opacity"); sop.expression = ""; sop.setValue(d.series ? 100 : 0); }
  setText("TextS1_06", d.subtitle || "");
  setText("TextS4_07", String((new Date()).getFullYear()));
  var intro = find("Intro", CompItem), outro = find("Outro", CompItem);
  stripEffects(intro, "Scene_05"); stripEffects(outro, "Scene_04"); stripEffects(outro, "Scene_05");
  for (var i = 1; i <= outro.numLayers; i++) { var ol = outro.layer(i); var fxn = []; var fxp = ol.property("ADBE Effect Parade"); for (var e = 1; e <= fxp.numProperties; e++) fxn.push(fxp.property(e).name); log("outro layer " + i + " " + ol.name + " [" + fxn.join(", ") + "]"); }

  var rq = app.project.renderQueue; while (rq.numItems) rq.item(1).remove();
  var jobs = [["Intro", "intro.mp4"], ["Outro", "outro.mp4"]];
  for (var j = 0; j < jobs.length; j++) {
    var out = new File(DIR + "/" + jobs[j][1]); if (out.exists) out.remove();
    var it = rq.items.add(find(jobs[j][0], CompItem)); it.applyTemplate("Best Settings");
    try { it.setSettings({ "Resolution": "Half" }); } catch (e1) { log("setSettings: " + e1); }
    var om = it.outputModule(1); om.applyTemplate("H.264 - Match Render Settings - 15 Mbps"); om.file = out;
  }
  log("rendering"); rq.render();
  for (var r = 1; r <= rq.numItems; r++) log("job " + r + " status=" + rq.item(r).status + " done=" + (rq.item(r).status == RQItemStatus.DONE));
  app.project.save();
  log("done");
} catch (e) { log("ERROR line " + e.line + ": " + e); }
