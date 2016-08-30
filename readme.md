# Clappr Subtitle

Simple Usage

```js
 var player = new Clappr.Player({
    source: 'video.mp4',
    baseUrl: '/latest',
    mute: true,
    height: 360,
    width: 640,
    plugins: [ClapprSubtitle],
    subtitle : "video.srt" // URL to subtitle
});
player.attachTo(document.getElementById('player'));
```

Styling the subtitles

```js
 var player = new Clappr.Player({
    source: 'video.mp4',
    baseUrl: '/latest',
    mute: true,
    height: 360,
    width: 640,
    plugins: [ClapprSubtitle],
    subtitle : {
        src : "video.srt",
        auto : true, // automatically loads subtitle
        backgroundColor : 'transparent',
        fontWeight : 'normal',
        fontSize : '14px',
        color: 'yellow',
        textShadow : '1px 1px #000'
    },
});
player.attachTo(document.getElementById('player'));
```

# SRT FORMAT

```
1
00:00:12,598 --> 00:00:13,891
Do not try and bend the spoon. That's impossible. Instead... only try to realize the truth.

2
00:00:14,212 --> 00:00:17,846
- What truth?
- There is no spoon.

3
00:00:18,102 --> 00:00:24,317
- There is no spoon?
- Then you'll see, that it is not the spoon that bends, it is only yourself.
```

# WARNING

This is a very early version.  You can't select subtitle tracks, and long srt files may run slow.
