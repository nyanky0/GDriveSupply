import os
import math
from PIL import Image, ImageDraw

def create_gdrive_monochrome_image(size=512):
    # Create RGBA canvas
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # Geometry coordinates for Google Drive triangle on 512x512
    # The 3 overlapping trapezoids:
    # Top vertex: (256, 40)
    # Bottom-right vertex: (470, 410)
    # Bottom-left vertex: (42, 410)

    # Segment 1: Left Ribbon (White to Silver to Medium Slate)
    # From top peak down to bottom left
    # Polygon 1:
    poly_left = [
        (175, 50),
        (337, 50),
        (182, 320),
        (100, 180)
    ]

    # Segment 2: Bottom Ribbon (Medium Slate to Charcoal)
    # Horizontal bar at bottom
    # Polygon 2:
    poly_bottom = [
        (110, 445),
        (192, 305),
        (500, 305),
        (418, 445)
    ]

    # Segment 3: Right Ribbon (Charcoal to Obsidian Pitch Black)
    # From top-right down to bottom-right
    # Polygon 3:
    poly_right = [
        (337, 50),
        (495, 325),
        (415, 465),
        (256, 190)
    ]

    # Let's use precise Google Drive ratio polygons
    # Normalized coordinates (0 to 1):
    # Google drive segments:
    # 1. Top-Left face (Yellow in original -> Pure White / Silver gradient)
    # 2. Right face (Blue in original -> Charcoal / Deep Black gradient)
    # 3. Bottom face (Green in original -> Slate / Medium Gray gradient)

    w, h = size, size
    
    # We can render using high-res sub-sampling for buttery smooth edges
    scale = 4
    hi_w, hi_h = w * scale, h * scale
    hi_img = Image.new('RGBA', (hi_w, hi_h), (0, 0, 0, 0))

    # Normalized polygon points for Google Drive
    # 1. Left (Face 1: White/Silver)
    p_left = [
        (0.355 * hi_w, 0.080 * hi_h),
        (0.685 * hi_w, 0.080 * hi_h),
        (0.365 * hi_w, 0.635 * hi_h),
        (0.200 * hi_w, 0.350 * hi_h)
    ]
    # 2. Bottom (Face 2: Slate Gray)
    p_bottom = [
        (0.220 * hi_w, 0.890 * hi_h),
        (0.385 * hi_w, 0.605 * hi_h),
        (1.000 * hi_w, 0.605 * hi_h),
        (0.835 * hi_w, 0.890 * hi_h)
    ]
    # 3. Right (Face 3: Pitch Black / Charcoal)
    p_right = [
        (0.685 * hi_w, 0.080 * hi_h),
        (1.000 * hi_w, 0.625 * hi_h),
        (0.835 * hi_w, 0.910 * hi_h),
        (0.520 * hi_w, 0.365 * hi_h)
    ]

    # Draw segments with gradients
    # We can draw onto separate layers then composite
    
    # Face 2 (Bottom: Slate -> Dark Slate)
    layer_bottom = Image.new('RGBA', (hi_w, hi_h), (0, 0, 0, 0))
    d_b = ImageDraw.Draw(layer_bottom)
    for x in range(int(0.22 * hi_w), int(hi_w)):
        t = (x - 0.22 * hi_w) / (0.78 * hi_w)
        t = max(0.0, min(1.0, t))
        c = int(175 - t * 95)  # 175 -> 80
        d_b.line([(x, 0), (x, hi_h)], fill=(c, c, int(c * 1.05), 255), width=1)
    mask_bottom = Image.new('L', (hi_w, hi_h), 0)
    ImageDraw.Draw(mask_bottom).polygon(p_bottom, fill=255)
    layer_bottom.putalpha(mask_bottom)

    # Face 3 (Right: Dark Slate -> Charcoal with visible edge)
    layer_right = Image.new('RGBA', (hi_w, hi_h), (0, 0, 0, 0))
    d_r = ImageDraw.Draw(layer_right)
    for y in range(int(0.08 * hi_h), int(0.91 * hi_h)):
        t = (y - 0.08 * hi_h) / (0.83 * hi_h)
        t = max(0.0, min(1.0, t))
        c = int(120 - t * 85)  # 120 -> 35
        d_r.line([(0, y), (hi_w, y)], fill=(c, c, int(c * 1.08), 255), width=1)
    mask_right = Image.new('L', (hi_w, hi_h), 0)
    ImageDraw.Draw(mask_right).polygon(p_right, fill=255)
    layer_right.putalpha(mask_right)

    # Face 1 (Left: Pure White -> Platinum Silver)
    layer_left = Image.new('RGBA', (hi_w, hi_h), (0, 0, 0, 0))
    d_l = ImageDraw.Draw(layer_left)
    for y in range(int(0.08 * hi_h), int(0.64 * hi_h)):
        t = (y - 0.08 * hi_h) / (0.56 * hi_h)
        t = max(0.0, min(1.0, t))
        c = int(255 - t * 65)  # 255 -> 190
        d_l.line([(0, y), (hi_w, y)], fill=(c, c, c, 255), width=1)
    mask_left = Image.new('L', (hi_w, hi_h), 0)
    ImageDraw.Draw(mask_left).polygon(p_left, fill=255)
    layer_left.putalpha(mask_left)

    # Composite: Bottom first, then Right, then Left on top
    hi_img.alpha_composite(layer_bottom)
    hi_img.alpha_composite(layer_right)
    hi_img.alpha_composite(layer_left)

    # Draw crisp anti-aliased edge outlines for maximum visibility on dark taskbars
    d_outline = ImageDraw.Draw(hi_img)
    stroke_w = max(2, int(hi_w * 0.008))
    d_outline.line(p_bottom + [p_bottom[0]], fill=(220, 225, 235, 180), width=stroke_w)
    d_outline.line(p_right + [p_right[0]], fill=(240, 245, 255, 220), width=stroke_w)
    d_outline.line(p_left + [p_left[0]], fill=(255, 255, 255, 255), width=stroke_w)

    # Downsample with high quality Lanczos filter for crisp anti-aliasing
    final_img = hi_img.resize((size, size), Image.Resampling.LANCZOS)
    return final_img

def main():
    root = r"D:\Projects\GDriveSupply"
    
    # 1. Generate master high-res image
    master_512 = create_gdrive_monochrome_image(512)
    master_256 = create_gdrive_monochrome_image(256)
    master_128 = create_gdrive_monochrome_image(128)
    master_64 = create_gdrive_monochrome_image(64)
    master_48 = create_gdrive_monochrome_image(48)
    master_32 = create_gdrive_monochrome_image(32)
    master_16 = create_gdrive_monochrome_image(16)

    # 2. Save .ico for Windows app
    ico_path = os.path.join(root, "cmd", "app", "app.ico")
    master_256.save(
        ico_path,
        format='ICO',
        sizes=[(16, 16), (24, 24), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)]
    )
    print(f"Saved: {ico_path}")

    # Also save to root for tray or installer
    root_ico = os.path.join(root, "app.ico")
    master_256.save(
        root_ico,
        format='ICO',
        sizes=[(16, 16), (24, 24), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)]
    )

    # 3. Save web public favicons
    web_pub_ico = os.path.join(root, "web", "public", "favicon.ico")
    master_256.save(
        web_pub_ico,
        format='ICO',
        sizes=[(16, 16), (32, 32), (48, 48)]
    )
    print(f"Saved: {web_pub_ico}")

    web_pub_png = os.path.join(root, "web", "public", "logo.png")
    master_512.save(web_pub_png, format='PNG')
    print(f"Saved: {web_pub_png}")

    web_src_png = os.path.join(root, "web", "src", "assets", "logo.png")
    master_512.save(web_src_png, format='PNG')
    print(f"Saved: {web_src_png}")

if __name__ == '__main__':
    main()
