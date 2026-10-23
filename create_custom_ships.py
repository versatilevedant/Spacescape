import os
from PIL import Image, ImageDraw

out_dir = r"c:\Users\vedan\Downloads\spacescape-main\portal\assets_custom"
itch_dir = r"c:\Users\vedan\Downloads\spacescape-main\itch_deploy\assets_custom"
web_dir = r"c:\Users\vedan\Downloads\spacescape-main\web_dist\assets_custom"

# Helper to mirror left half to right half for perfect symmetry
def create_symmetric_sprite(width, height, draw_func):
    img = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    # We draw on a canvas where cx = width / 2
    draw_func(img)
    return img

# Load player.png as reference dimensions
ref_img = Image.open(os.path.join(out_dir, "player.png"))
W, H = ref_img.size # 78, 100
cx = W // 2

# SHIP 2: CRIMSON VIPER (Forward-swept predator wings, sharp needle nose, crimson & gold)
def draw_viper(img):
    pix = img.load()
    # Color palette
    outline = (25, 10, 15, 255)
    crimson_dark = (140, 20, 30, 255)
    crimson_mid = (195, 30, 45, 255)
    crimson_light = (235, 55, 70, 255)
    gold = (255, 195, 20, 255)
    canopy_cyan = (0, 225, 245, 255)
    canopy_bright = (180, 250, 255, 255)
    thruster_yellow = (255, 235, 40, 255)
    thruster_orange = (255, 110, 20, 255)

    def set_sym(x, y, color):
        if 0 <= x < W and 0 <= y < H:
            pix[x, y] = color
            pix[W - 1 - x, y] = color

    def fill_sym_span(x_start, x_end, y, color):
        for x in range(x_start, x_end + 1):
            set_sym(x, y, color)

    # 1. Sharp Needle Nose
    for y in range(4, 18):
        hw = (y - 4) // 2 + 1
        fill_sym_span(cx - hw, cx, y, crimson_mid)
        set_sym(cx - hw, y, outline)
    set_sym(cx, 4, outline)

    # 2. Cyan Energy Canopy (y: 14 to 32)
    for y in range(14, 32):
        hw = 3 + int(3.5 * (1 - abs(y - 23) / 10))
        fill_sym_span(cx - hw, cx, y, canopy_cyan)
        fill_sym_span(cx - hw + 2, cx, y, canopy_bright)
        set_sym(cx - hw - 1, y, outline)

    # 3. Main Fuselage with Gold Accents (y: 30 to 76)
    for y in range(30, 76):
        hw = 7 + (y - 30) // 8
        fill_sym_span(cx - hw, cx, y, crimson_mid)
        # Gold center stripe
        set_sym(cx - 2, y, gold)
        set_sym(cx - 1, y, gold)
        set_sym(cx, y, gold)
        # Shading
        set_sym(cx - hw, y, crimson_dark)
        set_sym(cx - hw - 1, y, outline)

    # 4. Forward-Swept Predator Wings
    # Wings branch out from y: 44 to 78, sweeping forward from tips at y: 35!
    for y in range(35, 78):
        if y < 65:
            # Wing outer edge sweeps forward
            outer_x = 4 + int((y - 35) * 0.7)
            inner_x = 12 + int((y - 35) * 0.5)
            for x in range(outer_x, min(inner_x, cx)):
                set_sym(x, y, crimson_light if x < outer_x + 3 else crimson_mid)
            # Gold edge on forward wing
            set_sym(outer_x, y, gold)
            set_sym(outer_x - 1, y, outline)
        else:
            # Wing base connects to fuselage
            for x in range(18, cx):
                set_sym(x, y, crimson_dark if x > cx - 6 else crimson_mid)

    # Blaster pods on forward wingtips (y: 32 to 38, x: 2 to 6)
    for y in range(30, 38):
        for x in range(2, 6):
            set_sym(x, y, gold if y > 33 else canopy_cyan)
        set_sym(1, y, outline)
        set_sym(6, y, outline)
    set_sym(3, 29, outline)
    set_sym(4, 29, outline)

    # Outer wing outline
    for y in range(38, 76):
        set_sym(cx - (18 + (y - 38) // 3), y, outline)

    # 5. Twin Engine Thrusters (y: 76 to 98)
    for y in range(76, 96):
        for offset in [5, 14]:
            t_w = max(1, 3 - (y - 76) // 5)
            for tx in range(offset - t_w, offset + t_w + 1):
                col = thruster_yellow if y < 86 else thruster_orange
                set_sym(cx - tx, y, col)
            set_sym(cx - offset - t_w - 1, y, outline if y < 82 else (255, 60, 0, 180))

# SHIP 3: EMERALD PHANTOM (Wide delta with canards, emerald & neon lime)
def draw_phantom(img):
    pix = img.load()
    outline = (10, 25, 15, 255)
    green_dark = (20, 85, 35, 255)
    green_mid = (35, 145, 60, 255)
    green_light = (50, 195, 85, 255)
    lime = (0, 245, 140, 255)
    canopy_gold = (255, 225, 40, 255)
    canopy_white = (255, 255, 200, 255)
    thruster_cyan = (0, 220, 255, 255)
    thruster_green = (50, 255, 120, 255)

    def set_sym(x, y, color):
        if 0 <= x < W and 0 <= y < H:
            pix[x, y] = color
            pix[W - 1 - x, y] = color

    def fill_sym_span(x_start, x_end, y, color):
        for x in range(x_start, x_end + 1):
            set_sym(x, y, color)

    # 1. Angular Nose with intake vents (y: 8 to 22)
    for y in range(8, 22):
        hw = 3 + (y - 8) // 2
        fill_sym_span(cx - hw, cx, y, green_light)
        set_sym(cx - hw, y, outline)
    set_sym(cx, 8, outline)

    # 2. Front Stabilizer Canards (y: 18 to 28)
    for y in range(18, 28):
        canard_w = (y - 18) * 2 + 5
        fill_sym_span(cx - canard_w, cx - canard_w + 3, y, lime)
        set_sym(cx - canard_w - 1, y, outline)

    # 3. Gold Energy Canopy (y: 20 to 38)
    for y in range(20, 38):
        hw = 4 + int(3.5 * (1 - abs(y - 29) / 10))
        fill_sym_span(cx - hw, cx, y, canopy_gold)
        fill_sym_span(cx - hw + 2, cx, y, canopy_white)
        set_sym(cx - hw - 1, y, outline)

    # 4. Wide Swept Delta Wings (y: 35 to 80)
    for y in range(35, 80):
        # Swept delta spanning out to x: 2
        wing_span = min(cx - 3, int((y - 35) * 1.5) + 6)
        fill_sym_span(cx - wing_span, cx, y, green_mid)
        # Neon lime leading edge stripe
        set_sym(cx - wing_span + 1, y, lime)
        set_sym(cx - wing_span + 2, y, lime)
        # Shading & outline
        set_sym(cx - wing_span, y, outline)

    # Vertical winglet fins at tips (x: 2 to 6, y: 68 to 82)
    for y in range(68, 82):
        for x in range(2, 6):
            set_sym(x, y, lime if x == 3 else green_dark)
        set_sym(1, y, outline)
        set_sym(6, y, outline)

    # Trailing edge outline
    for x in range(6, cx):
        set_sym(x, 80, outline)

    # 5. Triple Thruster Plumes (y: 80 to 98)
    for y in range(80, 98):
        # Center plume
        tw = max(1, 4 - (y - 80) // 4)
        for tx in range(-tw, tw + 1):
            set_sym(cx + tx, y, thruster_cyan if y < 88 else thruster_green)
        # Side plumes
        for side in [11]:
            stw = max(1, 2 - (y - 80) // 6)
            for tx in range(-stw, stw + 1):
                set_sym(cx - side + tx, y, thruster_green)

# SHIP 4: VOID REAPER (Dual Fuselage X-Frame, Shadow Purple & Hot Magenta)
def draw_reaper(img):
    pix = img.load()
    outline = (20, 10, 30, 255)
    purple_dark = (75, 20, 95, 255)
    purple_mid = (125, 40, 155, 255)
    purple_light = (175, 65, 215, 255)
    magenta = (255, 0, 130, 255)
    magenta_glow = (255, 110, 195, 255)
    cyan_core = (0, 240, 255, 255)
    thruster_violet = (220, 60, 255, 255)
    thruster_blue = (60, 120, 255, 255)

    def set_sym(x, y, color):
        if 0 <= x < W and 0 <= y < H:
            pix[x, y] = color
            pix[W - 1 - x, y] = color

    def fill_sym_span(x_start, x_end, y, color):
        for x in range(x_start, x_end + 1):
            set_sym(x, y, color)

    # Twin-hull split design: Fuselage split at center (x: cx-4 to cx is empty / plasma channel!)
    # Twin Prow Noses (y: 10 to 30, center around cx - 10)
    for y in range(10, 30):
        hull_cx = cx - 11
        hw = 2 + (y - 10) // 4
        fill_sym_span(hull_cx - hw, hull_cx + hw, y, purple_mid)
        # Magenta accent stripe
        set_sym(hull_cx, y, magenta)
        set_sym(hull_cx - hw, y, outline)
        set_sym(hull_cx + hw, y, outline)

    # Central Glowing Cyan Plasma Orb (y: 28 to 44)
    for y in range(28, 44):
        hw = int(6 * (1 - abs(y - 36) / 8))
        if hw > 0:
            fill_sym_span(cx - hw, cx, y, cyan_core)
            set_sym(cx - hw - 1, y, outline)

    # Heavy X-Wing Frame (y: 35 to 82)
    for y in range(35, 82):
        # Outer heavy wing sweeping out
        outer_w = min(cx - 2, 14 + int((y - 35) * 1.3))
        fill_sym_span(cx - outer_w, cx - 6, y, purple_mid)
        # Magenta energy circuit lines
        set_sym(cx - outer_w + 2, y, magenta)
        set_sym(cx - outer_w + 3, y, magenta_glow)
        set_sym(cx - 8, y, purple_dark)
        set_sym(cx - outer_w, y, outline)
        set_sym(cx - 6, y, outline)

    # Quad Wingtip Plasma Cannons (x: 2 to 7, y: 70 to 86)
    for y in range(68, 84):
        for x in range(2, 7):
            set_sym(x, y, magenta if x == 4 else purple_dark)
        set_sym(1, y, outline)
        set_sym(7, y, outline)

    # Twin Heavy Thrusters (y: 82 to 98)
    for y in range(82, 98):
        for tx in [10, 20]:
            tw = max(1, 3 - (y - 82) // 5)
            for x in range(tx - tw, tx + tw + 1):
                set_sym(cx - x, y, thruster_violet if y < 90 else thruster_blue)

# SHIP 5: SOLARIS TITAN (Flagship Battleship, Brilliant Gold, White & Obsidian)
def draw_titan(img):
    pix = img.load()
    outline = (15, 15, 20, 255)
    obsidian = (35, 38, 48, 255)
    white_pure = (250, 252, 255, 255)
    white_shade = (195, 205, 220, 255)
    gold_pure = (255, 190, 0, 255)
    gold_dark = (200, 135, 0, 255)
    solar_orange = (255, 75, 15, 255)
    solar_core = (255, 235, 80, 255)

    def set_sym(x, y, color):
        if 0 <= x < W and 0 <= y < H:
            pix[x, y] = color
            pix[W - 1 - x, y] = color

    def fill_sym_span(x_start, x_end, y, color):
        for x in range(x_start, x_end + 1):
            set_sym(x, y, color)

    # 1. Armored Crown Nose (y: 5 to 20)
    for y in range(5, 20):
        hw = 3 + (y - 5) // 2
        fill_sym_span(cx - hw, cx, y, gold_pure)
        set_sym(cx - hw, y, outline)
    set_sym(cx, 5, outline)

    # 2. Solar Core Bridge (y: 18 to 36)
    for y in range(18, 36):
        hw = 4 + int(4.5 * (1 - abs(y - 27) / 10))
        fill_sym_span(cx - hw, cx, y, solar_orange)
        fill_sym_span(cx - hw + 2, cx, y, solar_core)
        set_sym(cx - hw - 1, y, outline)

    # 3. Triple Tiered White & Obsidian Armored Chassis (y: 32 to 84)
    for y in range(32, 84):
        # Tier 1: Inner Obsidian Spine
        fill_sym_span(cx - 9, cx, y, obsidian)
        set_sym(cx - 2, y, gold_pure)
        set_sym(cx - 1, y, gold_pure)
        set_sym(cx, y, gold_pure)

        # Tier 2: Mid White Armor Plate
        mid_w = 10 + int((y - 32) * 0.4)
        fill_sym_span(cx - mid_w, cx - 10, y, white_pure)
        set_sym(cx - mid_w, y, gold_dark)

        # Tier 3: Massive Outstretched Delta Wings
        wing_w = min(cx - 2, 12 + int((y - 32) * 1.6))
        fill_sym_span(cx - wing_w, cx - mid_w - 1, y, obsidian if y > 55 else white_shade)
        # Gold wingtips and borders
        set_sym(cx - wing_w + 1, y, gold_pure)
        set_sym(cx - wing_w + 2, y, gold_pure)
        set_sym(cx - wing_w, y, outline)

    # Stabilizer Tailfins (y: 60 to 86)
    for y in range(60, 86):
        set_sym(cx - 16, y, gold_pure)
        set_sym(cx - 17, y, outline)

    # 4. Quad Super-Heavy Thrusters (y: 84 to 98)
    for y in range(84, 98):
        for tx in [6, 15]:
            tw = max(1, 3 - (y - 84) // 4)
            for x in range(tx - tw, tx + tw + 1):
                col = solar_core if y < 90 else solar_orange
                set_sym(cx - x, y, col)
            set_sym(cx - tx - tw - 1, y, outline if y < 87 else (255, 60, 0, 180))

print("Generating 4 new custom pixel-art starfighters...")

viper_img = create_symmetric_sprite(W, H, draw_viper)
viper_img.save(os.path.join(out_dir, "ship_viper.png"))
viper_img.save(os.path.join(itch_dir, "ship_viper.png"))
viper_img.save(os.path.join(web_dir, "ship_viper.png"))

phantom_img = create_symmetric_sprite(W, H, draw_phantom)
phantom_img.save(os.path.join(out_dir, "ship_phantom.png"))
phantom_img.save(os.path.join(itch_dir, "ship_phantom.png"))
phantom_img.save(os.path.join(web_dir, "ship_phantom.png"))

reaper_img = create_symmetric_sprite(W, H, draw_reaper)
reaper_img.save(os.path.join(out_dir, "ship_reaper.png"))
reaper_img.save(os.path.join(itch_dir, "ship_reaper.png"))
reaper_img.save(os.path.join(web_dir, "ship_reaper.png"))

titan_img = create_symmetric_sprite(W, H, draw_titan)
titan_img.save(os.path.join(out_dir, "ship_titan.png"))
titan_img.save(os.path.join(itch_dir, "ship_titan.png"))
titan_img.save(os.path.join(web_dir, "ship_titan.png"))

print("All 4 new unique aircraft generated successfully!")
