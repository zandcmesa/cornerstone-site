var HOME = Folder("~").fsName;
var DIR = HOME + "/sermon-bumper";
var LOG = [];
function log(s) { LOG.push(String(s)); }
function flush() { var f = new File(DIR + "/adapt.log"); f.open("w"); f.write(LOG.join("\n")); f.close(); }
function find(name, type) { for (var i = 1; i <= app.project.numItems; i++) { var it = app.project.item(i); if (it.name == name && (!type || it instanceof type)) return it; } return null; }
function layer(c, name, nth) { var k = 0; for (var i = 1; i <= c.numLayers; i++) if (c.layer(i).name == name && ++k == (nth || 1)) return c.layer(i); return null; }
function layersNamed(c, name) { var out = []; for (var i = 1; i <= c.numLayers; i++) if (c.layer(i).name == name) out.push(c.layer(i)); return out; }
function importFile(path, name) { var old = find(name); if (old) return old; var it = app.project.importFile(new ImportOptions(File(path))); it.name = name; return it; }
function removeLayersNamed(c, names) { for (var i = c.numLayers; i >= 1; i--) { for (var n = 0; n < names.length; n++) if (c.layer(i).name == names[n]) { c.layer(i).remove(); break; } } }
function removeLayersWithSource(c, srcName) { for (var i = c.numLayers; i >= 1; i--) { var L = c.layer(i); if (L instanceof AVLayer && L.source && L.source.name == srcName) L.remove(); } }
var JSON_REF = 'footage("sermon.json").sourceData';

function widenWordComp(name, newW, srcExpr, scaleExpr) {
  var c = find(name, CompItem); if (!c) { log("missing comp " + name); return null; }
  var oldW = c.width; c.width = newW;
  var t = c.layer(1); var doc = t.property("Source Text");
  var td = doc.value; td.justification = ParagraphJustification.CENTER_JUSTIFY; doc.setValue(td);
  t.property("ADBE Transform Group").property("ADBE Anchor Point").setValue([0, td.fontSize * -0.3, 0]);
  t.property("ADBE Transform Group").property("ADBE Position").setValue([newW / 2, c.height / 2, 0]);
  if (srcExpr) doc.expression = srcExpr;
  if (scaleExpr) t.property("ADBE Transform Group").property("ADBE Scale").expression = scaleExpr;
  log(name + ": " + oldW + " -> " + newW + (doc.expressionError ? " EXPR ERROR " + doc.expressionError : ""));
  return { comp: c, oldW: oldW, newW: newW };
}
function reanchor(scene, compName, newW, h) { var ls = layersNamed(scene, compName); for (var i = 0; i < ls.length; i++) ls[i].property("ADBE Transform Group").property("ADBE Anchor Point").setValue([newW / 2, h / 2, 0]); }

app.beginUndoGroup("Cornerstone adapt");
var folder = find("Cornerstone", FolderItem) || app.project.items.addFolder("Cornerstone");
var mountain = importFile(DIR + "/mountain.mp4", "mountain.mp4"); mountain.parentFolder = folder;
var drone = importFile(DIR + "/drone.mov", "drone.mov"); drone.parentFolder = folder;
var logo = importFile(DIR + "/logo.png", "logo.png"); logo.parentFolder = folder;
var data = importFile(DIR + "/sermon.json", "sermon.json"); data.parentFolder = folder;
log("imported: " + mountain.width + "x" + mountain.height + " " + mountain.duration + "s, drone " + drone.duration + "s, logo " + logo.width + "x" + logo.height);

// ---- Scene_01: title stack ----
var scene1 = find("Scene_01", CompItem);
var ROW = 283, N_EXPR = "var L = " + JSON_REF + ".lines; var n = 0; for (var i = 0; i < L.length; i++) if (L[i] != '') n = i + 1; n = Math.max(n, 1);";
var wordScale = "var s = 289 * " + JSON_REF + ".size / 143; [s, s, 100]";
for (var w = 0; w < 4; w++) {
  var nm = "TextS1_0" + (w + 1);
  var info = widenWordComp(nm, 3400, "var L = " + JSON_REF + ".lines; (L.length > " + w + " ? L[" + w + "] : '')", wordScale);
  reanchor(scene1, nm, 3400, info.comp.height);
  var ls = layersNamed(scene1, nm);
  for (var k = 0; k < ls.length; k++) {
    var L = ls[k]; var p = L.property("ADBE Transform Group").property("ADBE Position"); var v = p.value;
    var centerY = L.parent ? 50 : 1048;
    p.expression = N_EXPR + " var y = " + centerY + " - (n - 1) * " + ROW + " / 2 + " + w + " * " + ROW + "; [" + v[0] + ", y, 0]";
    L.property("ADBE Transform Group").property("ADBE Opacity").expression = "(" + JSON_REF + ".lines.length > " + w + " && " + JSON_REF + ".lines[" + w + "] != '') ? 100 : 0";
  }
}
var seriesInfo = widenWordComp("TextS1_05", 2600, JSON_REF + ".series", null); reanchor(scene1, "TextS1_05", 2600, seriesInfo.comp.height);
layer(scene1, "TextS1_05").property("ADBE Transform Group").property("ADBE Opacity").expression = JSON_REF + ".series != '' ? 100 : 0";
var subInfo = widenWordComp("TextS1_06", 3000, JSON_REF + ".subtitle", null); reanchor(scene1, "TextS1_06", 3000, subInfo.comp.height);
scene1.duration = 5.0;
for (var i = 1; i <= scene1.numLayers; i++) { var L1 = scene1.layer(i); if (L1.outPoint > 2.5 && L1.outPoint < 4.9) L1.outPoint = 5.0; }
log("Scene_01 extended to 5.0");

// ---- Scene_05: logo ----
var logoComp = find("Logo", CompItem); logoComp.width = 2700; logoComp.height = 1350;
for (var i = logoComp.numLayers; i >= 1; i--) logoComp.layer(i).remove();
var lg = logoComp.layers.add(logo); lg.property("ADBE Transform Group").property("ADBE Position").setValue([1350, 675, 0]);
var lgScale = 1350 / 1050 * 100; lg.property("ADBE Transform Group").property("ADBE Scale").setValue([lgScale, lgScale, 100]);
var scene5 = find("Scene_05", CompItem);
layer(scene5, "Logo").property("ADBE Transform Group").property("ADBE Anchor Point").setValue([1350, 675, 0]);
var hereLayers = layersNamed(scene5, "TextS5_01"); for (var h = 0; h < hereLayers.length; h++) hereLayers[h].enabled = false;
var urlInfo = widenWordComp("TextS5_02", 1400, "'cornerstonechurchma.com'", null); reanchor(scene5, "TextS5_02", 1400, urlInfo.comp.height);
log("Scene_05 logo + url set");

// ---- Scene_04: outro text ----
var scene4 = find("Scene_04", CompItem);
var outroWords = ["JOIN US", "SUNDAYS", "10:00AM"];
for (var o = 0; o < 3; o++) { var nm4 = "TextS4_0" + (o + 1); var inf = widenWordComp(nm4, 3000, "'" + outroWords[o] + "'", null); reanchor(scene4, nm4, 3000, inf.comp.height); }
var addr = widenWordComp("TextS4_04", 2400, "'15 KIBBE RD, EAST LONGMEADOW'", null); reanchor(scene4, "TextS4_04", 2400, addr.comp.height);
var site = widenWordComp("TextS4_05", 2400, "'cornerstonechurchma.com'", null); reanchor(scene4, "TextS4_05", 2400, site.comp.height);
layer(scene4, "TextS4_05").property("ADBE Transform Group").property("ADBE Scale").setValue([100, 100, 100]);
site.comp.layer(1).property("ADBE Transform Group").property("ADBE Scale").setValue([45, 45, 100]);
var brand = widenWordComp("TextS4_06", 1200, "'CORNERSTONE CHURCH'", null); reanchor(scene4, "TextS4_06", 1200, brand.comp.height);
find("TextS4_07", CompItem).layer(1).property("Source Text").expression = "String((new Date()).getFullYear())";
layer(scene4, "Dark Gray Solid 1").enabled = false;
layer(scene4, "Footage_S4").enabled = false;
log("Scene_04 text set");

// ---- Intro comp ----
var color = find("Color", CompItem);
var intro = find("Intro", CompItem); if (intro) intro.remove();
intro = color.duplicate(); intro.name = "Intro"; intro.parentFolder = folder;
removeLayersNamed(intro, ["Scene_02", "Scene_03", "Scene_04", "LightLeack 2", "LightLeack 3", "LightLeack 5", "LightLeack 6", "Transition_02", "Fade", "Control"]);
removeLayersNamed(intro, ["Transition"]);
removeLayersWithSource(intro, "BackGround");
var s1 = layer(intro, "Scene_01"); s1.outPoint = 5.0;
var leak = layer(intro, "LightLeack"); leak.startTime = 4.1; leak.outPoint = 6.1;
var s5 = layer(intro, "Scene_05"); s5.startTime = 4.6; s5.inPoint = 4.6; s5.outPoint = 9.6;
var bg = intro.layers.add(mountain); bg.moveToEnd(); bg.startTime = 0; bg.outPoint = 9.6;
var fit = Math.max(3840 / mountain.width, 2160 / mountain.height) * 100; bg.property("ADBE Transform Group").property("ADBE Scale").setValue([fit, fit, 100]);
var grad = intro.layers.addSolid([0, 0, 0], "Scrim", 3840, 2160, 1); grad.moveBefore(bg); grad.blendingMode = BlendingMode.MULTIPLY;
var ramp = grad.property("ADBE Effect Parade").addProperty("ADBE Ramp"); ramp.property("ADBE Ramp-0001").setValue([400, 200]); ramp.property("ADBE Ramp-0002").setValue([0.18, 0.18, 0.2]); ramp.property("ADBE Ramp-0003").setValue([3600, 2100]); ramp.property("ADBE Ramp-0004").setValue([0.85, 0.85, 0.85]);
intro.duration = 9.6; intro.frameRate = 30;
log("Intro: " + intro.duration + "s, layers " + intro.numLayers);

// ---- Outro comp ----
var outro = find("Outro", CompItem); if (outro) outro.remove();
outro = color.duplicate(); outro.name = "Outro"; outro.parentFolder = folder;
removeLayersNamed(outro, ["Scene_01", "Scene_02", "Scene_03", "LightLeack", "LightLeack 2", "LightLeack 4", "LightLeack 5", "LightLeack 6", "Transition_02", "Fade", "Control"]);
removeLayersNamed(outro, ["Transition"]);
removeLayersWithSource(outro, "BackGround");
var s4 = layer(outro, "Scene_04"); s4.startTime = 0; s4.inPoint = 0; s4.outPoint = 4.0;
var leak3 = layer(outro, "LightLeack 3"); leak3.startTime = 3.3; leak3.outPoint = 4.6;
var s5b = layer(outro, "Scene_05"); s5b.startTime = 3.8; s5b.inPoint = 3.8; s5b.outPoint = 8.0;
var dbg = outro.layers.add(drone); dbg.moveToEnd(); dbg.startTime = -(drone.duration - 8.2); dbg.inPoint = 0; dbg.outPoint = 8.0;
var grad2 = outro.layers.addSolid([0, 0, 0], "Scrim", 3840, 2160, 1); grad2.moveBefore(dbg); grad2.blendingMode = BlendingMode.MULTIPLY;
var ramp2 = grad2.property("ADBE Effect Parade").addProperty("ADBE Ramp"); ramp2.property("ADBE Ramp-0001").setValue([1920, 2160]); ramp2.property("ADBE Ramp-0002").setValue([0.25, 0.25, 0.28]); ramp2.property("ADBE Ramp-0003").setValue([1920, 600]); ramp2.property("ADBE Ramp-0004").setValue([0.9, 0.9, 0.9]);
outro.duration = 8.0; outro.frameRate = 30;
log("Outro: " + outro.duration + "s, layers " + outro.numLayers);

app.endUndoGroup();
app.project.save(new File(DIR + "/cornerstone-bumper.aep"));
log("saved " + app.project.file.fsName);
flush();
