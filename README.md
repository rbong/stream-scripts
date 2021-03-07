# Stream Scripts

Various scripts I use for streaming.

## Scripts

### download_platform_demos.js

Downloads all demo prods from [pouet.net](http://www.pouet.net/) for a
particular platform.

Supports demos with plain ROM/archive downloads and also demos with a download
link to `scene.org`.

**Requirements**

- Linux
- [node](https://nodejs.org/en/)
- 7zip
- Prods data dump downloaded from [data.pouet.net](https://data.pouet.net/)

**Usage**

```bash
./download_platform_demo.js path/to/pouetdatadump-prods.json "Platform Name"
```

See the [list of platforms](https://api.pouet.net/v1/enums/platforms/) for the available platform names.

Demos will be downloaded to `demos/`.

### play_demos.py

Play a list of downloaded demos and show the name of the demo.
Will try and guess the info about the demo based on the name of its parent directory.

Recommended to use in conjunction with `download_platform_demos.js`.

**Requirements**

- Windows (tested with 10)
- [python](https://www.python.org/)
- An emulator
- A plain text file containing a list of demos

**Usage**

```bash
py play_demos.py path/to/emu.exe path/to/demo_list
```

Use `Left`/`Right` to navigate between demos.
Use `s` to stop the current demo.
Use `r` to reset the current demo.
