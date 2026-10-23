import os, zipfile

src_dir = 'itch_deploy'
zip_filename = 'spacescape-itch-deploy.zip'

with zipfile.ZipFile(zip_filename, 'w', zipfile.ZIP_DEFLATED) as zipf:
    for root, dirs, files in os.walk(src_dir):
        for file in files:
            full_path = os.path.join(root, file)
            # relative path inside the zip file
            rel_path = os.path.relpath(full_path, src_dir).replace('\\', '/')
            zipf.write(full_path, rel_path)
            print(f"Added: {rel_path} ({os.path.getsize(full_path)} bytes)")

print(f"\nSuccessfully created {zip_filename} ({os.path.getsize(zip_filename)} bytes)")
