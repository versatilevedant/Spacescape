import os, base64, json

def get_base64_data_uri(filepath, mime_type):
    with open(filepath, 'rb') as f:
        data = f.read()
    b64 = base64.b64encode(data).decode('ascii')
    return f"data:{mime_type};base64,{b64}"

image_map = {
    'player': 'itch_deploy/assets_custom/player.png',
    'viper': 'itch_deploy/assets_custom/ship_viper.png',
    'phantom': 'itch_deploy/assets_custom/ship_phantom.png',
    'reaper': 'itch_deploy/assets_custom/ship_reaper.png',
    'titan': 'itch_deploy/assets_custom/ship_titan.png',
    'enemy': 'itch_deploy/assets_custom/enemy.png',
    'flame1': 'itch_deploy/assets_custom/flame_1.png',
    'flame2': 'itch_deploy/assets_custom/flame_2.png',
    'flame3': 'itch_deploy/assets_custom/flame_3.png',
    'nuke': 'itch_deploy/assets_custom/nuke.png',
    'freeze': 'itch_deploy/assets_custom/freeze.png',
    'multiFire': 'itch_deploy/assets_custom/multi_fire.png',
    'repair': 'itch_deploy/assets_custom/icon_plusSmall.png'
}

audio_map = {
    'laser': 'itch_deploy/audio/laserSmall_001.ogg',
    'explosion': 'itch_deploy/audio/laser1.ogg',
    'powerup': 'itch_deploy/audio/powerUp6.ogg'
}

embedded_images = {k: get_base64_data_uri(p, 'image/png') for k, p in image_map.items()}
embedded_audio = {k: get_base64_data_uri(p, 'audio/ogg') for k, p in audio_map.items()}

# Read base game.js
with open('itch_deploy/game.js', 'r', encoding='utf-8') as f:
    game_code = f.read()

# Replace soundFiles definition
old_sound_def = """    const soundFiles = {
      laser: './audio/laserSmall_001.ogg',
      explosion: './audio/laser1.ogg',
      powerup: './audio/powerUp6.ogg'
    };"""

new_sound_def = """    const soundFiles = SPACESCAPE_EMBEDDED_AUDIO;"""

if old_sound_def in game_code:
    game_code = game_code.replace(old_sound_def, new_sound_def)
else:
    print("Warning: old_sound_def not found exactly, doing regex or manual replace")

# Replace fallback soundFiles in playSound
old_play_sound = """    const soundFiles = {
      laser: './audio/laserSmall_001.ogg',
      explosion: './audio/laser1.ogg',
      powerup: './audio/powerUp6.ogg'
    };
    if (soundFiles[key]) {"""

new_play_sound = """    const soundFiles = SPACESCAPE_EMBEDDED_AUDIO;
    if (soundFiles[key]) {"""

if old_play_sound in game_code:
    game_code = game_code.replace(old_play_sound, new_play_sound)

# Replace loadAssets assetList
old_asset_list = """    const assetList = {
      player: './assets_custom/player.png',
      viper: './assets_custom/ship_viper.png',
      phantom: './assets_custom/ship_phantom.png',
      reaper: './assets_custom/ship_reaper.png',
      titan: './assets_custom/ship_titan.png',
      enemy: './assets_custom/enemy.png',
      flame1: './assets_custom/flame_1.png',
      flame2: './assets_custom/flame_2.png',
      flame3: './assets_custom/flame_3.png',
      nuke: './assets_custom/nuke.png',
      freeze: './assets_custom/freeze.png',
      multiFire: './assets_custom/multi_fire.png',
      repair: './assets_custom/icon_plusSmall.png'
    };"""

new_asset_list = """    const assetList = SPACESCAPE_EMBEDDED_ASSETS;"""

if old_asset_list in game_code:
    game_code = game_code.replace(old_asset_list, new_asset_list)
else:
    print("Warning: old_asset_list not found exactly")

header = f"""// Spacescape - Arcade Space Shooter with Space Shop & Power-ups
// Created for Versatile Vedant (https://versatilevedant.itch.io/spacescape)

const SPACESCAPE_EMBEDDED_ASSETS = {json.dumps(embedded_images, indent=2)};

const SPACESCAPE_EMBEDDED_AUDIO = {json.dumps(embedded_audio, indent=2)};
"""

# Remove the original first 2 header lines if present
if game_code.startswith("// Spacescape - Arcade Space Shooter"):
    lines = game_code.splitlines(keepends=True)
    # skip first 3 lines
    game_code = "".join(lines[3:])

final_code = header + "\n" + game_code

with open('itch_deploy/game.js', 'w', encoding='utf-8') as f:
    f.write(final_code)

with open('web_dist/game.js', 'w', encoding='utf-8') as f:
    f.write(final_code)

print("Updated itch_deploy/game.js and web_dist/game.js successfully! Length:", len(final_code))
