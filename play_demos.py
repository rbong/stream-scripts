import ctypes
import os
import re
import subprocess
import sys
import time
import tkinter as tk

# Args

if len(sys.argv) < 2:
    print('missing emu_cmd', file=sys.stderr)
    sys.exit(1)

emu_cmd = sys.argv[1]

if len(sys.argv) < 3:
    print('missing demo_list', file=sys.stderr)
    sys.exit(1)

demo_list = sys.argv[2]

demos = list(map(str.strip, open(demo_list, 'r').readlines()))

# Config

max_title_width = 39

# State

current_demo = None
emu_proc = None

# TK objects

gui = tk.Tk()
gui.geometry('640x50')
gui.configure(bg='black')

label = tk.Label(text='', font=('Helvetica', 16))
label.pack(expand=True)

# Helper functions

def set_label(text):
    label.config(text=text, fg='white', bg='black')

def get_demo_title(path):
    parts = path.split('\\')[-2].split(' - ')

    if len(parts) == 1:
        return parts[0]

    # Set date, shift group

    date = parts[0]

    if re.match('^[0-9]{4}-[0-9]{2}-[0-9]{2}$', date):
        date = '{} - '.format(date[:4])
        group = parts[1]
    else:
        date = ''
        group = parts[0]

    # Set name, shift group

    if len(parts) == 2:
        if date:
            group = ''
        else:
            group = parts[0]
        name = parts[1]
    else:
        name = parts[2]

    # Format group

    if group:
        group = '{} - '.format(group)

    # Build title

    title = '{}{}{}'.format(date, group, name)

    # Check width

    if len(name) > max_title_width:
        return '{}...'.format(name[:max_title_width - 3])

    if len(title) > max_title_width:
        title = '{}{}'.format(group, name)
        if len(title) > max_title_width:
            title = name

    return title

def start_emu(demo_path):
    try:
        global emu_proc
        emu_proc = subprocess.Popen([emu_cmd, demo_path])
        # Get focus back from emulator
        time.sleep(1)
        ctypes.windll.user32.SetForegroundWindow(gui.winfo_id())
    except BaseException as e:
        print(e, file=sys.stderr)

def kill_emu():
    try:
        if emu_proc:
            emu_proc.kill()
    except BaseException as e:
        print(e, file=sys.stderr)

def set_demo_label(demo_num):
    if demo_num is None:
        set_label('Current demo: none')
        return

    path = demos[demo_num]
    set_label('Current demo: {}'.format(get_demo_title(path)))

def set_demo(demo_num):
    global current_demo

    current_demo = demo_num
    kill_emu()

    set_demo_label(demo_num)

    if demo_num is None:
        return
    path = demos[demo_num]
    start_emu(path)

def next_demo():
    if current_demo is None:
        set_demo(0)
    elif current_demo == len(demos) - 1:
        set_demo(None)
    else:
        set_demo(current_demo + 1)

def prev_demo():
    if current_demo is None:
        set_demo(len(demos) - 1)
    elif current_demo == 0:
        set_demo(None)
    else:
        set_demo(current_demo - 1)

def reset_demo():
    set_demo(current_demo)

def stop_demo():
    kill_emu()
    set_demo_label(None)

def key_release(e):
    if e.keysym == 'Right':
        next_demo()
    elif e.keysym == 'Left':
        prev_demo()
    elif e.keysym == 'r':
        reset_demo()
    elif e.keysym == 's':
        stop_demo()

# Launch

set_demo(None)

gui.bind('<KeyRelease>', key_release)

gui.mainloop()
