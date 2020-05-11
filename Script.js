// ==UserScript==
// @name         NGA优化摸鱼体验
// @namespace    https://github.com/kisshang1993/NGA-BBS-Script
// @version      2.4
// @author       HLD
// @description  NGA论坛显示优化，功能增强，防止突然蹦出一对??而导致的突然性的社会死亡
// @license      GPL-3.0
// @require https://cdn.staticfile.org/jquery/3.4.0/jquery.min.js
// @match        *://bbs.nga.cn/*
// @match        *://ngabbs.com/*
// @match        *://nga.178.com/*
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
        linkTargetBlank: true,
        imgResize: true,
        authorMark: true,
        keywordsBlock: true,
        markAndBan: true,
        banMode: 'SIMPLE',
        shortcutKeys: default_shortcut
    }
    let post_author = []
    let ban_list = []
    let mark_list = []
    let keywords_list = []

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

    //检查更新
    if (window.localStorage.getItem('hld__NGA_version')) {
        const current_version = +window.localStorage.getItem('hld__NGA_version')
        if (GM_info.script.version > current_version) {
            const focus = '<br><p>* 重点更新：新增Excel模式</p><br>'
            $('body').append(`<div id="hld__updated" class="animated-1s bounce"><p><a href="javascript:void(0)" class="hld__setting-close">×</a><b>NGA优化摸鱼插件已更新至v${GM_info.script.version}</b></p>${focus}<p><a class="hld__readme" href="https://greasyfork.org/zh-CN/scripts/393991-nga%E4%BC%98%E5%8C%96%E6%91%B8%E9%B1%BC%E4%BD%93%E9%AA%8C" target="_blank">查看更新内容</a></p></div>`)
            $('body').on('click', '#hld__updated a', function () {
                $(this).parents('#hld__updated').remove()
                window.localStorage.setItem('hld__NGA_version', GM_info.script.version)
            })
        }
    } else window.localStorage.setItem('hld__NGA_version', GM_info.script.version)
    //同步配置
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
    //同步关键字
    if (setting.keywordsBlock) {
        const local_keywords_list = window.localStorage.getItem('hld__NGA_keywords_list')
        local_keywords_list && (keywords_list = local_keywords_list.split(','))
    }
    //注册按键
    $('body').keyup(function (event) {
        if (/textarea|select|input/i.test(event.target.nodeName)
            || /text|password|number|email|url|range|date|month/i.test(event.target.type)) {
            return;
        }

        //切换显示头像
        if (event.keyCode == setting.shortcutKeys[0]) {
            $('.avatar').toggle()
        }
        //切换显示表情
        if (event.keyCode == setting.shortcutKeys[1]) {
            $('img').each(function () {
                const classs = $(this).attr('class');
                if (classs && classs.includes('smile')) $(this).toggle()
            })
            $('.smile_alt_text').toggle()
        }
        //切换显示图片
        if (event.keyCode == setting.shortcutKeys[2]) {
            $('.postcontent img').each(function () {
                const classs = $(this).attr('class');
                if (!classs && $(this).width() > 24) {
                    if ($(this).is(":hidden")) {
                        $(this).show()
                        $('.switch-img').hide()
                    } else {
                        $('.switch-img').css('display', 'inline')
                        $(this).hide()
                    }
                }
            })
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
        if (setting.excelMode && event.keyCode == setting.shortcutKeys[5]) {
            switchExcelMode();
        }

    })

    //Excel 模板
    if (setting.excelMode) {
        $('body').append('<div class="hld__excel-div hld__excel-header"><img src="https://pic.downk.cc/item/5eb65188c2a9a83be59c86ce.png"></div>')
        $('body').append('<div class="hld__excel-div hld__excel-footer"><img src="https://pic.downk.cc/item/5eb62491c2a9a83be560bcf1.jpg"></div>')
        $('body').append('<div class="hld__excel-div hld__excel-setting"><img src="https://pic.downk.cc/item/5ea7eb7ec2a9a83be5c6b56a.png"><a href="javascript:eval($(\'hld__setting_cover\').style.display=\'flex\')" title="打开NGA优化摸鱼插件设置面板">摸鱼</div>')
    }

    //快捷键-列表维护
    $('body').on('click', '#hld__shortcut_manage', function () {
        let $shortcutPanel = $(`<div id="hld__shortcut_panel" class="hld__list-panel animated fadeInUp">
<a href="javascript:void(0)" class="hld__setting-close">×</a>
<div><div><p>编辑快捷键</p><div class="hld__float-left"><table class="hld__table"><thead><tr><td>功能</td><td width="60">快捷键</td></tr></thead>
<tbody></tbody></table></div><div class="hld__float-left hld__shortcut-desc"><p><b>支持的快捷键范围</b></p><p>键盘 <code>A</code>~<code>Z</code></p><p>左箭头 <code>LEFT</code></p><p>右箭头 <code>RIGHT</code></p><p>上箭头 <code>UP</code></p><p>下箭头 <code>DOWN</code></p><p><i>* 留空则取消快捷键</i></p><br><p>如按键异常请尝试重置按键</p>
</div>
<div></div></div>
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

    //拉黑备注-列表维护
    if (setting.markAndBan) {
        const local_ban_list = window.localStorage.getItem('hld__NGA_ban_list')
        local_ban_list && (ban_list = local_ban_list.split(','))
        const local_mark_list = window.localStorage.getItem('hld__NGA_mark_list')
        local_mark_list && (mark_list = local_mark_list.split(','))
        //绑定事件
        $('body').on('click', '.hld__extra-icon', function () {
            const type = $(this).data('type')
            const user = $(this).data('user')
            if (type == 'ban') {
                let ban_name = window.prompt('是否拉黑此用户？\n请检查用户名称，可能会出现解析异常', user)
                ban_name = $.trim(ban_name)
                if (ban_name) {
                    !ban_list.includes(ban_name) && ban_list.push(ban_name)
                    window.localStorage.setItem('hld__NGA_ban_list', ban_list.join(','))
                    popMsg('拉黑成功，重载页面生效')
                }
            }
            if (type == 'mark') {
                const exists_remark = mark_list.find(v => v.startsWith(user))
                let current_remark = exists_remark ? exists_remark.split(':')[1] : ''
                let remark = window.prompt('请输入要备注的名称，备注名显示在原名字的后面\n留空则为取消备注', current_remark)
                remark = $.trim(remark)
                if (remark.includes(':')) {
                    popMsg('备注不能包含“:”为脚本保留符号')
                } else {
                    const r = `${user}:${remark}`
                    const check = mark_list.findIndex(v => v.startsWith(user))
                    remark == '' ? check > -1 && mark_list.splice(check, 1) : check > -1 ? mark_list[check] = r : mark_list.push(r)
                    window.localStorage.setItem('hld__NGA_mark_list', mark_list.join(','))
                    popMsg('标记成功，重载页面生效')
                }
            }
        })
        //关键字管理
        $('body').on('click', '#hld__keywords_manage', function () {
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
            $('#hld__setting_cover').append(`<div id="hld__banlist_panel"  class="hld__list-panel animated fadeInUp">
<a href="javascript:void(0)" class="hld__setting-close">×</a>
<div>
<div class="hld__list-c"><p>黑名单</p><textarea row="20" id="hld__ban_list_textarea"></textarea><p class="hld__list-desc">一行一条</p></div>
<div class="hld__list-c"><p>备注名单</p><textarea row="20" id="hld__mark_list_textarea"></textarea><p class="hld__list-desc">一行一条，格式为<用户名>:<备注> 如“abc123:菜鸡”</p></div>
</div>
<div class="hld__btn-groups"><button class="hld__btn" data-type="save_banlist">保存列表</button></div>
</div>`)
            $('#hld__ban_list_textarea').val(ban_list.join('\n'))
            $('#hld__mark_list_textarea').val(mark_list.join('\n'))
        })
    }
    //集中面板按钮响应
    $('body').on('click', '.hld__btn', function () {
        const type = $(this).data('type')
        if (type == 'save_keywords') {
            keywords_list = $('#hld__keywords_list_textarea').val().split('\n')
            keywords_list = removeBlank(keywords_list)
            keywords_list = uniq(keywords_list)
            console.log(keywords_list)
            window.localStorage.setItem('hld__NGA_keywords_list', keywords_list.join(','))
        }
        if (type == 'save_banlist') {
            ban_list = $('#hld__ban_list_textarea').val().split('\n')
            ban_list = removeBlank(ban_list)
            ban_list = uniq(ban_list)
            mark_list = $('#hld__mark_list_textarea').val().split('\n')
            mark_list = removeBlank(mark_list)
            mark_list = uniq(mark_list)
            window.localStorage.setItem('hld__NGA_ban_list', ban_list.join(','))
            window.localStorage.setItem('hld__NGA_mark_list', mark_list.join(','))
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
        $('#hld__setting').length == 0 && $('#startmenu > tbody > tr > td.last').append('<div><div class="item"><a id="hld__setting" href="javascript:eval($(\'hld__setting_cover\').style.display=\'flex\')" title="打开NGA优化摸鱼插件设置面板">NGA优化摸鱼插件设置</a></div></div>')
        if ($('.hld__excel-body').length > 0) {
            $(document).attr('title') != '工作簿1' && $(document).attr('title', '工作簿1');
            $('#hld__excel_icon').length == 0 && $('head').append('<link id= "hld__excel_icon" rel="shortcut icon" type="image/png" href="https://pic.downk.cc/item/5eb678a5c2a9a83be5d2e70a.png" />')
        }
    }
    const isThreads = () => $('#m_threads').length > 0
    const isPosts = () => $('#m_posts').length > 0
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
            const author = $(this).find('.author').text()
            if (setting.markAndBan) {
                if (ban_list.length > 0 && ban_list.includes(author)) {
                    console.warn(`【NGA优化摸鱼体验脚本-黑名单屏蔽】标题：${title}  连接：${$(this).find('.c2>a').attr('href')}`)
                    $(this).parents('tbody').remove()
                }
                if (mark_list.length > 0) {
                    for (let m of mark_list) {
                        const t = m.split(':')
                        if (t[0] == author) {
                            $(this).find('.author').append(`<span class="hld__remark"> (${t[1]}) </span>`)
                        }
                    }
                }
            }
            if (setting.keywordsBlock && keywords_list.length > 0) {
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
                $link.click(() => window.open($link.data('href')))
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
                        $(this).width() > 200 && $(this).css({ 'outline': '', 'outline-offset': '', 'cursor': 'alias', 'min-width': '200px', 'min-height': 'auto', 'width': '200px', 'height': 'auto', 'margin:': '5px' }).attr('title', '点击大图显示')
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
                $(this).find('.small_colored_text_btn.block_txt_c2.stxt').each(function () {
                    let current_user = ''
                    if ($(this).parents('td').prev('td').html() == '') {
                        current_user = $(this).parents('table').prev('.posterinfo').children('.author').text()
                    } else {
                        current_user = $(this).parents('td').prev('td').find('.author').text()
                    }
                    $(this).append(`<a class="hld__extra-icon" data-type="mark" title="备注此用户" data-user="${current_user}"><svg t="1578453291663" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="15334" width="32" height="32"><path d="M978.488889 494.933333l-335.644445 477.866667-415.288888 45.511111c-45.511111 5.688889-91.022222-28.444444-102.4-73.955555L22.755556 540.444444 358.4 56.888889C398.222222 0 477.866667-11.377778 529.066667 28.444444l420.977777 295.822223c56.888889 39.822222 68.266667 113.777778 28.444445 170.666666zM187.733333 927.288889c5.688889 11.377778 17.066667 22.755556 28.444445 22.755555l386.844444-39.822222 318.577778-455.111111c22.755556-22.755556 17.066667-56.888889-11.377778-73.955555L489.244444 85.333333c-22.755556-17.066667-56.888889-11.377778-79.644444 11.377778l-318.577778 455.111111 96.711111 375.466667z" fill="#3970fe" p-id="15335" data-spm-anchor-id="a313x.7781069.0.i43" class="selected"></path><path d="M574.577778 745.244444c-56.888889 85.333333-176.355556 108.088889-261.688889 45.511112-85.333333-56.888889-108.088889-176.355556-45.511111-261.688889s176.355556-108.088889 261.688889-45.511111c85.333333 56.888889 102.4 176.355556 45.511111 261.688888z m-56.888889-39.822222c39.822222-56.888889 22.755556-130.844444-28.444445-170.666666s-130.844444-22.755556-170.666666 28.444444c-39.822222 56.888889-22.755556 130.844444 28.444444 170.666667s130.844444 22.755556 170.666667-28.444445z" fill="#3970fe" p-id="15336" data-spm-anchor-id="a313x.7781069.0.i44" class="selected"></path></svg></a><a class="hld__extra-icon" title="拉黑此用户(屏蔽所有言论)" data-type="ban"  data-user="${current_user}"><svg t="1578452808565" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="9668" data-spm-anchor-id="a313x.7781069.0.i27" width="32" height="32"><path d="M512 1024A512 512 0 1 1 512 0a512 512 0 0 1 0 1024z m0-146.285714A365.714286 365.714286 0 1 0 512 146.285714a365.714286 365.714286 0 0 0 0 731.428572z" fill="#a20106" p-id="9669" data-spm-anchor-id="a313x.7781069.0.i28" class="selected"></path><path d="M828.708571 329.142857l-633.417142 365.714286 633.417142-365.714286z m63.341715-36.571428a73.142857 73.142857 0 0 1-26.770286 99.913142l-633.417143 365.714286a73.142857 73.142857 0 0 1-73.142857-126.683428l633.417143-365.714286A73.142857 73.142857 0 0 1 892.050286 292.571429z" fill="#a20106" p-id="9670" data-spm-anchor-id="a313x.7781069.0.i31" class="selected"></path></svg></a>`)
                })
            }
            //标记拉黑备注
            markDom($(this))
            //添加标志位
            $(this).attr('hld-render', 'ok')
        })
    }

    //Excel
    const switchExcelMode = () => {
        $('body').toggleClass('hld__excel-body')
    }
    //setting.excelMode && switchExcelMode()

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


    const markDom = $el => {
        $el.find('.b').each(function () {
            $(this).find('span.hld__post-author, span.hld__remark').remove()
            let name = $(this).attr('hld-mark-before-name') || $(this).text().replace('[', '').replace(']', '')
            if (setting.markAndBan) {
                if (ban_list.includes(name)) {
                    if (setting.banMode == 'STRICT') {
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
                    console.warn(`【NGA优化摸鱼体验脚本-黑名单屏蔽】用户：${name}`)
                }
                for (let m of mark_list) {
                    const t = m.split(':')
                    if (t[0] == name) {
                        $(this).attr('hld-mark-before-name', name).append(`<span class="hld__remark"> (${t[1]}) </span>`)
                    }
                }
            }
            if (setting.authorMark) {
                if (name == $('#hld__post-author').val() && $(this).find('span.hld__post-author').length == 0)
                    $(this).append('<span class="hld__post-author">[楼主]</span>')
            }
        })
    }


    //设置面板
    let $panel_dom = $(`<div id="hld__setting_cover" class="animated zoomIn"><div id="hld__setting_panel">
    <a href="javascript:eval($(\'hld__setting_cover\').style.display=\'none\')" class="hld__setting-close">×</a>
    <p class="hld__sp-title"><a title="更新地址" href="https://greasyfork.org/zh-CN/scripts/393991-nga%E4%BC%98%E5%8C%96%E6%91%B8%E9%B1%BC%E4%BD%93%E9%AA%8C" target="_blank">NGA优化摸鱼插件<span class="hld__script-info">v${GM_info.script.version}</span></a></p>
    <div class="hld__field">
    <p class="hld__sp-section">显示优化</p>
    <p><label><input type="checkbox" id="hld__cb_hideAvatar"> 隐藏头像（快捷键切换显示[<b>${getCodeName(setting.shortcutKeys[0])}</b>]）</label></p>
    <p><label><input type="checkbox" id="hld__cb_hideSmile"> 隐藏表情（快捷键切换显示[<b>${getCodeName(setting.shortcutKeys[1])}</b>]）</label></p>
    <p><label><input type="checkbox" id="hld__cb_hideImage"> 隐藏贴内图片（快捷键切换显示[<b>${getCodeName(setting.shortcutKeys[2])}</b>]）</label></p>
    <p><label><input type="checkbox" id="hld__cb_imgResize"> 贴内图片缩放(缩放至宽200px)</label></p>
    <p><label><input type="checkbox" id="hld__cb_hideSign"> 隐藏签名</label></p>
    <p><label><input type="checkbox" id="hld__cb_hideHeader"> 隐藏版头/版规/子版入口</label></p>
    <p><label><input type="checkbox" id="hld__cb_excelMode" enable="hld__excelMode_fold"> Excel模式（快捷键切换显示[<b>${getCodeName(setting.shortcutKeys[5])}</b>]）</label></p>
    <div class="hld__sp-fold" id="hld__excelMode_fold" data-id="hld__cb_excelMode">
    <div style="padding: 5px;margin-right: 40px;margin-bottom: 15px;border: 2px dashed #591804;">
    <p><b>注意：此功能目前为实验模式</b></p>
    <p>此模式处于测试阶段，可能会有BUG，如遇到请及时反馈</p>
    <p>在实验模式中，开启功能后需要手动切换显示（当前快捷键[<b>${getCodeName(setting.shortcutKeys[5])}</b>]）</p>
    <p>更多说明请至脚本发布页面阅读README中的更新说明</p>
    </div>
    </div>
    <p><button id="hld__shortcut_manage">编辑快捷键</button></p>
    </div>
    <div class="hld__field">
    <p class="hld__sp-section">功能强化</p>
    <p><label><input type="checkbox" id="hld__cb_linkTargetBlank"> 论坛列表新窗口打开</label></p>
    <p><label><input type="checkbox" id="hld__cb_imgEnhance"> 贴内图片功能增强</label></p>
    <p><label><input type="checkbox" id="hld__cb_authorMark"> 高亮楼主</label></p>
    <p><label><input type="checkbox" id="hld__cb_keywordsBlock" enable="hld__keywordsBlock_fold"> 关键字屏蔽</label></p>
    <div class="hld__sp-fold" id="hld__keywordsBlock_fold" data-id="hld__cb_keywordsBlock">
    <p><button id="hld__keywords_manage">管理关键字</button></p>
    </div>
    <p><label><input type="checkbox" id="hld__cb_markAndBan" enable="hld__markAndBan_fold"> 拉黑/备注功能</label></p>
    <div class="hld__sp-fold" id="hld__markAndBan_fold" data-id="hld__rb_banMode">
    <p class="hld__f-title">拉黑模式</p>
    <p><label title="仅抽被拉黑者的楼，不抽回复的被拉黑者的楼"><input type="radio" name="hld__rb_banMode" value="SIMPLE" >仅屏蔽被拉黑者的回复</label></p>
    <p><label title="一刀切模式，只要楼内与被拉者有关，一律抽楼"><input type="radio" name="hld__rb_banMode" value="STRICT">包含回复被拉黑者的回复</label></p>
    <p><button id="hld__list_manage">名单管理</button></p>
    </div>
    </div>
    <div class="hld__buttons">
    <span>
    <button class="hld__btn" id="hld__export__data" title="导出配置字符串，包含设置，黑名单，标记名单等等">导出</button>
    <button class="hld__btn" id="hld__import__data" title="导入配置字符串">导入</button>
    <button class="hld__btn hld__reward" id="hld__reward" title="好活当赏"><span style="margin-right:3px">¥</span>赏</button>
    </span>
    <button class="hld__btn" id="hld__save__data">保存设置</button>
    </div>
    </div>
    </div>`)
    $('body').append($panel_dom)
    //本地恢复设置
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
    //导出设置
    $('body').on('click', '#hld__export__data', function () {
        let obj = {
            name: 'NGA-BBS',
            setting: setting,
            ban_list: ban_list,
            mark_list: mark_list,
            keywords_list: keywords_list
        }
        window.prompt('导出成功，请复制以下代码以备份', Base64.encode(JSON.stringify(obj)))
    })
    //导入
    $('body').on('click', '#hld__import__data', function () {
        let base_str = window.prompt('导入字符串\n注意，导入会覆盖你当前所有的设置以及名单列表！', '')
        base_str = $.trim(base_str)
        if (base_str) {
            let str = Base64.decode(base_str)
            if (str) {
                let obj
                try {
                    obj = JSON.parse(str)
                    setting = obj.setting
                    ban_list = obj.ban_list
                    mark_list = obj.mark_list
                    window.localStorage.setItem('hld__NGA_setting', JSON.stringify(setting))
                    window.localStorage.setItem('hld__NGA_ban_list', ban_list.join(','))
                    window.localStorage.setItem('hld__NGA_mark_list', mark_list.join(','))
                    window.localStorage.setItem('hld__NGA_keywords_list', keywords_list.join(','))
                    $panel_dom.hide()
                    alert('导入成功，刷新生效')

                } catch (err) {
                    alert('配置有误，导入失败')
                }
            }
        }
    })
    //保存
    $('body').on('click', '#hld__save__data', function () {
        for (let k in setting) {
            $('input#hld__cb_' + k).length > 0 && (setting[k] = $('input#hld__cb_' + k)[0].checked)
            $(`input[name="hld__rb_${k}"]`).length > 0 && (setting[k] = $(`input[name="hld__rb_${k}"]:checked`).val())
        }
        window.localStorage.setItem('hld__NGA_setting', JSON.stringify(setting))
        $panel_dom.hide()
        popMsg('保存成功，刷新页面生效')
    })
    //打赏
    $('body').on('click', '#hld__reward', function () {
        $('#hld__setting_cover').append(`<div class="hld__list-panel hld__reward-panel animated fadeInUp">
        <a href="javascript:void(0)" class="hld__setting-close">×</a>
        <div class="hld__reward-info">
        <p><b>本脚本完全开源，并且长期维护，您若有功能需求，欢迎反馈</b></p>
        <p>如果您觉得脚本好用<span class="hld__delete-line">帮助到更好的摸鱼</span>，您也可以选择支持我~<img src="https://pic.downk.cc/item/5eb8f768c2a9a83be5e0d7c4.png"></p>
        </div>
        <div>
        <div class="hld__list-c"><img src="https://pic.downk.cc/item/5eb8eb58c2a9a83be5c4a0cb.png">
        </div>
        <div class="hld__list-c"><img src="https://pic.downk.cc/item/5eb8edaec2a9a83be5c94268.png">
        </div>
        </div>
        </div>`)
    })
    //消息
    const popMsg = (msg) => {
        alert(msg)
    }
    function getQueryString(name) {
        var url = decodeURI(window.location.search.replace(/&amp;/g, "&"));
        var reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)");
        var r = url.substr(1).match(reg);
        if (r != null) return unescape(r[2]);
        return null;
    }
    function uniq(array) {
        return [...new Set(array)]
    }
    function removeBlank(array) {
        let r = [];
        array.map(function (val, index) {
            if (val !== '' && val != undefined) {
                r.push(val);
            }
        });
        return r;
    }
    const Base64 = {
        encode: (str) => {
            return window.btoa(unescape(encodeURIComponent(str)))
        },
        decode: (str) => {
            try {
                return decodeURIComponent(escape(window.atob(str)))
            } catch (err) {
                alert('字符串有误，导入失败')
            }
        }
    }

    //样式
    let style = document.createElement("style")
    style.type = "text/css"
    style.appendChild(document.createTextNode(`
.animated {
animation-duration: .3s;
animation-fill-mode: both;
}
.animated-1s {
animation-duration: 1s;
animation-fill-mode: both;
}
.zoomIn {
animation-name: zoomIn;
}
@keyframes zoomIn {
from {
opacity: 0;
-webkit-transform: scale3d(0.3, 0.3, 0.3);
transform: scale3d(0.3, 0.3, 0.3);
}
50% {
opacity: 1;
}
}
@keyframes bounce {
from,
20%,
53%,
80%,
to {
-webkit-animation-timing-function: cubic-bezier(0.215, 0.61, 0.355, 1);
animation-timing-function: cubic-bezier(0.215, 0.61, 0.355, 1);
-webkit-transform: translate3d(0, 0, 0);
transform: translate3d(0, 0, 0);
}
40%,
43% {
-webkit-animation-timing-function: cubic-bezier(0.755, 0.05, 0.855, 0.06);
animation-timing-function: cubic-bezier(0.755, 0.05, 0.855, 0.06);
-webkit-transform: translate3d(0, -30px, 0);
transform: translate3d(0, -30px, 0);
}
70% {
-webkit-animation-timing-function: cubic-bezier(0.755, 0.05, 0.855, 0.06);
animation-timing-function: cubic-bezier(0.755, 0.05, 0.855, 0.06);
-webkit-transform: translate3d(0, -15px, 0);
transform: translate3d(0, -15px, 0);
}
90% {
-webkit-transform: translate3d(0, -4px, 0);
transform: translate3d(0, -4px, 0);
}
}
.bounce {
-webkit-animation-name: bounce;
animation-name: bounce;
-webkit-transform-origin: center bottom;
transform-origin: center bottom;
}
@keyframes fadeInUp {
from {
opacity: 0;
-webkit-transform: translate3d(0, 100%, 0);
transform: translate3d(0, 100%, 0);
}
to {
opacity: 1;
-webkit-transform: translate3d(0, 0, 0);
transform: translate3d(0, 0, 0);
}
}
.fadeInUp {
-webkit-animation-name: fadeInUp;
animation-name: fadeInUp;
}
#hld__setting_cover {
display:none;
justify-content: center;
align-items:center;
position: fixed;
top: 0;
left: 0;
right: 0;
bottom: 0;
}
.postcontent img {
margin: 0 5px 5px 0 !important;
box-shadow: none !important;
}
#hld__img_full{
position: fixed;
top: 0;
left: 0;
right: 0;
bottom: 0;
background: rgba(0, 0, 0, 0.6);
z-index: 99999;
/*display: flex;*/
/*align-items: center;*/
/*justify-content: center;*/
}
.hld__img_container {
position: absolute;
display: flex;
justify-content: center;
align-items: center;
}
#hld__img_full img{
cursor: move;
transition: transform .2s ease;
}
#hld__img_full .hld__imgcenter{
top: 50%;
left: 50%;
transform: translate(-50%, -50%);
}
.hld__if_control {
position: absolute;
display:flex;
left:50%;
bottom: 15px;
width: 160px;
margin-left:-80px;
height: 40px;
background: rgba(0, 0, 0, 0.6);
z-index:9999999;
}
#hld__img_full .change {
width: 40px;
height: 40px;
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
.hld__list-panel {
position:fixed;
background:#fff8e7;
padding: 15px 20px;
border-radius: 10px;
box-shadow: 0 0 10px #666;
border: 1px solid #591804;
z-index: 9999;
}
#hld__banlist_panel {
width:370px;
}
#hld__banlist_panel {
width:370px;
}
#hld__keywords_panel {
width:182px;
}
.hld__list-panel > div{
display:flex;
justify-content: space-between;
}
.hld__list-panel .hld__list-c{
width: 45%;
}
#hld__keywords_panel .hld__list-c{
width: 100%;
}
.hld__list-panel .hld__list-c textarea{
box-sizing: border-box;
padding: 0;
margin: 0;
height:200px;
width:100%;
resize: none;
}
.hld__list-panel .hld__list-desc {
margin-top:5px;
font-size:9px;
color:#666;
}
.hld__list-panel .hld__list-c > p:first-child{
weight:bold;
font-size:14px;
margin-bottom:10px;
}
#hld__updated {
position:fixed;
top:  20px;
right: 20px;
width: 200px;
padding: 10px;
border-radius: 5px;
box-shadow: 0 0 15px #666;
border: 1px solid #591804;
background: #fff8e7;
}
#hld__updated .hld__readme {
text-decoration: underline;
color: #591804;
}
#hld__setting_panel {
position: relative;
background:#fff8e7;
width:526px;
padding: 15px 20px;
border-radius: 10px;
box-shadow: 0 0 10px #666;
border: 1px solid #591804;
}
#hld__setting_panel > div.hld__field{
float:left;
width:50%;
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
.hld__setting-close{
position: absolute;
top: 5px;
right: 5px;
padding: 3px 6px;
background: #fff0cd;
color: #591804;
transition: all .2s ease;
cursor:pointer;
border-radius: 4px;
text-decoration: none;
}
.hld__setting-close:hover{
background: #591804;
color: #fff0cd;
text-decoration: none;
}
#hld__setting_panel button {
transition: all .2s ease;
cursor:pointer;
}
button.hld__btn {
padding: 3px 8px;
border: 1px solid #591804;
background: #fff8e7;
color: #591804;
}
button.hld__btn:hover {
background: #591804;
color: #fff0cd;
}
.hld__btn-groups {
display:flex;
justify-content: center !important;
margin-top:10px;
}
.hld__post-author {
color:#F00;
font-weight:bold;
}
.hld__table{
margin-top:10px;
width:200px;
}
.hld__table tr td:last-child{
text-align:center;
}
.hld__table input[type=text] {
width:48px;
text-transform:uppercase;
text-align:center;
}
.hld__table td{
border: 1px solid #c0c0c0;
padding: 3px 6px;
}
.hld__extra-icon {
padding: 0 2px;
cursor:pointer;
background-repeat: no-repeat;
background-position: center;
}
.hld__extra-icon svg{
width:10px;
height:10px;
vertical-align: -0.15em;
fill: currentColor;
overflow: hidden;
}
.hld__extra-icon:hover{
text-decoration:none;
}
span.hld__remark{
color:#666;
font-size:0.8em;
}
span.hld__banned {
color:#ba2026;
}
.hld__sp-fold {
padding-left:23px;
}
.hld__sp-fold .hld__f-title {
font-weight:bold;
}
.hld__buttons {
clear:both;
display:flex;
justify-content: space-between;
padding-top: 15px;
}
#loader{
display:none;
position: absolute;
top: 50%;
left: 50%;
margin-top:-10px;
margin-left:-10px;
width: 20px;
height: 20px;
border: 6px dotted #FFF;
border-radius: 50%;
-webkit-animation: 1s loader linear infinite;
animation: 1s loader linear infinite;
}
@keyframes loader {
0% {
-webkit-transform: rotate(0deg);
transform: rotate(0deg);
}
100% {
-webkit-transform: rotate(360deg);
transform: rotate(360deg);
}
}
code {
padding: 2px 4px;
font-size: 90%;
font-weight:bold;
color: #c7254e;
background-color: #f9f2f4;
border-radius: 4px;
}
.hld__float-left {
float:left;
}
.hld__shortcut-desc {
width:120px;
margin-left:20px;
padding-top:6px
}
.hld__shortcut-desc p{
margin-bottom:5px;
}
.hld__script-info {
margin-left:4px;
font-size:70%;
color:#666;
}
.hld__reward {
    
}
.hld__reward-panel {
    width: 500px;
}

.hld__reward-panel .hld__reward-info{
    display: block;
    font-size: 15px;
    margin-bottom: 20px;
    line-height: 20px;
}
.hld__delete-line {
    text-decoration: line-through;
    color: #666;
}
.hld__reward-panel .hld__list-c {
    width: 50%;
}
.hld__reward-panel .hld__list-c:first-child {
    margin-right: 15px;
}
.hld__reward-panel .hld__list-c>img{
width: 100%;
height: auto;
}
/* Excel */
.hld__excel-body {
    background: #fff !important;
}
.hld__excel-body #mainmenu,
.hld__excel-body .catenew,
.hld__excel-body #toptopics,
.hld__excel-body #m_pbtntop,
.hld__excel-body #m_fopts,
.hld__excel-body #b_nav,
.hld__excel-body #fast_post_c,
.hld__excel-body #custombg,
.hld__excel-body #m_threads th,
.hld__excel-body #m_posts th,
.hld__excel-body .r_container,
.hld__excel-body #footer,
.hld__excel-body .clickextend {
    display: none !important;
}
.hld__excel-body #mmc {
    margin-top: 195px;
}
.hld__excel-div {
    display: none;
}
.hld__excel-body .hld__excel-div,
.hld__excel-body .hld__excel-setting {
    display: block;
}
.hld__excel-body .hld__excel-setting {
    position: fixed;
    width: 60px;
    height: 20px;
    top: 5px;
    left: 1745px;
    background: #f2f4f7;
    z-index: 999;
}
.hld__excel-body .hld__excel-setting img {
    width: 20px;
    height: auto;
    vertical-align:middle;
}
.hld__excel-body .hld__excel-setting a{
    margin-left: 5px;
    vertical-align:middle;
}
.hld__excel-body .hld__excel-header {
    position: fixed;
    top: 0;
    left: 0;
    height: 196px;
    border-bottom: 1px solid #bbbbbb;
}
.hld__excel-body .hld__excel-footer {
    position: fixed;
    bottom: 0;
    left: 0;
    height: 50px;
}
.hld__excel-body #m_nav {
    position: fixed;
    top: 136px;
    left: 261px;
    margin: 0;
    padding: 0;
    z-index: 99;
}
.hld__excel-body #m_nav .nav_spr {
    display: block;
    border: 0;
    border-radius: 0;
    padding: 0;
    box-shadow: none;
    background: none;
}

.hld__excel-body #m_nav .nav_spr span{
    color: #000;
    font-size: 16px;
    vertical-align: unset;
    font-weight: normal;
}

.hld__excel-body #m_nav .nav_root,
.hld__excel-body #m_nav .nav_link{
    background: none;
    border: none;
    box-shadow: none;
    padding: 0;
    color: #000;
    border-radius: 0;
    font-weight: normal;
}
.hld__excel-body #m_threads {
    margin: 0;
}
.hld__excel-body #topicrows {
    border: none;
    box-shadow: none;
    border-radius: 0;
    margin: 0;
    background-color: #fff;
    counter-reset:num;
    border-spacing: 0;
}
.hld__excel-body #topicrows tbody{
    border-spacing: 0;
}
.hld__excel-body .topicrow {
    border-spacing: 0;
}
.hld__excel-body #topicrows td{
    background: #fff;
    padding: 5px 0;
    margin: 0;
    border-right: 1px solid #bbbbbb;
    border-bottom: 1px solid #bbbbbb;
    margin-right: -1px;
}
.hld__excel-body .topicrow .c1 {
    width: 33px;
    background: #e8e8e8 !important;
}
.hld__excel-body .topicrow .c1 a{
    display: none;
}
.hld__excel-body .topicrow .c1:before {
    content: counter(num);
    counter-increment: num;
    color: #777777;
    font-size: 16px;
}
.hld__excel-body .topicrow .c2 {
    padding-left: 5px !important;
}
.hld__excel-body .topicrow .c3{
    color: #1a3959 !important;
}
.hld__excel-body .block_txt {
    background: #fff !important;
    color: #1a3959 !important;
    border-radius: 0;
    padding: 0 !important;
    min-width: 0 !important;
    font-weight: normal;
}
.hld__excel-body #m_posts .block_txt {
    font-weight: bold;
}
.hld__excel-body .topicrow .postdate,
.hld__excel-body .topicrow .replydate {
    display: inline;
    margin: 10px;
}
.hld__excel-body #m_pbtnbtm{
    margin: 0;
    border-bottom: 1px solid #bbbbbb;
}
.hld__excel-body #pagebbtm,
.hld__excel-body #m_pbtnbtm .right_ {
    margin: 0;
}
.hld__excel-body #pagebbtm:before {
    display: block;
    line-height: 35px;
    width: 33px;
    float: left;
    content: "#";
    border-right: 1px solid #bbbbbb;
    color: #777;
    font-size: 16px;
    background: #e8e8e8;
}
.hld__excel-body #m_pbtnbtm td{
    line-height: 35px;
    padding: 0 5px;
}
.hld__excel-body #m_pbtnbtm .stdbtn {
    box-shadow: none;
    border: none;
    padding: 0;
    padding-left: 5px;
    background: #fff;
    border-radius: 0;
}
.hld__excel-body #m_pbtnbtm .stdbtn .invert {
    color: #591804;
}
.hld__excel-body #m_pbtnbtm td a {
    background: #fff;
    padding: 0;
    border: 0;
}
.hld__excel-body #m_posts .comment_c .comment_c_1 {
    border-top-color: #bbbbbb;
}
.hld__excel-body #m_posts .comment_c .comment_c_2 {
    border-color: #bbbbbb;
}
.hld__excel-body #m_posts {
    border: 0;
    box-shadow: none;
    padding-bottom: 0;
    margin: 0;
    counter-reset:num;
}
.hld__excel-body #m_posts td {
    background: #fff;
    border-right: 1px solid #bbbbbb;
    border-bottom: 1px solid #bbbbbb;
}
.hld__excel-body #m_posts .c0 {
    width: 32px;
    color: #777;
    font-size: 16px;
    background: #e8e8e8;
    text-align: center;
}
.hld__excel-body #m_posts .c0:before {
    content:counter(num);
    counter-increment: num;
}
.hld__excel-body #m_posts .vertmod {
    background: #fff !important;
    color: #ccc;
}
.hld__excel-body #m_posts a[name="uid"]:before {
    content: "UID:"
}
.hld__excel-body #m_posts .white,
.hld__excel-body #m_posts .block_txt_c2,
.hld__excel-body #m_posts .block_txt_c0 {
    background: #fff;
    color: #777777;
}
.hld__excel-body #m_posts .quote {
    background: #fff;
    border-color: #bbbbbb;
}
.hld__excel-body #m_posts button {
    background: #eee;
}
`))
    document.getElementsByTagName("head")[0].appendChild(style)

})();