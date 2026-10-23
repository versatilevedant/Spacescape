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

embedded_images = {}
for k, path in image_map.items():
    embedded_images[k] = get_base64_data_uri(path, 'image/png')

embedded_audio = {}
for k, path in audio_map.items():
    embedded_audio[k] = get_base64_data_uri(path, 'audio/ogg')

print("Embedded images count:", len(embedded_images))
print("Embedded audio count:", len(embedded_audio))

# Output to a js file or bundle
with open('itch_deploy/assets_embedded.js', 'w', encoding='utf-8') as f:
    f.write('// Self-contained embedded assets for zero-404 guarantee\n')
    f.write('window.SPACESCAPE_EMBEDDED_ASSETS = ' + json.dumps(embedded_images, indent=2) + ';\n')
    f.write('window.SPACESCAPE_EMBEDDED_AUDIO = ' + json.dumps(embedded_audio, indent=2) + ';\n')

print("Created itch_deploy/assets_embedded.js successfully!")
