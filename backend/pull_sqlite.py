import subprocess
import os

blob_id = 'a7e29399158e72bcf6f2ebf9d8b903f1e2d7407f'
output_file = 'lib_interno_correct.sqlite'

process = subprocess.Popen(['git', 'cat-file', '-p', blob_id], stdout=subprocess.PIPE)
content, _ = process.communicate()

with open(output_file, 'wb') as f:
    f.write(content)

print(f"Saved {len(content)} bytes to {output_file}")
