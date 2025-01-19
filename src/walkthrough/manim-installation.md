<div align="center">
  <img src="../../assets/manim-notebook-logo.png"
        width="150px"
        alt="Manim Notebook Logo showing a physical notebook with an 'M' letter on its title page"/>

  <div align="center">
    <h3 align="center">
      <strong>Welcome to Manim Notebook</strong>
    </h3>
    <p>
      Your extension to interactively preview Manim animations</strong>
      | <a href="https://github.com/Manim-Notebook/manim-notebook/">GitHub</a>
    </p>
  </div>
</div>

<br>

# 🎈 Manim Installation

> **Manim Notebook only works with ManimGL by 3Blue1Brown,<br>NOT with the community edition of Manim (Manim CE)**.

Unfortunately, installing 3Blue1Brown's Manim is not a trivial task due to its dependencies. Luckily, you have to do this only once. Get yourself some quiet time, and follow the steps below.

- First, note that there is a [**Manim installation guide**](https://3b1b.github.io/manim/getting_started/installation.html) available. However, it mainly just tells you _what_ to install and not _how to_.
- In the GitHub Actions pipeline for our Manim Notebook extension, we succeeded to automatically install ManimGL on the latest macOS, Ubuntu, and Windows. So take inspiration from there, i.e. this [`tests.yml`](https://github.com/Manim-Notebook/manim-notebook/blob/main/.github/workflows/tests.yml) workflow, as well as [this `manimInstaller.ts`](https://github.com/Manim-Notebook/manim-notebook/blob/main/tests/utils/manimInstaller.ts). It might be worth it to search for keywords there if you encounter errors during installation.

## 💨 Dependency installation guidance & quirks

**Python `3.13` (any OS)**

```py
# https://github.com/jiaaro/pydub/issues/815
pip install audioop-lts
```

**Linux (e.g. Ubuntu)**

You probably need the OpenGL Mesa Utils.

```py
# Install OpenGL Mesa Utils
sudo add-apt-repository ppa:kisak/kisak-mesa
sudo apt-get update
sudo apt-get install mesa-utils -y

# Install PyOpenGL
pip install PyOpenGL

# Test your OpenGL version via:
xvfb-run -a glxinfo | grep "OpenGL version"

# Install Pango
sudo apt-get install libpango1.0-dev -y
```

Only apply those if you encounter the respective errors:

```py
# Work around 'NoneType' object has no attribute 'glGetError'
# https://github.com/MPI-IS/mesh/issues/23#issuecomment-607784234
sudo apt-get install python3-opengl

# Install copy-paste mechanism to avoid ClipboardUnavailable errors
# (python pyperclip makes use of xclip on Linux)
sudo apt-get install xclip -y
```


**Windows**

Windows itself only comes with OpenGL 1.1, which is not enough for ManimGL. We found that the easiest way to do so is via [this amazing repo](https://github.com/pal1000/mesa-dist-win), which serves precompiled Mesa3D drivers for Windows. In a PowerShell, run:

```powershell
# Install OpenGL pre-built Mesa binaries from mesa-dist-win
Invoke-WebRequest -Uri https://github.com/pal1000/mesa-dist-win/releases/download/24.3.2/mesa3d-24.3.2-release-mingw.7z -OutFile mesa3d.7z

# Extract (on purpose no space between -o and mesa3d)
7z x mesa3d.7z -omesa3d

# Install system-wide (option 1: core desktop OpenGL drivers)
.\mesa3d\systemwidedeploy.cmd 1
```

Test your OpenGL version:

```bash
# Download wglinfo (analogous to glxinfo)
curl -L -O https://github.com/gkv311/wglinfo/releases/latest/download/wglinfo64.exe
chmod +x wglinfo64.exe
./wglinfo64.exe | grep "OpenGL version"
```

**macOS**

Lucky you, macOS already came with everything that ManimGL needed out of the box in our tests. We don't know a way to retrieve the OpenGL version on macOS, if you happen to know one, please let us know [in a new issue](https://github.com/Manim-Notebook/manim-notebook/issues).

## 💨 ManimGL installation

Finally, installing ManimGL should be as easy as installing any other Python package. However, we recommend installing it in an isolated environment to avoid conflicts with other packages. You can do so by creating a new virtual environment and installing ManimGL there.

```bash
# Clone Manim anywhere you like.
# Here, we assume you want to store it in `~/dev/manim/`
git clone https://github.com/3b1b/manim.git ~/dev/manim/

# Change into the directory where you want to use Manim,
# e.g. `~/dev/manim-videos/`
# and create a new virtual environment there,
# where you will install Manim and its Python dependencies.
cd ~/dev/manim-videos/
python3 -m venv manim-venv
. manim-venv/bin/activate # source the activate script

# Now `pip --version` should show its version and a path in your `manim-venv/`
# directory. That is, you are now in the virtual environment (venv)
# Finally, install ManimGL and its Python dependencies into that venv.
pip install -e ~/dev/manim/
```

Note that via this technique, the `manimgl` command is only available in the virtual environment (which is actually a good thing due to the isolation). If you want to upgrade Manim, it's as easy as pulling the latest commit from the repo: `git pull` (inside the `~/dev/manim/` folder). You might have to re-run `pip install -e ~/dev/manim/` afterwards (inside the virtual environment (!)). Note that the VSCode Python extension by Microsoft will also detect that you use a virtual environment: upon opening a new terminal, it will automatically source the `activate` script for you.

Finally, check your Manim version by running `manimgl --version`. If this shows the latest version, you have successfully installed ManimGL, congratulations! 🎉 This was the most difficult part, from now on it should be a breeze to use Manim.
