import AppKit
import CoreText

struct Line: Decodable { let text: String; let size: CGFloat; let weight: CGFloat; let color: String; let tracking: CGFloat; let y: CGFloat }
struct Spec: Decodable { let width: CGFloat; let height: CGFloat; let lines: [Line] }

func color(_ hex: String) -> NSColor {
  var h = hex; if h.hasPrefix("#") { h.removeFirst() }
  let v = UInt32(h, radix: 16) ?? 0xFFFFFF
  return NSColor(calibratedRed: CGFloat((v >> 16) & 0xFF) / 255, green: CGFloat((v >> 8) & 0xFF) / 255, blue: CGFloat(v & 0xFF) / 255, alpha: 1)
}

func font(_ path: String, _ size: CGFloat, _ weight: CGFloat) -> NSFont {
  let url = URL(fileURLWithPath: path) as CFURL
  let descs = CTFontManagerCreateFontDescriptorsFromURL(url) as? [CTFontDescriptor] ?? []
  guard let base = descs.first else { return NSFont.systemFont(ofSize: size) }
  let axis: CFNumber = 0x77676874 as CFNumber
  let varied = CTFontDescriptorCreateCopyWithVariation(base, axis, weight)
  return CTFontCreateWithFontDescriptor(varied, size, nil) as NSFont
}

let args = CommandLine.arguments
if args.count >= 3 && args[1] == "--has-font" {
  let names = (CTFontManagerCopyAvailablePostScriptNames() as? [String]) ?? []
  exit(names.contains(args[2]) ? 0 : 1)
}
let spec = try! JSONDecoder().decode(Spec.self, from: Data(contentsOf: URL(fileURLWithPath: args[1])))
let fontPath = args[2]; let out = args[3]
let rep = NSBitmapImageRep(bitmapDataPlanes: nil, pixelsWide: Int(spec.width), pixelsHigh: Int(spec.height), bitsPerSample: 8, samplesPerPixel: 4, hasAlpha: true, isPlanar: false, colorSpaceName: .deviceRGB, bytesPerRow: 0, bitsPerPixel: 0)!
NSGraphicsContext.saveGraphicsState()
let ctx = NSGraphicsContext(bitmapImageRep: rep)!
NSGraphicsContext.current = ctx
ctx.cgContext.clear(CGRect(x: 0, y: 0, width: spec.width, height: spec.height))
for l in spec.lines {
  let attrs: [NSAttributedString.Key: Any] = [.font: font(fontPath, l.size, l.weight), .foregroundColor: color(l.color), .kern: l.tracking]
  var s = NSAttributedString(string: l.text, attributes: attrs)
  var size = l.size
  while s.size().width > spec.width * 0.84 && size > 24 {
    size -= 2
    var a = attrs; a[.font] = font(fontPath, size, l.weight)
    s = NSAttributedString(string: l.text, attributes: a)
  }
  let w = s.size().width - l.tracking
  s.draw(at: NSPoint(x: (spec.width - w) / 2, y: spec.height - l.y - size))
}
NSGraphicsContext.restoreGraphicsState()
try! rep.representation(using: .png, properties: [:])!.write(to: URL(fileURLWithPath: out))
