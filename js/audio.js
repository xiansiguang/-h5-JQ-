$(window).load(function() {
    var audio = $("audio").get(0);
    initAudioEvent();

    function initAudioEvent() {
        musicLoad();
        var audioPlayer = document.getElementById('audioPlayer');
        // 当媒体加载完成后，自动将媒体的时间长度更新到页面
        function musicLoad() {
            audio.addEventListener('loadedmetadata', medioTime, true);
            audio.addEventListener("canplaythrough", medioTime, false);
        }

        function medioTime() {
            $(".audio-length-total").html(timeFormat(audio.duration));
        }
        // 监听播放完成事件
        audio.addEventListener('ended', function() {
            // 还原进度条，及音频播放图片
            audioEnded();
        }, false);

        // 点击播放/暂停图片时，控制音乐的播放与暂停
        audioPlayer.addEventListener('click', function() {
            // 监听音频播放时间并更新进度条
            audio.addEventListener('timeupdate', function() {
                updateProgress(audio);
            }, false);
            // 改变播放/暂停图片
            if (audio.paused) {
                // 开始播放当前点击的音频
                audio.play();
                audioPlayer.src = '../images/stop.png';
            } else {
                audio.pause();
                audioPlayer.src = '../images/play.png';
            }
        }, false);
        // 点击进度条跳到指定点播放
        // PS：此处不要用tap，否则下面的拖动进度点事件有可能在此处触发，此时e.offsetX的值非常小，会导致进度条弹回开始处（简直不能忍！！）
        var progressBarBg = document.getElementById('progressBarBg');
        progressBarBg.addEventListener('mousedown', function(event) {
            // 加上if判断则表示：只有音乐开始播放后才可以调节，已经播放过但暂停了的也可以，
            // if (!audio.paused || audio.currentTime != 0) {
            // 此处判断音频是否暂停，暂停则播放音频并且监听音频播放时间并更新进度条
            if (audio.paused) {
                audio.play();
                audioPlayer.src = '../images/stop.png';
                audio.addEventListener('timeupdate', function() {
                    updateProgress(audio);
                }, false);
            }
            var pgsWidth = parseFloat(window.getComputedStyle(progressBarBg, null).width.replace('px', ''));
            var rate = event.offsetX / pgsWidth;
            audio.currentTime = audio.duration * rate;
            // }
        }, false);

        // 拖动进度点调节进度
        dragProgressDotEvent(audio);
    }


    function medioTime() {
        $(".audio-length-total").html(timeFormat(audio.duration));
    }
    /**
     * 鼠标拖动进度点时可以调节进度
     * @param {*} audio
     */
    function dragProgressDotEvent(audio) {
        var dot = document.getElementById('progressDot');

        var position = {
            oriOffestLeft: 0, // 移动开始时进度条的点距离进度条的偏移值
            oriX: 0, // 移动开始时的x坐标
            maxLeft: 0, // 向左最大可拖动距离
            maxRight: 0 // 向右最大可拖动距离
        };
        var flag = false; // 标记是否拖动开始

        // 鼠标按下时
        dot.addEventListener('mousedown', down, false);
        dot.addEventListener('touchstart', down, false);

        // 开始拖动
        document.addEventListener('mousemove', move, false);
        document.addEventListener('touchmove', move, false);

        // 拖动结束
        document.addEventListener('mouseup', end, false);
        document.addEventListener('touchend', end, false);

        function down(event) {
            if (!audio.paused || audio.currentTime != 0) { // 只有音乐开始播放后才可以调节，已经播放过但暂停了的也可以
                flag = true;

                position.oriOffestLeft = dot.offsetLeft;
                position.oriX = event.touches ? event.touches[0].clientX : event.clientX; // 要同时适配mousedown和touchstart事件
                position.maxLeft = position.oriOffestLeft; // 向左最大可拖动距离
                position.maxRight = document.getElementById('progressBarBg').offsetWidth - position.oriOffestLeft; // 向右最大可拖动距离
                // 禁止默认事件（避免鼠标拖拽进度点的时候选中文字）
                if (event && event.preventDefault) {
                    event.preventDefault();
                } else {
                    event.returnValue = false;
                }

                // 禁止事件冒泡
                if (event && event.stopPropagation) {
                    event.stopPropagation();
                } else {
                    window.event.cancelBubble = true;
                }
            }
        }

        function move(event) {
            if (flag) {
                var clientX = event.touches ? event.touches[0].clientX : event.clientX; // 要同时适配mousemove和touchmove事件
                var length = clientX - position.oriX;
                if (length > position.maxRight) {
                    length = position.maxRight;
                } else if (length < -position.maxLeft) {
                    length = -position.maxLeft;
                }
                var progressBarBg = document.getElementById('progressBarBg');
                var pgsWidth = parseFloat(window.getComputedStyle(progressBarBg, null).width.replace('px', ''));
                var rate = (position.oriOffestLeft + length) / pgsWidth;
                audio.currentTime = audio.duration * rate;
                updateProgress(audio);
            }
        }

        function end() {
            flag = false;
        }
    }

    /**
     * 更新进度条与当前播放时间
     * @param {object} audio - audio对象
     */
    function updateProgress(audio) {
        var value = audio.currentTime / audio.duration;
        document.getElementById('progressBar').style.width = value * 100 + '%';
        document.getElementById('progressDot').style.left = value * 100 + '%';
        document.getElementById('audioCurTime').innerText = transTime(audio.currentTime);

    }

    /**
     * 播放完成时把进度调回开始的位置
     */
    function audioEnded() {
        document.getElementById('progressBar').style.width = 0;
        document.getElementById('progressDot').style.left = 0;
        document.getElementById('audioCurTime').innerText = transTime(0);
        document.getElementById('audioPlayer').src = '../images/play.png';
    }

    /**
     * 音频播放时间换算
     * @param {number} value - 音频当前播放时间，单位秒
     */
    function transTime(value) {
        var time = "";
        var h = parseInt(value / 3600);
        value %= 3600;
        var m = parseInt(value / 60);
        var s = parseInt(value % 60);
        if (h > 0) {
            time = formatTime(h + ":" + m + ":" + s);
        } else {
            time = formatTime(m + ":" + s);
        }

        return time;
    }

    /**
     * 格式化时间显示，补零对齐
     * eg：2:4  -->  02:04
     * @param {string} value - 形如 h:m:s 的字符串 
     */
    function formatTime(value) {
        var time = "";
        var s = value.split(':');
        var i = 0;
        for (; i < s.length - 1; i++) {
            time += s[i].length == 1 ? ("0" + s[i]) : s[i];
            time += ":";
        }
        time += s[i].length == 1 ? ("0" + s[i]) : s[i];

        return time;
    }

    //将获取的时间格式化
    function timeFormat(time) {
        var minute = parseInt(time / 60);
        var second = parseInt(time - (minute * 60));
        minute = minute >= 10 ? minute : "0" + minute;
        second = second >= 10 ? second : "0" + second;
        return minute + ":" + second;
    }
})