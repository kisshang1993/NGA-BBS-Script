// ==UserScript==
// @name         NGA优化摸鱼体验
// @namespace    https://github.com/kisshang1993/NGA-BBS-Script
// @version      3.3
// @author       HLD
// @description  NGA论坛显示优化，功能增强，防止突然蹦出一对??而导致的突然性的社会死亡
// @license      GPL-3.0
// @require      https://cdn.staticfile.org/jquery/3.4.0/jquery.min.js
// @require      https://cdn.staticfile.org/spectrum/1.8.0/spectrum.js
// @icon         https://s1.ax1x.com/2020/06/28/N25WBF.png
// @match        *://bbs.nga.cn/*
// @match        *://ngabbs.com/*
// @match        *://nga.178.com/*
// @inject-into content
// ==/UserScript==
(function () {
    'use strict';

    const default_shortcut = [81, 87, 69, 37, 39, 82]
    let setting = {
        hideAvatar: true,
        hideSmile: true,
        hideImage: false,
        imgEnhance: true,
        hideSign: true,
        hideHeader: true,
        excelMode: false,
        linkTargetBlank: false,
        imgResize: true,
        authorMark: true,
        autoPage: true,
        keywordsBlock: true,
        markAndBan: true,
        shortcutKeys: default_shortcut
    }
    let advanced_setting = {
        dynamicEnable: true,
        banStrictMode: false,
        kwdWithoutTitle: false,
        autoPageOffset: 5,
        excelNoMode: true,
        excelTitle: '工作簿1',
        authorMarkColor: '#FF0000',
        imgResizeWidth: 200,
        classicRemark: false
    }
    let post_author = []
    let ban_list = []
    let mark_list = []
    let keywords_list = []
    let before_url = window.location.href
    let $window = $(window)

    const shortcut_name = ['隐藏头像', '隐藏表情', '隐藏图片', '楼内上一张图', '楼内下一张图', '切换Excel模式']
    const shortcut_code = {
        'A': 65, 'B': 66, 'C': 67, 'D': 68, 'E': 69, 'F': 70, 'G': 71,
        'H': 72, 'I': 73, 'J': 74, 'K': 75, 'L': 76, 'M': 77, 'N': 78,
        'O': 79, 'P': 80, 'Q': 81, 'R': 82, 'S': 83, 'T': 84,
        'U': 85, 'V': 86, 'W': 87, 'X': 88, 'Y': 89, 'Z': 90,
        '0': 48, '1': 49, '2': 50, '3': 51, '4': 52, '5': 53, '6': 54, '7': 55, '8': 56, '9': 57,
        'LEFT': 37, 'RIGHT': 39, 'UP': 38, 'DOWN': 40, '': 0
    }
    const getCodeName = (code) => {
        let keyname = ''
        for (let [n, c] of Object.entries(shortcut_code)) {
            c == code && (keyname = n)
        }
        return keyname
    }

    const color_picker_config = {
        type: 'color',
        preferredFormat: 'hex',
        showPaletteOnly: 'true',
        togglePaletteOnly: 'true',
        hideAfterPaletteSelect: 'true',
        showAlpha: 'false',
        togglePaletteMoreText: '更多选项',
        togglePaletteLessText: '隐藏',
        palette: [
            ['#000000','#444444','#5b5b5b','#999999','#bcbcbc','#eeeeee','#f3f6f4','#ffffff'],
            ['#f44336','#744700','#ce7e00','#8fce00','#2986cc','#16537e','#6a329f','#c90076'],
            ['#f4cccc','#fce5cd','#fff2cc','#d9ead3','#d0e0e3','#cfe2f3','#d9d2e9','#ead1dc'],
            ['#ea9999','#f9cb9c','#ffe599','#b6d7a8','#a2c4c9','#9fc5e8','#b4a7d6','#d5a6bd'],
            ['#e06666','#f6b26b','#ffd966','#93c47d','#76a5af','#6fa8dc','#8e7cc3','#c27ba0'],
            ['#cc0000','#e69138','#f1c232','#6aa84f','#45818e','#3d85c6','#674ea7','#a64d79'],
            ['#990000','#b45f06','#bf9000','#38761d','#134f5c','#0b5394','#351c75','#741b47'],
            ['#660000','#783f04','#7f6000','#274e13','#0c343d','#073763','#20124d','#4c1130']
        ]
    }

    //检查更新
    if (window.localStorage.getItem('hld__NGA_version')) {
        const current_version = +window.localStorage.getItem('hld__NGA_version')
        if (GM_info.script.version > current_version) {
            const focus = ''
            $('body').append(`<div id="hld__updated" class="animated-1s bounce"><p><a href="javascript:void(0)" class="hld__setting-close">×</a><b>NGA优化摸鱼插件已更新至v${GM_info.script.version}</b></p>${focus}<p><a class="hld__readme" href="https://greasyfork.org/zh-CN/scripts/393991-nga%E4%BC%98%E5%8C%96%E6%91%B8%E9%B1%BC%E4%BD%93%E9%AA%8C" target="_blank">查看更新内容</a></p></div>`)
            $('body').on('click', '#hld__updated a', function () {
                $(this).parents('#hld__updated').remove()
                window.localStorage.setItem('hld__NGA_version', GM_info.script.version)
            })
        }
    } else window.localStorage.setItem('hld__NGA_version', GM_info.script.version)
    //同步配置
    //基础设置
    if (window.localStorage.getItem('hld__NGA_setting')) {
        let local_setting = JSON.parse(window.localStorage.getItem('hld__NGA_setting'))
        for (let k in setting) {
            !local_setting.hasOwnProperty(k) && (local_setting[k] = setting[k])
            if (k == 'shortcutKeys') {
                if (local_setting[k].length < setting[k].length) {
                    const offset_count = setting[k].length - local_setting[k].length
                    local_setting[k] = local_setting[k].concat(setting[k].slice(-offset_count))
                }
            }
        }
        for (let k in local_setting) {
            !setting.hasOwnProperty(k) && delete local_setting[k]
        }
        setting = local_setting
    }
    //高级设置
    if (window.localStorage.getItem('hld__NGA_advanced_setting')) {
        let local_advanced_setting = JSON.parse(window.localStorage.getItem('hld__NGA_advanced_setting'))
        for (let k in advanced_setting) {
            !local_advanced_setting.hasOwnProperty(k) && (local_advanced_setting[k] = advanced_setting[k])
        }
        for (let k in local_advanced_setting) {
            !advanced_setting.hasOwnProperty(k) && delete local_advanced_setting[k]
        }
        advanced_setting = local_advanced_setting
    }
    //同步列表
    const local_keywords_list = window.localStorage.getItem('hld__NGA_keywords_list')
    local_keywords_list && (keywords_list = local_keywords_list.split(','))
    const local_ban_list = window.localStorage.getItem('hld__NGA_ban_list')
    if(local_ban_list) {
        try {
            ban_list = JSON.parse(local_ban_list)
        } catch (error) {
            //3.3版本升级数据格式转换
            const t = local_ban_list.split(',')
            if (t) {
                t.forEach(item => ban_list.push({name: item, uid: ''}))
                window.localStorage.setItem('hld__NGA_ban_list', JSON.stringify(ban_list))
                window.localStorage.setItem('hld__NGA_ban_list', local_ban_list)
            }
        }
    }
    const local_mark_list = window.localStorage.getItem('hld__NGA_mark_list')
    if(local_mark_list) {
        try {
            mark_list = JSON.parse(local_mark_list)
        } catch (error) {
            const mark_list_str_obj = local_mark_list.split(',')
            mark_list_str_obj.forEach(item => {
                const name = item.split(':')[0]
                const mark_str = item.split(':')[1]
                let mark_obj = {name, uid: '', marks: []}
                const r_l = mark_str.split('&')
                r_l.forEach(item => {
                    let marks = {}
                    const f = item.split('(')
                    marks.mark = f[0]
                    if(f.length > 1) {
                        const g = f[1].substring(0, f[1].length - 1)
                        marks.text_color = g.split('^')[0]
                        marks.bg_color = g.split('^')[1]
                    }
                    mark_obj.marks.push(marks)
                });
                mark_list.push(mark_obj)
            })
            window.localStorage.setItem('hld__NGA_mark_list', JSON.stringify(mark_list))
            window.localStorage.setItem('hld__NGA_mark_list_bak', local_mark_list)
        }
    }
    //注册按键
    $('body').keyup(function (event) {
        if (/textarea|select|input/i.test(event.target.nodeName)
            || /text|password|number|email|url|range|date|month/i.test(event.target.type)) {
            return;
        }
        //切换显示头像
        if ((setting.hideAvatar || advanced_setting.dynamicEnable) && event.keyCode == setting.shortcutKeys[0]) {
            $('.avatar').toggle()
            popNotification(`${$('.avatar:hidden').length == 0 ? '显示' : '隐藏'}头像`)
        }
        //切换显示表情
        if ((setting.hideSmile || advanced_setting.dynamicEnable) && event.keyCode == setting.shortcutKeys[1]) {
            $('img').each(function () {
                const classs = $(this).attr('class');
                if (classs && classs.includes('smile')) $(this).toggle()
            })
            $('.smile_alt_text').toggle()
            popNotification(`${$('.smile_alt_text:hidden').length > 0 ? '显示' : '隐藏'}表情`)
        }
        //切换显示图片
        if ((setting.hideImage || advanced_setting.dynamicEnable) && event.keyCode == setting.shortcutKeys[2]) {
            if ($('.hld__img-resize:hidden').length < $('.switch-img').length) {
                $('.hld__img-resize').hide()
                $('.switch-img').text('图').show()
                popNotification(`隐藏图片`)
                return
            }
            $('.hld__img-resize').each(function () {
                $(this).toggle()
                $(this).is(':hidden') ? $(this).next('button.switch-img').show() : $(this).next('button.switch-img').hide()
            })
            popNotification(`${$('.switch-img:hidden').length > 0 ? '显示' : '隐藏'}图片`)
        }
        //关闭大图
        if (event.keyCode == 27) {
            if ($('#hld__img_full').length > 0) {
                $('#hld__img_full').remove()
            }
        }
        //上一张图片
        if (event.keyCode == setting.shortcutKeys[3]) {
            if ($('#hld__img_full').length > 0) {
                $('#hld__img_full .prev-img').click()
            }
        }
        //下一张图片
        if (event.keyCode == setting.shortcutKeys[4]) {
            if ($('#hld__img_full').length > 0) {
                $('#hld__img_full .next-img').click()
            }
        }
        //Excel模式
        if ((setting.excelMode || advanced_setting.dynamicEnable) && event.keyCode == setting.shortcutKeys[5]) {
            switchExcelMode()
            popNotification($('.hld__excel-body').length > 0 ? 'Excel模式' : '普通模式')
        }
    })
    setting.autoPage && $('body').addClass('hld__reply-fixed')
    $('body').append('<div class="hld__excel-div hld__excel-header"><img src="https://s1.ax1x.com/2020/06/28/N25bjK.png"></div>')
    $('body').append('<div class="hld__excel-div hld__excel-footer"><img src="https://s1.ax1x.com/2020/06/28/N2I93t.jpg"></div>')
    $('.hld__excel-header, .hld__excel-footer').append('【这里应该是一张仿造Excel的图片，如不显示，请刷新重试，如还不显示，请及时反馈！】')
    $('body').append('<div class="hld__excel-div hld__excel-setting"><img src="https://s1.ax1x.com/2020/06/28/N25WBF.png"><a id="hld__excel_setting" href="javascript:void(0)" title="打开NGA优化摸鱼插件设置面板">摸鱼</div>')
    $('#hld__excel_setting').click(()=>$('#hld__setting_cover').css('display', 'flex'))

    //快捷键-列表维护
    $('body').on('click', '#hld__shortcut_manage', function () {
        if($('#hld__shortcut_panel').length > 0) return
        let $shortcutPanel = $(`<div id="hld__shortcut_panel" class="hld__list-panel animated fadeInUp">
        <a href="javascript:void(0)" class="hld__setting-close">×</a>
        <div>
        <div><p>编辑快捷键</p><div class="hld__float-left"><table class="hld__table hld__table-keyword"><thead><tr><td>功能</td><td width="60">快捷键</td></tr></thead>
        <tbody></tbody></table></div><div class="hld__float-left hld__shortcut-desc"><p><b>支持的快捷键范围</b></p><p>键盘 <code>A</code>~<code>Z</code></p><p>左箭头 <code>LEFT</code></p><p>右箭头 <code>RIGHT</code></p><p>上箭头 <code>UP</code></p><p>下箭头 <code>DOWN</code></p><p><i>* 留空则取消快捷键</i></p><br><p>如按键异常请尝试重置按键</p>
        </div>
        <div class="clearfix"></div></div>
        </div>
        <div class="hld__btn-groups">
        <button class="hld__btn" data-type="reset_shortcut">重置按键</button>
        <button class="hld__btn" data-type="save_shortcut">保存快捷键</button>
        </div>
        </div>`)
        for (let [index, sn] of shortcut_name.entries()) {
            const keycode = setting.shortcutKeys[index]
            $shortcutPanel.find('.hld__table tbody').append(`<tr><td>${sn}</td><td><input type="text" value="${getCodeName(keycode)}"></td></tr>`)
        }
        $('#hld__setting_cover').append($shortcutPanel)
    })

    //拉黑标签-列表维护
    if (setting.markAndBan) {
        //绑定事件
        $('body').on('click', '.hld__extra-icon', function () {
            const type = $(this).data('type')
            const name = $(this).data('name')
            const uid = $(this).data('uid') + ''
            $('.hld__dialog').length > 0 && $('.hld__dialog').remove()
            if (type == 'ban') {
                banlistPopup({
                    type: 'confirm',
                    name,
                    uid,
                    top: $(this).offset().top+20,
                    left: $(this).offset().left-10
                })
            }
            if (type == 'mark') {
                userMarkPopup({
                    name,
                    uid,
                    top: $(this).offset().top+20,
                    left: $(this).offset().left-10
                })
            }
        })
    }
    //关键字管理
    $('body').on('click', '#hld__keywords_manage', function () {
        if($('#hld__keywords_panel').length > 0) return
        $('#hld__setting_cover').append(`<div id="hld__keywords_panel" class="hld__list-panel animated fadeInUp">
        <a href="javascript:void(0)" class="hld__setting-close">×</a>
        <div>
        <div class="hld__list-c"><p>屏蔽关键字</p><textarea row="20" id="hld__keywords_list_textarea"></textarea><p class="hld__list-desc">一行一条</p></div>
        </div>
        <div class="hld__btn-groups"><button class="hld__btn" data-type="save_keywords">保存列表</button></div>
        </div>`)
        $('#hld__keywords_list_textarea').val(keywords_list.join('\n'))
    })
    //名单管理
    $('body').on('click', '#hld__list_manage', function () {
        if($('#hld__banlist_panel').length > 0) return
        $('#hld__setting_cover').append(`<div id="hld__banlist_panel"  class="hld__list-panel animated fadeInUp">
        <a href="javascript:void(0)" class="hld__setting-close">×</a>
        <div class="hld__tab-header"><span class="hld__table-active">简易模式</span><span>原始数据</span></div>
        <div class="hld__tab-content hld__format-list hld__table-active">
        <div class="hld__list-c"><p>黑名单</p>
        <div class="hld__scroll-area">
        <table class="hld__table hld__table-banlist">
        <thead><tr><th width="175">用户名</th><th>UID</th><th width="25">操作</th></tr></thead><tbody id="hld__banlist"></tbody></table>
        </div>
        <div class="hld__table-banlist-buttons"><button id="hld__banlist_add_btn" class="hld__btn">+添加用户</button></div>
        </div>
        <div class="hld__list-c"><p>标签名单</p>
        <div class="hld__scroll-area">
        <table class="hld__table hld__table-banlist">
        <thead><tr><th width="100">用户名</th><th>UID</th><th width="50">标签数</th><th width="50">操作</th></tr></thead><tbody id="hld__marklist"></tbody></table>
        </div>
        <div class="hld__table-banlist-buttons"><button id="hld__marklist_add_btn" class="hld__btn">+添加用户</button></div>
        </div>
        </div>
        <div class="hld__tab-content hld__source-list">
        <div class="hld__list-c"><p>黑名单</p><textarea row="20" id="hld__ban_list_textarea"></textarea><p class="hld__list-desc" title='[{\n    "uid": "UID",\n    "name": "用户名"\n  }, ...]'>查看数据结构</p></div>
        <div class="hld__list-c"><p>标签名单</p><textarea row="20" id="hld__mark_list_textarea"></textarea><p class="hld__list-desc" title='[{\n    "uid": "UID",\n    "name": "用户名",\n    "marks": [{\n        "mark": "标记",\n        "text_color": "文字色",\n        "bg_color": "背景色"\n    }, ...]\n  }, ...]'>查看数据结构</p></div>
        <div class="hld__btn-groups" style="width: 100%;"><button class="hld__btn" data-type="save_banlist">保存列表</button></div>
        </div>
        </div>`)
        //切换选项卡
        $('body').on('click', '.hld__tab-header > span', function(){
            $('.hld__tab-header > span, .hld__tab-content').removeClass('hld__table-active')
            $(this).addClass('hld__table-active')
            $('.hld__tab-content').eq($(this).index()).addClass('hld__table-active')
        })
        //移除黑名单用户
        $('body').on('click', '.hld__bl-del', function(){
            const index = $(this).data('index')
            ban_list.splice(index, 1)
            window.localStorage.setItem('hld__NGA_ban_list', JSON.stringify(ban_list))
            reloadBanlist()
        })
        //添加黑名单用户
        $('body').on('click', '#hld__banlist_add_btn', function(){
            banlistPopup({
                type: 'add',
                name: $(this).data('name'),
                uid: $(this).data('uid'),
                top: $(this).offset().top + 30,
                left: $(this).offset().left - 5,
                callback: () => {reloadBanlist()}
            })
        })
        //修改标记
        $('body').on('click', '.hld__ml-edit', function(){
            const name = $(this).data('name')
            const uid = $(this).data('uid') + ''
            userMarkPopup({
                name,
                uid,
                top: $(this).offset().top + 30,
                left: $(this).offset().left - 5,
                callback: () => {reloadMarklist()}
            })
        })
        //删除标记
        $('body').on('click', '.hld__ml-del', function(){
            const index = $(this).data('index')
            mark_list.splice(index, 1)
            window.localStorage.setItem('hld__NGA_mark_list', JSON.stringify(mark_list))
            reloadMarklist()
        })
        //添加标记
        $('body').on('click', '#hld__marklist_add_btn', function(){
            userMarkPopup({
                type: 'add',
                name: $(this).data('name'),
                uid: $(this).data('uid'),
                top: $(this).offset().top + 30,
                left: $(this).offset().left - 5,
                callback: () => {reloadMarklist()}
            })
        })
        //重载名单
        reloadBanlist()
        reloadMarklist()
    })
    //集中面板按钮响应
    $('body').on('click', '.hld__btn', function () {
        const type = $(this).data('type')
        if(!type) return
        if (type == 'save_keywords') {
            let keywords_list = $('#hld__keywords_list_textarea').val().split('\n')
            keywords_list = removeBlank(keywords_list)
            keywords_list = uniq(keywords_list)
            window.localStorage.setItem('hld__NGA_keywords_list', keywords_list.join(','))
        }
        if (type == 'save_banlist') {
            const ban_list = $('#hld__ban_list_textarea').val()
            const mark_list = $('#hld__mark_list_textarea').val()
            window.localStorage.setItem('hld__NGA_ban_list', ban_list)
            window.localStorage.setItem('hld__NGA_mark_list', mark_list)
            //重载名单
            reloadBanlist()
            reloadMarklist()
        }
        if (type == 'reset_shortcut') {
            setting.shortcutKeys = default_shortcut
            window.localStorage.setItem('hld__NGA_setting', JSON.stringify(setting))
            popMsg('重置成功，刷新页面生效')
        }
        if (type == 'save_shortcut') {
            let shortcut_keys = []
            $('.hld__table tbody>tr').each(function () {
                const v = $(this).find('input').val().trim().toUpperCase()
                if (Object.keys(shortcut_code).includes(v)) shortcut_keys.push(shortcut_code[v])
                else popMsg(`${v}是个无效的快捷键`)
            })
            if (shortcut_keys.length != setting.shortcutKeys.length) return
            setting.shortcutKeys = shortcut_keys
            window.localStorage.setItem('hld__NGA_setting', JSON.stringify(setting))
            popMsg('保存成功，刷新页面生效')
        }
        $('.hld__list-panel').remove()
    })
    $('body').on('click', '.hld__list-panel .hld__setting-close', function () {
        $(this).parent().remove()
    })

    //动态检测
    setInterval(() => {
        alwaysDetect()
        isThreads() && renderThreads()
        isPosts() && renderPosts()
    }, 100)

    //持续监测
    const alwaysDetect = () => {
        //insert Menu
        if($('.hld__setting-box').length == 0) {
            $('#startmenu > tbody > tr > td.last').append('<div><div class="item hld__setting-box"></div></div>')
            let $entry = $('<a id="hld__setting" title="打开NGA优化摸鱼插件设置面板">NGA优化摸鱼插件设置</a>')
            $entry.click(()=>$('#hld__setting_cover').css('display', 'flex'))
            $('#hld__setting_close').click(()=>$('#hld__setting_cover').fadeOut(200))
            $('.hld__setting-box').append($entry)
        }
        if(setting.excelMode && window.location.href != before_url) {
            before_url = window.location.href
            if(before_url.includes('thread.php') || before_url.includes('read.php')) {
                $('.hld__excel-body').length == 0 && $('body').addClass('hld__excel-body')
            }else {
                $('.hld__excel-body').length > 0 && $('body').removeClass('hld__excel-body')
            }
        }
        if ($('.hld__excel-body').length > 0) {
            $(document).attr('title') != advanced_setting.excelTitle && $(document).attr('title', advanced_setting.excelTitle);
            $('#hld__excel_icon').length == 0 && $('head').append('<link id= "hld__excel_icon" rel="shortcut icon" type="image/png" href="https://s1.ax1x.com/2020/06/28/N25Jpt.png" />')
        }
        //自动翻页
        if(setting.autoPage) {
            if($('#hld__next_page').length > 0) return
            $('#pagebbtm>.stdbtn[hld-auto-page!=ok] td').each(function(){
                if($(this).children('a').text() == '>') {
                    $(this).children('a').attr('id', 'hld__next_page')
                    $window.on('scroll.autoPage', function(){
                        const offset = +advanced_setting.autoPageOffset;
                        if ($(document).scrollTop() != 0 && ($(document).scrollTop() + $(window).height() >= $(document).height() * (1 - offset / 100))) {
                            if($('#hld__next_page').length > 0) {
                                console.warn('Auto Page')
                                document.getElementById('hld__next_page').click()
                                $('#hld__next_page').removeAttr('id')
                                $window.off('scroll.autoPage')
                            }
                        }
                    })
                }
            })
            $('#pagebbtm>.stdbtn').attr('hld-auto-page', 'ok')
        }
    }
    const isThreads = () => $('#m_threads').length > 0
    const isPosts = () => $('#m_posts').length > 0
    const switchExcelMode = () => {
        $('body').toggleClass('hld__excel-body')
        !advanced_setting.excelNoMode && $('body').addClass('hld__excel-original-no')
    }
    if(setting.excelMode) {
        if(before_url.includes('thread.php') || before_url.includes('read.php')) switchExcelMode()
    }
    //论坛列表
    const renderThreads = () => {
        //隐藏版头
        if (setting.hideHeader && $('#hld__switch_header').length == 0) {
            $('#toppedtopic, #sub_forums').hide()
            let $toggle_header_btn = $('<button style="position: absolute;right: 16px;" id="hld__switch_header">切换显示版头</button>')
            $toggle_header_btn.click(() => $('#toppedtopic, #sub_forums').toggle())
            $('#toptopics > div > h3').append($toggle_header_btn)
        }
        $('.topicrow[hld-render!=ok]').each(function () {
            const title = $(this).find('.c2>a').text()
            const uid = ($(this).find('.author').attr('href') && $(this).find('.author').attr('href').indexOf('uid=') > -1) ? $(this).find('.author').attr('href').split('uid=')[1] + '' : ''
            const name = $(this).find('.author').text()
            if (setting.markAndBan) {
                const ban_user = getBanUser({name, uid})
                if (ban_list.length > 0 && ban_user) {
                    console.warn(`【NGA优化摸鱼体验脚本-黑名单屏蔽】标题：${title}  连接：${$(this).find('.c2>a').attr('href')}`)
                    $(this).parents('tbody').remove()
                }
                if (mark_list.length > 0) {
                    const user_mark = getUserMarks({name, uid})
                    if (user_mark) {
                        let f = []
                        user_mark.marks.forEach(e => f.push(e.mark))
                        $(this).find('.author').append(`<span class="hld__remark"> (${f.join(', ')}) </span>`)
                    }
                }
            }
            if (!advanced_setting.kwdWithoutTitle && setting.keywordsBlock && keywords_list.length > 0) {
                for (let keyword of keywords_list) {
                    if (title.includes(keyword)) {
                        console.warn(`【NGA优化摸鱼体验脚本-关键字屏蔽】标题：${title}  连接：${$(this).find('.c2>a').attr('href')}`)
                        $(this).remove()
                        break
                    }
                }
            }
            //新页面打开链接
            if (setting.linkTargetBlank) {
                let $link = $(this).find('.topic')
                $link.data('href', $link.attr('href')).attr('href', 'javascript:void(0)')
                $link.click(() => {
                    window.open($link.data('href'))
                    return false
                })
            }
            //添加标志位
            $(this).attr('hld-render', 'ok')
        })

    }

    //论坛详情
    const renderPosts = () => {
        //标记楼主
        if (setting.authorMark) {
            const author = $('#postauthor0').text().replace('[楼主]', '')
            if (author && $('#hld__post-author').val() != author) {
                const local_post_author = window.localStorage.getItem('hld__NGA_post_author')
                local_post_author && (post_author = local_post_author.split(','))
                const tid = getQueryString('tid')
                if (tid) {
                    const author_str = `${tid}:${author}`
                    if (!post_author.includes(author_str))
                        post_author.unshift(author_str) > 10 && post_author.pop()
                    window.localStorage.setItem('hld__NGA_post_author', post_author.join(','))
                }
                for (let pa of post_author) {
                    const t = pa.split(':')
                    if (t[0] == tid) {
                        if ($('#hld__post-author').length == 0) $('body').append(`<input type="hidden" value="${t[1]}" id="hld__post-author">`)
                        else $('#hld__post-author').val(t[1])
                        break
                    }
                }
            }
        }
        //回复列表
        $('.forumbox.postbox[hld-render!=ok]').each(function () {
            if ($(this).find('.small_colored_text_btn.block_txt_c2.stxt').length == 0) return true
            //excel 序号
            $(this).find('.postrow>td:first-child').before('<td class="c0"></td>')
            //关键字屏蔽
            if (setting.keywordsBlock && keywords_list.length > 0) {
                const $postcontent = $(this).find('.postcontent')
                const $postcontent_clone = $postcontent.clone()
                const consoleLog = (text) => console.warn(`【NGA优化摸鱼体验脚本-关键字屏蔽】内容：${text}`)
                let postcontent_quote = ''
                let postcontent_text = ''

                if ($postcontent.find('.quote').length > 0) {
                    $postcontent_clone.find('.quote').remove()
                    let postcontent_text = $postcontent.find('.quote').text()
                    const end_index = postcontent_text.indexOf(')')
                    postcontent_quote = postcontent_text.substring(end_index + 1)
                }

                postcontent_text = $postcontent_clone.text()

                for (let keyword of keywords_list) {
                    if (postcontent_text && postcontent_text.includes(keyword)) {
                        consoleLog(postcontent_text)
                        $(this).remove()
                        break
                    }
                    if (postcontent_quote && postcontent_quote.includes(keyword)) {
                        consoleLog(postcontent_quote)
                        $postcontent.find('.quote').remove()
                    }
                }
                const $comment_c_list = $(this).find('.comment_c')
                if ($comment_c_list.length > 0) {
                    let postcontent_reply = ''
                    $comment_c_list.each(function () {
                        let postcontent_reply_text = $(this).find('.ubbcode').text()
                        const end_index = postcontent_reply_text.indexOf(')')
                        postcontent_reply = postcontent_reply_text.substring(end_index + 1)
                        for (let keyword of keywords_list) {
                            if (postcontent_reply && postcontent_reply.includes(keyword)) {
                                consoleLog(postcontent_reply)
                                $(this).remove()
                            }
                        }
                    })
                }
            }
            //隐藏头像
            setting.hideAvatar && $(this).find('.avatar').css('display', 'none')
            //隐藏表情
            $(this).find('img').each(function () {
                const classs = $(this).attr('class');
                if (classs && classs.includes('smile')) {
                    const alt = $(this).attr('alt')
                    const $alt = $('<span class="smile_alt_text">[' + alt + ']</span>')
                    setting.hideSmile ? $(this).hide() : $alt.hide()
                    $(this).after($alt)
                } else if (!classs && $(this).attr('onload')) {
                    $(this).attr('hld__imglist', 'ready')
                    if (setting.imgResize) {
                        $(this).addClass('hld__img-resize').attr('title', '点击大图显示')
                    }
                    let $imgB = $('<button class="switch-img" style="display:none">图</button>')
                    $imgB.on('click', function () {
                        $(this).prev('img').toggle()
                        $(this).text($(this).prev('img').is(':hidden') ? '图' : '隐藏')
                    })
                    $(this).removeAttr('onload')
                    if (setting.hideImage) {
                        $(this).hide();
                        $imgB.show()
                    }
                    $(this).after($imgB)
                }
            })
            //图片增强
            if (setting.imgEnhance) {
                $('#mc').on('click', '.postcontent img[hld__imglist=ready]', function () {
                    resizeImg($(this))
                    e.stopPropagation()
                    return false
                })
            }
            //隐藏签名
            setting.hideSign && $(this).find('.sign, .sigline').css('display', 'none')
            //添加拉黑标记菜单及功能
            if (setting.markAndBan) {
                const current_uid = $(this).find('[name=uid]').text() + ''
                $(this).find('.small_colored_text_btn.block_txt_c2.stxt').each(function () {
                    let current_name = ''
                    if ($(this).parents('td').prev('td').html() == '') {
                        current_name = $(this).parents('table').prev('.posterinfo').children('.author').text()
                    } else {
                        current_name = $(this).parents('td').prev('td').find('.author').text()
                    }
                    $(this).parent().append(`<span class="hld__toolbox-reply"><a class="hld__extra-icon" data-type="mark" title="标签此用户" data-name="${current_name}" data-uid="${current_uid}"><svg t="1578453291663" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="15334" width="32" height="32"><path d="M978.488889 494.933333l-335.644445 477.866667-415.288888 45.511111c-45.511111 5.688889-91.022222-28.444444-102.4-73.955555L22.755556 540.444444 358.4 56.888889C398.222222 0 477.866667-11.377778 529.066667 28.444444l420.977777 295.822223c56.888889 39.822222 68.266667 113.777778 28.444445 170.666666zM187.733333 927.288889c5.688889 11.377778 17.066667 22.755556 28.444445 22.755555l386.844444-39.822222 318.577778-455.111111c22.755556-22.755556 17.066667-56.888889-11.377778-73.955555L489.244444 85.333333c-22.755556-17.066667-56.888889-11.377778-79.644444 11.377778l-318.577778 455.111111 96.711111 375.466667z" fill="#3970fe" p-id="15335" data-spm-anchor-id="a313x.7781069.0.i43" class="selected"></path><path d="M574.577778 745.244444c-56.888889 85.333333-176.355556 108.088889-261.688889 45.511112-85.333333-56.888889-108.088889-176.355556-45.511111-261.688889s176.355556-108.088889 261.688889-45.511111c85.333333 56.888889 102.4 176.355556 45.511111 261.688888z m-56.888889-39.822222c39.822222-56.888889 22.755556-130.844444-28.444445-170.666666s-130.844444-22.755556-170.666666 28.444444c-39.822222 56.888889-22.755556 130.844444 28.444444 170.666667s130.844444 22.755556 170.666667-28.444445z" fill="#3970fe" p-id="15336" data-spm-anchor-id="a313x.7781069.0.i44" class="selected"></path></svg></a><a class="hld__extra-icon" title="拉黑此用户(屏蔽所有言论)" data-type="ban"  data-name="${current_name}" data-uid="${current_uid}"><svg t="1578452808565" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="9668" data-spm-anchor-id="a313x.7781069.0.i27" width="32" height="32"><path d="M512 1024A512 512 0 1 1 512 0a512 512 0 0 1 0 1024z m0-146.285714A365.714286 365.714286 0 1 0 512 146.285714a365.714286 365.714286 0 0 0 0 731.428572z" fill="#a20106" p-id="9669" data-spm-anchor-id="a313x.7781069.0.i28" class="selected"></path><path d="M828.708571 329.142857l-633.417142 365.714286 633.417142-365.714286z m63.341715-36.571428a73.142857 73.142857 0 0 1-26.770286 99.913142l-633.417143 365.714286a73.142857 73.142857 0 0 1-73.142857-126.683428l633.417143-365.714286A73.142857 73.142857 0 0 1 892.050286 292.571429z" fill="#a20106" p-id="9670" data-spm-anchor-id="a313x.7781069.0.i31" class="selected"></path></svg></a></span>`)
                })
            }
            //标记拉黑标签
            markDom($(this))
            //添加标志位
            $(this).attr('hld-render', 'ok')
        })
    }

    //大图
    const resizeImg = (el) => {
        if ($('#hld__img_full').length > 0) return
        let url_list = []
        let current_index = el.parent().find('[hld__imglist=ready]').index(el)
        el.parent().find('[hld__imglist=ready]').each(function () {
            url_list.push($(this).data('srcorg') || $(this).data('srclazy') || $(this).attr('src'))
        })
        let $imgBox = $('<div id="hld__img_full" title="点击背景关闭"><div id="loader"></div></div>')
        let $imgContainer = $('<div class="hld__img_container hld__zoom-target"></div>')
        let $img = $('<img title="鼠标滚轮放大/缩小\n左键拖动移动" class="hld__img hld__zoom-target">')

        const renderImg = (index) => {
            let timer = null
            $('#loader').show()
            $imgContainer.css({
                'top': $(window).height() * 0.03 + 'px',
                'left': (($(window).width() - ($(window).height()) * 0.85) / 2) + 'px',
                'width': $(window).height() * 0.85 + 'px',
                'height': $(window).height() * 0.85 + 'px'
            })
            $img.css({ 'width': '', 'height': '' }).attr('src', url_list[index]).hide()
            timer = setInterval(() => {
                const w = $img.width()
                const h = $img.height()
                if (w > 0) {
                    w > h ? $img.css({ 'width': '100%', 'height': 'auto' }) : $img.css({ 'height': '100%', 'width': 'auto' })
                    $img.show()
                    $('#loader').hide()
                    clearInterval(timer)
                }
            }, 1)
        }
        //当前图片
        renderImg(current_index)
        $img.mousedown(function (e) {
            let endx = 0;
            let endy = 0;
            let left = parseInt($imgContainer.css("left"))
            let top = parseInt($imgContainer.css("top"))
            let downx = e.pageX
            let downy = e.pageY
            e.preventDefault()
            $(document).on("mousemove", function (es) {
                let endx = es.pageX - downx + left
                let endy = es.pageY - downy + top
                $imgContainer.css("left", endx + "px").css("top", endy + "px")
                return false
            });
        })
        $img.mouseup(function () { $(document).unbind("mousemove") })

        $imgContainer.append($img)
        $imgBox.append($imgContainer)
        $imgBox.click(function (e) { !$(e.target).hasClass('hld__img') && $(this).remove() })
        $imgBox.append(`<div class="hld__if_control">
<div class="change prev-img" title="本楼内上一张(快捷键${getCodeName(setting.shortcutKeys[3])})"><div></div></div>
<div class="change rotate-right" title="逆时针旋转90°"><div></div></div>
<div class="change rotate-left" title="顺时针旋转90°"><div></div></div>
<div class="change next-img" title="本楼内下一张(快捷键${getCodeName(setting.shortcutKeys[4])})"><div></div></div>
</div>`)
        $imgBox.on('click', '.change', function () {
            if ($(this).hasClass('prev-img') && current_index - 1 >= 0)
                renderImg(--current_index)

            if ($(this).hasClass('next-img') && current_index + 1 < url_list.length)
                renderImg(++current_index)

            if ($(this).hasClass('rotate-right') || $(this).hasClass('rotate-left')) {
                let deg = ($img.data('rotate-deg') || 0) - ($(this).hasClass('rotate-right') ? 90 : -90)
                if (deg >= 360 || deg <= -360) deg = 0
                $img.css('transform', `rotate(${deg}deg)`)
                $img.data('rotate-deg', deg)
            } else {
                $img.css('transform', '')
                $img.data('rotate-deg', 0)
            }
            window.getSelection ? window.getSelection().removeAllRanges() : document.selection.empty()
            return false;
        })

        $imgBox.on("mousewheel DOMMouseScroll", function (e) {
            const delta = (e.originalEvent.wheelDelta && (e.originalEvent.wheelDelta > 0 ? 1 : -1)) ||
                (e.originalEvent.detail && (e.originalEvent.detail > 0 ? -1 : 1));

            if ($imgContainer.width() > 50 || delta > 0) {
                const offset_y = $imgContainer.height() * 0.2
                const offset_x = $imgContainer.width() * 0.2
                let offset_top = offset_y / 2
                let offset_left = offset_x / 2

                if ($(e.target).hasClass('hld__zoom-target')) {
                    const target_offset_x = Math.round(e.clientX - $imgContainer.position().left)
                    const target_offset_y = Math.round(e.clientY - $imgContainer.position().top)
                    offset_left = (target_offset_x / ($imgContainer.height() / 2)) * offset_left
                    offset_top = (target_offset_y / ($imgContainer.height() / 2)) * offset_top
                }

                if (delta > 0) {
                    $imgContainer.css({
                        'width': ($imgContainer.height() + offset_y) + 'px',
                        'height': ($imgContainer.height() + offset_y) + 'px',
                        'top': ($imgContainer.position().top - offset_top) + 'px',
                        'left': ($imgContainer.position().left - offset_left) + 'px'
                    })
                }
                if (delta < 0) {
                    $imgContainer.css({
                        'width': ($imgContainer.height() - offset_y) + 'px',
                        'height': ($imgContainer.height() - offset_y) + 'px',
                        'top': ($imgContainer.position().top + offset_top) + 'px',
                        'left': ($imgContainer.position().left + offset_left) + 'px'
                    })
                }
            }
            e.stopPropagation()
            return false
        })

        $('body').append($imgBox)
    }

    //拉黑与标签
    const markDom = $el => {
        $el.find('a.b').each(function () {
            const uid = ($(this).attr('href') && $(this).attr('href').indexOf('uid=') > -1) ? $(this).attr('href').split('uid=')[1] + '' : ''
            $(this).find('span.hld__post-author, span.hld__remark').remove()
            let name = $(this).attr('hld-mark-before-name') || $(this).text().replace('[', '').replace(']', '')
            if (setting.markAndBan) {
                const ban_user = getBanUser({name, uid})
                if (ban_user) {
                    //拉黑用户实现
                    if (advanced_setting.banStrictMode) {
                        if ($(this).parents('div.comment_c').length > 0) $(this).parents('div.comment_c').remove()
                        else $(this).parents('.forumbox.postbox').remove()
                    } else {
                        if ($(this).hasClass('author')) {
                            if ($(this).parents('div.comment_c').length > 0) $(this).parents('div.comment_c').remove()
                            else $(this).parents('.forumbox.postbox').remove()
                        } else {
                            $(this).parent().html('<span class="hld__banned">此用户在你的黑名单中，已屏蔽其言论</span>')
                        }
                    }
                    console.warn(`【NGA优化摸鱼体验脚本-黑名单屏蔽】用户：${name}, UID:${uid}`)
                }
                if(advanced_setting.classicRemark) {
                    //经典备注风格
                    const user_marks = getUserMarks({name, uid})
                    if (user_marks) {
                        let f = []
                        user_marks.marks.forEach(e => f.push(e.mark))
                        $(this).attr('hld-mark-before-name', name).append(`<span class="hld__remark"> (${f.join(', ')}) </span>`)
                    }
                }else {
                    //新版标签风格
                    const user_marks = getUserMarks({name, uid})
                    if(user_marks) {
                        const $el = $(this).parents('.c1').find('.clickextend')
                        let marks_dom = ''
                        user_marks.marks.forEach(item => marks_dom += `<span style="color: ${item.text_color};background-color: ${item.bg_color};" title="${item.mark}">${item.mark}</span>`);
                        $el.before(`<div class="hld__marks-container">标签: ${marks_dom}</div>`)
                    }
                }
                if (setting.authorMark) {
                    if (name == $('#hld__post-author').val() && $(this).find('span.hld__post-author').length == 0)
                        $(this).append('<span class="hld__post-author">[楼主]</span>')
                }
            }
        })
    }

    //设置面板
    let $panel_dom = $(`<div id="hld__setting_cover" class="animated zoomIn"><div id="hld__setting_panel">
   <a href="javascript:void(0)" id="hld__setting_close" class="hld__setting-close">×</a>
    <p class="hld__sp-title"><a title="更新地址" href="https://greasyfork.org/zh-CN/scripts/393991-nga%E4%BC%98%E5%8C%96%E6%91%B8%E9%B1%BC%E4%BD%93%E9%AA%8C" target="_blank">NGA优化摸鱼插件<span class="hld__script-info">v${GM_info.script.version}</span></a></p>
    <div class="hld__field">
    <p class="hld__sp-section">显示优化</p>
    <p><label><input type="checkbox" id="hld__cb_hideAvatar"> 隐藏头像（快捷键切换显示[<b>${getCodeName(setting.shortcutKeys[0])}</b>]）</label></p>
    <p><label><input type="checkbox" id="hld__cb_hideSmile"> 隐藏表情（快捷键切换显示[<b>${getCodeName(setting.shortcutKeys[1])}</b>]）</label></p>
    <p><label><input type="checkbox" id="hld__cb_hideImage"> 隐藏贴内图片（快捷键切换显示[<b>${getCodeName(setting.shortcutKeys[2])}</b>]）</label></p>
    <p><label><input type="checkbox" id="hld__cb_imgResize"> 贴内图片缩放(默认缩放至宽200px)</label></p>
    <p><label><input type="checkbox" id="hld__cb_hideSign"> 隐藏签名</label></p>
    <p><label><input type="checkbox" id="hld__cb_hideHeader"> 隐藏版头/版规/子版入口</label></p>
    <p><label><input type="checkbox" id="hld__cb_excelMode"> Excel模式（快捷键切换显示[<b>${getCodeName(setting.shortcutKeys[5])}</b>]）</label></p>
    <p><button id="hld__shortcut_manage">编辑快捷键</button></p>
    </div>
    <div class="hld__field">
    <p class="hld__sp-section">功能强化</p>
    <p><label><input type="checkbox" id="hld__cb_linkTargetBlank"> 论坛列表新窗口打开</label></p>
    <p><label><input type="checkbox" id="hld__cb_imgEnhance"> 贴内图片功能增强</label></p>
    <p><label><input type="checkbox" id="hld__cb_authorMark"> 高亮楼主</label></p>
    <p><label><input type="checkbox" id="hld__cb_autoPage"> 自动翻页</label></p>
    <p><label><input type="checkbox" id="hld__cb_keywordsBlock" enable="hld__keywordsBlock_fold"> 关键字屏蔽</label></p>
    <div class="hld__sp-fold" id="hld__keywordsBlock_fold" data-id="hld__cb_keywordsBlock">
    <p><button id="hld__keywords_manage">管理关键字</button></p>
    </div>
    <p><label><input type="checkbox" id="hld__cb_markAndBan" enable="hld__markAndBan_fold"> 拉黑/标签功能</label></p>
    <div class="hld__sp-fold" id="hld__markAndBan_fold">
    <p><button id="hld__list_manage">名单管理</button></p>
    </div>
    </div>
    <div style="clear:both"></div>
    <div class="hld__advanced-setting">
    <button id="hld__advanced_button">+</button><span>高级设置</span>
    <div class="hld__advanced-setting-panel" >
    <p><svg t="1590560820184" class="icon" viewBox="0 0 1040 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="2738" width="200" height="200"><path d="M896.355855 975.884143 127.652332 975.884143c-51.575656 0-92.993974-19.771299-113.653503-54.238298-20.708648-34.515095-18.194384-79.5815 6.9022-123.5632L408.803663 117.885897c25.244964-44.376697 62.767556-69.77004 102.953813-69.77004 40.136116 0 77.658707 25.393343 103.002932 69.671803L1003.006873 798.131763c25.097608 44.030819 27.711132 89.049129 6.952342 123.514081C989.348806 956.159916 947.881368 975.884143 896.355855 975.884143L896.355855 975.884143 896.355855 975.884143 896.355855 975.884143 896.355855 975.884143zM511.805572 119.511931c-12.769838 0-27.414373 12.376888-39.298028 33.134655L84.656075 832.892451c-12.130272 21.350261-14.989389 40.530089-7.741311 52.611242 7.297197 12.08013 25.787316 19.033495 50.737568 19.033495l768.703523 0c24.997324 0 43.439348-6.903224 50.736545-19.033495 7.197936-12.031011 4.387937-31.210839-7.791453-52.5611L551.055504 152.646586C539.220968 131.888819 524.527314 119.511931 511.805572 119.511931L511.805572 119.511931 511.805572 119.511931 511.805572 119.511931 511.805572 119.511931zM512.004093 653.807726c-20.1182 0-36.488029-15.975856-36.488029-35.69906L475.516064 296.773124c0-19.723204 16.369829-35.698037 36.488029-35.698037 20.117177 0 36.485983 15.975856 36.485983 35.698037l0 321.335543C548.490076 637.832893 532.12127 653.807726 512.004093 653.807726L512.004093 653.807726 512.004093 653.807726 512.004093 653.807726zM511.757476 828.308039c31.359218 0 56.851822-24.950252 56.851822-55.717999s-25.491581-55.716976-56.851822-55.716976c-31.408337 0-56.851822 24.949228-56.851822 55.716976S480.349139 828.308039 511.757476 828.308039L511.757476 828.308039 511.757476 828.308039 511.757476 828.308039z" p-id="2739"></path></svg> 鼠标停留在<span class="hld__adv-help" title="详细描述">选项文字</span>上可以显示详细描述，设置有误可能会导致插件异常或者无效！</p>
    <table>
    <!-- <tr><td><span class="hld__adv-help" title=" "> </td><td><input type="checkbox" id="hld__adv_"></td></tr> -->
    <tr><td><span class="hld__adv-help" title="此配置表示部分可以快捷键切换的功能默认行为策略\n选中时：关闭功能(如隐藏头像)也可以通过快捷键切换显示/隐藏\n取消时：关闭功能(如隐藏头像)将彻底关闭功能，快捷键会失效">动态功能启用</span></td><td><input type="checkbox" id="hld__adv_dynamicEnable"></td></tr>
    <tr><td><span class="hld__adv-help" title="此配置表示拉黑某人后对帖子的屏蔽策略\n选中时：回复被拉黑用户的回复也会被删除\n取消时：仅删除被拉黑者的回复"> 严格拉黑模式</td><td><input type="checkbox" id="hld__adv_banStrictMode"></td></tr>
    <tr><td><span class="hld__adv-help" title="此配置表示关键字的屏蔽策略\n选中时：关键字屏蔽将排除标题\n取消时：标题及正文回复都会被屏蔽"> 关键字屏蔽排除标题</td><td><input type="checkbox" id="hld__adv_kwdWithoutTitle"></td></tr>
    <tr><td><span class="hld__adv-help" title="滚动条滚动到距离底部多少距离时执行自动翻页\n单位是页面高度的百分比(%)\n例如10即为滚动条滚动到距离底部有页面高度10%距离的时候，进行翻页">自动翻页检测距离</span></td><td><input type="number" id="hld__adv_autoPageOffset"></td></tr>
    <tr><td><span class="hld__adv-help" title="Excel最左列的显示序号，此策略为尽可能的更像Excel\n选中时：Excel最左栏为从1开始往下，逐行+1\n取消时：Excel最左栏为原始的回帖数\n*此功能仅在贴列表有效">Excel左列序号</span></td><td><input type="checkbox" id="hld__adv_excelNoMode"></td></tr>
    <tr><td><span class="hld__adv-help" title="Excel模式下标签栏的名称">Excel标题</span></td><td><input type="text" id="hld__adv_excelTitle"></td></tr>
    <tr><td><span class="hld__adv-help" title="标记楼主中的[楼主]的颜色，单位为16进制颜色代码">标记楼主颜色</span></td><td><input type="text" id="hld__adv_authorMarkColor"></td></tr>
    <tr><td><span class="hld__adv-help" title="图片缩放功能中对图片缩放的大小，单位为像素(px)\n*图片高度自适应">图片缩放宽度</span></td><td><input type="number" id="hld__adv_imgResizeWidth"></td></tr>
    <tr><td><span class="hld__adv-help" title="此配置表示标记功能的风格显示\n选中时：v2.9及以前的备注风格(仿微博)，此风格不能更改颜色\n取消时：新版标记风格"> 经典备注风格</td><td><input type="checkbox" id="hld__adv_classicRemark"></td></tr>
    </table>
    </div>
    </div>
    <div class="hld__buttons">
    <span>
    <button class="hld__btn" id="hld__backup_panel" title="导入/导出配置字符串，包含设置，黑名单，标记名单等等">导入/导出</button>
    <button class="hld__btn" id="hld__reset__data" title="重置配置">重置</button>
    <button class="hld__btn hld__reward" id="hld__reward" title="好活当赏"><span style="margin-right:3px">¥</span>赏</button>
    </span>
    <button class="hld__btn" id="hld__save__data">保存设置</button>
    </div>
    </div>
    </div>`)
    $('body').append($panel_dom)
    //本地恢复设置
    //基础设置
    for (let k in setting) {
        if ($('#hld__cb_' + k).length > 0) {
            $('#hld__cb_' + k)[0].checked = setting[k]
            const enable_dom_id = $('#hld__cb_' + k).attr('enable')
            if (enable_dom_id) {
                setting[k] ? $('#' + enable_dom_id).show() : $('#' + enable_dom_id).hide()
                $('#' + enable_dom_id).find('input').each(function () {
                    $(this).val() == setting[$(this).attr('name').substr(8)] && ($(this)[0].checked = true)
                })
                $('#hld__cb_' + k).on('click', function () {
                    $(this)[0].checked ? $('#' + enable_dom_id).slideDown() : $('#' + enable_dom_id).slideUp()
                })
            }
        }
    }
    //高级设置
    for (let k in advanced_setting) {
        //hld__adv_autoPageOffset
        if ($('#hld__adv_' + k).length > 0) {
            const value_type = typeof advanced_setting[k]
            if (value_type == 'boolean') {
                $('#hld__adv_' + k)[0].checked = advanced_setting[k]
            }
            if (value_type == 'number' || value_type == 'string') {
                $('#hld__adv_' + k).val(advanced_setting[k])
            }
        }
    }
    //高级设置-事件绑定
    $('body').on('click', '#hld__advanced_button', function () {
        $('.hld__advanced-setting-panel').toggle()
        $(this).text($('.hld__advanced-setting-panel').is(':hidden') ? '+' : '-')
    })
    //调色板绑定
    $('#hld__setting_cover').find('#hld__adv_authorMarkColor').spectrum(color_picker_config)
    /**
     * 导入导出设置面板
     */
    $('body').on('click', '#hld__backup_panel', function () {
        const unsupported = 3.3
        const current_ver = +GM_info.script.version
        if($('#hld__export_panel').length > 0) return
        $('#hld__setting_cover').append(`<div id="hld__export_panel" class="hld__list-panel animated fadeInUp">
            <a href="javascript:void(0)" class="hld__setting-close">×</a>
            <div class="hld__ep-container">
            <div>
            <p><b>选择导出的设置</b></p>
            <p><label><input type="checkbox" id="hld__cb_export_setting"> 配置</label></p>
            <p><label><input type="checkbox" id="hld__cb_export_banlist"> 黑名单列表</label></p>
            <p><label><input type="checkbox" id="hld__cb_export_marklist"> 标签列表</label></p>
            <p><label><input type="checkbox" id="hld__cb_export_keywordlist"> 屏蔽列表</label></p>
            <br>
            <p><button id="hld__export__data">导出</button> <button id="hld__import__data">导入</button></p>
            </div>
            <div>
            <p><b style="text-decoration: underline;cursor:help;" title="【导出】\n选择要导出的内容，点击导出，复制以下字符串用于备份，分享等\n【导入】\n将字符串复制到以下输入框中，点击导入，将会自动导入字符串中包含的内容">字符串</b></p>
            <textarea id="hld__export_str" rows="9"></textarea>
            </div>
            </div>
            <div><p id="hld__export_msg"></p></div>
            </div>`)
        /**
         * 导出配置
         */
        $('#hld__export__data').click(function(){
            let obj = {}
            if ($('#hld__cb_export_setting').prop('checked')) {
                obj['setting'] = setting
                obj['advanced_setting'] = advanced_setting
            }
            $('#hld__cb_export_banlist').prop('checked') && (obj['ban_list'] = ban_list)
            $('#hld__cb_export_marklist').prop('checked') && (obj['mark_list'] = mark_list)
            $('#hld__cb_export_keywordlist').prop('checked') && (obj['keywords_list'] = keywords_list)

            if (Object.keys(obj).length == 0) {
                $('#hld__export_msg').html('<span style="color:#CC0000">没有选择任何项目可供导出！</span>')
                return
            }
            obj['name'] = 'HLD-NGA-BBS'
            obj['ver'] = +GM_info.script.version
            $('#hld__export_str').val(Base64.encode(JSON.stringify(obj)))
            $('#hld__export_msg').html('<span style="color:#009900">导出成功，请复制右侧字符串以备份</span>')
        })
        /**
         * 导入配置
         */
        $('#hld__import__data').click(function(){
            if ($('#hld__export_str').val()) {
                try {
                    let obj = JSON.parse(Base64.decode($('#hld__export_str').val()))
                    if (obj.ver > current_ver) {
                        popMsg(`此配置是由更高版本(v${obj.ver.toFixed(1)})的脚本导出，请升级您的脚本 <a title="更新地址" href="https://greasyfork.org/zh-CN/scripts/393991-nga%E4%BC%98%E5%8C%96%E6%91%B8%E9%B1%BC%E4%BD%93%E9%AA%8C" target="_blank">[脚本地址]</a>`, 'warn')
                        return
                    }
                    if (obj.ver < unsupported) {
                        popMsg(`此配置是由低版本(v${obj.ver.toFixed(1)})的脚本导出，当前版本(v${current_ver})已不支持！`, 'err')
                        return
                    }
                    let confirm = window.confirm('此操作会覆盖你的配置，确认吗？')
                    if (!confirm) return
                    if (Object.keys(obj).includes('setting')) {
                        obj.setting && (setting = obj.setting)
                        obj.advanced_setting && (advanced_setting = obj.advanced_setting)
                        window.localStorage.setItem('hld__NGA_setting', JSON.stringify(setting))
                        window.localStorage.setItem('hld__NGA_advanced_setting', JSON.stringify(advanced_setting))
                    }
                    if (Object.keys(obj).includes('ban_list')) {
                        ban_list = obj.ban_list
                        window.localStorage.setItem('hld__NGA_ban_list', ban_list.join(','))
                    }
                    if (Object.keys(obj).includes('mark_list')) {
                        mark_list = obj.mark_list
                        window.localStorage.setItem('hld__NGA_mark_list', mark_list.join(','))
                    }
                    if (Object.keys(obj).includes('keywords_list')) {
                        keywords_list = obj.keywords_list
                        window.localStorage.setItem('hld__NGA_keywords_list', keywords_list.join(','))
                    }
                    $('#hld__export_msg').html('<span style="color:#009900">导入成功，刷新浏览器以生效</span>')

                } catch (err){
                    $('#hld__export_msg').html('<span style="color:#CC0000">字符串有误，解析失败！</span>')
                }
            }
        })
    })
    /**
     * 保存配置
     */
    $('body').on('click', '#hld__save__data', function () {
        for (let k in setting) {
            $('input#hld__cb_' + k).length > 0 && (setting[k] = $('input#hld__cb_' + k)[0].checked)
        }
        window.localStorage.setItem('hld__NGA_setting', JSON.stringify(setting))
        for (let k in advanced_setting) {
            if ($('#hld__adv_' + k).length > 0) {
                const value_type = typeof advanced_setting[k]
                if (value_type == 'boolean') {
                    advanced_setting[k] =  $('#hld__adv_' + k)[0].checked
                }
                if (value_type == 'number') {
                    advanced_setting[k] = +$('#hld__adv_' + k).val()
                }
                if (value_type == 'string') {
                    advanced_setting[k] = $('#hld__adv_' + k).val()
                }
            }
        }
        window.localStorage.setItem('hld__NGA_advanced_setting', JSON.stringify(advanced_setting))
        $panel_dom.hide()
        popMsg('保存成功，刷新页面生效')
    })
    /**
     * 重置配置
     */
    $('body').on('click', '#hld__reset__data', function(){
        if(confirm('若发生配置不生效的情况，或者插件失效，重置所有配置\n确认吗？')){
            localStorage.removeItem("hld__NGA_setting")
            localStorage.removeItem("hld__NGA_advanced_setting")
            popMsg('重置成功，即将自动刷新')
            window.location.reload()
       }
    })
    /**
     * 打赏
     */
    $('body').on('click', '#hld__reward', function () {
        $('#hld__setting_cover').append(`<div class="hld__list-panel hld__reward-panel animated fadeInUp">
        <a href="javascript:void(0)" class="hld__setting-close">×</a>
        <div class="hld__reward-info">
        <p><b>本脚本完全开源，并且长期维护<br>您若有好的功能需求或者建议，欢迎反馈</b></p>
        <p>如果您觉得脚本好用<span class="hld__delete-line">帮助到更好的摸鱼</span>，您也可以选择支持我~<img src="https://s1.ax1x.com/2020/06/28/N25w7Q.png"></p>
        </div>
        <div class="hld__flex">
        <div class="hld__list-c"><img src="https://s1.ax1x.com/2020/06/28/N25Bkj.png">
        </div>
        <div class="hld__list-c"><img src="https://s1.ax1x.com/2020/06/28/N25Dts.png">
        </div>
        </div>
        </div>`)
    })
    /**
     * 消息弹框
     * @param {String} msg 消息内容
     * @param {String} type 消息类型
     * @param {Boolean} refresh_enable 启用自动刷新
     */
    function popMsg(msg, type='ok', refresh_enable=true) {
        $('.hld__msg').length > 0 && $('.hld__msg').remove()
        let $msg = $(`<div class="hld__msg hld__msg-${type}">${msg}</div>`)
        $('body').append($msg)
        $msg.slideDown(200)
        setTimeout(() => { $msg.fadeOut(500) }, type == 'ok' ? 2000 : 5000)
        setTimeout(() => { $msg.remove() }, type == 'ok' ? 2500 : 5500)
    }
    /**
     * 通知弹框
     * @param {String} msg 消息内容
     */
    function popNotification (msg) {
        $('#hld__noti_container').length == 0 && $('body').append('<div id="hld__noti_container"></div>')
        let $msg_box = $(`<div class="hld__noti-msg">${msg}</div>`)
        $('#hld__noti_container').append($msg_box)
        $msg_box.slideDown(100)
        setTimeout(() => { $msg_box.fadeOut(500) }, 1000)
        setTimeout(() => { $msg_box.remove() }, 1500)
    }
    /**
     * 获取URL参数
     * @param {String} name 参数
     * @return {String|null} 参数的值
     */
    function getQueryString(name) {
        var url = decodeURI(window.location.search.replace(/&amp;/g, "&"));
        var reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)");
        var r = url.substr(1).match(reg);
        if (r != null) return unescape(r[2]);
        return null;
    }
    /**
     * 列表去重
     * @param {Array} array 列表
     * @return {Array} 处理后的列表
     */
    function uniq(array) {
        return [...new Set(array)]
    }
    /**
     * 列表去空
     * @param {Array} array 列表
     * @return {Array} 处理后的列表
     */
    function removeBlank(array) {
        let r = [];
        array.map(function (val, index) {
            if (val !== '' && val != undefined) {
                r.push(val);
            }
        });
        return r;
    }
    /**
     * Base64互转
     */
    const Base64 = {
        encode: (str) => {
            return window.btoa(unescape(encodeURIComponent(str)))
        },
        decode: (str) => {
            return decodeURIComponent(escape(window.atob(str)))
        }
    }
    /**
     * 黑名单弹窗
     * @param {Object} setting 设置项
     * @param {String} setting.name 用户昵称
     * @param {String} setting.uid UID
     * @param {String} setting.type 模式
     * @param {Number} setting.top  pos.top位置
     * @param {Number} setting.left pos.left 位置
     * @param {Function} setting.callback 回调函数
     */
    function banlistPopup (setting) {
        $('.hld__dialog').length > 0 && $('.hld__dialog').remove()
        const retain_word = [':', '(', ')', '&', '#', '^', ',']
        let $ban_dialog = $(`<div class="hld__dialog hld__dialog-sub-top hld__list-panel animated zoomIn"  style="top: ${setting.top}px;left: ${setting.left}px;"><a href="javascript:void(0)" class="hld__setting-close">×</a><div id="container_dom"></div><div class="hld__dialog-buttons"></div></div>`)
        if (setting.type == 'confirm') {
            $ban_dialog.find('#container_dom').append(`<div><span>您确定要拉黑用户</span><span class="hld__dialog-user">${setting.name}</span><span>吗？</span></div>`)
            let $ok_btn = $('<button class="hld__btn">拉黑</button>')
            $ok_btn.click(function(){
                const ban_obj = {name: setting.name, uid: setting.uid}
                !getBanUser(ban_obj) && ban_list.push(ban_obj)
                window.localStorage.setItem('hld__NGA_ban_list', JSON.stringify(ban_list))
                $('.hld__dialog').remove()
                popMsg('拉黑成功，重载页面生效')
            })
            $ban_dialog.find('.hld__dialog-buttons').append($ok_btn)
        }else if (setting.type == 'add') {
            $ban_dialog.find('#container_dom').append(`<div>添加用户：</div><div><input id="hld__dialog_add_uid" type="text" value="" placeholder="UID"></div><div><input id="hld__dialog_add_name" type="text" value="" placeholder="用户名"></div>`)
            let $ok_btn = $('<button class="hld__btn">添加</button>')
            $ok_btn.click(function(){
                const name = $ban_dialog.find('#hld__dialog_add_name').val().trim()
                const uid = $ban_dialog.find('#hld__dialog_add_uid').val().trim() + ''
                if (!name && !uid) {
                    popMsg('UID与用户名必填一个，其中UID权重较大', 'err')
                    return
                }
                !getBanUser({name, uid}) && ban_list.push({name, uid})
                window.localStorage.setItem('hld__NGA_ban_list', JSON.stringify(ban_list))
                $('.hld__dialog').remove()
                setting.callback()
            })
            $ban_dialog.find('.hld__dialog-buttons').append($ok_btn)
        }
        $('body').append($ban_dialog)
    }
    /**
     * 获取黑名单用户
     */
    function getBanUser(ban_obj) {
        for (let u of ban_list) {
            if ((u.uid && ban_obj.uid && u.uid == ban_obj.uid) || 
                (u.name && ban_obj.name && u.name == ban_obj.name)) {
                if ((!u.uid && ban_obj.uid) || (!u.name && ban_obj.name)) {
                    u.uid = ban_obj.uid + '' || ''
                    u.name = ban_obj.name || ''
                    window.localStorage.setItem('hld__NGA_ban_list', JSON.stringify(ban_list))
                }
                return u
            }
        }
        return null
    }
    /**
     * 重新渲染黑名单列表
     */
    function reloadBanlist() {
        $('#hld__banlist').empty()
        ban_list.forEach((item, index) => $('#hld__banlist').append(`<tr><td title="${item.name}">${item.name}</td><td title="${item.uid}">${item.uid}</td><td><span class="hld__us-action hld__us-del hld__bl-del" title="删除" data-index="${index}" data-name="${item.name}" data-uid="${item.uid}"></span></td></tr>`))
        $('#hld__ban_list_textarea').val(JSON.stringify(ban_list))
    }
    /**
     * 重新渲染标签列表
     */
    function reloadMarklist() {
        $('#hld__marklist').empty()
        mark_list.forEach((user_mark, index) => {
            $('#hld__marklist').append(`<tr><td title="${user_mark.name}">${user_mark.name}</td><td title="${user_mark.uid}">${user_mark.uid}</td><td title="${user_mark.marks.length}">${user_mark.marks.length}</td><td><span class="hld__us-action hld__us-edit hld__ml-edit" title="编辑" data-index="${index}" data-name="${user_mark.name}" data-uid="${user_mark.uid}"></span><span class="hld__us-action hld__us-del hld__ml-del" title="删除" data-index="${index}" data-name="${user_mark.name}" data-uid="${user_mark.uid}"></span></td></tr>`)
        })
        $('#hld__mark_list_textarea').val(JSON.stringify(mark_list))
    }
    /**
     * 标记弹窗
     * @param {Object} setting 设置项
     * @param {String} setting.name 用户名
     * @param {String} setting.uid UID
     * @param {String} setting.type 模式
     * @param {Number} setting.top  pos.top位置
     * @param {Number} setting.left pos.left 位置
     * @param {Function} setting.callback 回调函数
     */
    function userMarkPopup(setting) {
        $('.hld__dialog').length > 0 && $('.hld__dialog').remove()
        const retain_word = [':', '(', ')', '&', '#', '^', ',']
        let $mark_dialog = $(`<div class="hld__dialog hld__dialog-sub-top hld__list-panel animated zoomIn" style="top: ${setting.top}px;left: ${setting.left}px;">
        <a href="javascript:void(0)" class="hld__setting-close">×</a>
        ${setting.type == 'add' ? `<div style="display:block;">添加用户：<input id="hld__dialog_add_uid" type="text" value="" placeholder="UID"><input id="hld__dialog_add_name" type="text" value="" placeholder="用户名"></div>` : ''}
        <table class="hld__dialog-mark-table">
        <thead>
        <tr>
        <th width="100">标签</th><th width="50">文字</th><th width="50">背景</th><th>操作</th>
        </tr>
        </thead>
        <tbody id="hld__mark_body"></tbody>
        </table>
        <div class="hld__dialog-buttons" style="justify-content: space-between !important;"></div>
        </div>`)
        const insertRemarkRow = (r='', t='#ffffff', b='#1f72f1', n=true) => {
            let $tr = $(`<tr>
            <td><input type="text" class="hld__mark-mark" value="${r}"></td>
            <td><input class="hld__dialog-color-picker hld__mark-text-color" value="${t}"></td>
            <td><input class="hld__dialog-color-picker hld__mark-bg-color" value="${b}"></td>
            <td><button title="删除此标签" class="hld__mark-del">x</button></td>
            </tr>`)
            $tr.find('.hld__mark-del').click(function(){$(this).parents('tr').remove()})
            $tr.find('.hld__dialog-color-picker').spectrum(color_picker_config)
            $mark_dialog.find('#hld__mark_body').append($tr)
            n && $tr.find('.hld__mark-mark').focus()
        }

        //恢复标签
        const exist_mark = getUserMarks({name: setting.name, uid: setting.uid})
        exist_mark !== null && exist_mark.marks.forEach(item => insertRemarkRow(item.mark, item.text_color, item.bg_color, false))

        let $add_btn = $('<button class="hld__btn">+添加标签</button>')
        $add_btn.click(() => insertRemarkRow())
        $mark_dialog.find('.hld__dialog-buttons').append($add_btn)
        let $ok_btn = $('<button class="hld__btn">保存</button>')

        $ok_btn.click(function(){
            let user_marks = {marks: []}
            if (setting.type == 'add') {
                user_marks.name = $mark_dialog.find('#hld__dialog_add_name').val().trim()
                user_marks.uid = $mark_dialog.find('#hld__dialog_add_uid').val().trim() + ''
            } else {
                user_marks.name = setting.name
                user_marks.uid = setting.uid + ''
            }
            if (!user_marks.name && !user_marks.uid) {
                popMsg('UID与用户名必填一个，其中UID权重较大', 'err')
                return
            }
            $('#hld__mark_body > tr').each(function(){
                const mark = $(this).find('.hld__mark-mark').val().trim()
                const text_color = $(this).find('.hld__mark-text-color').val()
                const bg_color = $(this).find('.hld__mark-bg-color').val()
                if(mark) {
                    user_marks.marks.push({mark, text_color, bg_color})
                }
            })
            if (setting.type == 'add' && user_marks.marks.length == 0) {
                popMsg('至少添加一个标签内容', 'err')
                return
            }
            setUserMarks(user_marks)
            popMsg('保存成功，重载页面生效')
            $('.hld__dialog').remove()
            setting.callback()
        })
        $mark_dialog.find('.hld__dialog-buttons').append($ok_btn)
        $('body').append($mark_dialog)
        $('.hld__dialog-color-picker').spectrum(color_picker_config)
    }
    /**
     * 获取用户标签对象
     * @param {String} uid UID
     * @param {String} user 用户名
     * @return {Object|null} 标签对象
     */
    function getUserMarks(user) {
        const check = mark_list.findIndex(v => (v.uid && user.uid && v.uid == user.uid) || 
        (v.name && user.name && v.name == user.name))
        if(check > -1) {
            let user_mark = mark_list[check]
            if ((!user_mark.uid && user.uid) || (!user_mark.name && user.name)) {
                user_mark.uid = user.uid + '' || ''
                user_mark.name = user.name || ''
                window.localStorage.setItem('hld__NGA_mark_list', JSON.stringify(mark_list))
            }
            return mark_list[check]
        } else {
            return null
        }
    }
    /**
     * 保存标签
     * @param {Object} user_marks 标签对象
     */
    function setUserMarks(user_marks) {
        //检查是否已有标签
        const check = mark_list.findIndex(v => (v.uid && user_marks.uid && v.uid == user_marks.uid) || 
        (v.name && user_marks.name && v.name == user_marks.name))
        if(check > -1) {
            if (user_marks.marks.length == 0) {
                mark_list.splice(check, 1)
            } else {
                mark_list[check] = user_marks
            }
        }else {
            mark_list.push(user_marks)
        }
        window.localStorage.setItem('hld__NGA_mark_list', JSON.stringify(mark_list))
    }
    /**
     * 颜色RGB转HEX
     * @param {String} rgb rgb颜色代码
     * @return {String} 16进制颜色代码
     */
    function rgb2hex(rgb) {
      rgb = rgb.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
      function hex(x) {
        return ("0" + parseInt(x).toString(16)).slice(-2);
      }
      return "#" + hex(rgb[1]) + hex(rgb[2]) + hex(rgb[3]);
    }
    /**
     * Style Sheet
     */
    const style = document.createElement("style")
    style.type = "text/css"
    style.appendChild(document.createTextNode(`
.animated {animation-duration:.3s;animation-fill-mode:both;}
.animated-1s {animation-duration:1s;animation-fill-mode:both;}
.zoomIn {animation-name:zoomIn;}
.bounce {-webkit-animation-name:bounce;animation-name:bounce;-webkit-transform-origin:center bottom;transform-origin:center bottom;}
.fadeInUp {-webkit-animation-name:fadeInUp;animation-name:fadeInUp;}
#loader {display:none;position:absolute;top:50%;left:50%;margin-top:-10px;margin-left:-10px;width:20px;height:20px;border:6px dotted #FFF;border-radius:50%;-webkit-animation:1s loader linear infinite;animation:1s loader linear infinite;}
@keyframes loader {0% {-webkit-transform:rotate(0deg);transform:rotate(0deg);}100% {-webkit-transform:rotate(360deg);transform:rotate(360deg);}}
@keyframes zoomIn {from {opacity:0;-webkit-transform:scale3d(0.3,0.3,0.3);transform:scale3d(0.3,0.3,0.3);}50% {opacity:1;}}
@keyframes bounce {from,20%,53%,80%,to {-webkit-animation-timing-function:cubic-bezier(0.215,0.61,0.355,1);animation-timing-function:cubic-bezier(0.215,0.61,0.355,1);-webkit-transform:translate3d(0,0,0);transform:translate3d(0,0,0);}40%,43% {-webkit-animation-timing-function:cubic-bezier(0.755,0.05,0.855,0.06);animation-timing-function:cubic-bezier(0.755,0.05,0.855,0.06);-webkit-transform:translate3d(0,-30px,0);transform:translate3d(0,-30px,0);}70% {-webkit-animation-timing-function:cubic-bezier(0.755,0.05,0.855,0.06);animation-timing-function:cubic-bezier(0.755,0.05,0.855,0.06);-webkit-transform:translate3d(0,-15px,0);transform:translate3d(0,-15px,0);}90% {-webkit-transform:translate3d(0,-4px,0);transform:translate3d(0,-4px,0);}}
@keyframes fadeInUp {from {opacity:0;-webkit-transform:translate3d(0,100%,0);transform:translate3d(0,100%,0);}to {opacity:1;-webkit-transform:translate3d(0,0,0);transform:translate3d(0,0,0);}}
.postcontent img {margin:0 5px 5px 0 !important;box-shadow:none !important;outline:none !important;}
.hld__img_container {position:absolute;display:flex;justify-content:center;align-items:center;}
.hld__if_control {position:absolute;display:flex;left:50%;bottom:15px;width:160px;margin-left:-80px;height:40px;background:rgba(0,0,0,0.6);z-index:9999999;}
#hld__setting_cover {display:none;justify-content:center;align-items:center;position:fixed;top:0;left:0;right:0;bottom:0;z-index:999;}
#hld__img_full {position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.6);z-index:99999;/*display:flex;*//*align-items:center;*//*justify-content:center;*/}
#hld__img_full img {cursor:move;transition:transform .2s ease;}
#hld__img_full .hld__imgcenter {top:50%;left:50%;transform:translate(-50%,-50%);}
#hld__img_full .change {width:40px;height:40px;cursor:pointer;}
#hld__img_full .rotate-right,#hld__img_full .rotate-left {background:url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACQAAAAgCAYAAAB6kdqOAAADYElEQVRYR8WYS8hWVRSGn3cipg0qCExBKYxKQVJRIh1olF0GXpIIoVIUBZWahZeJOpDEQYMcWCBZQRFCZkpGJGgD0yJSwSyVIO0yMrpObPLK+tvnY3f8zu1Tfxfsydlrrf3uve5HXAPZfgR4HJiY1r3Av8BvwCXgOPChpCNtj1FbxoLPdhy+AHgaeLil/DngHWCHpL/qZDoBsj0P+LQliH5s3yVQO6t0dAW0GdhUUvYP8DXwc1q3AncBYb4pFQfvlrS8314nQKHA9n5gDnAKWCfpi6rbJvM+CSwFppf4jkiaW5btDGhQc9leBbwKjM50vC5pda5z2ACl170P+AS4OwOxRVK4whANK6AsUk8DkzNQiyXtvZmAJqVAuCWB6vnTTXmhZL5yxK6UtOsqQLaD8UdJbw3qwG3kbEdqiHQxNvHvlbT4f4Bsn08lIHg2SNrWRnm68e3APUBk4ouSLjfJ2n4DiOgLuiTpzh4g248Cn5WUrJFUmVUzJ80Vx+efgBeaapjtZ4A92ZnTckCvAOv73Oo5Se9W3db2i8BrFfuTJZ2peynbzvYX5IC+AaZWCM+XdKC8Z/s24PeaA49Kmt0A6JfMj1YMAbIdQAJQFf0JLCybwPaDwIkauSG/aAAUjl2UlXUFoJeB7Q1OeBFYJKkH3Hbkk29r5H6VNG4QQMeAh5qiAjgpqWdW2yOBePI7KmQPSJrfyWS2J0TeaQGmYJmbm64UumU1EyX90MmpG6KkrOsPYLykv/MN2wuBjcCM9D3q0kuS4vUqyfYyYHfGME22D6f+pk72SyD6nv11ucV2NGSRFAN4I9l+D1iSGP9LjLYPAtFEVdEhSY81au/IYPuB8ElgRPGqvdJhO7JlhOfnwAfAE6WoWyHpzY5n1rLb3prMXPD1L67Fru3IsHGLoJgaZkmK0eaayfZMINygoOb2w/azwPuZ0EfA82WHHgRdqVyEinYNmu2PgafymwDLJF0YEEj4avhsTu1bWNsxykRhLcI5FIUjhpJ9XUClJj+6gpy6N/mpkYqpM9qTnGI8fruukbthY5DtGP4C1KI+rxI5JzJ9rHD+UcM2KNpeC6wBoqgOQtd3lA4E6bUKYONbooqxJyL2+v5syA+3PSaVnPuBGACLFb9ivgfOAl9FyWkqsLneKyNmUcarECm7AAAAAElFTkSuQmCC) center no-repeat;background-size:25px;}
#hld__img_full .rotate-right {transform:rotateY(180deg);}
#hld__img_full .rotate-left:hover {transform:scale(1.2);}
#hld__img_full .rotate-right:hover {transform:scale(1.2) rotateY(180deg);}
#hld__img_full .next-img:hover {transform:scale(1.2) rotate(180deg);}
#hld__img_full .prev-img,#hld__img_full .next-img {background:url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAABmUlEQVRYR+3WsUtWURjH8e8z+J/4J7QF4vL+C5ZBiAoh6lCDDQmBoIMOOiiIoBCBU+DiUENRQUWigiAuCjoo5JAmkQ41/OTCEzxEwznnvr4u750vfD/nOfdcjnHLj91ynzagqROQ1AC2zOxH6tY2DSBpAnju4Ttmtp2CaApA0hTwLAT7zexFSwCSZoCxENsDuszs/MYBkuaAxyG0A9wzs/2UePVO8RZIWgBGQmgTuG9mh6nxYoCkJeBRCH3x+HFOvAggaQUYCKGPQK+ZfcuNZwMkvQQehtA7X/n3kngWQNIn4G4IvfGVX5TGkwGSDoDOEFr3+GWdeA7gN9DhsV9Aw8y+1o3nAN4D3SF45BPYqItI/g9IGgcmQ7A6ctXX/7kOIhlQRSQ9BaZD8NQRH0oRWQBHPAFmQ/DMj+LbEkQ2wBGjwHwI/nTE61xEEcARQ8BiCF45ojqiyU8xwBGDwHKo/XHEWqqgFsARfcC/l4+W34geAKth1T1m9iplCrUn8DciqceP6C4wbGYnLQWkxP73TtMm0Aa0J1A6gWvfCH8hDgZXwQAAAABJRU5ErkJggg==) center no-repeat;}
#hld__img_full .next-img {transform:rotate(180deg);}
#hld__img_full .prev-img:hover {transform:scale(1.2);}
#hld__img_full .next-img:hover {transform:scale(1.2) rotate(180deg);}
.clearfix{clear:both;}
#hld__setting {color:#6666CC;cursor:pointer;}
.hld__list-panel {position:fixed;background:#fff8e7;padding:15px 20px;border-radius:10px;box-shadow:0 0 10px #666;border:1px solid #591804;z-index:9999;}
#hld__banlist_panel {width:500px;}
#hld__keywords_panel {width:182px;}
.hld__tab-content {display:flex;justify-content:space-between;flex-wrap: wrap;}
.hld__list-panel .hld__list-c {width:45%;}
#hld__keywords_panel .hld__list-c {width:100%;}
.hld__list-panel .hld__list-c textarea {box-sizing:border-box;padding:0;margin:0;height:200px;width:100%;resize:none;}
.hld__list-panel .hld__list-desc {margin-top:5px;font-size:9px;color:#666;cursor:help;text-decoration: underline;}
.hld__list-panel .hld__list-c > p:first-child {font-weight:bold;font-size:14px;margin-bottom:10px;}
#hld__updated {position:fixed;top:20px;right:20px;width:200px;padding:10px;border-radius:5px;box-shadow:0 0 15px #666;border:1px solid #591804;background:#fff8e7;z-index: 9999;}
#hld__updated .hld__readme {text-decoration:underline;color:#591804;}
.hld__img-resize {outline:'';outline-offset:'';cursor:alias;min-width:auto !important;min-height:auto !important;max-width:${advanced_setting.imgResizeWidth || 200}px !important;margin:5px;}
#hld__setting_panel {position:relative;background:#fff8e7;width:526px;padding:15px 20px;border-radius:10px;box-shadow:0 0 10px #666;border:1px solid #591804;}
#hld__setting_panel > div.hld__field {float:left;width:50%;}
#hld__setting_panel p {margin-bottom:10px;}
#hld__setting_panel .hld__sp-title {font-size:15px;font-weight:bold;text-align:center;}
#hld__setting_panel .hld__sp-section {font-weight:bold;margin-top:20px;}
.hld__setting-close {position:absolute;top:5px;right:5px;padding:3px 6px;background:#fff0cd;color:#591804;transition:all .2s ease;cursor:pointer;border-radius:4px;text-decoration:none;}
.hld__setting-close:hover {background:#591804;color:#fff0cd;text-decoration:none;}
#hld__setting_panel button {transition:all .2s ease;cursor:pointer;}
button.hld__btn {padding:3px 8px;border:1px solid #591804;background:#fff8e7;color:#591804;}
button.hld__btn:hover {background:#591804;color:#fff0cd;}
.hld__btn-groups {display:flex;justify-content:center !important;margin-top:10px;}
.hld__post-author {color:${advanced_setting.authorMarkColor};font-weight:bold;}
.hld__extra-icon {position: relative;padding:0 2px;background-repeat:no-repeat;background-position:center;}
.hld__extra-icon svg {width:10px;height:10px;vertical-align:-0.15em;fill:currentColor;overflow:hidden;cursor:pointer;}
.hld__extra-icon:hover {text-decoration:none;}
span.hld__remark {color:#666;font-size:0.8em;}
span.hld__banned {color:#ba2026;}
.hld__sp-fold {padding-left:23px;}
.hld__sp-fold .hld__f-title {font-weight:bold;}
.hld__buttons {clear:both;display:flex;justify-content:space-between;padding-top:15px;}
code {padding:2px 4px;font-size:90%;font-weight:bold;color:#c7254e;background-color:#f9f2f4;border-radius:4px;}
.hld__float-left {float:left;}
.hld__shortcut-desc {width:120px;margin-left:20px;padding-top:6px}
.hld__shortcut-desc p {margin-bottom:5px;}
.hld__script-info {margin-left:4px;font-size:70%;color:#666;}
.hld__reward-panel {width:500px;}
.hld__reward-panel .hld__reward-info {display:block;font-size:15px;margin-bottom:20px;line-height:20px;}
.hld__delete-line {text-decoration:line-through;color:#666;}
.hld__reward-panel .hld__list-c {width:50%;}
.hld__reward-panel .hld__list-c:first-child {margin-right:15px;}
.hld__reward-panel .hld__list-c>img {width:100%;height:auto;}
.hld__excel-body {background:#fff !important;}
.hld__excel-header, .hld__excel-footer, .hld__excel-setting {display: none;}
.hld__excel-body #mainmenu,.hld__excel-body .catenew,.hld__excel-body #toptopics,.hld__excel-body #m_pbtntop,.hld__excel-body #m_fopts,.hld__excel-body #b_nav,.hld__excel-body #fast_post_c,.hld__excel-body #custombg,.hld__excel-body #m_threads th,.hld__excel-body #m_posts th,.hld__excel-body .r_container,.hld__excel-body #footer,.hld__excel-body .clickextend {display:none !important;}
.hld__excel-body #mmc {margin-top:195px;margin-bottom:35px;}
.hld__excel-body .postBtnPos > div, .hld__excel-body .postBtnPos .stdbtn a {background:#fff !important;border-color:#bbb;}
.hld__excel-body .hld__excel-div,.hld__excel-body .hld__excel-setting {display:block;}
.hld__excel-body .hld__excel-setting {position:fixed;width:60px;height:20px;top:5px;right:95px;background:#f2f4f7;z-index:999;}
.hld__excel-body .hld__excel-setting img {width:20px;height:auto;vertical-align:middle;}
.hld__excel-body .hld__excel-setting a {margin-left:5px;vertical-align:middle;}
.hld__excel-body .hld__excel-header {position:fixed;top:0;left:0;height:196px;}
.hld__excel-body .hld__excel-footer {position:fixed;bottom:0;left:0;height:50px;}
.hld__excel-body .hld__excel-header, .hld__excel-body .hld__excel-footer {width: 100%;text-align: center;font-size: 16px;font-weight: bold;background:#e8e8e8;color:#337ab7;line-height: 45px;}
.hld__excel-body .hld__excel-header>img, .hld__excel-body .hld__excel-footer>img{position:absolute;top:0;left:0}
.hld__excel-body #m_nav {position:fixed;top:136px;left:261px;margin:0;padding:0;z-index:99;}
.hld__excel-body #m_nav .nav_spr {display:block;border:0;border-radius:0;padding:0;box-shadow:none;background:none;}
.hld__excel-body #m_nav .nav_spr span {color:#000;font-size:16px;vertical-align:unset;font-weight:normal;}
.hld__excel-body #m_nav .nav_root,.hld__excel-body #m_nav .nav_link {background:none;border:none;box-shadow:none;padding:0;color:#000;border-radius:0;font-weight:normal;}
.hld__excel-body #m_threads {margin:0;}
.hld__excel-body #topicrows {border:none;box-shadow:none;border-radius:0;margin:0;background-color:#fff;counter-reset:num;border-spacing:0;}
.hld__excel-body #topicrows tbody {border-spacing:0;}
.hld__excel-body .topicrow {border-spacing:0;}
.hld__excel-body #topicrows td {background:#fff;padding:5px 0;margin:0;border:none;border-right:1px solid #bbbbbb;border-bottom:1px solid #bbbbbb;margin-right:-1px;}
.hld__excel-body .topicrow .c1 {width:33px;background:#e8e8e8 !important;}
.hld__excel-body .topicrow .c1 a {display:none;color: #777777 !important;font-size: 16px !important;font-family: auto;width: 30px;overflow: hidden;text-overflow: ellipsis;white-space: nowrap;}
.hld__excel-body.hld__excel-original-no .topicrow .c1:before {display:none;}
.hld__excel-body.hld__excel-original-no .topicrow .c1 a {display:inline-block;}
.hld__excel-body.hld__excel-original-no .topicrow .c1 img {width:20px;}
.hld__excel-body .topicrow .c1:before {content:counter(num);counter-increment:num;color:#777777;font-size:16px;}
.hld__excel-body .topicrow .c2 {padding-left:5px !important;}
.hld__excel-body .topicrow .c3 {color:#1a3959 !important;}
.hld__excel-body .block_txt {background:#fff !important;color:#1a3959 !important;border-radius:0;padding:0 !important;min-width:0 !important;font-weight:normal;}
.hld__excel-body .quote {background:#fff !important;}
.hld__excel-body #m_posts .block_txt {font-weight:bold;}
.hld__excel-body .topicrow .postdate,.hld__excel-body .topicrow .replydate {display:inline;margin:10px;}
.hld__excel-body #m_pbtnbtm {margin:0;border-bottom:1px solid #bbbbbb;}
.hld__excel-body #pagebbtm,.hld__excel-body #m_pbtnbtm .right_ {margin:0;}
.hld__excel-body #pagebbtm:before {display:block;line-height:35px;width:33px;float:left;content:"#";border-right:1px solid #bbbbbb;color:#777;font-size:16px;background:#e8e8e8;}
.hld__excel-body #m_pbtnbtm td {line-height:35px;padding:0 5px;}
.hld__excel-body #m_pbtnbtm .stdbtn {box-shadow:none;border:none;padding:0;padding-left:5px;background:#fff;border-radius:0;}
.hld__excel-body #m_pbtnbtm .stdbtn .invert {color:#591804;}
.hld__excel-body #m_pbtnbtm td a {background:#fff;padding:0;border:0;}
.hld__excel-body #m_posts .comment_c .comment_c_1 {border-top-color:#bbbbbb;}
.hld__excel-body #m_posts .comment_c .comment_c_2 {border-color:#bbbbbb;}
.hld__excel-body #m_posts {border:0;box-shadow:none;padding-bottom:0;margin:0;counter-reset:num;}
.hld__excel-body #m_posts td {background:#fff;border-right:1px solid #bbbbbb;border-bottom:1px solid #bbbbbb;}
.hld__excel-body #m_posts .c0 {width:32px;color:#777;font-size:16px;background:#e8e8e8;text-align:center;}
.hld__excel-body #m_posts .c0:before {content:counter(num);counter-increment:num;}
.hld__excel-body #m_posts .vertmod {background:#fff !important;color:#ccc;}
.hld__excel-body #m_posts a[name="uid"]:before {content:"UID:"}
.hld__excel-body #m_posts .white,.hld__excel-body #m_posts .block_txt_c2,.hld__excel-body #m_posts .block_txt_c0 {background:#fff !important;color:#777777;}
.hld__excel-body #m_posts .quote {background:#fff;border-color:#bbbbbb;}
.hld__excel-body #m_posts button {background:#eee;}
.hld__excel-body #m_posts .postbox {border:none !important;}
.hld__excel-body.hld__reply-fixed #postbbtm {position:fixed;right:30px;top:75px;z-index:999;border-radius: 10px;overflow: hidden;}
.hld__flex{display:flex;}
#hld__noti_container {position:fixed;top:10px;left:10px;}
.hld__noti-msg {display:none;padding:10px 20px;font-size:14px;font-weight:bold;color:#fff;margin-bottom:10px;background:rgba(0,0,0,0.6);border-radius:10px;cursor:pointer;}
.hld__advanced-setting {border-top: 1px solid #e0c19e;border-bottom: 1px solid #e0c19e;padding: 3px 0;margin-top:25px;}
.hld__advanced-setting >span {font-weight:bold}
.hld__advanced-setting >button {padding: 0px;margin-right:5px;width: 18px;text-align: center;}
.hld__advanced-setting-panel {display:none;padding:5px 0;}
.hld__advanced-setting-panel>p {margin: 7px 0 !important;font-weight:bold;}
.hld__advanced-setting-panel>p svg {height:16px;width:16px;vertical-align: top;margin-right:3px;}
.hld__advanced-setting-panel>table td {padding-right:10px}
.hld__advanced-setting-panel input[type=text],.hld__advanced-setting-panel input[type=number] {width:80px}
.hld__advanced-setting-panel .hld__adv-help {cursor:help;text-decoration: underline;}
.hld__ep-container{display:flex;width:300px;margin-bottom: 7px;}
.hld__ep-container p {margin-bottom:10px;}
.hld__ep-container >div{width:50%;}
.hld__ep-container textarea {width: 100%;padding:0;margin:0;resize:none;}
.hld__table-keyword {margin-top:10px;width:200px;}
.hld__table-keyword tr td:last-child {text-align:center;}
.hld__table-keyword input[type=text] {width:48px;text-transform:uppercase;text-align:center;}
.hld__tab-header{height:40px}
.hld__tab-header>span{margin-right:10px;padding:5px;cursor:pointer}
.hld__tab-header .hld__table-active,.hld__tab-header>span:hover{color:#591804;font-weight:700;border-bottom:3px solid #591804}
.hld__tab-content{display:none}
.hld__tab-content.hld__table-active{display:flex}
.hld__msg{display:none;position:fixed;top:10px;left:48%;color:#fff;text-align:center;z-index:99996;padding:10px 30px 10px 45px;font-size:16px;border-radius:10px;background-image:url("data:image/svg+xml,%3Csvg t='1595842925125' class='icon' viewBox='0 0 1024 1024' version='1.1' xmlns='http://www.w3.org/2000/svg' p-id='2280' width='200' height='200'%3E%3Cpath d='M89.216226 575.029277c-6.501587-7.223986-10.47478-15.892769-12.641975-26.367549-1.805996-10.47478-0.722399-20.22716 3.973192-29.257143l4.695591-10.47478c5.05679-8.307584 11.558377-13.725573 19.865961-15.892769 7.946384-2.167196 15.892769-0.361199 23.477954 5.417989L323.995767 639.322751c8.307584 5.779189 17.698765 8.668783 27.812346 8.307584 10.11358-0.361199 18.782363-3.611993 26.006349-10.11358L898.302646 208.411993c7.585185-5.779189 16.253968-8.307584 26.006349-7.585185 9.752381 0.722399 18.059965 4.334392 24.922751 10.47478l-12.641975-12.641975c6.501587 7.223986 9.752381 15.17037 9.752381 24.561552 0 9.391182-3.250794 17.337566-9.752381 24.561552L376.008466 816.310406c-7.223986 7.223986-15.17037 10.47478-24.200353 10.47478-9.029982 0-16.976367-3.250794-24.200353-9.752381L89.216226 575.029277z' p-id='2281' fill='%23ffffff'%3E%3C/path%3E%3C/svg%3E");background-size:25px;background-repeat:no-repeat;background-position:15px}
.hld__msg a{color:#fff;text-decoration: underline;}
.hld__msg-ok{background:#4bcc4b}
.hld__msg-err{background:#c33}
.hld__msg-warn{background:#FF9900}
.hld__dialog{position:absolute;padding-right:35px}
.hld__dialog>div{line-height:30px}
.hld__dialog:before{position:absolute;content:' ';width:10px;height:10px;background-color:#fff6df;left:10px;transform:rotate(45deg)}
.hld__dialog-sub-top:before{top:-6px;border-top:1px solid #591804;border-left:1px solid #591804}
.hld__dialog-sub-bottom:before{bottom:-5px;border-bottom:1px solid #591804;border-right:1px solid #591804}
.hld__dialog-buttons{display:flex;justify-content:flex-end!important;margin-top:10px}
.hld__dialog-buttons>button{cursor:pointer}
.hld__dialog-user{font-size:1.5em;color:red;margin:0 5px}
.hld__dialog input[type=text]{width:100px;margin-right:15px}
.hld__dialog-mark-table td{padding-bottom:3px}
.hld__dialog-mark-table button{padding:0 6px;margin:0;height:20px;line-height:20px;width:20px;text-align:center;cursor:pointer}
.cp-color-picker{z-index:99997}
.sp-container{position:absolute;top:0;left:0;display:inline-block;z-index:9999994;overflow:hidden}
.sp-original-input-container{position:relative;display:inline-flex}
.sp-original-input-container input{margin:0!important}
.sp-original-input-container .sp-add-on{width:40px;border-top-right-radius:0!important;border-bottom-right-radius:0!important}
input.spectrum.with-add-on{border-top-left-radius:0;border-bottom-left-radius:0;border-left:0}
.sp-original-input-container .sp-add-on .sp-colorize{height:100%;width:100%;border-radius:inherit}
.sp-colorize-container{background-image:url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAwAAAAMCAIAAADZF8uwAAAAGUlEQVQYV2M4gwH+YwCGIasIUwhT25BVBADtzYNYrHvv4gAAAABJRU5ErkJggg==)}
.sp-container.sp-flat{position:relative}
.sp-container,.sp-container *{-webkit-box-sizing:content-box;-moz-box-sizing:content-box;box-sizing:content-box}
.sp-top{position:relative;width:100%;display:inline-block}
.sp-top-inner{position:absolute;top:0;left:0;bottom:0;right:0}
.sp-color{position:absolute;top:0;left:0;bottom:0;right:20px!important}
.sp-hue{position:absolute;top:0;right:0;bottom:0;width:12px;height:100%;left:initial!important}
.sp-clear-enabled .sp-hue{top:15%;height:85%}
.sp-fill{padding-top:80%}
.sp-sat,.sp-val{position:absolute;top:0;left:0;right:0;bottom:0}
.sp-alpha-enabled .sp-top{margin-bottom:28px!important}
.sp-alpha-enabled .sp-alpha{display:block}
.sp-alpha-handle{position:absolute;top:-3px;cursor:pointer;height:16px;border-radius:50%;width:16px;margin-right:5px;left:-2px;right:0;background:#f9f9f9;box-shadow:0 0 2px 0 #3a3a3a}
.sp-alpha{display:none;position:absolute;bottom:-18px;right:0;left:0;height:10px}
.sp-alpha-inner{border-radius:4px}
.sp-clear{display:none}
.sp-clear.sp-clear-display{background-position:center}
.sp-clear-enabled .sp-clear{display:block;position:absolute;top:3px;right:0;bottom:0;cursor:pointer;left:initial;height:12px;width:12px}
.sp-alpha,.sp-alpha-handle,.sp-clear,.sp-container,.sp-container button,.sp-container.sp-dragging .sp-input,.sp-dragger,.sp-preview,.sp-replacer,.sp-slider{-webkit-user-select:none;-moz-user-select:-moz-none;-o-user-select:none;user-select:none}
.sp-container.sp-input-disabled .sp-input-container{display:none}
.sp-container.sp-buttons-disabled .sp-button-container{display:none}
.sp-container.sp-palette-buttons-disabled .sp-palette-button-container{display:none}
.sp-palette-only .sp-picker-container{display:none}
.sp-palette-disabled .sp-palette-container{display:none}
.sp-initial-disabled .sp-initial{display:none}
.sp-sat{background-image:-webkit-gradient(linear,0 0,100% 0,from(#fff),to(rgba(204,154,129,0)));background-image:-webkit-linear-gradient(left,#fff,rgba(204,154,129,0));background-image:-moz-linear-gradient(left,#fff,rgba(204,154,129,0));background-image:-o-linear-gradient(left,#fff,rgba(204,154,129,0));background-image:-ms-linear-gradient(left,#fff,rgba(204,154,129,0));background-image:linear-gradient(to right,#fff,rgba(204,154,129,0))}
.sp-val{border-radius:4px;background-image:-webkit-gradient(linear,0 100%,0 0,from(#000),to(rgba(204,154,129,0)));background-image:-webkit-linear-gradient(bottom,#000,rgba(204,154,129,0));background-image:-moz-linear-gradient(bottom,#000,rgba(204,154,129,0));background-image:-o-linear-gradient(bottom,#000,rgba(204,154,129,0));background-image:-ms-linear-gradient(bottom,#000,rgba(204,154,129,0));background-image:linear-gradient(to top,#000,rgba(204,154,129,0))}
.sp-hue{background:-moz-linear-gradient(top,red 0,#ff0 17%,#0f0 33%,#0ff 50%,#00f 67%,#f0f 83%,red 100%);background:-ms-linear-gradient(top,red 0,#ff0 17%,#0f0 33%,#0ff 50%,#00f 67%,#f0f 83%,red 100%);background:-o-linear-gradient(top,red 0,#ff0 17%,#0f0 33%,#0ff 50%,#00f 67%,#f0f 83%,red 100%);background:-webkit-gradient(linear,left top,left bottom,from(red),color-stop(.17,#ff0),color-stop(.33,#0f0),color-stop(.5,#0ff),color-stop(.67,#00f),color-stop(.83,#f0f),to(red));background:-webkit-linear-gradient(top,red 0,#ff0 17%,#0f0 33%,#0ff 50%,#00f 67%,#f0f 83%,red 100%);background:linear-gradient(to bottom,red 0,#ff0 17%,#0f0 33%,#0ff 50%,#00f 67%,#f0f 83%,red 100%)}
.sp-1{height:17%}
.sp-2{height:16%}
.sp-3{height:17%}
.sp-4{height:17%}
.sp-5{height:16%}
.sp-6{height:17%}
.sp-hidden{display:none!important}
.sp-cf:after,.sp-cf:before{content:"";display:table}
.sp-cf:after{clear:both}
@media (max-device-width:480px){.sp-color{right:40%}
.sp-hue{left:63%}
.sp-fill{padding-top:60%}
}
.sp-dragger{border-radius:5px;height:10px;width:10px;border:1px solid #fff;cursor:pointer;position:absolute;top:0;left:0;margin-left:3px;margin-top:3px;box-shadow:0 0 2px 1px rgba(0,0,0,.2)}
.sp-slider{position:absolute;top:0;cursor:pointer;height:16px;border-radius:50%;width:16px;left:-2px;background:#f9f9f9;box-shadow:0 0 2px 0 #3a3a3a;margin-top:8px}
.sp-container{display:inline-flex;border-radius:0;background-color:#fff;padding:0;border-radius:4px;color:#000;box-shadow:0 0 0 1px rgba(99,114,130,.16),0 8px 16px rgba(27,39,51,.08)}
.sp-clear,.sp-color,.sp-container,.sp-container button,.sp-container input,.sp-hue{font-size:12px;-webkit-box-sizing:border-box;-moz-box-sizing:border-box;-ms-box-sizing:border-box;box-sizing:border-box}
.sp-top{margin-bottom:10px}
.sp-clear,.sp-color,.sp-hue,.sp-sat,.sp-val{border-radius:3px}
.sp-input-container{margin-top:-5px}
.sp-button-container.sp-cf,.sp-initial.sp-thumb.sp-cf,.sp-input-container.sp-cf{height:25px}
.sp-picker-container .sp-cf{margin-bottom:10px}
.sp-palette-row-initial>span:first-child{cursor:pointer}
.sp-initial-disabled .sp-input-container{width:100%}
.sp-input{padding:0 5px!important;margin:0;width:100%;box-shadow:none!important;height:100%!important;background:0 0;color:#3a3a3a;border-radius:2px!important;border:1px solid #e0e0e0!important;text-align:center;font-family:monospace;font-size:inherit!important}
.sp-input.sp-validation-error{border:1px solid red;background:#fdd}
.sp-palette-container,.sp-picker-container{position:relative;padding:10px}
.sp-picker-container{width:200px;padding-bottom:0}
.sp-palette-container{border-right:solid 1px #ccc}
.sp-palette-only .sp-palette-container{border:0}
.sp-palette .sp-thumb-el{display:block;position:relative;float:left;width:24px;height:15px;margin:3px;cursor:pointer;border:solid 2px transparent}
.sp-palette .sp-thumb-el.sp-thumb-active,.sp-palette .sp-thumb-el:hover{border-color:orange}
.sp-thumb-el{position:relative}
.sp-initial{float:left}
.sp-initial span{width:30px;height:25px;border:none;display:block;float:left;margin:0}
.sp-initial .spe-thumb-el.sp-thumb-active{border-radius:0 5px 5px 0}
.sp-initial .spe-thumb-el{border-radius:5px 0 0 5px}
.sp-initial .sp-clear-display{background-position:center}
.sp-button-container{float:right;display:none;}
.sp-palette-button-container{margin-top:10px}
.sp-replacer{position:relative;overflow:hidden;cursor:pointer;display:inline-block;border-radius:3px;border:1px solid #aaa;color:#666;transition:border-color .3s;vertical-align:middle;width:40px;height:20px;margin: 1.5px 3px;}
.sp-replacer.sp-active,.sp-replacer:hover{border:1px solid #666;color:#000}
.sp-replacer.sp-disabled{cursor:default;border-color:silver;color:silver}
.sp-dd{position:absolute;font-size:10px;right:0;top:0;bottom:0;padding:0 1px;line-height:22px;background-color:#fff;border-left: 1px solid #aaa;}
.sp-preview{position:relative;width:100%;height:100%;float:left;z-index:0}
.sp-preview-inner{transition:background-color .2s}
.sp-preview-inner.sp-clear-display{display:none}
.sp-palette .sp-thumb-el{width:16px;height:16px;margin:3px;border:none;border-radius:3px}
.sp-container button{border-radius:3px;border:none;background:0 0;line-height:1;padding:0 8px;height:25px;text-transform:capitalize;text-align:center;vertical-align:middle;cursor:pointer;color:#606c72;font-weight:700}
.sp-container button.sp-choose{background-color:#3cab3b;color:#fff;margin-left:5px}
.sp-container button:hover{opacity:.8}
.sp-container button.sp-palette-toggle{width:100%;background-color:#f3f3f3;margin:0}
.sp-palette span.sp-thumb-active,.sp-palette span:hover{border-color:#000}
.sp-alpha,.sp-preview,.sp-thumb-el{position:relative;background-image:url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAwAAAAMCAIAAADZF8uwAAAAGUlEQVQYV2M4gwH+YwCGIasIUwhT25BVBADtzYNYrHvv4gAAAABJRU5ErkJggg==)}
.sp-alpha-inner,.sp-preview-inner,.sp-thumb-inner{display:block;position:absolute;top:0;left:0;bottom:0;right:0}
.sp-palette .sp-thumb-inner{border-radius:3px;background-position:50% 50%;background-repeat:no-repeat}
.sp-palette .sp-thumb-light.sp-thumb-active .sp-thumb-inner{background-image:url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABIAAAASCAYAAABWzo5XAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAIVJREFUeNpiYBhsgJFMffxAXABlN5JruT4Q3wfi/0DsT64h8UD8HmpIPCWG/KemIfOJCUB+Aoacx6EGBZyHBqI+WsDCwuQ9mhxeg2A210Ntfo8klk9sOMijaURm7yc1UP2RNCMbKE9ODK1HM6iegYLkfx8pligC9lCD7KmRof0ZhjQACDAAceovrtpVBRkAAAAASUVORK5CYII=)}
.sp-palette .sp-thumb-dark.sp-thumb-active .sp-thumb-inner{background-image:url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABIAAAASCAYAAABWzo5XAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAAadEVYdFNvZnR3YXJlAFBhaW50Lk5FVCB2My41LjEwMPRyoQAAAMdJREFUOE+tkgsNwzAMRMugEAahEAahEAZhEAqlEAZhEAohEAYh81X2dIm8fKpEspLGvudPOsUYpxE2BIJCroJmEW9qJ+MKaBFhEMNabSy9oIcIPwrB+afvAUFoK4H0tMaQ3XtlrggDhOVVMuT4E5MMG0FBbCEYzjYT7OxLEvIHQLY2zWwQ3D+9luyOQTfKDiFD3iUIfPk8VqrKjgAiSfGFPecrg6HN6m/iBcwiDAo7WiBeawa+Kwh7tZoSCGLMqwlSAzVDhoK+6vH4G0P5wdkAAAAASUVORK5CYII=)}
.sp-clear-display{background-repeat:no-repeat;background-position:center;background-image:url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA4AAAAOCAYAAAAfSC3RAAABe0lEQVQokYXSsUtcQRTF4d8Jj+VhHSxkEQuLsEUKK0nhTBFTmLSSUhBCMCAWsmgIwWrBLk0akfwLCaSQKBJmtrIIISwpRFKIhViETScphGMzysMtvOVwvpm5d0bGNCuGWAOPgYdl6S8wSDn9b+bUhDHEKWAdeAFMANg+l/TV9ofcz6cjMIbYBvaBMds7QCqZ58CmpBNgPuV0DvAAIMyFGugWtJr7eTv38xEwkPRPErY7QDeG2LqFkjrAgu0dSd/KDVqSNmxvAZ8lfbS9AHRuYemnLWkv5XRVBrQMbAI/gTXgEzAJtJuwBVS2L2OIle03QA/4Lmkl5XQBXEqqbFcAVYFDYChpFngiqWf7l6TXKaezMt2Zkhk24THwG+jZriX9AFZvUAyxLbRke2D75O5zPAO+ADXwEtizjaRHwDvbTyUtppwOmicCHAJvbXcl9YA1SQDjtseA97YPRz7ATcUQp2y/kjRdevsjaTfldNrMjcDGBjXA3T96L7yvrgFzP69+0Ao/HAAAAABJRU5ErkJggg==)}
.hld__marks-container>span{padding:1px 5px;border-radius:3px;margin-right:5px;color:#fff;background-color:#1f72f1}
.hld__table{table-layout:fixed;border-top:1px solid #ead5bc;border-left:1px solid #ead5bc}
.hld__table-banlist-buttons{margin-top:10px}
.hld__table thead{background:#591804;border:1px solid #591804;color:#fff}
.hld__scroll-area{position:relative;height:200px;overflow:auto;border:1px solid #ead5bc}
.hld__scroll-area::-webkit-scrollbar{width:6px;height:6px}
.hld__scroll-area::-webkit-scrollbar-thumb{border-radius:10px;box-shadow:inset 0 0 5px rgba(0,0,0,.2);background:#591804}
.hld__scroll-area::-webkit-scrollbar-track{box-shadow:inset 0 0 5px rgba(0,0,0,.2);border-radius:10px;background:#ededed}
.hld__table td,.hld__table th{padding:3px 5px;border-bottom:1px solid #ead5bc;border-right:1px solid #ead5bc;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.hld__us-action{display: inline-block;width:18px;height:18px;margin:0 3px;}
.hld__us-action:hover{opacity:.8}
.hld__us-edit{background-size:20px;background-image:url("data:image/svg+xml,%3Csvg t='1595910222437' class='icon' viewBox='0 0 1024 1024' version='1.1' xmlns='http://www.w3.org/2000/svg' p-id='3699'%3E%3Cpath d='M533.333333 106.666667v85.333333H213.333333v618.666667h618.666667V490.666667h85.333333v405.333333H128V106.666667h405.333333z m355.114667 97.237333L501.504 590.826667l-64.426667-64.426667L824.021333 139.498667l64.426667 64.426666z' p-id='3700'%3E%3C/path%3E%3C/svg%3E")}
.hld__us-del{background-image:url("data:image/svg+xml,%3Csvg t='1595910451854' class='icon' viewBox='0 0 1024 1024' version='1.1' xmlns='http://www.w3.org/2000/svg' p-id='4969'%3E%3Cpath d='M769.214785 190.785215V0h-511.488511v190.785215H2.365634v65.918082H1022.977023V190.785215h-253.762238zM320.959041 61.954046h384.383616v128.895105H320.959041V61.954046zM386.621379 382.593407h61.954046v446.593406h-61.954046V382.593407zM577.406593 382.593407H639.360639v446.593406h-61.954046V382.593407z' p-id='4970'%3E%3C/path%3E%3Cpath d='M832.191808 959.040959h-639.360639V318.657343h-63.936064v705.342657h767.616384V318.657343h-64.319681V959.040959z' p-id='4971'%3E%3C/path%3E%3C/svg%3E")}
.hld__toolbox-reply{opacity: 0;padding:0 0.4em;}
.forumbox.postbox:hover .hld__toolbox-reply{opacity:1;}
`))
    document.getElementsByTagName('head')[0].appendChild(style)
})();
