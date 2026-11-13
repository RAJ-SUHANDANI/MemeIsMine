#!/usr/bin/env python3
"""Build a launch edit strictly from captured production-site video frames."""
import json, subprocess
from pathlib import Path
D=Path(__file__).resolve().parent
out=D/"output"
m=json.loads((out/"marks.json").read_text())
cuts=[
    ("intro",m["home_loaded"]+1.3,m["home_loaded"]+3.3),
    ("hero",m["home_hero"]+.02,m["caption_edit"]-.03),
    ("live_caption",m["caption_edit"],m["scroll_images"]-.12),
    ("image_collection",m["scroll_images"]+.2,m["explore_nav"]-.8),
    ("explore_gallery",m["explore_view"]-.75,m["videos_nav"]-.15),
    ("moving_reactions",m["videos_view"]-.75,m["outro_nav"]-.1),
    ("outro",m["outro_view"]-.1,m["end"]-.1),
]
assert all(e>s for _,s,e in cuts)
duration=sum(e-s for _,s,e in cuts)
assert 18 <= duration <= 25, (duration,cuts)
print("Real-footage edit",[(n,round(e-s,2)) for n,s,e in cuts],"duration",round(duration,2))
n=len(cuts)
filters=[f"[0:v]split={n}"+ "".join(f"[v{i}]" for i in range(n))]
for i,(_,start,end) in enumerate(cuts):
    filters.append(f"[v{i}]trim=start={start:.4f}:end={end:.4f},setpts=PTS-STARTPTS,fps=30[v{i}o]")
filters.append("".join(f"[v{i}o]" for i in range(n))+f"concat=n={n}:v=1:a=0,scale=1920:1080:flags=lanczos,format=yuv420p[outv]")
filters.append(f"[1:a]atrim=duration={duration:.4f},asetpts=PTS-STARTPTS,volume=0.67,afade=t=in:st=0:d=0.6,afade=t=out:st={duration-1.2:.4f}:d=1.2[outa]")
music=out/"brag-music.mp3"
subprocess.run(["curl","-fsSL","--retry","3","https://raw.githubusercontent.com/latent-spaces/brag/main/skills/brag/assets/music/happy-beats-business-moves-vol-10-by-ende-dot-app.mp3","-o",str(music)],check=True)
mp4=out/"memeismine-real-launch.mp4"
subprocess.run(["ffmpeg","-y","-hide_banner","-loglevel","warning","-i",str(out/"raw.webm"),"-ss","6","-i",str(music),"-filter_complex",";".join(filters),"-map","[outv]","-map","[outa]","-c:v","libx264","-preset","medium","-crf","19","-pix_fmt","yuv420p","-c:a","aac","-b:a","160k","-movflags","+faststart",str(mp4)],check=True)
subprocess.run(["ffmpeg","-y","-loglevel","error","-ss","5.5","-i",str(mp4),"-frames:v","1","-q:v","2",str(out/"memeismine-real-poster.jpg")],check=True)
subprocess.run(["ffprobe","-v","error","-show_entries","format=duration,size","-of","default=noprint_wrappers=1",str(mp4)],check=True)
print("Completed:",mp4)
