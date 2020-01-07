// ==UserScript==
// @name         NGA优化摸鱼体验
// @namespace    http://tampermonkey.net/
// @version      1.4
// @require https://cdn.staticfile.org/jquery/3.4.0/jquery.min.js
// @description  NGA论坛功能增强
// @author       HLD
// @match        *bbs.nga.cn/*
// @match        *ngabbs.com/*
// ==/UserScript==

(function() {
    'use strict';

    let setting = {
        hideAvatar: true,
        hideSmile: true,
        hideImage: false,
        hideSign: true,
        linkTargetBlank: true,
        imgResize: true,
        authorMark: true
    }
    //同步配置
    if(window.localStorage.getItem('hld__NGA_setting')){
        let local_setting = JSON.parse(window.localStorage.getItem('hld__NGA_setting'))
        for(let k in setting) {
            !local_setting.hasOwnProperty(k) && (local_setting[k] = setting[k])
        }
        for(let k in local_setting) {
            !setting.hasOwnProperty(k) && delete local_setting[k]
        }
        setting = local_setting
    }
    //注册按键
    $('body').keyup(function(event){
        if (/textarea|select|input/i.test(event.target.nodeName)
            || /text|password|number|email|url|range|date|month/i.test(event.target.type)) {
            return;
        }
        //切换显示头像
        if(event.keyCode == 81){
            $('.avatar').toggle()
        }
        //切换显示表情
        if(event.keyCode == 87){
            $('img').each(function(){
                const classs = $(this).attr('class');
                if(classs && classs.indexOf('smile') > -1) $(this).toggle()
            })
            $('.smile_alt_text').toggle()
        }
        //切换显示图片
        if(event.keyCode == 69){
            $('.postcontent img').each(function(){
                const classs = $(this).attr('class');
                if(!classs && $(this).width() > 24) {
                    if($(this).is(":hidden")) {
                        $(this).show()
                        $('.switch-img').hide()
                    }else {
                        $('.switch-img').css('display', 'inline')
                        $(this).hide()
                    }
                }
            })
        }
    })
    //查找楼主
    if(setting.authorMark && $('#postauthor0').length > 0) {
        $('body').append(`<input type="hidden" value="${$('#postauthor0').text()}" id="hld__post-author">`)
        $('#postauthor0').append('<span class="hld__post-author">[楼主]</span>')
    }
    //动态检测
    setInterval(()=>{
        $('.forumbox.postbox[hld-render!=ok]').length > 0 && runDom()
        $('#hld__setting').length == 0 && $('#startmenu > tbody > tr > td.last').append('<div><div class="item"><a id="hld__setting" href="javascript:eval($(\'hld__setting_panel\').style.display=\'block\')" title="打开NGA优化摸鱼插件设置面板">NGA优化摸鱼插件设置</a></div></div>')
    }, 100)
    //大图
    const resizeImg = (el) => {
        if($('#hld__img_full').length > 0) return
        let url_list = []
        let current_index = el.parent().find('[hld__imglist=ready]').index(el)
        el.parent().find('[hld__imglist=ready]').each(function(){
            url_list.push($(this).data('srcorg') || $(this).data('srclazy') || $(this).attr('src'))
        })
        let $imgBox = $('<div id="hld__img_full" title="点击背景关闭"></div>')
        $imgBox.click(function(){
            $(this).remove()
        })
        $imgBox.append(`<div class="hld__if_control">
<div class="change prev-img" title="本楼内上一张（滚轮上）"><div></div></div>
<div class="change rotate-right" title="逆时针旋转90°"><div></div></div>
<div class="change rotate-left" title="顺时针旋转90°"><div></div></div>
<div class="change next-img" title="本楼内下一张（滚轮下）"><div></div></div>
</div>`)
        $imgBox.on('click', '.change', function(){
            if($(this).hasClass('prev-img') && current_index - 1 >= 0)
                $img.attr('src', url_list[--current_index])
            if($(this).hasClass('next-img') && current_index + 1 < url_list.length)
                $img.attr('src', url_list[++current_index])
            if($(this).hasClass('rotate-right') || $(this).hasClass('rotate-left')) {
                let deg = ($img.data('rotate-deg') || 0) - ($(this).hasClass('rotate-right') ? 90 : -90)
                if(deg >= 360 || deg <= -360) deg = 0
                $img.css('transform', `rotate(${deg}deg)`)
                $img.data('rotate-deg', deg)
                console.log(deg)
                if((Math.abs(deg) == 90 || Math.abs(deg) == 270) && $img.width() > $(window).height()) {
                    $img.css('max-height', ($img.css('max-height').replace('px', '')) * ($img.height() / $img.width()) + 'px')
                }else {
                    $img.css('max-height', $(window).height() * 0.85 + 'px')
                }
            }else {
                $img.css('transform', '')
                $img.data('rotate-deg', 0)
                $img.css('max-height', $(window).height() * 0.85 + 'px')
            }
            return false;
        })
        $imgBox.on("mousewheel DOMMouseScroll", function (e) {
            const delta = (e.originalEvent.wheelDelta && (e.originalEvent.wheelDelta > 0 ? 1 : -1))||
                  (e.originalEvent.detail && (e.originalEvent.detail > 0 ? -1 : 1));
            if(delta > 0 && current_index - 1 >= 0) {
                $img.attr('src', url_list[--current_index])
            }
            if(delta < 0 && current_index + 1 < url_list.length) {
                $img.attr('src', url_list[++current_index])
            }
            e.stopPropagation()
            return false
        })
        let $img = $('<img>')
        $img.css({'max-height': $(window).height() * 0.85 + 'px', 'margin-top': `-${$(window).height() * 0.1}px`, 'transition': 'all .2s ease'})
        $img.attr('src', url_list[current_index])
        $imgBox.append($img)
        $('body').append($imgBox)
    }
    //新页面打开连接
    setting.linkTargetBlank && $('.topic').attr('target', '_blank')
    const runDom = () => {
        //楼内
        $('.forumbox.postbox[hld-render!=ok]').each(function(){
            //隐藏头像
            setting.hideAvatar && $(this).find('.avatar').css('display', 'none')
            //隐藏表情
            $(this).find('img').each(function(){
                const classs = $(this).attr('class');
                if(classs && classs.indexOf('smile') > -1) {
                    const alt = $(this).attr('alt')
                    const $alt = $('<span class="smile_alt_text">[' + alt + ']</span>')
                    setting.hideSmile ? $(this).hide() : $alt.hide()
                    $(this).after($alt)
                }else if(!classs && $(this).attr('onload')) {
                    $(this).attr('hld__imglist', 'ready')
                    if(setting.imgResize) {
                        $(this).width() > 200 && $(this).css({'outline': '', 'outline-offset': '', 'cursor': 'pointer', 'min-width': '200px', 'min-height': 'auto', 'width': '200px', 'height': 'auto', 'margin:': '5px'})
                    }
                    let $imgB = $('<button class="switch-img" style="display:none">图</button>')
                    $imgB.on('click', function(){
                        $(this).prev('img').toggle()
                        $(this).text($(this).prev('img').is(':hidden') ? '图' : '隐藏')
                    })
                    $(this).removeAttr('onload')
                    if(setting.hideImage) {
                        $(this).hide();
                        $imgB.show()
                    }
                    $(this).after($imgB)
                }
            })
            //隐藏签名
            setting.hideSign && $(this).find('.sign, .sigline').css('display', 'none')
            //标记楼主
            if(setting.authorMark) {
                $(this).find('.author, .b').each(function(){
                    let name = $(this).text().replace('[', '').replace(']', '')
                    name == $('#hld__post-author').val() && $(this).append('<span class="hld__post-author">[楼主]</span>')
                })
            }
            //添加标志位
            $(this).attr('hld-render', 'ok')
        })
    }
    if(setting.imgResize) {
        $('#m_posts').on('click', '.postcontent img[hld__imglist=ready]', function(){
            resizeImg($(this))
        })
    }
    //设置面板
    let $panel_dom = $(`<div id="hld__setting_panel">
<a href="javascript:eval($(\'hld__setting_panel\').style.display=\'none\')" class="hld__setting-close">×</a>
<p class="hld__sp-title"><a title="更新地址" href="https://greasyfork.org/zh-CN/scripts/393991-nga%E4%BC%98%E5%8C%96%E6%91%B8%E9%B1%BC%E4%BD%93%E9%AA%8C" target="_blank">NGA优化摸鱼插件设置</a></p>
<p class="hld__sp-section">显示优化</p>
<p><label><input type="checkbox" id="hld__cb_hideAvatar"> 隐藏头像（快捷键切换显示[<b>Q</b>]）</label></p>
<p><label><input type="checkbox" id="hld__cb_hideSmile"> 隐藏表情（快捷键切换显示[<b>W</b>]）</label></p>
<p><label><input type="checkbox" id="hld__cb_hideImage"> 隐藏贴内图片（快捷键切换显示[<b>R</b>]）</label></p>
<p><label><input type="checkbox" id="hld__cb_hideSign"> 隐藏签名</label></p>
<p class="hld__sp-section">功能优化</p>
<p><label><input type="checkbox" id="hld__cb_linkTargetBlank"> 论坛列表新窗口打开</label></p>
<p><label><input type="checkbox" id="hld__cb_imgResize"> 贴内图片功能增强</label></p>
<p><label><input type="checkbox" id="hld__cb_authorMark"> 高亮楼主</label></p>
</div>`)
    let $panel_save_btn = $('<button>保存设置</button>')
    $panel_save_btn.click(()=>{
        for(let k in setting) {
            $('#hld__cb_' + k).length > 0 && (setting[k] = $('#hld__cb_' + k)[0].checked)
        }
        window.localStorage.setItem('hld__NGA_setting', JSON.stringify(setting))
        $panel_dom.hide()
        popMsg('保存成功，刷新页面生效')
    })
    $panel_dom.append($panel_save_btn)
    $('body').append($panel_dom)
    //读取设置
    for(let k in setting) {
        $('#hld__cb_' + k).length > 0 && ($('#hld__cb_' + k)[0].checked = setting[k])
    }
    //消息
    const popMsg = (msg) => {
        alert(msg)
    }
    //样式
    let style = document.createElement("style")
    style.type = "text/css"
    style.appendChild(document.createTextNode(`
.postcontent img {
margin: 0 5px 5px 0;
}
#hld__img_full{
position: fixed;
top: 0;
left: 0;
right: 0;
bottom: 0;
background: rgba(0, 0, 0, 0.6);
z-index: 99999;
display: flex;
align-items: center;
justify-content: center;
}
#hld__img_full img{
display:block;
width:auto;
max-width:auto;
cursor: pointer;
}
.hld__if_control {
position: absolute;
display:flex;
left:50%;
bottom: 15px;
width: 160px;
margin-left:-80px;
height: 40px;
}
#hld__img_full .change {
width: 40px;
height: 40px;
transition: all .2s ease;
cursor:pointer;
}
#hld__img_full .rotate-right,
#hld__img_full .rotate-left{
background:url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACQAAAAgCAYAAAB6kdqOAAADYElEQVRYR8WYS8hWVRSGn3cipg0qCExBKYxKQVJRIh1olF0GXpIIoVIUBZWahZeJOpDEQYMcWCBZQRFCZkpGJGgD0yJSwSyVIO0yMrpObPLK+tvnY3f8zu1Tfxfsydlrrf3uve5HXAPZfgR4HJiY1r3Av8BvwCXgOPChpCNtj1FbxoLPdhy+AHgaeLil/DngHWCHpL/qZDoBsj0P+LQliH5s3yVQO6t0dAW0GdhUUvYP8DXwc1q3AncBYb4pFQfvlrS8314nQKHA9n5gDnAKWCfpi6rbJvM+CSwFppf4jkiaW5btDGhQc9leBbwKjM50vC5pda5z2ACl170P+AS4OwOxRVK4whANK6AsUk8DkzNQiyXtvZmAJqVAuCWB6vnTTXmhZL5yxK6UtOsqQLaD8UdJbw3qwG3kbEdqiHQxNvHvlbT4f4Bsn08lIHg2SNrWRnm68e3APUBk4ouSLjfJ2n4DiOgLuiTpzh4g248Cn5WUrJFUmVUzJ80Vx+efgBeaapjtZ4A92ZnTckCvAOv73Oo5Se9W3db2i8BrFfuTJZ2peynbzvYX5IC+AaZWCM+XdKC8Z/s24PeaA49Kmt0A6JfMj1YMAbIdQAJQFf0JLCybwPaDwIkauSG/aAAUjl2UlXUFoJeB7Q1OeBFYJKkH3Hbkk29r5H6VNG4QQMeAh5qiAjgpqWdW2yOBePI7KmQPSJrfyWS2J0TeaQGmYJmbm64UumU1EyX90MmpG6KkrOsPYLykv/MN2wuBjcCM9D3q0kuS4vUqyfYyYHfGME22D6f+pk72SyD6nv11ucV2NGSRFAN4I9l+D1iSGP9LjLYPAtFEVdEhSY81au/IYPuB8ElgRPGqvdJhO7JlhOfnwAfAE6WoWyHpzY5n1rLb3prMXPD1L67Fru3IsHGLoJgaZkmK0eaayfZMINygoOb2w/azwPuZ0EfA82WHHgRdqVyEinYNmu2PgafymwDLJF0YEEj4avhsTu1bWNsxykRhLcI5FIUjhpJ9XUClJj+6gpy6N/mpkYqpM9qTnGI8fruukbthY5DtGP4C1KI+rxI5JzJ9rHD+UcM2KNpeC6wBoqgOQtd3lA4E6bUKYONbooqxJyL2+v5syA+3PSaVnPuBGACLFb9ivgfOAl9FyWkqsLneKyNmUcarECm7AAAAAElFTkSuQmCC) center no-repeat;
background-size: 25px;
}
#hld__img_full .rotate-right {
transform: rotateY(180deg);
}
#hld__img_full .rotate-left:hover {
transform: scale(1.2);
}
#hld__img_full .rotate-right:hover {
transform: scale(1.2) rotateY(180deg);
}
#hld__img_full .next-img:hover {
transform: scale(1.2) rotate(180deg);
}
#hld__img_full .prev-img,
#hld__img_full .next-img{
background:url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAABmUlEQVRYR+3WsUtWURjH8e8z+J/4J7QF4vL+C5ZBiAoh6lCDDQmBoIMOOiiIoBCBU+DiUENRQUWigiAuCjoo5JAmkQ41/OTCEzxEwznnvr4u750vfD/nOfdcjnHLj91ynzagqROQ1AC2zOxH6tY2DSBpAnju4Ttmtp2CaApA0hTwLAT7zexFSwCSZoCxENsDuszs/MYBkuaAxyG0A9wzs/2UePVO8RZIWgBGQmgTuG9mh6nxYoCkJeBRCH3x+HFOvAggaQUYCKGPQK+ZfcuNZwMkvQQehtA7X/n3kngWQNIn4G4IvfGVX5TGkwGSDoDOEFr3+GWdeA7gN9DhsV9Aw8y+1o3nAN4D3SF45BPYqItI/g9IGgcmQ7A6ctXX/7kOIhlQRSQ9BaZD8NQRH0oRWQBHPAFmQ/DMj+LbEkQ2wBGjwHwI/nTE61xEEcARQ8BiCF45ojqiyU8xwBGDwHKo/XHEWqqgFsARfcC/l4+W34geAKth1T1m9iplCrUn8DciqceP6C4wbGYnLQWkxP73TtMm0Aa0J1A6gWvfCH8hDgZXwQAAAABJRU5ErkJggg==) center no-repeat;
}
#hld__img_full .next-img {
transform: rotate(180deg);
}
#hld__img_full .prev-img:hover {
transform: scale(1.2);
}
#hld__img_full .next-img:hover {
transform: scale(1.2) rotate(180deg);
}
#hld__setting {
color:#6666CC;
}
#hld__setting_panel {
display:none;
position:fixed;
top:70px;
left:50%;
margin-left:-120px;
background:#FFF;
width:240px;
padding: 15px 20px;
border-radius: 10px;
box-shadow: 0 0 10px #666;
}
#hld__setting_panel p{
margin-bottom:10px;
}
#hld__setting_panel .hld__sp-title {
font-size: 15px;
font-weight: bold;
text-align: center;
}
#hld__setting_panel .hld__sp-section{
font-weight: bold;
margin-top: 20px;
}
#hld__setting_panel .hld__setting-close{
position: absolute;
top: 5px;
right: 5px;
padding: 3px 6px;
background: #efefef;
transition: all .2s ease;
cursor:pointer;
border-radius: 4px;
text-decoration: none;
}
#hld__setting_panel .hld__setting-close:hover{
background: #1a3959;
color: #FFF;
}
#hld__setting_panel button {
margin-top:10px;
margin-left: 85px;
background: #FFF;
border: 1px solid #10273f;
color: #10273f;
padding: 3px 8px;
transition: all .2s ease;
cursor:pointer;
}
#hld__setting_panel button:hover {
background: #10273f;
color: #FFF;
}
.hld__post-author {
color:#F00;
font-weight:bold;
}
`))
    document.getElementsByTagName("head")[0].appendChild(style)

})();