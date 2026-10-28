var DIR = Folder("~").fsName + "/sermon-bumper"; var P = DIR + "/icons3.log";
function w(s) { var f = new File(P); f.open("a"); f.write(s + "\n"); f.close(); }
function find(name, type) { for (var i = 1; i <= app.project.numItems; i++) { var it = app.project.item(i); if (it.name == name && (!type || it instanceof type)) return it; } return null; }
function importFile(path, name) { var old = find(name); if (old) return old; app.beginSuppressDialogs(); var it = app.project.importFile(new ImportOptions(File(path))); app.endSuppressDialogs(false); it.name = name; it.parentFolder = find("Cornerstone", FolderItem); return it; }
function swap(sceneName, suffix) {
  var scene = find(sceneName, CompItem);
  for (var s = scene.numLayers; s >= 1; s--) if (/^(facebook|instagram|youtube)$/.test(scene.layer(s).name)) scene.layer(s).remove();
  var map = [["Artwork 10 Outlines" + suffix, "facebook"], ["Artwork 11 Outlines" + suffix, "instagram"], ["Artwork 9 Outlines" + suffix, "youtube"]];
  for (var m = 0; m < map.length; m++) {
    var old = null; for (var i = 1; i <= scene.numLayers; i++) if (scene.layer(i).name == map[m][0]) old = scene.layer(i);
    if (!old) { w(sceneName + " missing " + map[m][0]); continue; }
    var icon = importFile(DIR + "/icons/" + map[m][1] + ".png", map[m][1] + ".png");
    var L = scene.layers.add(icon); L.name = map[m][1]; L.moveBefore(old);
    L.startTime = old.startTime; L.inPoint = old.inPoint; L.outPoint = old.outPoint;
    var nt = L.property("ADBE Transform Group"), ot = old.property("ADBE Transform Group");
    var oa = ot.property("ADBE Anchor Point").value; var ax = Number(oa[0]), ay = Number(oa[1]);
    L.parent = old;
    nt.property("ADBE Anchor Point").setValue([256, 256, 0]);
    nt.property("ADBE Position").setValue([ax, ay, 0]);
    var sizes = { facebook: 30, instagram: 31, youtube: 36 }; nt.property("ADBE Scale").setValue([sizes[map[m][1]], sizes[map[m][1]], 100]);
    var oop = ot.property("ADBE Opacity"), nop = nt.property("ADBE Opacity"), nk = Number(oop.numKeys);
    if (nk > 0) { for (var k = 1; k <= nk; k++) nop.setValueAtTime(Number(oop.keyTime(k)), Number(oop.keyValue(k))); } else nop.setValue(Number(oop.value));
    old.enabled = false;
    w(sceneName + " " + map[m][1] + " ok keys=" + nk);
  }
}
try { swap("Scene_01", ""); swap("Scene_05", " 2"); w("icons done"); } catch (e) { w("ERROR line " + e.line + ": " + e); }
