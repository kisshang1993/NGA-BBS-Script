// ==UserScript==
// @name         NGA优化摸鱼体验
// @namespace    https://github.com/kisshang1993/NGA-BBS-Script
// @version      4.2.2
// @author       HLD
// @description  NGA论坛显示优化，全面功能增强，优雅的摸鱼
// @license      MIT
// @require      https://cdn.staticfile.org/jquery/3.4.0/jquery.min.js
// @require      https://cdn.staticfile.org/spectrum/1.8.0/spectrum.js
// @require      https://cdn.staticfile.org/localforage/1.10.0/localforage.min.js
// @require      https://cdn.staticfile.org/echarts/5.4.2/echarts.min.js
// @require      https://greasyfork.org/scripts/424901-nga-script-resource/code/NGA-Script-Resource.js?version=1216641
// @icon         https://i.loli.net/2021/04/07/8x3yFj2pWEKluSY.png
// @match        *://bbs.nga.cn/*
// @match        *://ngabbs.com/*
// @match        *://nga.178.com/*
// @grant        GM_registerMenuCommand
// @grant        unsafeWindow
// @inject-into content
// ==/UserScript==

(function () {
    'use strict';

    /**
     * NGA摸鱼主脚本
     * @class NGABBSScript
     * @constructor
     */
    class NGABBSScript {
        constructor () {
            // 配置
            this.setting = {
                normal: {},
                advanced: {}
            }
            // 模块
            this.modules = []
            // 样式
            this.style = ''
        }
        /**
         * 获取模块对象
         * @method getModule
         * @param {String} name 模块name
         * @return {Object} 模块对象
         */
        getModule (name) {
            for (const m of this.modules) {
                if (m.name && m.name === name) {
                    return m
                }
            }
            return null
        }
        /**
         * 全程渲染函数
         * @method renderAlways
         */
        renderAlways() {
            for (const module of this.modules) {
                try {
                    module.renderAlwaysFunc && module.renderAlwaysFunc(this)
                } catch (error) {
                    this.printLog(`[${module.name}]模块在[renderAlwaysFunc()]中运行失败！`)
                    console.log(error)
                }
            }
        }
        /**
         * 列表页渲染函数
         * @method renderThreads
         */
        renderThreads () {
            $('.topicrow[hld-threads-render!=ok]').each((index, dom) => {
                const $el = $(dom)
                for (const module of this.modules) {
                    try {
                        module.renderThreadsFunc && module.renderThreadsFunc($el, this)
                    } catch (error) {
                        this.printLog(`[${module.name}]模块在[renderThreadsFunc()]中运行失败！`)
                        console.log(error)
                    }
                }
                $el.attr('hld-threads-render', 'ok')
            })
        }
        /**
         * 详情页渲染函数
         * @method renderForms
         */
        renderForms () {
            $('.forumbox.postbox[hld-forms-render!=ok]').each((index, dom) => {
                const $el = $(dom)
                // 等待NGA页面渲染完成
                if ($el.find('.small_colored_text_btn').length == 0) return true
                for (const module of this.modules) {
                    try {
                        module.renderFormsFunc && module.renderFormsFunc($el, this)
                    } catch (error) {
                        this.printLog(`[${module.name}]模块在[renderFormsFunc()]中运行失败！`)
                        console.log(error)
                    }
                }
                $el.attr('hld-forms-render', 'ok')
            })
        }
        /**
         * 添加模块
         * @method addModule
         * @param {Object} module 模块对象
         * @param {Boolean} plugin 是否为插件
         */
        addModule (module, plugin=false) {
            // 组件预处理函数
            if (module.beforeFunc) {
                try {
                    module.beforeFunc(this)
                } catch (error) {
                    this.printLog(`[${module.name}]模块在[beforeFunc()]中运行失败！`)
                    console.log(error)
                }
            }
            // 添加模块
            const addModule = setting => {
                if (setting.shortCutCode && this.setting.normal.shortcutKeys) this.setting.normal.shortcutKeys.push(setting.shortCutCode)
                if (setting.key) {
                    this.setting[setting.type || 'normal'][setting.key] = setting.default
                }
            }
            // 功能板块
            if (module.setting && !Array.isArray(module.setting)) {
                addModule(module.setting)
            }
            if (module.settings && Array.isArray(module.settings)) {
                for (const setting of module.settings) {
                    addModule(setting)
                }
            }
            // 添加样式
            if (module.style) {
                this.style += module.style
            }
            plugin && (module.type = 'plugin')
            this.modules.push(module)
        }
        /**
         * 判断当前页面是否为列表页
         * @method isThreads
         * @return {Boolean} 判断状态
         */
        isThreads () {
            return $('#m_threads').length > 0
        }
        /**
         * 判断当前页面是否为详情页
         * @method isForms
         * @return {Boolean} 判断状态
         */
        isForms () {
            return $('#m_posts').length > 0
        }
        /**
         * 抛出异常
         * @method throwError
         * @param {String} msg 异常信息
         */
        throwError (msg) {
            alert(msg)
            throw(msg)
        }
        /**
         * 初始化
         * @method init
         */
        init () {
            // 开始初始化
            this.printLog('初始化...')
            localforage.config({name: 'NGA BBS Script DB'})
            const startInitTime = new Date().getTime()
            const modulesTable = []
            //同步配置
            this.loadSetting()
            // 组件初始化函数
            for (const module of this.modules) {
                if (module.initFunc) {
                    try {
                        module.initFunc(this)
                    } catch (error) {
                        this.printLog(`[${module.name}]模块在[initFunc()]中运行失败！`)
                        console.log(error)
                    }
                }
            }
            // 组件后处理函数
            for (const module of this.modules) {
                if (module.afterFunc) {
                    try {
                        module.afterFunc(this)
                    } catch (error) {
                        this.printLog(`[${module.name}]模块在[afterFunc()]中运行失败！`)
                        console.log(error)
                    }
                }
            }
            // 异步样式
            for (const module of this.modules) {
                if (module.asyncStyle) {
                    try {
                        this.style += module.asyncStyle(this)
                    } catch (error) {
                        this.printLog(`[${module.name}]模块在[asyncStyle()]中运行失败！`)
                        console.log(error)
                    }
                }
                modulesTable.push({
                    name: module.title || module.name || 'UNKNOW',
                    type: module.type == 'plugin' ? '插件' : '内置模块',
                    version: module.version || '-'
                })
            }
            // 插入样式
            const style = document.createElement("style")
            style.appendChild(document.createTextNode(this.style))
            document.getElementsByTagName('head')[0].appendChild(style)
            // 初始化完成
            const endInitTime = new Date().getTime()
            console.table(modulesTable)
            this.printLog(`[v${this.getInfo().version}] 初始化完成：共加载${this.modules.length}个模块，总耗时${endInitTime-startInitTime}ms`)
        }
        /**
         * 通知弹框
         * @method popNotification
         * @param {String} msg 消息内容
         * @param {Number} duration 显示时长(ms)
         */
        popNotification (msg, duration=1000) {
            $('#hld__noti_container').length == 0 && $('body').append('<div id="hld__noti_container"></div>')
            let $msgBox = $(`<div class="hld__noti-msg">${msg}</div>`)
            $('#hld__noti_container').append($msgBox)
            $msgBox.slideDown(100)
            setTimeout(() => { $msgBox.fadeOut(500) }, duration)
            setTimeout(() => { $msgBox.remove() }, duration + 500)
        }
        /**
         * 消息弹框
         * @method popMsg
         * @param {String} msg 消息内容
         * @param {String} type 消息类型 [ok, err, warn]
         */
        popMsg(msg, type='ok') {
            $('.hld__msg').length > 0 && $('.hld__msg').remove()
            let $msg = $(`<div class="hld__msg hld__msg-${type}">${msg}</div>`)
            $('body').append($msg)
            $msg.slideDown(200)
            setTimeout(() => { $msg.fadeOut(500) }, type == 'ok' ? 2000 : 5000)
            setTimeout(() => { $msg.remove() }, type == 'ok' ? 2500 : 5500)
        }
        /**
         * 打印控制台消息
         * @method printLog
         * @param {String} msg 消息内容
         */
        printLog (msg) {
            console.log(`%cNGA%cScript%c ${msg}`,
                'background: #222;color: #fff;font-weight:bold;padding:2px 2px 2px 4px;border-radius:4px 0 0 4px;',
                'background: #fe9a00;color: #000;font-weight:bold;padding:2px 4px 2px 2px;border-radius:0px 4px 4px 0px;',
                'background:none;color:#000;'
            )
        }
        /**
         * 保存配置到本地
         * @method saveSetting
         * @param {String} msg 自定义消息信息
         */
        saveSetting (msg='保存配置成功，刷新页面生效') {
            for (let k in this.setting.normal) {
                $('input#hld__cb_' + k).length > 0 && (this.setting.normal[k] = $('input#hld__cb_' + k)[0].checked)
            }
            window.localStorage.setItem('hld__NGA_setting', JSON.stringify(this.setting.normal))
            for (let k in this.setting.advanced) {
                if ($('#hld__adv_' + k).length > 0) {
                    const valueType = typeof this.setting.advanced[k]
                    const inputType = $('#hld__adv_' + k)[0].nodeName
                    if (inputType == 'SELECT') {
                        this.setting.advanced[k] = $('#hld__adv_' + k).val()
                    } else {
                        if (valueType == 'boolean') {
                            this.setting.advanced[k] = $('#hld__adv_' + k)[0].checked
                        }
                        if (valueType == 'number') {
                            this.setting.advanced[k] = +$('#hld__adv_' + k).val()
                        }
                        if (valueType == 'string') {
                            this.setting.advanced[k] = $('#hld__adv_' + k).val()
                        }
                    }
                }
            }
            window.localStorage.setItem('hld__NGA_advanced_setting', JSON.stringify(this.setting.advanced))
            msg && this.popMsg(msg)
        }
        /**
         * 从本地读取配置
         * @method loadSetting
         */
        loadSetting () {
            // 基础设置
            try {
                if (window.localStorage.getItem('hld__NGA_setting')) {
                    let localSetting = JSON.parse(window.localStorage.getItem('hld__NGA_setting'))
                    for (let k in this.setting.normal) {
                        !localSetting.hasOwnProperty(k) && (localSetting[k] = this.setting.normal[k])
                        if (k == 'shortcutKeys') {
                            if (localSetting[k].length < this.setting.normal[k].length) {
                                const offset_count = this.setting.normal[k].length - localSetting[k].length
                                localSetting[k] = localSetting[k].concat(this.setting.normal[k].slice(-offset_count))
                            }
                            // 更改默认按键
                            let index = 0
                            for (const module of this.modules) {
                                if (module.setting && module.setting.shortCutCode) {
                                    if (localSetting[k][index] != module.setting.shortCutCode) {
                                        module.setting.rewriteShortCutCode = localSetting[k][index]
                                    }
                                    index += 1
                                }else if (module.settings) {
                                    for (const setting of module.settings) {
                                        if (setting.shortCutCode) {
                                            if (localSetting[k][index] != setting.shortCutCode) {
                                                setting.rewriteShortCutCode = localSetting[k][index]
                                            }
                                            index += 1
                                        }
                                    }
                                }
                            }
                        }
                    }
                    for (let k in localSetting) {
                        !this.setting.normal.hasOwnProperty(k) && delete localSetting[k]
                    }
                    this.setting.normal = localSetting
                }
                // 高级设置
                if (window.localStorage.getItem('hld__NGA_advanced_setting')) {
                    let localAdvancedSetting = JSON.parse(window.localStorage.getItem('hld__NGA_advanced_setting'))
                    for (let k in this.setting.advanced) {
                        !localAdvancedSetting.hasOwnProperty(k) && (localAdvancedSetting[k] = this.setting.advanced[k])
                    }
                    for (let k in localAdvancedSetting) {
                        !this.setting.advanced.hasOwnProperty(k) && delete localAdvancedSetting[k]
                    }
                    this.setting.advanced = localAdvancedSetting
                }
            } catch {
                this.throwError('【NGA-Script】配置文件出现错误，无法加载配置文件！\n遇到此问题请清空浏览器缓存并重新刷新页面\n如还有问题，请前往脚本发布页提出反馈')
            }

        }
        /**
         * 检查是否更新
         * @method checkUpdate
         */
        checkUpdate() {
            // 字符串版本转数字
            const vstr2num = str => {
                let num = 0
                str.split('.').forEach((n, i) => num += i < 2 ? +n * 1000 / Math.pow(10, i) : +n)
                return num
            }
            // 字符串中版本截取
            const vstr2mid = str => {
                return str.substring(0, str.lastIndexOf('.'))
            }
            //检查更新
            if (window.localStorage.getItem('hld__NGA_version')) {
                const local_version = vstr2num(window.localStorage.getItem('hld__NGA_version'))
                const current_version = vstr2num(GM_info.script.version)
                if (current_version > local_version) {
                    const lv_mid = +vstr2mid(window.localStorage.getItem('hld__NGA_version'))
                    const cv_mid = +vstr2mid(GM_info.script.version)
                    window.localStorage.setItem('hld__NGA_version', GM_info.script.version)
                    if (cv_mid > lv_mid) {
                        const focus = ''
                        $('body').append(`<div id="hld__updated" class="animated-1s bounce"><p><a href="javascript:void(0)" class="hld__setting-close">×</a><b>NGA-Script已更新至v${GM_info.script.version}</b></p>${focus}<p><a class="hld__readme" href="https://greasyfork.org/zh-CN/scripts/393991-nga%E4%BC%98%E5%8C%96%E6%91%B8%E9%B1%BC%E4%BD%93%E9%AA%8C" target="_blank">查看更新内容</a></p></div>`)
                        $('body').on('click', '#hld__updated a', function () {
                            $(this).parents('#hld__updated').remove()
                        })
                    }
                }
            } else window.localStorage.setItem('hld__NGA_version', GM_info.script.version)
        }
        /**
         * 运行脚本
         * @method run
         */
        run() {
            this.checkUpdate()
            this.init()
            setInterval(() => {
                this.renderAlways()
                this.isThreads() && this.renderThreads()
                this.isForms() && this.renderForms()
            }, 100)
        }
        /**
         * 获取脚本信息
         * @method getInfo
         * @return {Object} 脚本信息对象
         */
        getInfo() {
            return {
                version: GM_info.script.version,
                author: 'HLD',
                github: 'https://github.com/kisshang1993/NGA-BBS-Script',
                update: 'https://greasyfork.org/zh-CN/scripts/393991-nga%E4%BC%98%E5%8C%96%E6%91%B8%E9%B1%BC%E4%BD%93%E9%AA%8C'
            }
        }
    }
    /* 注册菜单按钮 */
    try {
        // 设置面板
        GM_registerMenuCommand('设置面板', function () {
            $('#hld__setting_cover').css('display', 'block')
        })
        // 清理缓存
        GM_registerMenuCommand('清理缓存', function () {
            if (window.confirm('此操作为清理Local Storage与IndexedDB部分缓存内容，不会清理配置\n\n继续请点击【确定】')) {
                localStorage.removeItem('hld__NGA_post_author')
                localforage.clear()
                alert('操作成功，请刷新页面重试')
            }
        })
        // 修复脚本
        GM_registerMenuCommand('修复脚本', function () {
            if (window.confirm('如脚本运行失败或无效，尝试修复脚本，这会清除脚本的本地缓存信息\n* 本地缓存信息包含配置，各种名单等\n* 此操作不可逆转，如果需要备份，请手动备份localStorage内的hld__*的字段\n\n继续请点击【确定】')) {
                for (let i=0;i<localStorage.length;i++) {
                    let key = localStorage.key(i)
                    key.startsWith('hld__NGA_') && localStorage.removeItem(key)
                }
                alert('操作成功，请刷新页面重试')
            }
        })
        // 反馈问题
        GM_registerMenuCommand('反馈问题', function () {
            if (window.confirm('如脚本运行失败而且修复后也无法运行，请反馈问题报告\n* 问题报告请包含使用的：[浏览器]，[脚本管理器]，[脚本版本]\n* 描述问题最好以图文并茂的形式\n* 如脚本运行失败，建议提供F12控制台的红色错误输出以辅助排查\n\n默认打开的为Greasy Fork的反馈页面，有能力最好去Github Issue反馈问题，可以获得优先处理\n\n即将打开反馈页面，继续请点击【确定】')) {
                window.open('https://greasyfork.org/zh-CN/scripts/393991-nga%E4%BC%98%E5%8C%96%E6%91%B8%E9%B1%BC%E4%BD%93%E9%AA%8C/feedback')
            }
        })
    } catch (e) {
        // 不支持此命令
        console.warn(`【NGA Script】警告：此脚本管理器不支持菜单按钮，可能会导致新特性无法正常使用，建议更改脚本管理器为
        Tampermonkey[https://www.tampermonkey.net/] 或 Violentmonkey[https://violentmonkey.github.io/]`)
    }

    /* 标准模块 */
    /**
     * 默认样式
     * @name defaultStyle
     * @description 脚本的初始样式
     */
    const defaultStyle = {
        name: 'defaultStyle',
        style: `
        .animated {animation-duration:.3s;animation-fill-mode:both;}
        .animated-1s {animation-duration:1s;animation-fill-mode:both;}
        .zoomIn {animation-name:zoomIn;}
        .bounce {-webkit-animation-name:bounce;animation-name:bounce;-webkit-transform-origin:center bottom;transform-origin:center bottom;}
        .fadeInUp {-webkit-animation-name:fadeInUp;animation-name:fadeInUp;}
        #loader {display:none;position:absolute;top:50%;left:50%;margin-top:-10px;margin-left:-10px;width:20px;height:20px;border:6px dotted #FFF;border-radius:50%;-webkit-animation:1s loader linear infinite;animation:1s loader linear infinite;}
        @keyframes loader {0% {-webkit-transform:rotate(0deg);transform:rotate(0deg);}100% {-webkit-transform:rotate(360deg);transform:rotate(360deg);}}
        @keyframes zoomIn {from {opacity:0;-webkit-transform:scale3d(0.3,0.3,0.3);transform:scale3d(0.3,0.3,0.3);}50% {opacity:1;}}
        @keyframes bounce {from,20%,53%,80%,to {-webkit-animation-timing-function:cubic-bezier(0.215,0.61,0.355,1);animation-timing-function:cubic-bezier(0.215,0.61,0.355,1);-webkit-transform:translate3d(0,0,0);transform:translate3d(0,0,0);}40%,43% {-webkit-animation-timing-function:cubic-bezier(0.755,0.05,0.855,0.06);animation-timing-function:cubic-bezier(0.755,0.05,0.855,0.06);-webkit-transform:translate3d(0,-30px,0);transform:translate3d(0,-30px,0);}70% {-webkit-animation-timing-function:cubic-bezier(0.755,0.05,0.855,0.06);animation-timing-function:cubic-bezier(0.755,0.05,0.855,0.06);-webkit-transform:translate3d(0,-15px,0);transform:translate3d(0,-15px,0);}90% {-webkit-transform:translate3d(0,-4px,0);transform:translate3d(0,-4px,0);}}
        @keyframes fadeInUp {from {opacity:0;-webkit-transform:translate3d(-50%,100%,0);transform:translate3d(-50%,100%,0);}to {opacity:1;-webkit-transform:translate3d(-50%,0,0);transform:translate3d(-50%,0,0);}}
        .hld__msg{display:none;position:fixed;top:10px;left:50%;transform:translateX(-50%);color:#fff;text-align:center;z-index:99996;padding:10px 30px 10px 45px;font-size:16px;border-radius:10px;background-image:url("${SVG_ICON_MSG}");background-size:25px;background-repeat:no-repeat;background-position:15px}
        .hld__msg a{color:#fff;text-decoration: underline;}
        .hld__msg-ok{background:#4bcc4b}
        .hld__msg-err{background:#c33}
        .hld__msg-warn{background:#FF9900}
        .hld__flex{display:flex;}
        .hld__float-left{float: left;}
        .clearfix {clear: both;}
        #hld__noti_container {position:fixed;top:10px;left:10px;z-index:99;}
        .hld__noti-msg {display:none;padding:10px 20px;font-size:14px;font-weight:bold;color:#fff;margin-bottom:10px;background:rgba(0,0,0,0.6);border-radius:10px;cursor:pointer;}
        .hld__btn-groups {display:flex;justify-content:center !important;margin-top:10px;}
        button.hld__btn {padding:3px 8px;border:1px solid #591804;background:#fff8e7;color:#591804;}
        button.hld__btn:hover {background:#591804;color:#fff0cd;}
        #hld__updated {position:fixed;top:20px;right:20px;width:230px;padding:10px;border-radius:5px;box-shadow:0 0 15px #666;border:1px solid #591804;background:#fff8e7;z-index: 9999;}
        #hld__updated .hld__readme {text-decoration:underline;color:#591804;}
        .hld__script-info {margin-left:4px;font-size:70%;color:#666;}
        `
    }
    /**
     * 设置模块
     * @name settingPanel
     * @description 提供脚本的设置面板，提供配置修改，保存等基础功能
     */
    const settingPanel = {
        name: 'settingPanel',
        initFunc: function () {
            const _this = this
            //设置面板
            let $panelDom = $(`
            <div id="hld__setting_cover" class="animated zoomIn">
                <div id="hld__setting_panel">
                    <a href="javascript:void(0)" id="hld__setting_close" class="hld__setting-close">×</a>
                    <p class="hld__sp-title"><a title="更新地址" href="https://greasyfork.org/zh-CN/scripts/393991-nga%E4%BC%98%E5%8C%96%E6%91%B8%E9%B1%BC%E4%BD%93%E9%AA%8C" target="_blank">NGA优化摸鱼插件<span class="hld__script-info">v${script.getInfo().version}</span></a></p>
                    <div class="hld__field">
                        <p class="hld__sp-section">显示优化</p>
                        <div id="hld__normal_left"></div>
                    </div>
                    <div class="hld__field">
                        <p class="hld__sp-section">功能增强</p>
                        <div id="hld__normal_right"></div>
                    </div>
                    <div style="clear:both"></div>
                    <div class="hld__advanced-setting">
                        <button id="hld__advanced_button">+</button><span>高级设置</span>
                        <div class="hld__advanced-setting-panel">
                            <p><svg t="1590560820184" class="icon" viewBox="0 0 1040 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="2738" width="200" height="200"><path d="M896.355855 975.884143 127.652332 975.884143c-51.575656 0-92.993974-19.771299-113.653503-54.238298-20.708648-34.515095-18.194384-79.5815 6.9022-123.5632L408.803663 117.885897c25.244964-44.376697 62.767556-69.77004 102.953813-69.77004 40.136116 0 77.658707 25.393343 103.002932 69.671803L1003.006873 798.131763c25.097608 44.030819 27.711132 89.049129 6.952342 123.514081C989.348806 956.159916 947.881368 975.884143 896.355855 975.884143L896.355855 975.884143 896.355855 975.884143 896.355855 975.884143 896.355855 975.884143zM511.805572 119.511931c-12.769838 0-27.414373 12.376888-39.298028 33.134655L84.656075 832.892451c-12.130272 21.350261-14.989389 40.530089-7.741311 52.611242 7.297197 12.08013 25.787316 19.033495 50.737568 19.033495l768.703523 0c24.997324 0 43.439348-6.903224 50.736545-19.033495 7.197936-12.031011 4.387937-31.210839-7.791453-52.5611L551.055504 152.646586C539.220968 131.888819 524.527314 119.511931 511.805572 119.511931L511.805572 119.511931 511.805572 119.511931 511.805572 119.511931 511.805572 119.511931zM512.004093 653.807726c-20.1182 0-36.488029-15.975856-36.488029-35.69906L475.516064 296.773124c0-19.723204 16.369829-35.698037 36.488029-35.698037 20.117177 0 36.485983 15.975856 36.485983 35.698037l0 321.335543C548.490076 637.832893 532.12127 653.807726 512.004093 653.807726L512.004093 653.807726 512.004093 653.807726 512.004093 653.807726zM511.757476 828.308039c31.359218 0 56.851822-24.950252 56.851822-55.717999s-25.491581-55.716976-56.851822-55.716976c-31.408337 0-56.851822 24.949228-56.851822 55.716976S480.349139 828.308039 511.757476 828.308039L511.757476 828.308039 511.757476 828.308039 511.757476 828.308039z" p-id="2739"></path></svg> 鼠标停留在<span class="hld__adv-help" title="详细描述">选项文字</span>上可以显示详细描述，设置有误可能会导致插件异常或者无效！</p>
                            <table id="hld__advanced_left"></table>
                            <table id="hld__advanced_right"></table>
                        </div>
                    </div>
                    <div class="hld__buttons">
                        <span id="hld_setting_panel_buttons"></span>
                        <span>
                            <button class="hld__btn" id="hld__save__data">保存设置</button>
                        </span>
                    </div>
                </div>
            </div>
            `)
            const insertDom = setting => {
                if (setting.type === 'normal') {
                    $panelDom.find(`#hld__normal_${setting.menu || 'left'}`).append(`
                    <p><label ${setting.desc ? 'class="hld__adv-help" help="'+setting.desc+'"' : ''}><input type="checkbox" id="hld__cb_${setting.key}"> ${setting.title || setting.key}${setting.shortCutCode ? '（快捷键切换[<b>'+script.getModule('shortCutKeys').getCodeName(setting.rewriteShortCutCode || setting.shortCutCode)+'</b>]）' : ''}</label></p>
                    `)
                    if (setting.extra) {
                        $panelDom.find(`#hld__cb_${setting.key}`).attr('enable', `hld__${setting.key}_${setting.extra.mode || 'fold'}`)
                        $panelDom.find(`#hld__normal_${setting.menu || 'left'}`).append(`
                        <div class="hld__sp-${setting.extra.mode || 'fold'}" id="hld__${setting.key}_${setting.extra.mode || 'fold'}" data-id="hld__${setting.key}">
                            <p><button id="${setting.extra.id}">${setting.extra.label}</button></p>
                        </div>
                        `)
                    }
                }
                if (setting.type === 'advanced') {
                    let formItem = ''
                    const valueType = typeof setting.default
                    if (valueType === 'boolean') {
                        formItem = `<input type="checkbox" id="hld__adv_${setting.key}">`
                    }
                    if (valueType === 'number') {
                        formItem = `<input type="number" id="hld__adv_${setting.key}">`
                    }
                    if (valueType === 'string') {
                        if (setting.options) {
                            let t = ''
                            for (const option of setting.options) {
                                t += `<option value="${option.value}">${option.label}</option>`
                            }
                            formItem = `<select id="hld__adv_${setting.key}">${t}</select>`
                        } else {
                            formItem = `<input type="text" id="hld__adv_${setting.key}">`
                        }
                    }
                    $panelDom.find(`#hld__advanced_${setting.menu || 'left'}`).append(`
                    <tr>
                        <td><span class="hld__adv-help" help="${setting.desc || ''}">${setting.title || setting.key}</span></td>
                        <td>${formItem}</td>
                    </tr>`)
                }
            }
            for (const module of script.modules) {
                if (module.setting && module.setting.key) {
                    insertDom(module.setting)
                }
                if (module.settings) {
                    for (const setting of module.settings) {
                        setting.key && insertDom(setting)
                    }
                }
            }
            /**
             * Bind:Mouseover Mouseout
             * 提示信息Tips
             */
            $panelDom.find('.hld__adv-help').mouseover(function(e){
                const $help = $(`<div class="hld__help-tips">${$(this).attr('help').replace(/\n/g, '<br>')}</div>`)
                $help.css({
                    top: ($(this).offset().top + $(this).height() + 5) + 'px',
                    left: $(this).offset().left + 'px'
                })
                $('body').append($help)
            }).mouseout(()=>$('.hld__help-tips').remove())
            $('body').append($panelDom)
            //本地恢复设置
            //基础设置
            for (let k in script.setting.normal) {
                if ($('#hld__cb_' + k).length > 0) {
                    $('#hld__cb_' + k)[0].checked = script.setting.normal[k]
                    const enableDomID = $('#hld__cb_' + k).attr('enable')
                    if (enableDomID) {
                        script.setting.normal[k] ? $('#' + enableDomID).show() : $('#' + enableDomID).hide()
                        $('#' + enableDomID).find('input').each(function () {
                            $(this).val() == script.setting.normal[$(this).attr('name').substr(8)] && ($(this)[0].checked = true)
                        })
                        $('#hld__cb_' + k).on('click', function () {
                            $(this)[0].checked ? $('#' + enableDomID).slideDown() : $('#' + enableDomID).slideUp()
                        })
                    }
                }
            }
            //高级设置
            for (let k in script.setting.advanced) {
                if ($('#hld__adv_' + k).length > 0) {
                    const valueType = typeof script.setting.advanced[k]
                    if (valueType == 'boolean') {
                        $('#hld__adv_' + k)[0].checked = script.setting.advanced[k]
                    }
                    if (valueType == 'number' || valueType == 'string') {
                        $('#hld__adv_' + k).val(script.setting.advanced[k])
                    }
                }
            }
            /**
             * Bind:Click
             * 设置面板-展开切换高级设置
             */
            $('body').on('click', '#hld__advanced_button', function () {
                if ($('.hld__advanced-setting-panel').is(':hidden')) {
                    $('.hld__advanced-setting-panel').css('display', 'flex')
                    $(this).text('-')
                } else {
                    $('.hld__advanced-setting-panel').css('display', 'none')
                    $(this).text('+')
                }
            })
            /**
             * Bind:Click
             * 关闭面板（通用）
             */
            $('body').on('click', '.hld__list-panel .hld__setting-close', function () {
                $(this).parent().remove()
            })
            /**
             * Bind:Click
             * 保存配置
             */
            $('body').on('click', '#hld__save__data', () => {
                script.saveSetting()
                $('#hld__setting_cover').fadeOut(200)
            })
        },
        renderAlwaysFunc: function () {
            if($('.hld__setting-box').length == 0) {
                $('#startmenu > tbody > tr > td.last').append('<div><div class="item hld__setting-box"></div></div>')
                let $entry = $('<a id="hld__setting" title="打开NGA优化摸鱼插件设置面板">NGA优化摸鱼插件设置</a>')
                $entry.click(()=>{
                    $('#hld__setting_cover').css('display', 'block')
                    $('html, body').animate({scrollTop: 0}, 500)
                })
                $('#hld__setting_close').click(()=>$('#hld__setting_cover').fadeOut(200))
                $('.hld__setting-box').append($entry)
            }
        },
        addButton: function (button) {
            $('#hld_setting_panel_buttons').append(`
            <button class="hld__btn" id="${button.id}" title="${button.desc}">${button.title}</button>
            `)
        },
        style: `
        #hld__setting {color:#6666CC;cursor:pointer;}
        #hld__setting_cover {display:none;padding-top: 70px;position:absolute;top:0;left:0;right:0;bottom:0;z-index:999;}
        #hld__setting_panel {position:relative;background:#fff8e7;width:600px;left: 50%;transform: translateX(-50%);padding:15px 20px;border-radius:10px;box-shadow:0 0 10px #666;border:1px solid #591804;}
        #hld__setting_panel > div.hld__field {float:left;width:50%;}
        #hld__setting_panel p {margin-bottom:10px;}
        #hld__setting_panel .hld__sp-title {font-size:15px;font-weight:bold;text-align:center;}
        #hld__setting_panel .hld__sp-section {font-weight:bold;margin-top:20px;}
        .hld__setting-close {position:absolute;top:5px;right:5px;padding:3px 6px;background:#fff0cd;color:#591804;transition:all .2s ease;cursor:pointer;border-radius:4px;text-decoration:none;z-index:9999;}
        .hld__setting-close:hover {background:#591804;color:#fff0cd;text-decoration:none;}
        #hld__setting_panel button {transition:all .2s ease;cursor:pointer;}
        .hld__advanced-setting {border-top: 1px solid #e0c19e;border-bottom: 1px solid #e0c19e;padding: 3px 0;margin-top:25px;}
        .hld__advanced-setting >span {font-weight:bold}
        .hld__advanced-setting >button {padding: 0px;margin-right:5px;width: 18px;text-align: center;}
        .hld__advanced-setting-panel {display:none;padding:5px 0;flex-wrap: wrap;}
        .hld__advanced-setting-panel>p {width:100%;}
        .hld__advanced-setting-panel>table {width:50%;}
        .hld__advanced-setting-panel>p {margin: 7px 0 !important;font-weight:bold;}
        .hld__advanced-setting-panel>p svg {height:16px;width:16px;vertical-align: top;margin-right:3px;}
        .hld__advanced-setting-panel>table td {padding-right:10px}
        .hld__advanced-setting-panel input[type=text],.hld__advanced-setting-panel input[type=number] {width:80px}
        .hld__adv-help {cursor:help;text-decoration: underline;}
        .hld__buttons {clear:both;display:flex;justify-content:space-between;padding-top:15px;}
        button.hld__btn {padding:3px 8px;border:1px solid #591804;background:#fff8e7;color:#591804;}
        button.hld__btn:hover {background:#591804;color:#fff0cd;}
        .hld__sp-fold {padding-left:23px;}
        .hld__sp-fold .hld__f-title {font-weight:bold;}
        .hld__help-tips {position: absolute;padding: 5px 10px;background: rgba(0,0,0,.8);color: #FFF;border-radius: 5px;z-index: 9999;}
        `
    }
    /**
     * 快捷键模块
     * @name shortCutKeys
     * @description 为模块提供快捷键切换的能力，提供修改，保存快捷键等
    */
    const shortCutKeys = {
        name: 'shortCutKeys',
        beforeFunc: function () {
            script.setting.normal.shortcutKeys = []
        },
        initFunc: function () {
            const _this = this
            // 添加到配置面板的设置入口
            script.getModule('settingPanel').addButton({
                id: 'hld__shortcut_manage',
                title: '编辑快捷键',
                desc: '编辑快捷键'
            })
            /**
             * Bind:keyup
             * 注册监听按键
             */
            $('body').keyup(event => {
                if (/textarea|select|input/i.test(event.target.nodeName)
                    || /text|password|number|email|url|range|date|month/i.test(event.target.type)) {
                    return
                }
                if (event.ctrlKey || event.altKey || event.shiftKey) return
                for (const keyCode of script.setting.normal.shortcutKeys) {
                    if (event.keyCode === keyCode) {
                        for (const module of script.modules) {
                            if (module.setting && module.shortcutFunc) {
                                if (module.setting.rewriteShortCutCode) {
                                    if (module.setting.rewriteShortCutCode === event.keyCode) {
                                        module.shortcutFunc[module.setting.key].call(module)
                                    }
                                } else if (module.setting.shortCutCode === event.keyCode) {
                                    module.shortcutFunc[module.setting.key].call(module)
                                }
                            }
                            if (module.settings) {
                                for (const setting of module.settings) {
                                    if (module.shortcutFunc) {
                                        if (setting.rewriteShortCutCode) {
                                            if (setting.rewriteShortCutCode === event.keyCode) {
                                                module.shortcutFunc[setting.key].call(module)
                                            }
                                        } else if (setting.shortCutCode === event.keyCode) {
                                            module.shortcutFunc[setting.key].call(module)
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            })
            /**
             * Bind:Click
             * 快捷键编辑面板
             */
            $('body').on('click', '#hld__shortcut_manage', () => {
                if($('#hld__shortcut_panel').length > 0) return
                let $shortcutPanel = $(`<div id="hld__shortcut_panel" class="hld__list-panel animated fadeInUp">
                <a href="javascript:void(0)" class="hld__setting-close">×</a>
                <div>
                <div><p><b>编辑快捷键</b></p><div class="hld__float-left"><table class="hld__table hld__table-keyword"><thead><tr><td>功能</td><td width="60">快捷键</td></tr></thead>
                <tbody></tbody></table></div><div class="hld__float-left hld__shortcut-desc"><p><b>支持的快捷键范围</b></p><p>键盘 <code>A</code>~<code>Z</code></p><p>左箭头 <code>LEFT</code></p><p>右箭头 <code>RIGHT</code></p><p>上箭头 <code>UP</code></p><p>下箭头 <code>DOWN</code></p><p><i>* 留空则取消快捷键</i></p><br><p>如按键异常请尝试重置按键</p>
                </div>
                <div class="clearfix"></div></div>
                </div>
                <div class="hld__btn-groups">
                <button class="hld__btn" id="hld__reset_shortcut">重置按键</button>
                <button class="hld__btn" id="hld__save_shortcut">保存快捷键</button>
                </div>
                </div>`)
                const insertDom = setting => $shortcutPanel.find('.hld__table tbody').append(`<tr><td>${setting.title || setting.key}</td><td><input type="text" value="${this.getCodeName(setting.rewriteShortCutCode || setting.shortCutCode)}"></td></tr>`)
                for (const module of script.modules) {
                    if (module.setting && module.setting.shortCutCode) {
                        insertDom(module.setting)
                    }
                    if (module.settings) {
                        for (const setting of module.settings) {
                            if (setting.shortCutCode) {
                                insertDom(setting)
                            }
                        }
                    }
                }
                $('#hld__setting_cover').append($shortcutPanel)
            })
            /**
             * Bind:Click
             * 重置快捷键
             */
            $('body').on('click', '#hld__reset_shortcut', () => {
                const defaultShortcut = []
                for (const module of script.modules) {
                    if (module.setting && module.setting.shortCutCode) {
                        defaultShortcut.push(module.setting.shortCutCode)
                    }
                    if (module.settings) {
                        for (const setting of module.settings) {
                            setting.shortCutCode && defaultShortcut.push(setting.shortCutCode)
                        }
                    }
                }
                script.setting.normal.shortcutKeys = defaultShortcut
                script.saveSetting('重置按键成功，刷新页面生效')
                $('#hld__shortcut_panel').remove()
            })
            /**
             * Bind:Click
             * 保存快捷键
             */
            $('body').on('click', '#hld__save_shortcut', () => {
                const _this = this
                let shortcutKeys = []
                $('.hld__table tbody>tr').each(function () {
                    const v = $(this).find('input').val().trim().toUpperCase()
                    if (v == '') {
                        shortcutKeys.push(-1)
                    } else {
                        const code = _this.getCodeName(v, 'name')
                        if (code > 0) shortcutKeys.push(code)
                        else script.popMsg(`${v}是个无效的快捷键`, 'err')
                    }
                })
                if (shortcutKeys.length != script.setting.normal.shortcutKeys.length) return
                script.setting.normal.shortcutKeys = shortcutKeys
                script.saveSetting('保存按键成功，刷新页面生效')
                $('#hld__shortcut_panel').remove()
            })
        },
        getCodeName (val, valType='code') {
            const shortcutCode = {
                'A': 65, 'B': 66, 'C': 67, 'D': 68, 'E': 69, 'F': 70, 'G': 71,
                'H': 72, 'I': 73, 'J': 74, 'K': 75, 'L': 76, 'M': 77, 'N': 78,
                'O': 79, 'P': 80, 'Q': 81, 'R': 82, 'S': 83, 'T': 84,
                'U': 85, 'V': 86, 'W': 87, 'X': 88, 'Y': 89, 'Z': 90,
                '0': 48, '1': 49, '2': 50, '3': 51, '4': 52, '5': 53, '6': 54, '7': 55, '8': 56, '9': 57,
                'LEFT': 37, 'RIGHT': 39, 'UP': 38, 'DOWN': 40, '': 0, '': -1
            }
            if (valType == 'code') {
                let keyname = ''
                for (let [n, c] of Object.entries(shortcutCode)) {
                    c == val && (keyname = n)
                }
                return keyname
            } else {
                let code = -1
                for (let [n, c] of Object.entries(shortcutCode)) {
                    n == val && (code = c)
                }
                return code
            }
        },
        style: `
        code {padding:2px 4px;font-size:90%;font-weight:bold;color:#c7254e;background-color:#f9f2f4;border-radius:4px;}
        .hld__list-panel {position:absolute;top: 100px;left: 50%;background:#fff8e7;padding:15px 20px;border-radius:10px;box-shadow:0 0 10px #666;border:1px solid #591804;z-index:9999;}
        .hld__list-panel .hld__list-c {width:45%;}
        .hld__list-panel .hld__list-c textarea {box-sizing:border-box;padding:0;margin:0;height:200px;width:100%;resize:none;}
        .hld__list-panel .hld__list-desc {margin-top:5px;font-size:9px;color:#666;cursor:help;text-decoration: underline;}
        .hld__list-panel .hld__list-c > p:first-child {font-weight:bold;font-size:14px;margin-bottom:10px;}
        .hld__table-keyword {margin-top:10px;width:200px;}
        .hld__table-keyword tr td:last-child {text-align:center;}
        .hld__table-keyword input[type=text] {width:48px;text-transform:uppercase;text-align:center;}
        .hld__table{table-layout:fixed;border-top:1px solid #ead5bc;border-left:1px solid #ead5bc}
        .hld__table-banlist-buttons{margin-top:10px}
        .hld__table thead{background:#591804;border:1px solid #591804;color:#fff}
        .hld__table td,.hld__table th{padding:3px 5px;border-bottom:1px solid #ead5bc;border-right:1px solid #ead5bc;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
        .hld__shortcut-desc {width:120px;margin-left:20px;padding-top:6px}
        .hld__shortcut-desc p {margin-bottom:5px;}

        `
    }
    /**
     * 配置备份模块
     * @name backupModule
     * @description 提供配置的导入，导出功能
     */
    const backupModule = {
        name: 'backupModule',
        backupItems: [],
        initFunc: function () {
            /**
             * 导入导出设置面板
             */
            const _this = this
            // 在设置面板上添加按钮
            script.getModule('settingPanel').addButton({
                id: 'hld__backup_panel',
                title: '导入/导出',
                desc: '导入/导出配置字符串，包含设置，黑名单，标记名单等等'
            })
            /**
             * Bind:Click
             * 导入导出面板
             */
            $('body').on('click', '#hld__backup_panel', function () {
                const unsupported = '3.3.0'
                const currentVer = script.getInfo().version
                if($('#hld__export_panel').length > 0) return
                $('#hld__setting_cover').append(`
                    <div id="hld__export_panel" class="hld__list-panel animated fadeInUp">
                        <a href="javascript:void(0)" class="hld__setting-close">×</a>
                        <div class="hld__ep-container">
                            <div>
                                <p><b>选择导出的设置</b></p>
                                <div id="hld__export_panel_cb">
                                    <p><label><input type="checkbox" id="hld__cb_export_setting" checked="checked"> 配置</label></p>
                                </div>
                                <br>
                                <p><button id="hld__export__data">导出</button> <button id="hld__import__data">导入</button></p>
                            </div>
                            <div>
                                <p><b style="text-decoration: underline;cursor:help;" title="【导出】\n选择要导出的内容，点击导出，复制以下字符串用于备份，分享等\n【导入】\n将字符串复制到以下输入框中，点击导入，将会自动导入字符串中包含的内容">字符串</b></p>
                                <textarea id="hld__export_str" rows="9"></textarea>
                            </div>
                        </div>
                        <div><p id="hld__export_msg"></p></div>
                    </div>
                `)
                // 加载其他模组备份项
                for (const item of _this.backupItems) {
                    $('#hld__export_panel_cb').append(`
                    <p><label><input type="checkbox" id="hld__cb_export_${item.writeKey}" checked="checked"> ${item.title}</label></p>
                    `)
                }
                /**
                 * Bind:Click
                 * 导出配置
                 */
                $('#hld__export__data').click(function(){
                    let obj = {}
                    // 基础配置
                    if ($('#hld__cb_export_setting').prop('checked')) {
                        obj['setting'] = script.setting.normal
                        obj['advanced_setting'] = script.setting.advanced
                    }
                    // 其他模组备份项
                    for (const item of _this.backupItems) {
                        const $c = $(`#hld__cb_export_${item.writeKey}`)
                        if ($c.length > 0 && $c.prop('checked')) {
                            obj[item.writeKey] = item.module[item.valueKey]
                        }
                    }
                    if (Object.keys(obj).length == 0) {
                        $('#hld__export_msg').html('<span style="color:#CC0000">没有选择任何项目可供导出！</span>')
                        return
                    }
                    obj['name'] = 'HLD-NGA-SCRIPT'
                    obj['ver'] = script.getInfo().version
                    const backupB64 = _this.Base64.encode(JSON.stringify(obj))
                    $('#hld__export_str').val(backupB64)
                    $('#hld__export_msg').html(`<span style="color:#009900">导出成功(${_this.calculateSize(backupB64.length)})，请复制右侧字符串以备份</span>`)
                })
                /**
                 * Bind:Click
                 * 导入配置
                 */
                $('#hld__import__data').click(function(){
                    if ($('#hld__export_str').val()) {
                        try {
                            let obj = JSON.parse(_this.Base64.decode($('#hld__export_str').val()))
                            const objVer = _this.vstr2num(obj.ver)
                            if (objVer != 0 && objVer > _this.vstr2num(currentVer)) {
                                script.popMsg(`此配置是由更高版本(v${obj.ver})的脚本导出，请升级您的脚本 <a title="更新地址" href="https://greasyfork.org/zh-CN/scripts/393991-nga%E4%BC%98%E5%8C%96%E6%91%B8%E9%B1%BC%E4%BD%93%E9%AA%8C" target="_blank">[脚本地址]</a>`, 'warn')
                                return
                            }
                            if (objVer != 0 && objVer < _this.vstr2num(unsupported)) {
                                script.popMsg(`此配置是由低版本(v${obj.ver})的脚本导出，当前版本(v${currentVer})已不支持！`, 'err')
                                return
                            }
                            let confirm = window.confirm('此操作会覆盖你的配置，确认吗？')
                            if (!confirm) return
                            if (Object.keys(obj).includes('setting')) {
                                obj.setting && (script.setting.normal = obj.setting)
                                obj.advanced_setting && (script.setting.advanced = obj.advanced_setting)
                                window.localStorage.setItem('hld__NGA_setting', JSON.stringify(script.setting.normal))
                                window.localStorage.setItem('hld__NGA_advanced_setting', JSON.stringify(script.setting.advanced))
                            }
                            // 其他模组备份项
                            for (const item of _this.backupItems) {
                                if (Object.keys(obj).includes(item.writeKey)) {
                                    item.module[item.valueKey] = obj[item.writeKey]
                                    window.localStorage.setItem(`hld__NGA_${item.writeKey}`, JSON.stringify(obj[item.writeKey]))
                                }
                            }
                            $('#hld__export_msg').html('<span style="color:#009900">导入成功，刷新浏览器以生效</span>')

                        } catch (err){
                            script.printLog(`JSON解析失败：${err}`)
                            $('#hld__export_msg').html('<span style="color:#CC0000">字符串有误，解析失败！</span>')
                        }
                    }
                })
            })
        },
        addItem: function(item) {
            this.backupItems.push(item)
        },
        // 字符串版本转数字
        vstr2num: function(str) {
            let num = 0
            str.split('.').forEach((n, i) => num += i < 2 ? +n * 1000 / Math.pow(10, i) : +n)
            return num
        },
        calculateSize: function (num) {
            if (num == 0) return '0 B'
            let k = 1024
            let sizeStr = ['B','KB','MB','GB']
            let i = 0
            for(let l=0;l<8;l++){
            　　if(num / Math.pow(k, l) < 1) break
            　　i = l
            }
        　　return (num / Math.pow(k, i)).toFixed(2) + ' ' + sizeStr[i]
        },
        /**
         * Base64互转
         */
        Base64: {
            encode: (str) => {
                return window.btoa(unescape(encodeURIComponent(str)))
            },
            decode: (str) => {
                return decodeURIComponent(escape(window.atob(str)))
            }
        },
        style: `
        .hld__ep-container{display:flex;width:300px;margin-bottom: 7px;}
        .hld__ep-container p {margin-bottom:10px;}
        .hld__ep-container >div{width:50%;}
        .hld__ep-container textarea {width: 100%;padding:0;margin:0;resize:none;}
        `
    }
    /**
     * 赏面板
     * @name rewardPanel
     * @description 别问，好活当赏
     */
    const rewardPanel = {
        name: 'rewardPanel',
        initFunc: function () {
            /**
             * 打赏
             */
            script.getModule('settingPanel').addButton({
                id: 'hld__reward',
                title: '<span style="margin-right:3px">¥</span>赏',
                desc: '好活当赏'
            })
            /**
             * Bind:Click
             * 打赏面板
             */
            $('body').on('click', '#hld__reward', function () {
                $('#hld__setting_cover').append(`
                <div class="hld__list-panel hld__reward-panel animated fadeInUp">
                    <a href="javascript:void(0)" class="hld__setting-close">×</a>
                    <div class="hld__reward-info">
                        <p><b>喜欢此脚本请可以去作者<a href="${script.getInfo().github}" target="_blank"><b>Github</b></a>点个⭐️</p>
                        <p>如果觉得脚本好用<span class="hld__delete-line">摸到鱼了</span>，也可以请作者喝杯☕意思意思，打多少零看缘分😎</p>
                        <p>如若有功能需求或者建议，欢迎在社区进行反馈</p>
                    </div>
                    <div class="hld__flex">
                        <div class="hld__list-c"><img src="${IMG_REWARD_ALIPAY}"></div>
                        <div class="hld__list-c"><img src="${IMG_REWARD_WXPAY}"></div>
                    </div>
                    <div class="hld__source">
                        <a href="${script.getInfo().github}" target="_blank"><img alt="Mozilla Add-on" src="https://img.shields.io/github/stars/kisshang1993/NGA-BBS-Script?label=Star&style=social"></a>
                        <a href="${script.getInfo().update}" target="_blank"><img alt="Mozilla Add-on" src="https://img.shields.io/badge/Greasy%20Fork-NGA优化摸鱼体验-brightgreen"></a>
                    </div>
                </div>
            `)
            })
        },
        style: `
        .hld__reward-panel {width:500px;}
        .hld__reward-panel .hld__reward-info {display:block;font-size:15px;margin-bottom:20px;line-height:20px;}
        .hld__reward-panel .hld__reward-info p {margin-bottom:5px;}
        .hld__delete-line {text-decoration:line-through;color:#666;}
        .hld__reward-panel .hld__list-c {width:50%;}
        .hld__reward-panel .hld__list-c:first-child {margin-right:15px;}
        .hld__reward-panel .hld__list-c>img {width:100%;height:auto;}
        .hld__reward-panel .hld__source {margin-top:15px;}
        .hld__reward-panel .hld__source > a {margin-right:10px;}
        `
    }
    /**
     * 动态启用配置模块
     * @name dynamicEnable
     * @description 此模块提供了快捷键动态启用的功能
     */
    const dynamicEnable = {
        name: 'dynamicEnable',
        setting: {
            type: 'advanced',
            key: 'dynamicEnable',
            default: true,
            title: '动态功能启用',
            desc: '此配置表示部分可以快捷键切换的功能默认行为策略\n选中时：关闭功能(如隐藏头像)也可以通过快捷键切换显示/隐藏\n取消时：关闭功能(如隐藏头像)将彻底关闭功能，快捷键会失效',
            menu: 'left'
        }
    }
    /**
     * 隐藏头像模块
     * @name hideAvatar
     * @description 此模块提供了可以快捷键切换显示隐藏头像
     */
    const hideAvatar = {
        name: 'hideAvatar',
        setting: {
            shortCutCode: 81, // Q
            type: 'normal',
            key: 'hideAvatar',
            default: true,
            title: '隐藏头像',
            menu: 'left'
        },
        renderFormsFunc: function ($el) {
            if (script.setting.normal.hideAvatar) {
                $el.find('.avatar, .avatar+img').css('display', 'none')
                $el.find('.c1').css('background-image', 'none')
            }
        },
        shortcutFunc: {
            hideAvatar: function () {
                if (script.setting.normal.hideAvatar || script.setting.advanced.dynamicEnable) {
                    $('.avatar, .avatar+img').toggle()
                    script.popNotification(`${$('.avatar:hidden').length == 0 ? '显示' : '隐藏'}头像`)
                }
            }
        },
        asyncStyle: function () {
            return `
            .posterinfo .avatar+img {display:${script.setting.normal.hideAvatar ? 'none' : 'inline'};}
            `
        }
    }
    /**
     * 隐藏头像模块
     * @name hideSmile
     * @description 此模块提供了可以快捷键切换显示隐藏表情
     *              其中隐藏的表情会用文字来替代
     */
    const hideSmile = {
        name: 'hideSmile',
        setting: {
            shortCutCode: 87, // W
            type: 'normal',
            key: 'hideSmile',
            default: true,
            title: '隐藏表情',
            menu: 'left'
        },
        renderFormsFunc: function ($el) {
            $el.find('.c2 img').each(function () {
                const classs = $(this).attr('class')
                if (classs && classs.includes('smile') && !$(this).is(':hidden')) {
                    const alt = $(this).attr('alt')
                    const $alt = $('<span class="smile_alt_text">[' + alt + ']</span>')
                    script.setting.normal.hideSmile ? $(this).hide() : $alt.hide()
                    $(this).after($alt)
                }
            })
        },
        shortcutFunc: {
            hideSmile: function () {
                if (script.setting.normal.hideSmile || script.setting.advanced.dynamicEnable) {
                    $('.c2 img').each(function () {
                        const classs = $(this).attr('class');
                        if (classs && classs.includes('smile')) $(this).toggle()
                    })
                    $('.smile_alt_text').toggle()
                    script.popNotification(`${$('.smile_alt_text:hidden').length > 0 ? '显示' : '隐藏'}表情`)
                }
            }
        }
    }
    /**
     * 贴内图片缩放模块
     * @name imgResize
     * @description 此模块提供了可以调整贴内图片的尺寸
     */
    const imgResize = {
        name: 'imgResize',
        settings: [{
            type: 'normal',
            key: 'imgResize',
            title: '贴内图片缩放',
            default: true,
            menu: 'left'
        }, {
            type: 'advanced',
            key: 'imgResizeWidth',
            default: 200,
            title: '图片缩放宽度',
            desc: '贴内图片缩放的宽度，高度自适应，单位px',
            menu: 'left'
        }],
        renderFormsFunc: function ($el) {
            $el.find('.c2 img').each(function () {
                const classs = $(this).attr('class')
                if ((!classs || !classs.includes('smile')) && script.setting.normal.imgResize) {
                    $(this).addClass('hld__img-resize').attr('hld-img-resize', 'ok').attr('title', '点击大图显示')
                }
            })
        },
        asyncStyle: () => {
            return `
            .hld__img-resize {outline:none !important;outline-offset:'';cursor:alias;min-width:auto !important;min-height:auto !important;max-width:${script.setting.advanced.imgResizeWidth || 200}px !important;max-height:none !important;margin:5px;}
            `
        }
    }
    /**
     * 隐藏图片模块
     * @name hideImage
     * @description 此模块提供了可以快捷键切换显示隐藏图片
     *              其中隐藏的图片会用一个按钮来替代
     */
    const hideImage = {
        name: 'hideImage',
        setting: {
            shortCutCode: 69, // E
            type: 'normal',
            key: 'hideImage',
            default: false,
            title: '隐藏贴内图片',
            menu: 'left'
        },
        renderFormsFunc: function ($el) {
            $el.find('.c2 img').each(function () {
                const classs = $(this).attr('class')
                if ((!classs || !classs.includes('smile')) && !$(this).is(':hidden')) {
                    $(this).addClass('hld__img-postimg')
                    // 显示原图
                    $(this).attr('src', $(this).attr('src').replace('.medium.jpg', '')).attr('hld-hideimg', 'ok')
                    let $imgB = $('<button class="switch-img" style="display:none">图</button>')
                    $imgB.on('click', function () {
                        $(this).prev('img').toggle()
                        $(this).text($(this).prev('img').is(':hidden') ? '图' : '隐藏')
                    })
                    if (script.setting.normal.hideImage) {
                        $(this).hide();
                        $imgB.show()
                    }
                    $(this).after($imgB)
                }
            })
        },
        shortcutFunc: {
            hideImage: function () {
                if (!script.setting.advanced.dynamicEnable) return
                if ($('.hld__img-postimg:hidden').length < $('.switch-img').length) {
                    $('.hld__img-postimg').hide()
                    $('.switch-img').text('图').show()
                    script.popNotification(`隐藏图片`)
                    return
                }
                $('.hld__img-postimg').each(function () {
                    $(this).toggle()
                    $(this).is(':hidden') ? $(this).next('button.switch-img').show() : $(this).next('button.switch-img').hide()
                })
                script.popNotification(`${$('.switch-img:hidden').length > 0 ? '显示' : '隐藏'}图片`)
            }
        }
    }
    /**
     * 隐藏签名模块
     * @name hideSign
     * @description 此模块提供了可以配置默认隐藏签名
     */
    const hideSign = {
        name: 'hideSign',
        setting: {
            type: 'normal',
            key: 'hideSign',
            default: true,
            title: '隐藏签名',
            menu: 'left'
        },
        renderFormsFunc: function ($el) {
            script.setting.normal.hideSign && $el.find('.sign, .sigline').css('display', 'none')
        }
    }
    /**
     * 隐藏图片模块
     * @name hideHeader
     * @description 此模块提供了可以配置默认隐藏版头
     *              以及一个高级配置可选一起隐藏顶部背景
     */
    const hideHeader = {
        name: 'hideHeader',
        settings: [{
            type: 'normal',
            key: 'hideHeader',
            default: true,
            title: '隐藏版头/版规/子版入口',
            menu: 'left'
        }, {
            type: 'advanced',
            key: 'hideCustomBg',
            default: true,
            title: '隐藏背景图片',
            desc: '选中时：隐藏版头的同时顶部背景图片\n取消时：无操作',
            menu: 'right'
        }],
        renderAlwaysFunc: function ($el) {
            //隐藏版头
            if (script.setting.normal.hideHeader && $('#hld__switch_header').length == 0) {
                $('#toppedtopic, #sub_forums').hide()
                let $toggleHeaderBtn = $('<button style="position: absolute;right: 16px;" id="hld__switch_header">切换显示版头</button>')
                $toggleHeaderBtn.click(() => $('#toppedtopic, #sub_forums').toggle())
                $('#toptopics > div > h3').append($toggleHeaderBtn)
            }
            if(script.setting.normal.hideHeader && script.setting.advanced.hideCustomBg) {
                $('#custombg').hide()
                $('#mainmenu').css('margin', '0px')
            }
        },
        style: `
        #m_threads .toptopicsRight {float:none;width:auto;}
        .topicrowsLeftC {margin-right:0;}
        `
    }
    /**
     * Excel模块
     * @name excelMode
     * @description 此模块提供了可以快捷键切换Excel模式
     *              以及一个高级配置可选更改Excel左侧序号的类型
     */
    const excelMode = {
        name: 'excelMode',
        settings: [{
            shortCutCode: 82, // R
            type: 'normal',
            key: 'excelMode',
            default: false,
            title: 'Excel模式',
            menu: 'left'
        }, {
            type: 'advanced',
            key: 'excelTheme',
            default: 'wps',
            options: [{
                label: '腾讯文档',
                value: 'tencent'
            }, {
                label: 'WPS',
                value: 'wps'
            }, {
                label: 'Office',
                value: 'office'
            }],
            title: 'Excel皮肤',
            desc: 'Excel的皮肤\n腾云文档是矢量图形绘制，适应各种分辨率，不会失真，推荐优先使用\nWPS与Office为图片拼接而成，分辨率为1080P，高于此分辨率可能会失真',
            menu: 'left'
        }, {
            type: 'advanced',
            key: 'excelNoMode',
            default: false,
            title: 'Excel左列序号',
            desc: 'Excel最左列的显示序号，此策略为尽可能的更像Excel\n选中时：Excel最左栏为从1开始往下，逐行+1\n取消时：Excel最左栏为原始的回帖数\n*此功能仅在贴列表有效',
            menu: 'left'
        }],
        beforeUrl: window.location.href,
        initFunc: function() {
            // 生成列标题字母列表
            const columnLetters = () => {
                let capital = []
                let columnLetters = []
                for (let i=65;i<91;i++) capital.push(String.fromCharCode(i))
                Array('', 'A', 'B', 'C').forEach(n => capital.forEach(c => columnLetters.push(`${n}${c}`)))
                return columnLetters
            }
            if (script.setting.advanced.excelTheme == 'tencent') {
                // 腾讯文档元素
                // 插入Excel头部
                $('body').append(`
                <div class="hld__excel-div hld__excel-header">
                    <div class="hld__excel-titlebar">
                        <div class="hld__excel-titlebar-content hld__excel-icon24" style="margin:2px 2px 2px 10px;background-image:url(${getExcelTheme(script.setting.advanced.excelTheme, 'icon_1')});"></div>
                        <div class="hld__excel-titlebar-content hld__excel-icon12" style="background-image:url(${getExcelTheme(script.setting.advanced.excelTheme, 'icon_2')});"></div>
                        <div style="height: 24px;border-right: 1px solid rgb(0, 0, 0);opacity: 0.06;margin: 0 12px;vertical-align: middle;"></div>
                        <div class="hld__excel-titlebar-title"></div>
                        <div class="hld__excel-titlebar-content hld__excel-icon16" style="margin-left: 10px;background-image:url(${getExcelTheme(script.setting.advanced.excelTheme, 'icon_3')});"></div>
                        <div class="hld__excel-titlebar-content hld__excel-icon16" style="margin-left: 12px;background-image:url(${getExcelTheme(script.setting.advanced.excelTheme, 'icon_4')});"></div>
                        <div class="hld__excel-titlebar-content hld__excel-icon16" style="margin-left: 10px;background-image:url(${getExcelTheme(script.setting.advanced.excelTheme, 'icon_5')});"></div>
                        <div style="margin-left: 5px;font-size: 12px;line-height: 20px;height: 18px;;color: #000;opacity: 0.48;font-weight:400;">上次修改是在2小时前进行的</div>
                        <div style="flex-grow: 1;"></div>
                        <div style="height: 24px;border-right: 1px solid rgb(0, 0, 0);opacity: 0.06;margin: 0 12px;vertical-align: middle;"></div>
                        <div style="width:28px;height:28px;border-radius: 4px;background: #e9e9e9;text-align: center;line-height: 32px;">🐟︎</div>
                    </div>
                    <div class="hld__excel-toolbar">
                        ${Array.from({length: 4}, (_, i) => '<div class="hld__excel-titlebar-content hld__excel-icon20" style="margin:0 6px;background-image:url(' + getExcelTheme(script.setting.advanced.excelTheme, "icon_"+(10+i)) + ');"></div>').join('')}
                        <div style="height: 16px;border-right: 1px solid rgb(0, 0, 0);opacity: 0.06;margin: 0 4px;vertical-align: middle;"></div>
                        <div class="hld__excel-titlebar-content hld__excel-icon20" style="margin-left: 8px;background-image:url(${getExcelTheme(script.setting.advanced.excelTheme, 'icon_14')});"></div>
                        <div style="padding: 0 2px;">插入</div>
                        <div class="hld__excel-titlebar-content hld__excel-icon12" style="background-image:url(${getExcelTheme(script.setting.advanced.excelTheme, 'icon_2')});"></div>
                        <div style="height: 16px;border-right: 1px solid rgb(0, 0, 0);opacity: 0.06;margin: 0 8px;vertical-align: middle;"></div>
                        <div style="padding: 0 30px 0 4px;">常规</div>
                        <div class="hld__excel-titlebar-content hld__excel-icon12" style="background-image:url(${getExcelTheme(script.setting.advanced.excelTheme, 'icon_2')});"></div>
                        <div class="hld__excel-titlebar-content hld__excel-icon20" style="margin-left: 12px;background-image:url(${getExcelTheme(script.setting.advanced.excelTheme, 'icon_15')});"></div>
                        <div style="margin-left: 1px;">
                            <div class="hld__excel-titlebar-content hld__excel-icon12" style="transform: rotate(180deg);background-image:url(${getExcelTheme(script.setting.advanced.excelTheme, 'icon_2')});"></div>
                            <div class="hld__excel-titlebar-content hld__excel-icon12" style="background-image:url(${getExcelTheme(script.setting.advanced.excelTheme, 'icon_2')});"></div>
                        </div>
                        <div style="height: 16px;border-right: 1px solid #000;opacity: 0.06;margin: 0 4px;vertical-align: middle;"></div>
                        <div style="padding: 0 4px 0 16px;">默认字体</div>
                        <div class="hld__excel-titlebar-content hld__excel-icon12" style="background-image:url(${getExcelTheme(script.setting.advanced.excelTheme, 'icon_2')});"></div>
                        <div style="padding: 0 4px 0 13px;">10</div>
                        <div class="hld__excel-titlebar-content hld__excel-icon12" style="background-image:url(${getExcelTheme(script.setting.advanced.excelTheme, 'icon_2')});"></div>
                        <div class="hld__excel-titlebar-content hld__excel-icon20" style="margin-left: 10px;background-image:url(${getExcelTheme(script.setting.advanced.excelTheme, 'icon_16')});"></div>
                        <div class="hld__excel-titlebar-pick">
                            <div class="hld__excel-titlebar-content hld__excel-icon20" style="background-image:url(${getExcelTheme(script.setting.advanced.excelTheme, 'icon_17')});"></div>
                            <div class="hld__excel-titlebar-indication" style="background-color: #000;"></div>
                        </div>
                        <div class="hld__excel-titlebar-content hld__excel-icon12" style="margin-left: 4px;background-image:url(${getExcelTheme(script.setting.advanced.excelTheme, 'icon_2')});"></div>
                        <div class="hld__excel-titlebar-pick">
                            <div class="hld__excel-titlebar-content hld__excel-icon20" style="background-image:url(${getExcelTheme(script.setting.advanced.excelTheme, 'icon_18')});"></div>
                            <div class="hld__excel-titlebar-indication" style="background-color: #8cddfa;"></div>
                        </div>
                        <div class="hld__excel-titlebar-content hld__excel-icon12" style="margin-left: 4px;background-image:url(${getExcelTheme(script.setting.advanced.excelTheme, 'icon_2')});"></div>
                        <div class="hld__excel-titlebar-content hld__excel-icon20" style="margin-left: 10px;background-image:url(${getExcelTheme(script.setting.advanced.excelTheme, 'icon_19')});"></div>
                        <div class="hld__excel-titlebar-content hld__excel-icon12" style="margin-left: 2px;background-image:url(${getExcelTheme(script.setting.advanced.excelTheme, 'icon_2')});"></div>
                        <div class="hld__excel-titlebar-content hld__excel-icon20" style="margin-left: 10px;background-image:url(${getExcelTheme(script.setting.advanced.excelTheme, 'icon_20')});"></div>
                        <div style="height: 16px;border-right: 1px solid #000;opacity: 0.06;margin: 0 10px;vertical-align: middle;"></div>
                        ${Array.from({length: 4}, (_, i) => '<div class="hld__excel-titlebar-content hld__excel-icon20" style="background-image:url(' + getExcelTheme(script.setting.advanced.excelTheme, "icon_"+(21+i)) + ');"></div><div class="hld__excel-titlebar-content hld__excel-icon12" style="margin-left: 2px;margin-right: '+ (i==3?'0':'10') +'px;background-image:url(' + getExcelTheme(script.setting.advanced.excelTheme, "icon_2") + ');"></div>').join('')}
                        <div style="height: 16px;border-right: 1px solid #000;opacity: 0.06;margin: 0 10px;vertical-align: middle;"></div>
                        <div class="hld__excel-titlebar-content hld__excel-icon20" style="background-image:url(${getExcelTheme(script.setting.advanced.excelTheme, 'icon_25')});"></div>
                        <div class="hld__excel-titlebar-content hld__excel-icon12" style="margin-left: 4px;background-image:url(${getExcelTheme(script.setting.advanced.excelTheme, 'icon_2')});"></div>
                        <div style="height: 16px;border-right: 1px solid #000;opacity: 0.06;margin: 0 10px;vertical-align: middle;"></div>
                        ${Array.from({length: 4}, (_, i) => '<div class="hld__excel-titlebar-content hld__excel-icon20" style="background-image:url(' + getExcelTheme(script.setting.advanced.excelTheme, "icon_"+(26+i)) + ');"></div><div class="hld__excel-titlebar-content hld__excel-icon12" style="margin-left: 2px;margin-right: '+ (i==3?'0':'10') +'px;background-image:url(' + getExcelTheme(script.setting.advanced.excelTheme, "icon_2") + ');"></div>').join('')}
                        <div style="height: 16px;border-right: 1px solid #000;opacity: 0.06;margin: 0 10px;vertical-align: middle;"></div>
                        <div class="hld__excel-titlebar-content hld__excel-icon20" style="margin-left: 10px;background-image:url(${getExcelTheme(script.setting.advanced.excelTheme, 'icon_20')});"></div>
                        <div style="flex-grow: 1;"></div>
                    </div>
                    <div class="hld__excel-formulabar">
                        <div style="border-right: 1px solid #e0e2e4;color: #777;text-align: center;width: 50px;font-size: 12px;height: 25px;line-height: 25px;font-weight:400;">A1</div>
                    </div>
                    <div class="hld__excel-h4">
                        <div class="hld__excel-sub"><div></div></div>
                        ${(columnLetters().map(c => '<div class="hld__excel-column">'+c+'</div>')).join('')}
                    </div>
                </div>
                `)
                // 插入Excel尾部
                $('body').append(`
                    <div class="hld__excel-div hld__excel-footer">
                        <div class="hld__excel-icon24" style="margin-left: 10px;background-image:url(${getExcelTheme(script.setting.advanced.excelTheme, 'icon_33')});"></div>
                        <div class="hld__excel-icon24" style="margin-left: 10px;background-image:url(${getExcelTheme(script.setting.advanced.excelTheme, 'icon_34')});"></div>
                        <div class="hld__excel-sheet-tab">
                            <div class="hld__excel-sheet-name">
                                <div>工作表1</div>
                                <div class="hld__excel-icon12" style="margin-left: 4px;background-image:url(${getExcelTheme(script.setting.advanced.excelTheme, 'icon_2')});"></div>
                            </div>
                            <div class="hld__excel-sheet-underblock"></div>
                        </div>
                        <div style="flex-grow: 1;"></div>
                        <div class="hld__excel-icon24" style="margin-left: 10px;background-image:url(${getExcelTheme(script.setting.advanced.excelTheme, 'icon_35')});"></div>
                        <div class="hld__excel-icon12" style="margin-left: 2px;background-image:url(${getExcelTheme(script.setting.advanced.excelTheme, 'icon_2')});"></div>
                        <div style="height: 16px;border-right: 1px solid #000;opacity: 0.12;margin: 0 10px;vertical-align: middle;"></div>
                        <div class="hld__excel-icon24" style="background-image:url(${getExcelTheme(script.setting.advanced.excelTheme, 'icon_36')});"></div>
                        <div class="hld__excel-footer-item" style="font-size: 20px;margin-left:20px;">-</div>
                        <div class="hld__excel-footer-item" style="font-weight: 400">100%</div>
                        <div class="hld__excel-footer-item" style="font-size: 20px;">+</div>
                        <div style="width:10px;"></div>
                    </div>
                `)
            } else {
                // WPS与Office元素
                // 插入Excel头部
                $('body').append(`
                    <div class="hld__excel-div hld__excel-header">
                        <div class="hld__excel-h1">
                            <div class="hld__excel-title">${script.setting.advanced.excelTitle || document.title} - Excel</div>
                            <img class="hld__excel-img-h1-l1" src="${getExcelTheme(script.setting.advanced.excelTheme, 'H_L_1')}">
                            <img class="hld__excel-img-h1-r1" src="${getExcelTheme(script.setting.advanced.excelTheme, 'H_R_1')}">
                        </div>
                        <div class="hld__excel-h2">
                            <img class="hld__excel-img-h2-l1" src="${getExcelTheme(script.setting.advanced.excelTheme, 'H_L_2')}">
                            <img class="hld__excel-img-h2-r1" src="${getExcelTheme(script.setting.advanced.excelTheme, 'H_R_2')}">
                        </div>
                        <div class="hld__excel-h3">
                            <img class="hld__excel-img-h3-l1" src="${getExcelTheme(script.setting.advanced.excelTheme, 'H_L_3')}">
                            <img class="hld__excel-img-h3-r1" src="${getExcelTheme(script.setting.advanced.excelTheme, 'H_R_3')}">
                            <div class="hld__excel-fx"></div>
                        </div>
                        <div class="hld__excel-h4">
                            <div class="hld__excel-sub"><div></div></div>
                            ${(columnLetters().map(c => '<div class="hld__excel-column">'+c+'</div>')).join('')}
                        </div>
                    </div>
                `)
                // 插入Excel尾部
                $('body').append(`
                    <div class="hld__excel-div hld__excel-footer">
                        <div class="hld__excel-f1">
                            <img class="hld__excel-img-f1-l1" src="${getExcelTheme(script.setting.advanced.excelTheme, 'F_L_1')}">
                            <img class="hld__excel-img-f1-r1" src="${getExcelTheme(script.setting.advanced.excelTheme, 'F_R_1')}">
                        </div>
                        <div class="hld__excel-f2">
                        <img class="hld__excel-img-fl2" src="${getExcelTheme(script.setting.advanced.excelTheme, 'F_L_2')}">
                        <img class="hld__excel-img-fr2" src="${getExcelTheme(script.setting.advanced.excelTheme, 'F_R_2')}">
                        </div>
                    </div>
                `)
            }

            $('#hld__excel_setting').click(()=>$('#hld__setting_cover').css('display', 'flex'))
            $('#mainmenu .half').parent().append($('#mainmenu .half').clone(true).addClass('hld__half-clone').text($('#mainmenu .half').text().replace('你好', '')))
            if(script.setting.normal.excelMode) {
                if(this.beforeUrl.includes('thread.php') || this.beforeUrl.includes('read.php')) {
                    this.switchExcelMode()
                }
            }
        },
        renderAlwaysFunc: function ($el) {
            $('.hld__excel-theme-' + script.setting.advanced.excelTheme).length == 0 && $('body').addClass('hld__excel-theme-' + script.setting.advanced.excelTheme)
            if(script.setting.normal.excelMode && window.location.href != this.beforeUrl) {
                this.beforeUrl = window.location.href
                if(this.beforeUrl.includes('thread.php') || this.beforeUrl.includes('read.php')) {
                    $('.hld__excel-body').length == 0 && $('body').addClass('hld__excel-body')
                }else {
                    $('.hld__excel-body').length > 0 && $('body').removeClass('hld__excel-body')
                }
                $('body').toggleClass('hld__excel-original-no', !script.setting.advanced.excelNoMode)
            }
            if(script.setting.normal.excelMode && $('.hld__excel-body').length > 0 && $('#mmc').length == 0) {
                $('body').addClass('hld__excel-body-err')
            }else {
                $('body').removeClass('hld__excel-body-err')
            }
        },
        renderFormsFunc: function ($el) {
            $el.find('.postrow>td:first-child').before('<td class="c0"></td>')
        },
        shortcutFunc: {
            excelMode: function () {
                if (script.setting.normal.excelMode || script.setting.advanced.dynamicEnable) {
                    this.switchExcelMode()
                    script.popNotification($('.hld__excel-body').length > 0 ? 'Excel模式' : '普通模式')
                }
            }
        },
        /**
         * 切换Excel模式
         * @method switchExcelMode
         */
        switchExcelMode: () => {
            $('body').toggleClass('hld__excel-body')
            !script.setting.advanced.excelNoMode && $('body').addClass('hld__excel-original-no')
            script.setting.normal.darkMode && script.popMsg('Excel模式与暗黑模式不兼容, 请勿重合使用', 'warn')
        },
        style: `
        /* WPS风格 */
        .hld__excel-body-err {padding-top: 200px}
        .hld__excel-header, .hld__excel-footer, .hld__excel-setting, .hld__half-clone {display: none;}
        .hld__excel-header>div, .hld__excel-footer>div {position: relative;box-sizing: border-box;}
        .hld__excel-header img, .hld__excel-footer img {position: absolute;}
        .hld__excel-header {border-bottom:1px solid #bbbbbb;}
        .hld__excel-title {display:none;}
        .hld__excel-h1 {height:30px;background:#f3f5f8;border-bottom:1px solid #c5cbd6;}
        .hld__excel-h2 {height:102px;background:#f4f4f4;}
        .hld__excel-img-h1-l1, .hld__excel-img-h2-l1, .hld__excel-img-f1-l1, .hld__excel-img-fl2 {top:0;left:0;}
        .hld__excel-img-h1-r1, .hld__excel-img-h2-r1, .hld__excel-img-f1-r1, .hld__excel-img-fr2 {top:0;right:0;}
        .hld__excel-h3 {height:44px;background:#e8e8e8;box-shadow: inset 0 3px 5px #d9d9d9;}
        .hld__excel-img-h3-l1 {top:12px;left:0;}
        .hld__excel-img-h3-r1 {toP:8px;right:0;}
        .hld__excel-fx {position: absolute;top:12px;left:253px;right:45px;height:24px;box-sizing: border-box;border:1px solid #cccccc;border-radius:4px;background:#ffffff;}
        .hld__excel-h4 {height:21px;display:flex;overflow: hidden;}
        .hld__excel-h4 > div {height:21px;border-right:1px solid #c8c8c8;box-sizing:border-box;flex-shrink: 0;}
        .hld__excel-sub {width:34px;position: relative;}
        .hld__excel-sub > div {position: absolute;right:4px;bottom:4px;width: 0px;height: 0px;border-top: 6px solid transparent;border-left: 6px solid transparent;border-right: 6px solid #b8b8b8;border-bottom: 6px solid #b8b8b8;}
        .hld__excel-column {width: 72px;line-height:21px;text-align:center;color:#444444;font-family: sans-serif;font-weight:100;font-size:14px;}
        .hld__excel-f1 {height:22px;background:#e8e8e8;}
        .hld__excel-f2 {height:28px;background:#f4f4f4;}
        .hld__excel-body {background:#fff !important;}
        .hld__excel-body #mainmenu {position: fixed;top: 5px;right: 75px;width: 425px;z-index: 98;}
        .hld__excel-body #mainmenu .right {float:none;}
        .hld__excel-body #mainmenu .stdbtn {background:none;box-shadow:none;}
        .hld__excel-body #mainmenu .half {display:none;}
        .hld__excel-body #mainmenu .hld__half-clone {display:block;width: 150px;text-align: right;overflow: hidden;text-overflow:ellipsis;white-space: nowrap;}
        .hld__excel-body #mainmenu .half {color:#f4f4f4 !important;}
        .hld__excel-body #mainmenu .stdbtn a:hover {background:none;text-decoration:underline;color:#2c5787 !important;}
        .hld__excel-body #mainmenu .mmdefault.cell input {padding:0;margin:0;background:#ededed;border:1px solid #c9d0dc;border-radius:10px;box-shadow:none;font-size:13px !important;}
        .hld__excel-body #mainmenu, .hld__excel-body #mainmenu .half, .hld__excel-body #mainmenu td a, .hld__excel-body #mainmenu .stdbtn .innerbg, .hld__excel-body #mainmenu, .hld__excel-body #mainmenu .stdbtn a, .hld__excel-body #mainmenu .stdbtn .td {height: 20px !important;line-height: 20px !important;padding: 0 5px !important;background:none;color:#424242 !important;}
        .hld__excel-body #mainmenu .innerbg > div:nth-child(2) > div:first-child {display:none;}
        .hld__excel-body .single_ttip2 {position: fixed !important;z-index:999 !important;top:30px !important;border-color:#888;}
        .hld__excel-body .hld__excel-body #mainmenu, .hld__excel-body .catenew,.hld__excel-body #toptopics,.hld__excel-body #m_pbtntop,.hld__excel-body #m_fopts,.hld__excel-body #b_nav,.hld__excel-body #fast_post_c,.hld__excel-body #custombg,.hld__excel-body #m_threads th,.hld__excel-body #m_posts th,.hld__excel-body .r_container,.hld__excel-body #footer,.hld__excel-body .clickextend {display:none !important;}
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
        .hld__excel-body #m_nav {position:fixed;top:136px;left:261px;margin:0;padding:0;z-index:99;width: 9999px;}
        .hld__excel-body #m_nav .nav_spr {display:block;border:0;border-radius:0;padding:0;box-shadow:none;background:none;margin-top: 18px;margin-left: 10px;}
        .hld__excel-body #m_nav .nav_spr span {color:#000;font-size:16px;vertical-align:unset;font-weight:normal;}
        .hld__excel-body #m_nav .nav_root,.hld__excel-body #m_nav .nav_link {background:none;border:none;box-shadow:none;padding:0;color:#000;border-radius:0;font-weight:normal;}
        .hld__excel-body .nav {font-size:14px !important;}
        .hld__excel-body #mainmenu .stdbtn a {font-size:13px !important;}
        .hld__excel-body #m_threads {margin:0;}
        .hld__excel-body .postBtnPos > div {z-index:9991;}
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
        .hld__excel-body .topicrow .c3 > div, .hld__excel-body .topicrow .c4 > div {background:#FFF !important;}
        .hld__excel-body .topicrow .c3 > div a, .hld__excel-body .topicrow .c4 > div a {color:#888 !important;}
        .hld__excel-body .block_txt {background:#fff !important;color:#1a3959 !important;border-radius:0;padding:0 !important;min-width:0 !important;font-weight:normal;}
        .hld__excel-body .quote {background:#fff !important;}
        .hld__excel-body #m_posts .block_txt {font-weight:bold;}
        .hld__excel-body .topicrow .postdate,.hld__excel-body .topicrow .replydate {display:inline;margin:10px;}
        .hld__excel-body #m_pbtnbtm {margin:0;border-bottom:1px solid #bbbbbb;}
        .hld__excel-body .hld__country-flag {border:.5px solid rgba(0,0,0,.2);}
        .hld__excel-body #pagebbtm,.hld__excel-body #m_pbtnbtm .right_ {margin:0;}
        .hld__excel-body #pagebbtm:before {display:block;line-height:35px;width:33px;float:left;content:"#";border-right:1px solid #bbbbbb;color:#777;font-size:16px;background:#e8e8e8;}
        .hld__excel-body #m_pbtnbtm td {line-height:35px;padding:0 5px;}
        .hld__excel-body #m_pbtnbtm .stdbtn {box-shadow:none;border:none !important;padding:0;padding-left:5px;background:#fff;border-radius:0;font-size:13px !important;}
        .hld__excel-body #m_pbtnbtm .stdbtn .invert {color:#591804;}
        .hld__excel-body #m_pbtnbtm td a {background:#fff;padding:0;border:0;}
        .hld__excel-body #m_posts .comment_c .comment_c_1 {border-top-color:#bbbbbb;}
        .hld__excel-body #m_posts .comment_c .comment_c_2 {border-color:#bbbbbb;}
        .hld__excel-body #m_posts {border:0;box-shadow:none;padding-bottom:0;margin:0;counter-reset:num;}
        .hld__excel-body #m_posts td {background:#fff;border-top:1px solid #bbbbbb;border-right:1px solid #bbbbbb;border-bottom:1px solid #bbbbbb;}
        .hld__excel-body #m_posts .c0 {width:32px;color:#777;font-size:16px;background:#e8e8e8;text-align:center;}
        .hld__excel-body #m_posts .c0:before {content:counter(num);counter-increment:num;}
        .hld__excel-body #m_posts .vertmod {background:#fff !important;color:#ccc;}
        .hld__excel-body #m_posts a[name="uid"]:before {content:"UID:"}
        .hld__excel-body #m_posts .white,.hld__excel-body #m_posts .block_txt_c2,.hld__excel-body #m_posts .block_txt_c0 {background:#fff !important;color:#777777;}
        .hld__excel-body #m_posts .quote {background:#fff;border-color:#bbbbbb;}
        .hld__excel-body #m_posts .postrow .postinfob .iconfont,.hld__excel-body #m_posts .ogoodbtn a:hover .iconfont {fill: #10273f;}
        .hld__excel-body #m_posts .postInfo svg {fill:#10273f !important;}
        .hld__excel-body #m_posts .recommendvalue {color:#10273f !important;}
        .hld__excel-body #m_posts button {background:#eee;}
        .hld__excel-body #m_posts button:active {outline-color:#bbbbbb;}
        .hld__excel-body #m_posts .postbox {border:none !important;}
        .hld__excel-body .posterInfoLine {background: #FFF !important;border-bottom-color: #FFF !important;}
        .hld__excel-body.hld__reply-fixed #postbbtm {position:fixed;right:30px;top:75px;z-index:999;border-radius: 10px;overflow: hidden;}
        .hld__excel-body .row2 .comment_c .comment_c_1_1 {border-top-color: #FFF;}
        .hld__excel-body #m_posts .comment_c .comment_c_1 {border-color: #FFF;border-top-color: #BBB;}
        /* Office风格 */
        .hld__excel-body.hld__excel-theme-office .hld__excel-header {height:221px;}
        .hld__excel-body.hld__excel-theme-office .hld__excel-h1 {height:59px;background:#227447;display:flex;justify-content: center;}
        .hld__excel-body.hld__excel-theme-office .hld__excel-title {display: block;color:#FFF;font-size: 12px;font-weight: 400;font-family: sans-serif;line-height:30px;}
        .hld__excel-body.hld__excel-theme-office .hld__excel-h2 {height:95px;background:#f1f1f1;border-bottom:1px solid #d5d5d5;}
        .hld__excel-body.hld__excel-theme-office .hld__excel-h3 {height:48px;background:#e6e6e6;box-shadow:none;}
        .hld__excel-body.hld__excel-theme-office .hld__excel-fx {left:250px;right: 5px;border-color:#c6c6c6;border-radius:0;height:28px;}
        .hld__excel-body.hld__excel-theme-office .hld__excel-h4 {height:20px;}
        .hld__excel-body.hld__excel-theme-office .hld__excel-f1 {height:29px;}
        .hld__excel-body.hld__excel-theme-office .hld__excel-f2 {height:21px;}
        .hld__excel-body.hld__excel-theme-office .hld__excel-f1 {border-top:1px solid #999999;border-bottom:1px solid #bfbfbf;}
        .hld__excel-body.hld__excel-theme-office .hld__excel-img-f1-l1, .hld__excel-body.hld__excel-theme-office .hld__excel-img-f1-r1 {top:-1px;}
        .hld__excel-body.hld__excel-theme-office #mmc {margin-top:221px;}
        .hld__excel-body.hld__excel-theme-office #m_nav {top:160px;}
        .hld__excel-body.hld__excel-theme-office #m_posts .c0,
        .hld__excel-body.hld__excel-theme-office .topicrow .c1 {width:32px;}
        .hld__excel-body.hld__excel-theme-office #pagebbtm:before,
        .hld__excel-body.hld__excel-theme-office .topicrow .c1 a {width:28px;}
        .hld__excel-body.hld__excel-theme-office .hld__excel-setting {top: 36px;background:none;text-align: center;}
        .hld__excel-body.hld__excel-theme-office .hld__excel-setting a {color:#FFFFFF;}
        .hld__excel-body.hld__excel-theme-office .hld__excel-setting img {display:none;}
        .hld__excel-body.hld__excel-theme-office.hld__reply-fixed #postbbtm {top: 162px;}
        .hld__excel-body.hld__excel-theme-office #m_pbtnbtm td a,
        .hld__excel-body.hld__excel-theme-office #m_pbtnbtm .stdbtn {background: none;}
        .hld__excel-body.hld__excel-theme-office #mainmenu {top:35px;right:45px;}
        .hld__excel-body.hld__excel-theme-office #mainmenu .mmdefault.cell input {border-radius:0;}
        .hld__excel-body.hld__excel-theme-office #mainmenu .stdbtn a, .hld__excel-body.hld__excel-theme-office #mainmenu .hld__half-clone {color:#FFF !important;}
        .hld__excel-body.hld__excel-theme-office .single_ttip2 {top:59px !important;}
        /* 腾讯文档风格 */
        .hld__excel-body.hld__excel-theme-tencent {font-family: -apple-system, Helvetica Neue, Helvetica, PingFang SC, Microsoft YaHei, Source Han Sans SC, Noto Sans CJK SC, WenQuanYi Micro Hei, sans-serif !important;}
        .hld__excel-body.hld__excel-theme-tencent .hld__excel-header {height:125px;background:#FFF;}
        .hld__excel-body.hld__excel-theme-tencent .hld__excel-titlebar-title {height: 36px;line-height: 36px;font-size: 18px;font-weight: 500;color: #000;opacity: 0.88;margin: 0 9px;max-width: 30%;overflow: hidden;text-overflow: ellipsis;white-space: nowrap;}
        .hld__excel-body.hld__excel-theme-tencent #mmc {margin-top: 145px;}
        .hld__excel-body.hld__excel-theme-tencent #m_nav {top: 94px;left: 65px;}
        .hld__excel-body.hld__excel-theme-tencent .hld__excel-sub {width: 51px;}
        .hld__excel-body.hld__excel-theme-tencent .hld__excel-titlebar {height:56px;display: flex;align-items: center;flex-shrink: 0;padding: 0 4px;border-bottom:1px solid #ebebeb;}
        .hld__excel-body.hld__excel-theme-tencent .hld__excel-toolbar {height:44px;display: flex;align-items: center;flex-shrink: 0;padding: 0 12px;border-bottom:1px solid #ebebeb;line-height: 24px;font-size: 12px;color:rgba(0, 0, 0, 0.88);font-weight:400;}
        .hld__excel-body.hld__excel-theme-tencent .hld__excel-toolbar > div {flex-shrink: 0;}
        .hld__excel-body.hld__excel-theme-tencent .hld__excel-titlebar-pick {margin-left: 12px;margin-top: -2px;}
        .hld__excel-body.hld__excel-theme-tencent .hld__excel-titlebar-pick .hld__excel-titlebar-content {width:17px;height:17px}
        .hld__excel-body.hld__excel-theme-tencent .hld__excel-titlebar-pick .hld__excel-titlebar-indication {height: 3px;width: 14px;margin-left: 2px;margin-top: -2px;}
        .hld__excel-body.hld__excel-theme-tencent .hld__excel-formulabar {height:25px;}
        .hld__excel-body.hld__excel-theme-tencent .hld__excel-icon24 {width:24px;height:24px;background-size: 100% 100%;}
        .hld__excel-body.hld__excel-theme-tencent .hld__excel-icon20 {width:20px;height:20px;background-size: 100% 100%;}
        .hld__excel-body.hld__excel-theme-tencent .hld__excel-icon16 {width:16px;height:16px;background-size: 100% 100%;}
        .hld__excel-body.hld__excel-theme-tencent .hld__excel-icon12 {width:12px;height:12px;background-size: 100% 100%;}
        .hld__excel-body.hld__excel-theme-tencent .hld__excel-h4 > div {background-color:#f9fafb;border-bottom: 1px solid #ebebeb;border-top: 1px solid #ebebeb;border-color:#ebebeb;}
        .hld__excel-body.hld__excel-theme-tencent #m_posts .c0, .hld__excel-body.hld__excel-theme-tencent .topicrow .c1, .hld__excel-body.hld__excel-theme-tencent #pagebbtm:before {width:50px;background-color:#f9fafb !important;}
        .hld__excel-body.hld__excel-theme-tencent #topicrows td, .hld__excel-body.hld__excel-theme-tencent #m_posts td {border-color:#ebebeb;}
        .hld__excel-body.hld__excel-theme-tencent .hld__excel-footer {height:32px;background:#FFF;display:flex;align-items: center;border-top: 1px solid #e0e0e0;padding: 0 10px;}
        .hld__excel-body.hld__excel-theme-tencent .hld__excel-sheet-tab {margin-left: 8px;width:104px;border: 1px solid #e0e0e0;border-top: 1px solid #fff;text-align:center;height: 30px;}
        .hld__excel-body.hld__excel-theme-tencent .hld__excel-sheet-tab .hld__excel-sheet-name {font-size: 14px;color: rgba(0,0,0,.88);font-weight: 400;height: 26px;line-height: 26px;border-bottom:2px solid #1e6fff;display:flex;justify-content: center;align-items: center;}
        .hld__excel-body.hld__excel-theme-tencent .hld__excel-footer-item {color:#464d5a;font-size:14px;margin:0 4px;height: 32px;line-height: 32px;}
        .hld__excel-body.hld__excel-theme-tencent #mainmenu {top: 18px;right: 20px;}
        .hld__excel-body.hld__excel-theme-tencent #postbbtm {top: 60px;right: 5px;}
        .hld__excel-body.hld__excel-theme-tencent #m_pbtnbtm .stdbtn, .hld__excel-body.hld__excel-theme-tencent #m_pbtnbtm .stdbtn a {background: none;font-weight:400;}
        .hld__excel-body.hld__excel-theme-tencent #m_pbtnbtm .uitxt1 span {font-size: 1em !important;color: #10273f;}
        .hld__excel-body.hld__excel-theme-tencent #mainmenu .mmdefault.cell input {background: #FFF;}
        `
    }
    /**
     * Excel标题栏标题模块
     * @name excelTitle
     * @description 此模块提供了在Excel模式下可以更改标题的功能
     *              提供一个高级配置输入自定义标题
     */
    const excelTitle = {
        name: 'excelTitle',
        setting: {
            type: 'advanced',
            key: 'excelTitle',
            default: '工作簿1',
            title: 'Excel覆盖标题',
            desc: 'Excel模式下标签栏的名称, 如留空, 则显示原始标题',
            menu: 'left'
        },
        renderAlwaysFunc: function ($el) {
            if ($('.hld__excel-body').length > 0) {
                const excelTitle = script.setting.advanced.excelTitle
                if (excelTitle) {
                    $(document).attr('title') != excelTitle && $(document).attr('title', excelTitle)
                }
                $('.hld__excel-titlebar-title').html(excelTitle || $(document).attr('title'))
                $('#hld__excel_icon').length == 0 && $('head').append(`<link id= "hld__excel_icon" rel="shortcut icon" type="image/png" href="${IMG_EXCEL_ICON}" />`)
            }
        }
    }
    /**
     * 折叠引用模块
     * @name foldQuote
     * @description 此模块提供了可以选择配置自动折叠过长引用
     *              提供一个高级配置可以设置折叠的阈值
     */
    const foldQuote = {
        name: 'foldQuote',
        settings: [{
            type: 'normal',
            key: 'foldQuote',
            default: true,
            title: '折叠过长引用与附件',
            menu: 'left'
        },{
            type: 'advanced',
            key: 'foldQuoteHeight',
            default: 300,
            title: '自动折叠引用高度',
            desc: '自动折叠引用的高度阈值，单位为像素(px)',
            menu: 'right'
        }],
        renderFormsFunc: function ($el) {
            if (script.setting.normal.foldQuote) {
                // 自动折叠过长引用
                if ($el.find('.postcontent .quote').length > 0) {
                    let $quote = $el.find('.postcontent .quote')
                    if ($quote.height() > (script.setting.advanced.foldQuoteHeight || 300)) {
                        const originalHeight = $quote.height()
                        $quote.addClass('hld__quote-fold')
                        const foldHeight = $quote.height()
                        const $openBtn = $(`<div class="hld__quote-box"><button>查看全部 (剩余${100-parseInt(foldHeight/originalHeight*100)}%)</button></div>`)
                        $openBtn.on('click', 'button', function(){
                            $(this).parent().remove()
                            $quote.removeClass('hld__quote-fold')
                        })
                        $quote.append($openBtn)
                    }
                }
                // 折叠附件
                if ($el.find('h4.silver.subtitle').length > 0) {
                    $el.find('h4.silver.subtitle').each(function (){
                        if ($(this).html() === '附件' && $(this).next().attr('id').includes('postattach')) {
                            const $attach = $(this).next()
                            $attach.hide()
                            const $openBtn = $(`<button>显示附件</button>`)
                            $openBtn.on('click', function(){
                                $(this).remove()
                                $attach.show()
                            })
                            $(this).next().after($openBtn)
                        }
                    })
                }
            }
        },
        style: `
        .hld__quote-fold{height:150px;overflow:hidden;position: relative;}
        .hld__quote-box{padding:10px;position: absolute;left:0;right:0;bottom:0;background:#f2eddf;}
        .hld__excel-body .hld__quote-box{background:#FFF;}
        `
    }
    /**
     * 新页面打开模块
     * @name linkTargetBlank
     * @description 此模块提供了可以选择配置在新页面打开链接
     */
    const linkTargetBlank = {
        name: 'linkTargetBlank',
        setting: {
            type: 'normal',
            key: 'linkTargetBlank',
            default: false,
            title: '论坛列表新窗口打开',
            menu: 'right'
        },
        renderThreadsFunc: function ($el) {
            if (script.setting.normal.linkTargetBlank) {
                let $link = $el.find('.topic')
                $link.data('href', $link.attr('href')).attr('href', 'javascript:void(0)')
                $link.click(() => {
                    window.open($link.data('href'))
                    return false
                })
            }
        }
    }
    /**
     * 链接直接跳转
     * @name directLinkJump
     * @description 此模块提供了超链接等直接跳转无须弹窗确认
     */
    const directLinkJump = {
        name: 'directLinkJump',
        setting: {
            type: 'normal',
            key: 'directLinkJump',
            default: true,
            title: '链接直接跳转',
            menu: 'right'
        },
        renderFormsFunc: function ($el) {
            if (script.setting.normal.directLinkJump) {
                $el.find('a[onclick]').each(function(){
                    if ($(this).attr('onclick').includes('showUrlAlert')) {
                        $(this).removeAttr('onclick onmouseover onmouseout')
                    }
                })
            }
        }
    }
    /**
     * 图片增强模块
     * @name imgEnhance
     * @description 此模块提供了图片增强功能，使用一个独立的图层打开图片
     *              可以快速切换，缩放，旋转等
     */
    const imgEnhance = {
        name: 'imgEnhance',
        settings: [{
            type: 'normal',
            key: 'imgEnhance',
            default: true,
            title: '贴内图片功能增强',
            menu: 'right'
        }, {
            shortCutCode: 37, // LEFT
            key: 'imgEnhancePrev',
            title: '楼内上一张图'
        }, {
            shortCutCode: 39, // RIGHT
            key: 'imgEnhanceNext',
            title: '楼内上一张图'
        }],
        renderFormsFunc: function ($el) {
            $el.find('img').each(function () {
                const classs = $(this).attr('class')
                if (!classs || (classs && !classs.includes('smile'))) {
                    $(this).attr('hld__imglist', 'ready').removeAttr('onload')
                }
            })
            //图片增强
            if (script.setting.normal.imgEnhance) {
                const _this = this
                $('#mc').on('click', '.postcontent img[hld__imglist=ready]', function () {
                    _this.resizeImg($(this))
                    return false
                })
            }
        },
        resizeImg: (el) => {
            if ($('#hld__img_full').length > 0) return
            let urlList = []
            let currentIndex = el.parent().find('[hld__imglist=ready]').index(el)
            el.parent().find('[hld__imglist=ready]').each(function () {
                if ($(this).attr('src') != 'about:blank') {
                    urlList.push($(this).data('srcorg') || $(this).data('srclazy') || $(this).attr('src'))
                }
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
                $img.css({ 'width': '', 'height': '' }).attr('src', urlList[index]).hide()
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
            renderImg(currentIndex)
            $img.mousedown(function (e) {
                let endx = 0;
                let endy = 0;
                let left = parseInt($imgContainer.css("left"))
                let top = parseInt($imgContainer.css("top"))
                let downx = e.pageX
                let downy = e.pageY
                e.preventDefault()
                $(document).on("mousemove", function (es) {
                    endx = es.pageX - downx + left
                    endy = es.pageY - downy + top
                    $imgContainer.css("left", endx + "px").css("top", endy + "px")
                    return false
                });
            })
            $img.mouseup(function () { $(document).unbind("mousemove") })
            $imgContainer.append($img)
            $imgBox.append($imgContainer)
            $imgBox.click(function (e) { !$(e.target).hasClass('hld__img') && $(this).remove() })
            $imgBox.append(`
                <div class="hld__if_control">
                <div class="change prev-img" title="本楼内上一张"><div></div></div>
                <div class="change rotate-right" title="逆时针旋转90°"><div></div></div>
                <div class="change rotate-left" title="顺时针旋转90°"><div></div></div>
                <div class="change next-img" title="本楼内下一张"><div></div></div>
                </div>
            `)
            /**
             * Bind:Click
             * 切换图片
             */
            $imgBox.on('click', '.change', function () {
                if ($(this).hasClass('prev-img') && currentIndex - 1 >= 0)
                    renderImg(--currentIndex)

                if ($(this).hasClass('next-img') && currentIndex + 1 < urlList.length)
                    renderImg(++currentIndex)

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
            /**
             * Bind:MouseWheel
             * 大图鼠标滚动缩放
             */
            $imgBox.on("mousewheel DOMMouseScroll", function (e) {
                const delta = (e.originalEvent.wheelDelta && (e.originalEvent.wheelDelta > 0 ? 1 : -1)) ||
                    (e.originalEvent.detail && (e.originalEvent.detail > 0 ? -1 : 1));

                if ($imgContainer.width() > 50 || delta > 0) {
                    const offsetY = $imgContainer.height() * 0.2
                    const offsetX = $imgContainer.width() * 0.2
                    let offsetTop = offsetY / 2
                    let offsetLeft = offsetX / 2

                    if ($(e.target).hasClass('hld__zoom-target')) {
                        const targetOffsetX = Math.round(e.clientX - $imgContainer.position().left)
                        const targetOffsetY = Math.round(e.clientY - $imgContainer.position().top)
                        offsetLeft = (targetOffsetX / ($imgContainer.height() / 2)) * offsetLeft
                        offsetTop = (targetOffsetY / ($imgContainer.height() / 2)) * offsetTop
                    }

                    if (delta > 0) {
                        $imgContainer.css({
                            'width': ($imgContainer.height() + offsetY) + 'px',
                            'height': ($imgContainer.height() + offsetY) + 'px',
                            'top': ($imgContainer.position().top - offsetTop) + 'px',
                            'left': ($imgContainer.position().left - offsetLeft) + 'px'
                        })
                    }
                    if (delta < 0) {
                        $imgContainer.css({
                            'width': ($imgContainer.height() - offsetY) + 'px',
                            'height': ($imgContainer.height() - offsetY) + 'px',
                            'top': ($imgContainer.position().top + offsetTop) + 'px',
                            'left': ($imgContainer.position().left + offsetLeft) + 'px'
                        })
                    }
                }
                e.stopPropagation()
                return false
            })
            /**
             * Bind:Keyup
             * Esc关闭大图
             */
            $('body').keyup(event => (event.keyCode == 27 && $('#hld__img_full').length > 0) && $('#hld__img_full').remove())
            $('body').append($imgBox)
        },
        shortcutFunc: {
            imgEnhancePrev: function () {
                if ($('#hld__img_full').length > 0) {
                    $('#hld__img_full .prev-img').click()
                }
            },
            imgEnhanceNext: function () {
                if ($('#hld__img_full').length > 0) {
                    $('#hld__img_full .next-img').click()
                }
            }
        },
        style: `
        .hld__img_container {position:absolute;display:flex;justify-content:center;align-items:center;}
        .hld__if_control {position:absolute;display:flex;left:50%;bottom:15px;width:160px;margin-left:-80px;height:40px;background:rgba(0,0,0,0.6);z-index:9999999;}
        .postcontent img {margin:0 5px 5px 0 !important;box-shadow:none !important;outline:none !important;}
        #hld__img_full {position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.6);z-index:99999;}
        #hld__img_full img {cursor:move;transition:transform .2s ease;}
        #hld__img_full .hld__imgcenter {top:50%;left:50%;transform:translate(-50%,-50%);}
        #hld__img_full .change {width:40px;height:40px;cursor:pointer;}
        #hld__img_full .rotate-right,#hld__img_full .rotate-left {background:url(${IMG_ICON_REFRESH}) center no-repeat;background-size:25px;}
        #hld__img_full .rotate-right {transform:rotateY(180deg);}
        #hld__img_full .rotate-left:hover {transform:scale(1.2);}
        #hld__img_full .rotate-right:hover {transform:scale(1.2) rotateY(180deg);}
        #hld__img_full .next-img:hover {transform:scale(1.2) rotate(180deg);}
        #hld__img_full .prev-img,#hld__img_full .next-img {background:url(${IMG_ICON_LEFT}) center no-repeat;}
        #hld__img_full .next-img {transform:rotate(180deg);}
        #hld__img_full .prev-img:hover {transform:scale(1.2);}
        #hld__img_full .next-img:hover {transform:scale(1.2) rotate(180deg);}
        `
    }
    /**
     * 标记楼主模块
     * @name authorMark
     * @description 此模块提供了自动标记楼主，使其更醒目
     */
    const authorMark = {
        name: 'authorMark',
        setting: {
            type: 'normal',
            key: 'authorMark',
            default: true,
            title: '高亮楼主',
            menu: 'right'
        },
        postAuthor: [],
        initFunc: function () {
            const localPostAuthor = window.localStorage.getItem('hld__NGA_post_author')
            localPostAuthor && (this.postAuthor = localPostAuthor.split(','))
        },
        renderFormsFunc: function ($el) {
            const _this = this
            if (script.setting.normal.authorMark) {
                const author = $('#postauthor0').text().replace('楼主', '')
                const tid = this.getQueryString('tid')
                const authorStr = `${tid}:${author}`
                if (author && !this.postAuthor.includes(authorStr) && !window.location.href.includes('authorid')) {
                    this.postAuthor.unshift(authorStr) > 10 && this.postAuthor.pop()
                    window.localStorage.setItem('hld__NGA_post_author', this.postAuthor.join(','))
                }
                $el.find('a.b').each(function () {
                    const name = $(this).attr('hld-mark-before-name') || $(this).text().replace('[', '').replace(']', '')
                    if (name && _this.postAuthor.includes(`${tid}:${name}`)) {
                        $(this).append('<span class="hld__post-author">楼主</span>')
                    }
                })
            }
        },
        /**
         * 获取URL参数
         * @method getQueryString
         * @param {String} name key
         * @return {String|null} value
         */
        getQueryString: (name) => {
            let url = decodeURI(window.location.search.replace(/&amp;/g, "&"))
            let reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)")
            let r = url.substr(1).match(reg)
            if (r != null) return unescape(r[2])
            return null
        },
        asyncStyle: () => {
            return `
            .hld__post-author {background:${script.setting.advanced.authorMarkColor || '#F00'};color: #FFF;display: inline-block;padding:0 5px;margin-left: 5px;border-radius: 5px;font-weight:bold;    line-height: 1.4em;padding-top: 0.1em;padding-bottom: 0;}
            `
        }
    }
    /**
     * 标记楼主可选颜色模块
     * @name authorMarkColor
     * @requires https://cdn.staticfile.org/spectrum/1.8.0/spectrum.js
     * @description 此模块提供了高级设置可选标记楼主的颜色
     *              以及为其他模块提供一个spectrum的配置文件
     */
    const authorMarkColor = {
        name: 'authorMarkColor',
        setting: {
            type: 'advanced',
            key: 'authorMarkColor',
            default: '#F00',
            title: '标记楼主颜色',
            desc: '标记楼主中的[楼主]的背景颜色，单位为16进制颜色代码',
            menu: 'left'
        },
        // spectrum配置对象
        colorPickerConfig: {
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
        },
        initFunc: function() {
            $('#hld__setting_cover').find('#hld__adv_authorMarkColor').spectrum(this.colorPickerConfig)
        },
        style: `
        .cp-color-picker{z-index:99997}
        .sp-container{position:absolute;top:0;left:0;display:inline-block;z-index:9999994;overflow:hidden}
        .sp-original-input-container{position:relative;display:inline-flex}
        .sp-original-input-container input{margin:0!important}
        .sp-original-input-container .sp-add-on{width:40px;border-top-right-radius:0!important;border-bottom-right-radius:0!important}
        input.spectrum.with-add-on{border-top-left-radius:0;border-bottom-left-radius:0;border-left:0}
        .sp-original-input-container .sp-add-on .sp-colorize{height:100%;width:100%;border-radius:inherit}
        .sp-colorize-container{background-image:url(${IMG_ICON_ALPHA})}
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
        .sp-alpha,.sp-preview,.sp-thumb-el{position:relative;background-image:url(${IMG_ICON_ALPHA})}
        .sp-alpha-inner,.sp-preview-inner,.sp-thumb-inner{display:block;position:absolute;top:0;left:0;bottom:0;right:0}
        .sp-palette .sp-thumb-inner{border-radius:3px;background-position:50% 50%;background-repeat:no-repeat}
        .sp-palette .sp-thumb-light.sp-thumb-active .sp-thumb-inner{background-image:url(${IMG_ICON_CHECK_BLACK})}
        .sp-palette .sp-thumb-dark.sp-thumb-active .sp-thumb-inner{background-image:url(${IMG_ICON_CHECK_WHITE})}
        .sp-clear-display{background-repeat:no-repeat;background-position:center;background-image:url(${IMG_ICON_BLOCK})}
        `
    }
    /**
     * 自动翻页模块
     * @name autoPage
     * @description 此模块提供了脚本自动翻页的功能
     *              提供一个高级配置可以设置自动翻页的检测阈值
     */
    const autoPage = {
        name: 'autoPage',
        settings: [{
            type: 'normal',
            key: 'autoPage',
            default: true,
            title: '自动翻页',
            menu: 'right'
        }],
        $window: $(window),
        initFunc: function () {
            script.setting.normal.autoPage && $('body').addClass('hld__reply-fixed')
        },
        renderAlwaysFunc: function () {
            const _this = this
            if(script.setting.normal.autoPage) {
                if($('#hld__next_page').length > 0) return
                $('#pagebbtm>.stdbtn[hld-auto-page!=ok] td').each(function(){
                    if($(this).children('a').text() == '>') {
                        $(this).children('a').attr('id', 'hld__next_page')
                        _this.$window.on('scroll.autoPage', function(){
                            if ($(document).scrollTop() != 0 && (Math.ceil($(document).scrollTop()) + $(window).height() >= ($(document).height() - 20))) {
                                if($('#hld__next_page').length > 0) {
                                    document.getElementById('hld__next_page').click()
                                    $('#hld__next_page').removeAttr('id')
                                    _this.$window.off('scroll.autoPage')
                                }
                            }
                        })
                    }
                })
                $('#pagebbtm>.stdbtn').attr('hld-auto-page', 'ok')
            }
        }
    }
    /**
     * 关键字屏蔽模块
     * @name keywordsBlock
     * @description 此模块提供了关键字屏蔽功能
     *              提供一个高级配置可以设置是否过滤标题
     */
    const keywordsBlock = {
        name: 'keywordsBlock',
        settings: [{
            type: 'normal',
            key: 'keywordsBlock',
            default: true,
            title: '关键字屏蔽',
            menu: 'right',
            extra: {
                type: 'button',
                label: '关键字管理',
                id: 'hld__keywords_manage'
            }
        }, {
            type: 'advanced',
            key: 'kwdBlockContent',
            default: 'ALL',
            options: [{
                label: '标题跟正文',
                value: 'ALL'
            }, {
                label: '仅标题',
                value: 'TITLE'
            }, {
                label: '仅正文',
                value: 'BODY'
            }],
            title: '关键字屏蔽方式',
            desc: '此配置表示关键字的屏蔽方式',
            menu: 'right'
        }],
        keywordsList: [],
        initFunc: function () {
            const _this = this
            // 同步本地数据
            const localKeywordsList = window.localStorage.getItem('hld__NGA_keywords_list')
            try {
                localKeywordsList && (_this.keywordsList = JSON.parse(localKeywordsList))
            } catch {
                localKeywordsList && (_this.keywordsList = localKeywordsList.split(','))
                window.localStorage.setItem('hld__NGA_keywords_list', JSON.stringify(_this.keywordsList))
            }
            // 添加到导入导出配置
            script.getModule('backupModule').addItem({
                title: '关键字列表',
                writeKey: 'keywords_list',
                valueKey: 'keywordsList',
                module: this
            })
            /**
             * Bind:Click
             * 管理弹窗面板
             */
            $('body').on('click', '#hld__keywords_manage', function () {
                if($('#hld__keywords_panel').length > 0) return
                $('#hld__setting_cover').append(`<div id="hld__keywords_panel" class="hld__list-panel animated fadeInUp">
                <a href="javascript:void(0)" class="hld__setting-close">×</a>
                <div>
                <div class="hld__list-c"><p>屏蔽关键字</p><textarea row="20" id="hld__keywords_list_textarea"></textarea><p class="hld__list-desc">一行一条</p></div>
                </div>
                <div class="hld__btn-groups"><button class="hld__btn" id="hld__save_keywords">保存列表</button></div>
                </div>`)
                $('#hld__keywords_list_textarea').val(_this.keywordsList.join('\n'))
            })
            /**
             * Bind:Click
             * 保存关键字
             */
            $('body').on('click', '#hld__save_keywords', function () {
                let keywordsList = $('#hld__keywords_list_textarea').val().split('\n')
                keywordsList = _this.removeBlank(keywordsList)
                keywordsList = _this.uniq(keywordsList)
                _this.keywordsList = keywordsList
                window.localStorage.setItem('hld__NGA_keywords_list', JSON.stringify(_this.keywordsList))
                $('.hld__list-panel').remove()
                script.popMsg('保存成功，刷新页面生效')
            })
        },
        renderThreadsFunc: function ($el) {
            const title = $el.find('.c2>a').text()
            if ((script.setting.advanced.kwdBlockContent === 'ALL' || script.setting.advanced.kwdBlockContent === 'TITLE') && script.setting.normal.keywordsBlock && this.keywordsList.length > 0) {
                for (let keyword of this.keywordsList) {
                    if (title.includes(keyword)) {
                        script.printLog(`关键字屏蔽：标题：${title}  连接：${$el.find('.c2>a').attr('href')}`)
                        $el.remove()
                        break
                    }
                }
            }
        },
        renderFormsFunc: function ($el) {
            const _this = this
            if (script.setting.normal.keywordsBlock && this.keywordsList.length > 0 && (script.setting.advanced.kwdBlockContent === 'ALL' || script.setting.advanced.kwdBlockContent === 'BODY')) {
                const $postcontent = $el.find('.postcontent')
                const $postcontentClone = $postcontent.clone()
                const consoleLog = (text) => script.printLog(`关键字屏蔽：内容：${text}`)
                let postcontentQuote = ''
                let postcontentText = ''

                if ($postcontent.find('.quote').length > 0) {
                    $postcontentClone.find('.quote').remove()
                    let postcontentText = $postcontent.find('.quote').text()
                    const endIndex = postcontentText.indexOf(')')
                    postcontentQuote = postcontentText.substring(endIndex + 1)
                }

                postcontentText = $postcontentClone.text()
                let blockCount = 0
                for (let keyword of this.keywordsList) {
                    if (postcontentText && postcontentText.includes(keyword)) {
                        consoleLog(postcontentText)
                        $el.remove()
                        blockCount += 1
                        break
                    }
                    if (postcontentQuote && postcontentQuote.includes(keyword)) {
                        consoleLog(postcontentQuote)
                        blockCount += 1
                        $postcontent.find('.quote').remove()
                    }
                }
                const $commentCList = $el.find('.comment_c')
                if ($commentCList.length > 0) {
                    let postcontentReply = ''
                    $commentCList.each(function () {
                        let postcontentReplyText = $el.find('.ubbcode').text()
                        const end_index = postcontentReplyText.indexOf(')')
                        postcontentReply = postcontentReplyText.substring(end_index + 1)
                        for (let keyword of _this.keywordsList) {
                            if (postcontentReply && postcontentReply.includes(keyword)) {
                                consoleLog(postcontentReply)
                                blockCount += 1
                                $(this).remove()
                            }
                        }
                    })
                }
            }
        },
        /**
         * 列表去空
         * @method removeBlank
         * @param {Array} array 列表
         * @return {Array} 处理后的列表
         */
        removeBlank: function (array) {
            let r = []
            array.map(function (val, index) {
                if (val !== '' && val != undefined) {
                    r.push(val)
                }
            });
            return r
        },
        /**
         * 列表去重
         * @method uniq
         * @param {Array} array 列表
         * @return {Array} 处理后的列表
         */
        uniq: function (array) {
            return [...new Set(array)]
        },
        style: `
        #hld__keywords_panel {width:182px;}
        #hld__keywords_panel .hld__list-c {width:100%;}
        `
    }
    /**
     * 黑名单标记模块
     * @name markAndBan
     * @description 此模块提供了黑名单屏蔽功能，标签标记功能
     *              提供高级配置可以设置标记/备注风格
     *              提供高级配置可以设置功能面板显示方式
     *              提供高级配置可以设置黑名单屏蔽策略
     */
    const markAndBan = {
        name: 'markAndBan',
        settings: [{
            type: 'normal',
            key: 'markAndBan',
            default: true,
            title: '拉黑/标签功能',
            menu: 'right',
            extra: {
                type: 'button',
                label: '名单管理',
                id: 'hld__list_manage'
            }
        }, {
            type: 'advanced',
            key: 'classicRemark',
            default: false,
            title: '经典备注风格',
            desc: '此配置表示标记功能的风格显示\n选中时：v2.9及以前的备注风格(仿微博)，此风格不能更改颜色\n取消时：新版标记风格',
            menu: 'right'
        }, {
            type: 'advanced',
            key: 'autoHideBanIcon',
            default: false,
            title: '按需显示标注拉黑按钮',
            desc: '选中时：默认隐藏标注与拉黑按钮, 当鼠标停留区域时, 才会显示\n取消时：一直显示',
            menu: 'right'
        }, {
            type: 'advanced',
            key: 'banStrictMode',
            default: 'HIDE',
            options: [{
                label: '屏蔽',
                value: 'HIDE'
            }, {
                label: '删除',
                value: 'REMOVE'
            }, {
                label: '全部删除',
                value: 'ALL'
            }],
            title: '拉黑模式',
            desc: '此配置表示拉黑某人后对帖子的屏蔽策略\n屏蔽：保留楼层, 仅会屏蔽用户的回复\n删除：将会删除楼层\n全部删除: 回复被拉黑用户的回复也会被删除',
            menu: 'right'
        }],
        banList: [],
        markList: [],
        markedTags: [],
        initFunc: function () {
            const _this = this
            // 读取本地数据
            const localBanList = window.localStorage.getItem('hld__NGA_ban_list')
            try {
                localBanList && (_this.banList = JSON.parse(localBanList))
            } catch {
                window.localStorage.setItem('hld__NGA_ban_list_bak', localBanList)
                window.localStorage.removeItem('hld__NGA_ban_list')
                script.throwError('【NGA-Script】无法加载黑名单列表，数据解析失败\n黑名单已清空，之前的数据已经备份到hld__NGA_ban_list_bak\n请在控制台中的localStorage中查看')
            }
            const localMarkList = window.localStorage.getItem('hld__NGA_mark_list')
            try {
                if (localMarkList) {
                    _this.markList = JSON.parse(localMarkList)
                    // 统计已添加过的标签
                    _this.markList.forEach(item => {
                        item.marks.forEach(mark => {
                            const exist_tag = _this.markedTags.find(t => t.mark == mark.mark)
                            if (exist_tag) {
                                exist_tag.count += 1
                            } else {
                                _this.markedTags.push({
                                    mark: mark.mark,
                                    text_color: mark.text_color,
                                    bg_color: mark.bg_color,
                                    count: 1
                                })
                            }
                        })
                    })
                    _this.markedTags.sort((a, b) => {return b.count - a.count})
                }
            } catch {
                window.localStorage.setItem('hld__NGA_mark_list_bak', localMarkList)
                window.localStorage.removeItem('hld__NGA_mark_list')
                script.throwError('【NGA-Script】无法加载标记列表，数据解析失败\n标记列表已清空，之前的数据已经备份到hld__NGA_mark_list_bak\n请在控制台中的localStorage中查看')
            }
            // 添加到导入导出配置
            script.getModule('backupModule').addItem({
                title: '黑名单列表',
                writeKey: 'ban_list',
                valueKey: 'banList',
                module: this
            })
            script.getModule('backupModule').addItem({
                title: '标记名单列表',
                writeKey: 'mark_list',
                valueKey: 'markList',
                module: this
            })
            // 拉黑标签-名单
            if (script.setting.normal.markAndBan) {
                /**
                 * Bind:Click
                 * 操作按钮点击事件
                 */
                $('body').on('click', '.hld__extra-icon', function () {
                    const type = $(this).data('type')
                    const name = $(this).data('name')
                    const uid = $(this).data('uid') + ''
                    $('.hld__dialog').length > 0 && $('.hld__dialog').remove()
                    if (type == 'ban') {
                        _this.banlistPopup({
                            type: 'confirm',
                            name,
                            uid,
                            top: $(this).offset().top+20,
                            left: $(this).offset().left-10
                        })
                    }
                    if (type == 'mark') {
                        _this.userMarkPopup({
                            name,
                            uid,
                            top: $(this).offset().top+20,
                            left: $(this).offset().left-10
                        })
                    }
                })
                /**
                 * Bind:Click
                 * 屏蔽按钮
                 */
                $('body').on('click', '.hld__banned-block', function(){
                    if ($(this).parent().hasClass('quote')) {
                        $(this).parent().prev().show()
                        $(this).parent().hide()
                    } else {
                        $(this).prev().show()
                        $(this).hide()
                    }
                })
                /**
                 * Bind:Click
                 * 名单管理
                 */
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
                    <div class="hld__btn-groups" style="width: 100%;"><button class="hld__btn" id="hld__save_banlist">保存列表</button></div>
                    </div>
                    </div>`)
                    /**
                     * Bind:Click
                     * 切换选项卡
                     */
                    $('body').on('click', '.hld__tab-header > span', function(){
                        $('.hld__tab-header > span, .hld__tab-content').removeClass('hld__table-active')
                        $(this).addClass('hld__table-active')
                        $('.hld__tab-content').eq($(this).index()).addClass('hld__table-active')
                    })
                    /**
                     * Bind:Click
                     * 移除黑名单
                     */
                    $('body').on('click', '.hld__bl-del', function(){
                        const index = $(this).data('index')
                        _this.banList.splice(index, 1)
                        window.localStorage.setItem('hld__NGA_ban_list', JSON.stringify(_this.banList))
                        _this.reloadBanlist()
                    })
                    /**
                     * Bind:Click
                     * 添加黑名单
                     */
                    $('body').on('click', '#hld__banlist_add_btn', function(){
                        _this.banlistPopup({
                            type: 'add',
                            name: $(this).data('name'),
                            uid: $(this).data('uid'),
                            top: $(this).offset().top + 30,
                            left: $(this).offset().left - 5,
                            callback: () => {_this.reloadBanlist()}
                        })
                    })
                    /**
                     * Bind:Click
                     * 保存黑名单
                     */
                    $('body').on('click', '#hld__save_banlist', function(){
                        const banList = $('#hld__ban_list_textarea').val()
                        const markList = $('#hld__mark_list_textarea').val()
                        try {
                            _this.banList = JSON.parse(banList)
                            window.localStorage.setItem('hld__NGA_ban_list', banList)
                            _this.reloadBanlist()
                        } catch {
                            script.popMsg('黑名单数据有误！', 'err')
                            return
                        }
                        try {
                            _this.markList = JSON.parse(markList)
                            window.localStorage.setItem('hld__NGA_mark_list', markList)
                            _this.reloadMarklist()
                        } catch {
                            script.popMsg('标记单数据有误！', 'err')
                            return
                        }
                        script.popMsg('数据已成功')
                    })
                    /**
                     * Bind:Click
                     * 修改标记
                     */
                    $('body').on('click', '.hld__ml-edit', function(){
                        const name = $(this).data('name')
                        const uid = $(this).data('uid') + ''
                        _this.userMarkPopup({
                            name,
                            uid,
                            top: $(this).offset().top + 30,
                            left: $(this).offset().left - 5,
                            callback: () => {_this.reloadMarklist()}
                        })
                    })
                    /**
                     * Bind:Click
                     * 删除标记
                     */
                    $('body').on('click', '.hld__ml-del', function(){
                        const index = $(this).data('index')
                        _this.markList.splice(index, 1)
                        window.localStorage.setItem('hld__NGA_mark_list', JSON.stringify(_this.markList))
                        _this.reloadMarklist()
                    })
                    /**
                     * Bind:Click
                     * 添加标记
                     */
                    $('body').on('click', '#hld__marklist_add_btn', function(){
                        _this.userMarkPopup({
                            type: 'add',
                            name: $(this).data('name'),
                            uid: $(this).data('uid'),
                            top: $(this).offset().top + 30,
                            left: $(this).offset().left - 5,
                            callback: () => {_this.reloadMarklist()}
                        })
                    })
                    //重载名单
                    _this.reloadBanlist()
                    _this.reloadMarklist()
                })
            }
        },
        renderThreadsFunc: function($el) {
            const title = $el.find('.c2>a').text()
            const uid = ($el.find('.author').attr('href') && $el.find('.author').attr('href').indexOf('uid=') > -1) ? $el.find('.author').attr('href').split('uid=')[1] + '' : ''
            const name = $el.find('.author').text()
            if (script.setting.normal.markAndBan) {
                const banUser = this.getBanUser({name, uid})
                //黑名单屏蔽
                if (this.banList.length > 0 && banUser) {
                    script.printLog(`黑名单屏蔽：标题：${title}  连接：${$el.find('.c2>a').attr('href')}`)
                    $el.parents('tbody').remove()
                }
            }
        },
        renderFormsFunc: function($el) {
            const _this = this
            if (script.setting.normal.markAndBan) {
                // 插入操作面板
                const currentUid = $el.find('[name=uid]').text() + ''
                $el.find('.small_colored_text_btn.block_txt_c2.stxt').each(function () {
                    let currentName = ''
                    if ($(this).parents('td').prev('td').html() == '') {
                        currentName = $(this).parents('table').prev('.posterinfo').children('.author').text()
                    } else {
                        currentName = $(this).parents('td').prev('td').find('.author').text()
                    }
                    currentName.endsWith('楼主') && (currentName = currentName.substr(0, currentName.length - 4))
                    const mbDom = `<a class="hld__extra-icon" data-type="mark" title="标签此用户" data-name="${currentName}" data-uid="${currentUid}"><svg t="1686732786072" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="2385" width="200" height="200"><path d="M900.64 379.808l-263.072-256.032c-36.448-35.328-105.76-35.392-142.304 0.096l-327.04 319.904c-56.416 54.72-70.72 76.704-70.72 150.976l0 143.936c0 132.768 26.976 192 186.912 192l131.872 0c81.12 0 128.448-46.656 193.952-111.264l290.016-297.696c18.592-17.984 29.248-43.968 29.248-71.264C929.504 423.36 918.976 397.6 900.64 379.808zM323.008 786.752c-52.928 0-96-43.072-96-96s43.072-96 96-96 96 43.072 96 96S375.936 786.752 323.008 786.752z" fill="#3970fe" p-id="2386" data-spm-anchor-id="a313x.7781069.0.i0" class="selected"></path></svg></a><a class="hld__extra-icon" title="拉黑此用户(屏蔽所有言论)" data-type="ban"  data-name="${currentName}" data-uid="${currentUid}"><svg t="1686733137783" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="12682" width="200" height="200"><path d="M512 0a512 512 0 1 0 0 1024 512 512 0 0 0 0-1024zM204.8 409.6h614.4v204.8H204.8V409.6z" fill="#d00309" p-id="12683" data-spm-anchor-id="a313x.7781069.0.i10" class="selected"></path></svg></a>`
                    script.setting.advanced.autoHideBanIcon ? $(this).after(`<span class="hld__extra-icon-box">${mbDom}</span>`) : $(this).append(mbDom)
                })
                // 标记DOm
                $el.find('a.b').each(function () {
                    const uid = ($(this).attr('href') && $(this).attr('href').indexOf('uid=') > -1) ? $(this).attr('href').split('uid=')[1] + '' : ''
                    let name = ''
                    if ($(this).find('span.hld__post-author').length > 0 || $(this).find('span.hld__remark').length > 0) {
                        const $a = $(this).clone()
                        $a.find('span.hld__post-author, span.hld__remark').remove()
                        name = $a.text()
                    } else {
                        name = $(this).attr('hld-mark-before-name') || $(this).text().replace('[', '').replace(']', '')
                    }
                    const banUser = _this.getBanUser({name, uid})
                    if (banUser) {
                        //拉黑用户实现
                        if (script.setting.advanced.banStrictMode == 'HIDE') {
                            if ($(this).hasClass('author')) {
                                if ($(this).parents('div.comment_c').length > 0) {
                                    $(this).parents('div.comment_c').find('.ubbcode').hide()
                                    $(this).parents('div.comment_c').find('.ubbcode').after('<span class="hld__banned hld__banned-block">此用户在你的黑名单中，已屏蔽其言论，点击查看</span>')
                                } else {
                                    $(this).parents('.forumbox.postbox').find('.c2 .postcontent').hide()
                                    $(this).parents('.forumbox.postbox').find('.c2 .postcontent').after('<span class="hld__banned hld__banned-block">此用户在你的黑名单中，已屏蔽其言论，点击查看</span>')
                                }
                            } else {
                                if (!$(this).parent().is(':hidden')) {
                                    $(this).parent().hide()
                                    $(this).parent().after('<div class="quote"><span class="hld__banned hld__banned-block">此用户在你的黑名单中，已屏蔽其言论，点击查看</span></div>')
                                }
                            }
                        } else if (script.setting.advanced.banStrictMode == 'ALL') {
                            if ($(this).parents('div.comment_c').length > 0) $(this).parents('div.comment_c').remove()
                            else $(this).parents('.forumbox.postbox').remove()
                        } else {
                            if ($(this).hasClass('author')) {
                                if ($(this).parents('div.comment_c').length > 0) $(this).parents('div.comment_c').remove()
                                else $(this).parents('.forumbox.postbox').remove()
                            } else {
                                $(this).parent().html('<span class="hld__banned">此用户在你的黑名单中，已删除其言论</span>')
                            }
                        }
                        script.printLog(`黑名单屏蔽：用户：${name}, UID:${uid}`)
                    }
                    if(script.setting.advanced.classicRemark) {
                        //经典备注风格
                        const userMarks = _this.getUserMarks({name, uid})
                        if (userMarks) {
                            let f = []
                            userMarks.marks.forEach(e => f.push(e.mark))
                            $(this).attr('hld-mark-before-name', name).append(`<span class="hld__remark"> (${f.join(', ')}) </span>`)
                        }
                    }else {
                        //新版标签风格
                        const userMarks = _this.getUserMarks({name, uid})
                        if(userMarks) {
                            const $el = $(this).parents('.c1').find('.clickextend')
                            let marksDom = ''
                            userMarks.marks.forEach(item => marksDom += `<span style="color: ${item.text_color};background-color: ${item.bg_color};" title="${item.mark}">${item.mark}</span>`);
                            $el.before(`<div class="hld__marks-container">标签: ${marksDom}</div>`)
                        }
                    }
                })
            }
        },
        /**
         * 黑名单弹窗
         * @method banlistPopup
         * @param {Object} setting 设置项
         * @param {String} setting.name 用户昵称
         * @param {String} setting.uid UID
         * @param {String} setting.type 模式
         * @param {Number} setting.top  pos.top位置
         * @param {Number} setting.left pos.left 位置
         * @param {Function} setting.callback 回调函数
         */
        banlistPopup: function (setting) {
            const _this = this
            $('.hld__dialog').length > 0 && $('.hld__dialog').remove()
            const retainWord = [':', '(', ')', '&', '#', '^', ',']
            let $banDialog = $(`<div class="hld__dialog hld__dialog-sub-top hld__list-panel animated zoomIn"  style="top: ${setting.top}px;left: ${setting.left}px;"><a href="javascript:void(0)" class="hld__setting-close">×</a><div id="container_dom"></div><div class="hld__dialog-buttons"></div></div>`)
            if (setting.type == 'confirm') {
                $banDialog.find('#container_dom').append(`<div><span>您确定要拉黑用户</span><span class="hld__dialog-user">${setting.name}</span><span>吗？</span></div>`)
                let $okBtn = $('<button class="hld__btn">拉黑</button>')
                $okBtn.click(function(){
                    const banObj = {name: setting.name, uid: setting.uid}
                    !_this.getBanUser(banObj) && _this.banList.push(banObj)
                    window.localStorage.setItem('hld__NGA_ban_list', JSON.stringify(_this.banList))
                    $('.hld__dialog').remove()
                    script.popMsg('拉黑成功，重载页面生效')
                })
                $banDialog.find('.hld__dialog-buttons').append($okBtn)
            }else if (setting.type == 'add') {
                $banDialog.find('#container_dom').append(`<div>添加用户：</div><div><input id="hld__dialog_add_uid" type="text" value="" placeholder="UID"></div><div><input id="hld__dialog_add_name" type="text" value="" placeholder="用户名"></div>`)
                let $okBtn = $('<button class="hld__btn">添加</button>')
                $okBtn.click(function(){
                    const name = $banDialog.find('#hld__dialog_add_name').val().trim()
                    const uid = $banDialog.find('#hld__dialog_add_uid').val().trim() + ''
                    if (!name && !uid) {
                        script.popMsg('UID与用户名必填一个，其中UID权重较大', 'err')
                        return
                    }
                    !_this.getBanUser({name, uid}) && _this.banList.push({name, uid})
                    window.localStorage.setItem('hld__NGA_ban_list', JSON.stringify(_this.banList))
                    $('.hld__dialog').remove()
                    setting.callback()
                })
                $banDialog.find('.hld__dialog-buttons').append($okBtn)
            }
            $('body').append($banDialog)
        },
        /**
         * 获取黑名单用户
         * @method getBanUser
         * @param {Object} banObj 黑名单对象
         * @return {Object|null} 获取的用户对象
         */
        getBanUser: function (banObj) {
            const _this = this
            for (let u of _this.banList) {
                if ((u.uid && banObj.uid && u.uid == banObj.uid) || 
                    (u.name && banObj.name && u.name == banObj.name)) {
                    if ((!u.uid && banObj.uid) || (!u.name && banObj.name)) {
                        u.uid = banObj.uid + '' || ''
                        u.name = banObj.name || ''
                        window.localStorage.setItem('hld__NGA_ban_list', JSON.stringify(_this.banList))
                    }
                    return u
                }
            }
            return null
        },
        /**
         * 重新渲染黑名单列表
         * @method reloadBanlist
         */
        reloadBanlist: function () {
            const _this = this
            $('#hld__banlist').empty()
            _this.banList.forEach((item, index) => $('#hld__banlist').append(`
                <tr>
                    <td title="${item.name}">${item.name}</td>
                    <td title="${item.uid}">${item.uid}</td>
                    <td>
                        <span class="hld__us-action hld__us-del hld__bl-del" title="删除" data-index="${index}" data-name="${item.name}" data-uid="${item.uid}">
                            <svg t="1686881304570" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="2976" width="48" height="48"><path d="M341.312 85.312l64-85.312h213.376l64 85.312H960v85.376H64V85.312h277.312zM170.688 256h682.624v768H170.688V256zM256 341.312v597.376h512V341.312H256z m213.312 85.376v426.624H384V426.688h85.312z m170.688 0v426.624H554.688V426.688H640z" fill="#111111" p-id="2977"></path></svg>
                        </span>
                    </td>
                </tr>
            `))
            $('#hld__ban_list_textarea').val(JSON.stringify(_this.banList))
        },
        /**
         * 重新渲染标签列表
         * @method reloadMarklist
         */
        reloadMarklist: function () {
            const _this = this
            $('#hld__marklist').empty()
            _this.markList.forEach((user_mark, index) => {
                $('#hld__marklist').append(`
                    <tr>
                        <td title="${user_mark.name}">${user_mark.name}</td>
                        <td title="${user_mark.uid}">${user_mark.uid}</td>
                        <td title="${user_mark.marks.length}">${user_mark.marks.length}</td>
                        <td>
                            <span class="hld__us-action hld__us-edit hld__ml-edit" title="编辑" data-index="${index}" data-name="${user_mark.name}" data-uid="${user_mark.uid}">
                                <svg t="1686881523486" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="4234" width="48" height="48"><path d="M652.4 156.6125a112.5 112.5 0 1 1 155.925 161.15625L731.375 394.71875 572.3 235.5875l79.5375-79.5375 0.5625 0.5625zM333.63125 792.40625v0.1125H174.5v-159.1875l358.03125-357.975 159.075 159.13125-357.975 357.91875zM62 849.5h900v112.5H62v-112.5z" fill="#111111" p-id="4235"></path></svg>
                            </span>
                            <span class="hld__us-action hld__us-del hld__ml-del" title="删除" data-index="${index}" data-name="${user_mark.name}" data-uid="${user_mark.uid}">
                                <svg t="1686881304570" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="2976" width="48" height="48"><path d="M341.312 85.312l64-85.312h213.376l64 85.312H960v85.376H64V85.312h277.312zM170.688 256h682.624v768H170.688V256zM256 341.312v597.376h512V341.312H256z m213.312 85.376v426.624H384V426.688h85.312z m170.688 0v426.624H554.688V426.688H640z" fill="#111111" p-id="2977"></path></svg>
                            </span>
                        </td>
                    </tr>
                `)
            })
            $('#hld__mark_list_textarea').val(JSON.stringify(_this.markList))
        },
        /**
         * 标记弹窗
         * @method userMarkPopup
         * @param {Object} setting 设置项
         * @param {String} setting.name 用户名
         * @param {String} setting.uid UID
         * @param {String} setting.type 模式
         * @param {Number} setting.top  pos.top位置
         * @param {Number} setting.left pos.left 位置
         * @param {Function} setting.callback 回调函数
         */
        userMarkPopup: function (setting) {
            const _this = this
            $('.hld__dialog').length > 0 && $('.hld__dialog').remove()
            const retain_word = [':', '(', ')', '&', '#', '^', ',']
            let $markDialog = $(`<div class="hld__dialog hld__dialog-sub-top hld__list-panel animated zoomIn" style="top: ${setting.top}px;left: ${setting.left}px;">
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
            <div class="hld__dialog-buttons hld__button-insert" style="justify-content: left !important;"></div>
            <div class="hld__mark_history"><div class="hld__mark_history-title">选择已添加过的标签</div><div class="hld__mark_history-content"><div class="hld__mark_history-scrollarea">暂无</div></div></div>
            <div class="hld__dialog-buttons hld__button-save" style="justify-content: right !important;"></div>
            </div>`)
            const insertRemarkRow = (r='', t='#ffffff', b='#1f72f1', n=true) => {
                let $tr = $(`<tr>
                <td><input type="text" class="hld__mark-mark" value="${r}"></td>
                <td><input class="hld__dialog-color-picker hld__mark-text-color" value="${t}"></td>
                <td><input class="hld__dialog-color-picker hld__mark-bg-color" value="${b}"></td>
                <td><button title="删除此标签" class="hld__mark-del">x</button></td>
                </tr>`)
                $tr.find('.hld__mark-del').click(function(){$(this).parents('tr').remove()})
                $tr.find('.hld__dialog-color-picker').spectrum(script.getModule('authorMarkColor').colorPickerConfig)
                $markDialog.find('#hld__mark_body').append($tr)
                n && $tr.find('.hld__mark-mark').focus()
            }

            _this.markedTags.length > 0 && $markDialog.find('.hld__mark_history-scrollarea').empty()
            _this.markedTags.forEach(tag => {
                $markDialog.find('.hld__mark_history-scrollarea').append(`
                    <span title="${tag.mark}" textcolor="${tag.text_color}" bgcolor="${tag.bg_color}" style="color: ${tag.text_color};background-color: ${tag.bg_color};">${tag.mark} (${tag.count})</span>
                `)
            })
            $markDialog.on('click', '.hld__mark_history-scrollarea > span', function (e) {
                insertRemarkRow($(this).attr('title'), $(this).attr('textcolor'), $(this).attr('bgcolor'), false)
            })

            //恢复标签
            const existMark = _this.getUserMarks({name: setting.name, uid: setting.uid})
            existMark !== null && existMark.marks.forEach(item => insertRemarkRow(item.mark, item.text_color, item.bg_color, false))

            let $addBtn = $('<button class="hld__btn">+添加新标签</button>')
            $addBtn.click(() => insertRemarkRow())
            $markDialog.find('.hld__button-insert').append($addBtn)
            let $okBtn = $('<button class="hld__btn">保存</button>')

            $okBtn.click(function(){
                let userMarks = {marks: []}
                if (setting.type == 'add') {
                    userMarks.name = $markDialog.find('#hld__dialog_add_name').val().trim()
                    userMarks.uid = $markDialog.find('#hld__dialog_add_uid').val().trim() + ''
                } else {
                    userMarks.name = setting.name
                    userMarks.uid = setting.uid + ''
                }
                if (!userMarks.name && !userMarks.uid) {
                    script.popMsg('UID与用户名必填一个，其中UID权重较大', 'err')
                    return
                }
                $('#hld__mark_body > tr').each(function(){
                    const mark = $(this).find('.hld__mark-mark').val().trim()
                    const textColor = $(this).find('.hld__mark-text-color').val()
                    const bgColor = $(this).find('.hld__mark-bg-color').val()
                    if(mark) {
                        userMarks.marks.push({mark, text_color: textColor, bg_color: bgColor})
                    }
                })
                if (setting.type == 'add' && userMarks.marks.length == 0) {
                    script.popMsg('至少添加一个标签内容', 'err')
                    return
                }
                _this.setUserMarks(userMarks)
                script.popMsg('保存成功，重载页面生效')
                $('.hld__dialog').remove()
                setting.callback()
            })
            $markDialog.find('.hld__button-save').append($okBtn)
            $('body').append($markDialog)
            $('.hld__dialog-color-picker').spectrum(script.getModule('authorMarkColor').colorPickerConfig)
        },
        /**
         * 获取用户标签对象
         * @method getUserMarks
         * @param {String} uid UID
         * @param {String} user 用户名
         * @return {Object|null} 标签对象
         */
        getUserMarks: function (user) {
            const _this = this
            const check = _this.markList.findIndex(v => (v.uid && user.uid && v.uid == user.uid) || 
            (v.name && user.name && v.name == user.name))
            if(check > -1) {
                let userMark = _this.markList[check]
                if ((!userMark.uid && user.uid) || (!userMark.name && user.name)) {
                    userMark.uid = user.uid + '' || ''
                    userMark.name = user.name || ''
                    window.localStorage.setItem('hld__NGA_mark_list', JSON.stringify(_this.markList))
                }
                return _this.markList[check]
            } else {
                return null
            }
        },
        /**
         * 保存标签
         * @method setUserMarks
         * @param {Object} userMarks 标签对象
         */
        setUserMarks: function (userMarks) {
            // 检查是否已有标签
            const _this = this
            const check = _this.markList.findIndex(v => (v.uid && userMarks.uid && v.uid == userMarks.uid) || 
            (v.name && userMarks.name && v.name == userMarks.name))
            if(check > -1) {
                if (userMarks.marks.length == 0) {
                    _this.markList.splice(check, 1)
                } else {
                    _this.markList[check] = userMarks
                }
            }else {
                _this.markList.push(userMarks)
            }
            window.localStorage.setItem('hld__NGA_mark_list', JSON.stringify(_this.markList))
        },
        style: `
        #hld__setting {color:#6666CC !important;cursor:pointer;}
        .hld__list-panel {position:fixed;background:#fff8e7;padding:15px 20px;border-radius:10px;box-shadow:0 0 10px #666;border:1px solid #591804;z-index:9999;}
        #hld__banlist_panel {width:500px;}
        #hld__keywords_panel {width:182px;}
        .hld__extra-icon-box {padding: 5px 5px 5px 0;opacity: 0;transition: all ease .2s;}
        .hld__extra-icon-box:hover {opacity: 1;}
        .hld__extra-icon {position: relative;padding:0 4px;background-repeat:no-repeat;background-position:center;}
        .hld__extra-icon svg {width:1em;height:1em;vertical-align:-0.15em;fill:currentColor;overflow:hidden;cursor:pointer;}
        .hld__extra-icon:hover {text-decoration:none;}
        span.hld__remark {color:#666;font-size:0.8em;}
        span.hld__banned {color:#ba2026;}
        span.hld__banned-block:hover {text-decoration: underline;cursor: pointer;}
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
        .hld__mark_history {margin-top: 10px;}
        .hld__mark_history .hld__mark_history-title {font-weight: bold;}
        .hld__mark_history .hld__mark_history-content {max-height: 200px;overflow: hidden;overflow-y: scroll;}
        .hld__mark_history .hld__mark_history-scrollarea  {display: flex;flex-wrap: wrap;width:250px;}
        .hld__mark_history .hld__mark_history-content span {display: inline-block;padding: 2px 5px;border-radius: 3px;margin-right: 5px;margin-top: 5px;line-height: 20px;cursor: pointer;}
        .hld__tab-content {display:flex;justify-content:space-between;flex-wrap: wrap;}
        .hld__table-keyword {margin-top:10px;width:200px;}
        .hld__table-keyword tr td:last-child {text-align:center;}
        .hld__table-keyword input[type=text] {width:48px;text-transform:uppercase;text-align:center;}
        .hld__tab-header{height:40px}
        .hld__tab-header>span{margin-right:10px;padding:5px;cursor:pointer}
        .hld__tab-header .hld__table-active,.hld__tab-header>span:hover{color:#591804;font-weight:700;border-bottom:3px solid #591804}
        .hld__tab-content{display:none}
        .hld__tab-content.hld__table-active{display:flex}
        .hld__marks-container>span{display: inline-block;padding:1px 5px;border-radius:3px;margin-right:5px;margin-top:5px;color:#fff;background-color:#1f72f1}
        .hld__table{table-layout:fixed;border-top:1px solid #ead5bc;border-left:1px solid #ead5bc}
        .hld__table-banlist-buttons{margin-top:10px}
        .hld__table thead{background:#591804;border:1px solid #591804;color:#fff}
        .hld__scroll-area{position:relative;height:200px;overflow:auto;border:1px solid #ead5bc}
        .hld__scroll-area::-webkit-scrollbar{width:6px;height:6px}
        .hld__scroll-area::-webkit-scrollbar-thumb{border-radius:10px;box-shadow:inset 0 0 5px rgba(0,0,0,.2);background:#591804}
        .hld__scroll-area::-webkit-scrollbar-track{box-shadow:inset 0 0 5px rgba(0,0,0,.2);border-radius:10px;background:#ededed}
        .hld__table td,.hld__table th{padding:3px 5px;border-bottom:1px solid #ead5bc;border-right:1px solid #ead5bc;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
        .hld__us-action{display: inline-block;width:18px;height:18px;margin:0 3px;}
        .hld__us-action svg{width:100%;height:100%;}
        .hld__us-action:hover{opacity:.8}
        `
    }
    /**
     * 护眼模式
     * @name eyeCareMode
     * @description 此模块提供了护眼模式（绿色）
     */
    const eyeCareMode = {
        name: 'eyeCareMode',
        setting: {
            type: 'normal',
            key: 'eyeCareMode',
            default: false,
            title: '护眼模式',
            desc: 'NGA自带的界面色调会与此功能有一定冲突\n使用前请先将NGA的界面色调设置为默认',
            menu: 'left'
        },
        mainColor: '#cce8cc', // 主背景颜色
        textColor: '#10273f', //文字颜色
        buttonColor: '#c7edcc', // 按钮颜色
        borderColor: '#ffffff', // 边框颜色
        initFunc: function () {
            script.setting.normal.eyeCareMode && $('body').addClass('hld__eye-care')
        },
        asyncStyle: function () {
            return `
            body.hld__eye-care, .hld__eye-care #msg_block_c .menu a, #msg_block_c .pager a, .hld__eye-care .nav_link, .hld__eye-care button.hld__btn:hover {color: ${this.textColor} !important;}
            .hld__eye-care body, .hld__eye-care .stdbtn, .hld__eye-care .stdbtn .innerbg, .hld__eye-care .stdbtn a, .hld__eye-care .nav_root,
            .hld__eye-care .nav_link, .hld__eye-care .nav_spr, .hld__eye-care .stdbtn a:hover, .hld__eye-care .row2c1, .hld__eye-care .row1c1,
            .hld__eye-care .c1, .hld__eye-care .c2, .hld__eye-care .c3, .hld__eye-care .c4, .hld__eye-care .catenew,
            .hld__eye-care .cateblock, .hld__eye-care .forumbox, .hld__eye-care .quote, .hld__eye-care textarea, .hld__eye-care select, .hld__eye-care input,
            .hld__eye-care #m_posts .white, .hld__eye-care #m_posts .block_txt_c0, .hld__eye-care #m_posts .block_txt_c2, .hld__eye-care .block_txt_c3, .hld__eye-care .block_txt, .hld__eye-care .hld__docker-sidebar,
            .hld__eye-care .hld__docker-btns > div, .hld__eye-care .forumbox th, .hld__eye-care .contentBlock, .hld__eye-care .catenew .b2, .hld__eye-care .catenew .b3,
            .hld__eye-care .catenew h2, .hld__eye-care .catenew div, .hld__eye-care .topicrow .c2 > span:first-child, .hld__eye-care .urltip.nobr,
            .hld__eye-care #hld__setting_panel, .hld__eye-care .hld__list-panel, .hld__eye-care .single_ttip2 .tip_title, .hld__eye-care .single_ttip2 .div2,
            .hld__eye-care  .postBtnPos > div, .hld__eye-care .postBtnPos .stdbtn a, .hld__eye-care .postbtnsc td, .hld__eye-care #mc > div:not(.module_wrap):not(#mainmenu), .hld__eye-care #m_nav > div:not(.nav),
            .hld__eye-care {background-color: ${this.mainColor} !important;}
            .hld__eye-care .nav_root, .hld__eye-care .nav_link, .hld__eye-care .nav_spr, .hld__eye-care .stdbtn, .hld__eye-care .quote, .hld__eye-care textarea,
            .hld__eye-care select, .hld__eye-care input, .hld__eye-care .block_txt_c2, .hld__eye-care .block_txt_c3, .hld__eye-care .hld__docker-btns>div,
            .hld__eye-care .r_container, .hld__eye-care .forumbox .postrow .stat {border:1px solid ${this.borderColor} !important;}
            .hld__eye-care .b .block_txt, .hld__eye-care .block_txt.block_txt_c0 {color: #1a3959 !important;padding:0 !important;}
            .hld__eye-care .forumbox.postbox {border-bottom: 2px solid  ${this.borderColor} !important;border: none !important;}
            .hld__eye-care .r_bar {background-color:  ${this.borderColor};}
            .hld__eye-care .forumbox .postrow .sigline, .hld__eye-care #m_posts .block_txt_c0 {color:  ${this.borderColor} !important;border-color:  ${this.borderColor} !important;}
            .hld__eye-care .nav_root, .hld__eye-care .invert, .hld__eye-care #mainmenu .stdbtn .half, .hld__eye-care .catenew .invert .uitxt1, .hld__eye-care .catenew .invert .uitxt3 {color:#591804;}
            .hld__eye-care:not(.hld__excel-body) #mainmenu {border-bottom: 1px solid  ${this.borderColor} !important;}
            .hld__eye-care #m_posts, .hld__eye-care #toptopics, .hld__eye-care #topicrows, .hld__eye-care #mc > div:not(.module_wrap):not(#mainmenu),
            .hld__eye-care #msg_block_c .subblock {box-shadow:none;border-color:  ${this.borderColor} !important;}
            .hld__eye-care .stdbtn a, .hld__eye-care .hld__advanced-setting, .hld__eye-care .hld__docker-sidebar {border-color:  ${this.borderColor};}
            .hld__eye-care .block_txt.block_txt_c3 {border:none !important;}
            .hld__eye-care button, .hld__eye-care .hld__setting-close, .hld__eye-care .colored_text_btn, .hld__eye-care .rep.block_txt_big {border: 1px solid ${this.borderColor} !important;background: ${this.buttonColor} !important;}
            .hld__eye-care #toppedtopic table, .hld__eye-care .single_ttip2 .tip_title, .hld__eye-care .collapse_btn {border-color:  ${this.borderColor} !important;}
            .hld__eye-care .apd {color: ${this.borderColor} !important;}
            .hld__eye-care .forumbox td:not(.c0) {border-color:  ${this.borderColor} !important;border-bottom: 1px solid  ${this.borderColor};border-right: 1px solid  ${this.borderColor};}
            .hld__eye-care .c4 {border-right:none !important;}
            /* Excel 适配 */
            .hld__eye-care.hld__excel-body .hld__quote-box, .hld__eye-care.hld__excel-body #m_pbtnbtm td a {background: ${this.mainColor};}
            .hld__eye-care.hld__excel-body #postbbtm .stdbtn, .hld__eye-care.hld__excel-body #postbbtm td a {background: #FFF !important;}
            .hld__eye-care.hld__excel-body .nav_root, .hld__eye-care.hld__excel-body .nav_spr,.hld__eye-care.hld__excel-body .nav_link,
            .hld__eye-care.hld__excel-body #mainmenu .stdbtn, .hld__eye-care.hld__excel-body #mainmenu .innerbg, .hld__eye-care.hld__excel-body #mainmenu .stdbtn a {background: none !important;border: none !important;}
            .hld__eye-care.hld__excel-body #mainmenu .mmdefault.cell input {background-color:#ededed !important;border-color: #c9d0dc !important;}
            `
        }
    }
    /**
     * 暗黑模式
     * @name darkMode
     * @description 此模块提供了暗黑主题(仿Github Dark efault Theme)
     */
    const darkMode = {
        name: 'darkMode',
        setting: {
            type: 'normal',
            key: 'darkMode',
            default: false,
            title: '暗黑模式',
            desc: 'NGA自带的界面色调会与此功能有一定冲突\n使用前请先将NGA的界面色调设置为默认\n与Excel模式不兼容，请勿混用',
            menu: 'left'
        },
        mainColor: '#0c1117', // 主背景颜色
        minorColor: '#141b22', // 次要背景颜色
        textColor: '#e6edf3', // 文字颜色
        muteColor: '#7d8590', // 次要文字颜色
        linkColor: '#2f81f7', // 主链接颜色
        buttonColor: '#1f262d', // 按钮颜色
        buttonHoverColor: '#2e363d', // 按钮停留颜色
        borderColor: '#21262d', // 边框颜色
        initFunc: function () {
            script.setting.normal.darkMode && $('body').removeClass('hld__eye-care').addClass('hld__dark-mode')
        },
        asyncStyle: function () {
            return `
            body.hld__dark-mode, .hld__dark-mode #msg_block_c .menu a, #msg_block_c .pager a, .hld__dark-mode .nav_link, .hld__dark-mode button.hld__btn:hover {color: ${this.textColor} !important;}
            .hld__dark-mode #m_threads a, .hld__dark-mode .forumbox h2, .hld__dark-mode .forumbox h1, .hld__dark-mode textarea, .hld__dark-mode select, .hld__dark-mode input,
            .hld__dark-mode .catetitle {color:${this.textColor} !important;}
            .hld__dark-mode #m_threads a:hover {background-color:${this.buttonHoverColor} !important;}
            .hld__dark-mode svg, .hld__dark-mode svg path {fill:${this.textColor} !important;}
            .hld__dark-mode a, .hld__dark-mode .uitxt1, .hld__dark-mode #hld__setting_panel .hld__sp-title a, .hld__dark-mode .author, .hld__dark-mode #m_post .author .block_txt, .hld__dark-mode #m_posts .urlincontent,
            .hld__dark-mode .cell.rep, .hld__dark-mode .uitxt1 {color:${this.linkColor} !important;}
            .hld__dark-mode #hld__setting_panel, .hld__dark-mode .hld__list-panel, .hld__dark-mode .single_ttip2 {border-color:${this.borderColor};box-shadow:0 8px 24px #010409;}
            .hld__dark-mode #mainmenu .stdbtn a:hover {border-bottom:4px solid ${this.linkColor} !important;}
            .hld__dark-mode #m_threads .block_txt_c0, .hld__dark-mode .block_txt_c0 .iconfont, .hld__dark-mode .nav_root {background-color:${this.buttonColor} !important;}
            .hld__dark-mode .invert {color:${this.linkColor} !important;background-color:${this.minorColor} !important;}
            .hld__dark-mode .hld__scroll-area::-webkit-scrollbar-thumb {background:#9f9f9f !important;}
            .hld__dark-mode .innerbg, .hld__dark-mode .innerbg .mmdefault, .hld__dark-mode #usernamebg,
            .hld__dark-mode .hld__table thead {background-color:${this.minorColor} !important;color:${this.textColor} !important;}
            .hld__dark-mode .hld__tab-header > span.hld__table-active, .hld__dark-mode .hld__tab-header > span:hover {color:${this.linkColor} !important;border-color:${this.linkColor} !important;}
            .hld__dark-mode .hld__dialog-sub-top:before, .hld__dark-mode .nav_root_c {background-color:${this.mainColor} !important;border-color:${this.borderColor} !important;}
            .hld__dark-mode body, .hld__dark-mode .stdbtn, .hld__dark-mode .forumbox .topicrow .c3 > div:first-child, .hld__dark-mode .forumbox .topicrow .c4  > div:first-child,
            .hld__dark-mode .nav_link, .hld__dark-mode .nav_spr, .hld__dark-mode .row2c1, .hld__dark-mode .row1c1, .hld__dark-mode .uitxt1, .hld__dark-mode .nav_link,
            .hld__dark-mode .c1, .hld__dark-mode .c2, .hld__dark-mode .c3, .hld__dark-mode .c4, .hld__dark-mode .catenew, .hld__dark-mode .stdbtn a, .hld__dark-mode .block_txt,
            .hld__dark-mode .cateblock, .hld__dark-mode .forumbox, .hld__dark-mode .quote, .hld__dark-mode textarea, .hld__dark-mode select, .hld__dark-mode input,
            .hld__dark-mode #m_posts .white, .hld__dark-mode #m_posts .block_txt_c2, .hld__dark-mode .block_txt_c3, .hld__dark-mode .hld__docker-sidebar, .hld__dark-mode #hld__updated,
            .hld__dark-mode .hld__docker-btns > div, .hld__dark-mode .forumbox th, .hld__dark-mode .contentBlock, .hld__dark-mode .catenew .b2, .hld__dark-mode .catenew .b3,
            .hld__dark-mode .catenew h2, .hld__dark-mode .catenew div, .hld__dark-mode .topicrow .c2 > span:first-child, .hld__dark-mode .urltip.nobr, .hld__dark-mode #m_posts .small_colored_text_btn,
            .hld__dark-mode #hld__setting_panel, .hld__dark-mode .hld__list-panel, .hld__dark-mode .single_ttip2 .tip_title, .hld__dark-mode .single_ttip2 .div2, .hld__dark-mode #startmenu .recent,
            .hld__dark-mode .postBtnPos > div, .hld__dark-mode .postBtnPos .stdbtn a, .hld__dark-mode .postbtnsc td, .hld__dark-mode #mc > div:not(.module_wrap):not(#mainmenu), .hld__dark-mode #m_nav > div:not(.nav),
            .hld__dark-mode {background-color: ${this.mainColor} !important;}
            .hld__dark-mode .nav_root, .hld__dark-mode .nav_link, .hld__dark-mode .nav_spr, .hld__dark-mode .stdbtn, .hld__dark-mode .quote, .hld__dark-mode textarea,
            .hld__dark-mode select, .hld__dark-mode input, .hld__dark-mode .block_txt_c2, .hld__dark-mode .block_txt_c3, .hld__dark-mode .hld__docker-btns>div,
            .hld__dark-mode .r_container, .hld__dark-mode .forumbox .postrow .stat {border:1px solid ${this.borderColor} !important;}
            .hld__dark-mode .b .block_txt, .hld__dark-mode .block_txt.block_txt_c0 {color: ${this.linkColor} !important;padding:0 !important;}
            .hld__dark-mode .forumbox.postbox {border-bottom: 2px solid  ${this.borderColor} !important;border: none !important;}
            .hld__dark-mode .r_bar {background-color:  ${this.borderColor};}
            .hld__dark-mode .nav_root, .hld__dark-mode .invert, .hld__dark-mode #mainmenu .stdbtn .half, .hld__dark-mode .catenew .invert .uitxt1, .hld__dark-mode .catenew .invert .uitxt3,
            .hld__dark-mode .single_ttip2 .tip_title, .hld__dark-mode #startmenu .item > a {color:${this.textColor} !important;}
            .hld__dark-mode:not(.hld__excel-body) #mainmenu {border-bottom: 1px solid  ${this.borderColor} !important;}
            .hld__dark-mode #m_posts, .hld__dark-mode #toptopics, .hld__dark-mode #topicrows, .hld__dark-mode #mc > div:not(.module_wrap):not(#mainmenu),
            .hld__dark-mode #msg_block_c .subblock, .hld__dark-mode #hld__updated {box-shadow:none;border-color:  ${this.borderColor} !important;}
            .hld__dark-mode .stdbtn a, .hld__dark-mode .hld__advanced-setting, .hld__dark-mode .hld__docker-sidebar {border-color:  ${this.borderColor};}
            .hld__dark-mode .block_txt.block_txt_c3 {border:none !important;}
            .hld__dark-mode button, .hld__dark-mode .hld__setting-close, .hld__dark-mode .colored_text_btn, .hld__dark-mode .rep.block_txt_big,
            .hld__dark-mode #main a {border: 1px solid ${this.borderColor} !important;background: ${this.buttonColor} !important;color:#c9d1d9 !important;box-shadow:none !important;}
            .hld__dark-mode button:hover {background:${this.buttonHoverColor} !important;}
            .hld__dark-mode button:active {outline:none !important;}
            .hld__dark-mode #toppedtopic table, .hld__dark-mode .single_ttip2 .tip_title, .hld__dark-mode .collapse_btn {border-color:  ${this.borderColor} !important;}
            .hld__dark-mode .apd {color: ${this.borderColor} !important;}
            .hld__dark-mode .forumbox td:not(.c0) {border-color:  ${this.borderColor} !important;border-bottom: 1px solid  ${this.borderColor};border-right: 1px solid  ${this.borderColor};}
            .hld__dark-mode .c4 {border-right:none !important;}
            .hld__dark-mode #m_threads .replyer, .hld__dark-mode #m_threads .replyer > b, .hld__dark-mode .small_colored_text_btn, .hld__dark-mode .forumbox .postrow .stat,
            .hld__dark-mode #m_posts .postrow .userval, .hld__dark-mode #m_nav .bbsinfo, .hld__dark-mode .catenew p {color:${this.muteColor} !important;}
            `
        }
    }
    /**
     * 字体大小调整
     * @name fontResize
     * @description 此模块提供了调整字体大小的功能
     */
    const fontResize = {
        name: 'fontResize',
        setting: {
            type: 'advanced',
            key: 'fontResize',
            default: 12,
            title: '字体大小调整',
            desc: '字体大小调整，单位为像素(px)，初始值是12，注意：此值调整过大会导致页面混乱',
            menu: 'left'
        },
        initFunc: function () {
            const fontResizeInput = script.setting.advanced.fontResize
            try {
                const fontSize = parseInt(fontResizeInput)
                if (fontSize && fontSize != 12) {
                    $('body').css('font-size', fontSize + 'px')
                }
            } catch {
                script.printLog(`字体大小的值${script.setting.advanced.fontResize}无效，不是一个有效的数字`)
            }
        }
    }
    /**
     * 扩展坞模块
     * @name extraDocker
     * @description 此模块提供了一个悬浮的扩展坞，来添加某些功能
     *              目前添加的功能有：
     *                  返回顶部：无跳转返回当前页面的第一页/刷新当页
     *                  打开菜单：打开个人主菜单
     *                  收藏：收藏主题
     *                  回复：回复主题
     *                  跳转尾页：跳转到当前帖子的尾页
     */
    const extraDocker = {
        name: 'extraDocker',
        settings: [{
            shortCutCode: 84, // T
            key: 'backTop',
            title: '返回顶部'
        }, {
            shortCutCode: 66, // B
            key: 'backBottom',
            title: '跳转尾页'
        }],
        initFunc: function () {
            const _this = this
            const $dockerDom = $(`
                <div class="hld__docker">
                    <div class="hld__docker-sidebar">
                        <svg t="1603961015993" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="3634" width="64" height="64"><path d="M518.344359 824.050365c-7.879285 0-15.758569-2.967523-21.693614-9.004897l-281.403018-281.403018c-5.730389-5.730389-9.004897-13.609673-9.004897-21.693614s3.274508-15.963226 9.004897-21.693614l281.403018-281.403018c11.972419-11.972419 31.41481-11.972419 43.387229 0 11.972419 11.972419 11.972419 31.41481 0 43.387229L280.32857 511.948836l259.709403 259.709403c11.972419 11.972419 11.972419 31.41481 0 43.387229C534.0006 821.082842 526.223643 824.050365 518.344359 824.050365z" p-id="3635" fill="#888888"></path><path d="M787.160987 772.88618c-7.879285 0-15.758569-2.967523-21.693614-9.004897l-230.238833-230.238833c-11.972419-11.972419-11.972419-31.41481 0-43.387229l230.238833-230.238833c11.972419-11.972419 31.41481-11.972419 43.387229 0 11.972419 11.972419 11.972419 31.41481 0 43.387229L600.309383 511.948836l208.545218 208.545218c11.972419 11.972419 11.972419 31.41481 0 43.387229C802.817228 769.918657 794.937943 772.88618 787.160987 772.88618z" p-id="3636" fill="#888888"></path></svg>
                    </div>
                    <div class="hld__docker-btns">
                        <div data-type="TOP" id="hld__jump_top"><svg t="1603962702679" title="返回顶部" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="9013" width="64" height="64"><path d="M528.73 161.5c-9.39-9.38-24.6-9.38-33.99 0L319.65 336.59a24.028 24.028 0 0 0-7.05 23.59A24.04 24.04 0 0 0 330 377.6c8.56 2.17 17.62-0.52 23.6-7.02l158.14-158.14 158.1 158.14a23.901 23.901 0 0 0 17 7.09c6.39 0 12.5-2.55 17-7.09 9.38-9.39 9.38-24.61 0-34L528.73 161.5zM63.89 607.09h102.79V869.5h48.04V607.09h102.79v-48.04H63.89v48.04z m518.69-48.05h-127.3c-15.37 0-30.75 5.85-42.49 17.59a59.846 59.846 0 0 0-17.59 42.49v190.3c0 15.37 5.89 30.75 17.59 42.49 11.74 11.74 27.12 17.59 42.49 17.59h127.3c15.37 0 30.75-5.85 42.49-17.59 11.7-11.74 17.59-27.12 17.59-42.49V619.17a59.903 59.903 0 0 0-17.53-42.55 59.912 59.912 0 0 0-42.55-17.54v-0.04z m12 250.38c0 2.31-0.6 5.59-3.5 8.54a11.785 11.785 0 0 1-8.5 3.5h-127.3c-3.2 0.02-6.26-1.26-8.5-3.54a11.785 11.785 0 0 1-3.5-8.5V619.17c0-2.31 0.6-5.59 3.5-8.54 2.24-2.27 5.31-3.53 8.5-3.5h127.3c2.27 0 5.55 0.64 8.5 3.55 2.27 2.24 3.53 5.31 3.5 8.5v190.29-0.05z m347.4-232.78a59.846 59.846 0 0 0-42.49-17.59H734.74V869.5h48.04V733.32h116.71a59.94 59.94 0 0 0 42.54-17.55 59.923 59.923 0 0 0 17.55-42.54v-54.07c0-15.37-5.85-30.74-17.59-42.49v-0.03z m-30.44 96.64c0 2.26-0.64 5.55-3.55 8.5a11.785 11.785 0 0 1-8.5 3.5H782.78v-78.15h116.71c2.27 0 5.59 0.6 8.54 3.5 2.27 2.24 3.53 5.31 3.5 8.5v54.15z m0 0" p-id="9014" fill="#591804"></path></svg></div>
                        <div data-type="MENU" id="hld__jump_menu"><svg t="1687167394269" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="5137" width="48" height="48"><path d="M708.367 353.656c0-56.745-22.729-110.092-63.996-150.218s-96.132-62.224-154.494-62.224-113.229 22.099-154.498 62.224-63.996 93.473-63.996 150.218c0 43.987 13.713 86.196 39.651 122.064 7.273 10.060 21.559 12.479 31.904 5.406 10.343-7.073 12.834-20.963 5.561-31.019-20.486-28.329-31.315-61.684-31.315-96.451 0-92.585 77.471-167.911 172.694-167.911s172.689 75.325 172.689 167.911-77.471 167.906-172.694 167.906c-47.055 0-92.711 8.965-135.702 26.646-41.516 17.076-78.796 41.509-110.806 72.632-32.007 31.123-57.142 67.371-74.705 107.736-18.181 41.808-27.401 86.199-27.401 131.948 0 12.298 10.252 22.266 22.898 22.266s22.898-9.968 22.898-22.266c0-162.35 135.843-294.425 302.816-294.425 58.361 0 113.229-22.099 154.497-62.22s63.996-93.477 63.996-150.221zM530.991 631.551c0 12.298 10.252 22.266 22.898 22.266h304.337c12.647 0 22.898-9.968 22.898-22.266s-10.252-22.266-22.898-22.266h-304.337c-12.647 0-22.898 9.968-22.898 22.266zM858.229 722.671h-304.337c-12.65 0-22.898 9.968-22.898 22.266s10.252 22.266 22.898 22.266h304.337c12.647 0 22.898-9.968 22.898-22.266 0-12.294-10.252-22.266-22.898-22.266zM858.229 836.056h-304.337c-12.65 0-22.898 9.967-22.898 22.266s10.252 22.266 22.898 22.266h304.337c12.647 0 22.898-9.968 22.898-22.266 0-12.294-10.252-22.266-22.898-22.266z" fill="#591804" p-id="5138"></path></svg></div>
                        <div data-type="FAVOR" id="hld__jump_favor"><svg t="1687168828546" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="6134" width="48" height="48"><path d="M512 776.533333l-238.933333 85.333334 8.533333-251.733334L128 405.333333l243.2-72.533333L512 128l140.8 209.066667L896 405.333333l-153.6 200.533334 8.533333 251.733333-238.933333-81.066667z m0-93.866666l149.333333 51.2-4.266666-157.866667 98.133333-123.733333-153.6-42.666667L512 277.333333 422.4 409.6l-153.6 42.666667 98.133333 123.733333-4.266666 157.866667L512 682.666667z" fill="#591804" p-id="6135"></path></svg></div>
                        <div data-type="REPLY" id="hld__jump_reply"><svg t="1687169791224" class="icon" viewBox="0 0 1025 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="8570" width="48" height="48"><path d="M415.937331 320 415.937331 96 20.001331 438.176C-6.718669 461.28-6.622669 498.784 20.033331 521.824L415.937331 864 415.937331 640C639.937331 640 847.937331 688 1023.937331 928 943.937331 480 607.937331 320 415.937331 320" p-id="8571" fill="#591804"></path></svg></div>
                        <div data-type="BOTTOM" id="hld__jump_bottom"><svg t="1603962680160" title="跳转至最后一页" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="7501" width="64" height="64"><path d="M792.855 465.806c-6.24-6.208-14.369-9.312-22.56-9.312s-16.447 3.169-22.688 9.44l-207.91 207.74v-565.28c0-17.697-14.336-32-32-32s-32.002 14.303-32.002 32v563.712l-206.24-206.164c-6.271-6.209-14.432-9.344-22.624-9.344-8.224 0-16.417 3.135-22.656 9.407-12.511 12.513-12.48 32.768 0.032 45.248L483.536 770.38c3.265 3.263 7.104 5.6 11.136 7.135 4 1.793 8.352 2.88 13.024 2.88 1.12 0 2.08-0.544 3.2-0.64 8.288 0.064 16.608-3.009 22.976-9.408l259.11-259.292c12.48-12.511 12.448-32.8-0.127-45.248z m99.706 409.725c0 17.665-14.303 32.001-31.999 32.001h-704c-17.665 0-32-14.334-32-31.999s14.335-32 32-32h704c17.696 0 32 14.334 32 31.998z" p-id="7502" fill="#591804"></path></svg></div>
                    </div>
                </div>
            `)
            $('body').append($dockerDom)
            /**
             * Bind:Click
             * 按钮点击事件
             */
            $('body').on('click', '.hld__docker-btns>div', function (e) {
                const type = $(this).data('type')
                if (type == 'TOP') {
                    const $nav_link = $('#m_nav a.nav_link')
                    if ($nav_link.length > 0) {
                        $nav_link[$nav_link.length-1].click()
                    }
                }
                if (type == 'MENU') {
                    unsafeWindow.commonui.mainMenu.menuOpen()
                    unsafeWindow.commonui.mainMenu.menuOpenAct({
                        clientX: window.screen.width - 30,
                        clientY: 30,
                        pageX: window.screen.width - 30,
                        pageY: 30
                    }, null, 8)
                }
                if (type == 'FAVOR') {
                    const tid = script.getModule('authorMark').getQueryString('tid')
                    if (script.isForms() && tid) {
                        unsafeWindow.commonui.favor(e, null, tid)
                    }
                }
                if (type == 'REPLY') {
                    if (script.isForms()) {
                        window.location.href = $('#postbbtm a.rep.uitxt1').attr('href')
                    }
                }
                if (type == 'BOTTOM') {
                    let queryset = _this.getQuerySet()
                    queryset.page = 9999
                    let search = ''
                    for (let key in queryset) {
                        search += `${search == '' ? '?' : '&'}${key}=${queryset[key]}`
                    }
                    window.location.href = `${window.location.origin}${window.location.pathname}${search}`
                }
            })
        },
        renderAlwaysFunc: function (script) {
            (script.isThreads() || script.isForms()) ? $('.hld__docker').show() : $('.hld__docker').hide()
            $('#hld__jump_favor').toggle(script.isForms())
            $('#hld__jump_reply').toggle(script.isForms())
        },
        shortcutFunc: {
            backTop: function () {
                $('#hld__jump_top').click()
                script.popNotification('返回顶部')
            },
            backBottom: function () {
                $('#hld__jump_bottom').click()
                script.popNotification('最后一页')
            }
        },
        /**
         * 获取URL参数对象
         * @method getQuerySet
         * @return {Object} 参数对象
         */
        getQuerySet: function () {
            let queryList = {}
            let url = decodeURI(window.location.search.replace(/&amp;/g, "&"))
            url.startsWith('?') && (url = url.substring(1))
            url.split('&').forEach(item => {
                let t = item.split('=')
                if (t[0] && t[1]) {
                    queryList[t[0]] = t[1]
                }
            })
            return queryList
        },
        style: `
        .hld__docker{position:fixed;height:80px;width:30px;bottom:180px;right:0;transition:all ease .2s}
        .hld__docker:hover{width:150px;height:300px;bottom:75px}
        .hld__docker-sidebar{background:#0f0;position:fixed;height:50px;width:20px;bottom:195px;right:0;display:flex;justify-content:center;align-items:center;background:#fff6df;border:1px solid #591804;box-shadow:0 0 1px #333;border-right:none;border-radius:5px 0 0 5px}
        .hld__excel-body .hld__docker-sidebar{background:#fff;border:1px solid #bbb}
        .hld__docker-btns{position:absolute;top:0;left:50px;bottom:0;right:50px;display:flex;justify-content:center;align-items:center;flex-direction:column}
        .hld__docker .hld__docker-btns>div{opacity:0;flex-shrink: 0;}
        .hld__docker:hover .hld__docker-btns>div{opacity:1}
        .hld__docker-btns>div{background:#fff6df;border:1px solid #591804;box-shadow:0 0 5px #444;width:50px;height:50px;border-radius:50%;margin:10px 0;cursor:pointer;display:flex;justify-content:center;align-items:center}
        .hld__excel-body .hld__docker-btns>div{background:#fff;border:1px solid #bbb}
        .hld__docker-btns svg{width:30px;height:30px;transition:all ease .2s}
        .hld__docker-btns svg:hover{width:40px;height:40px}
        .hld__excel-body .hld__docker-sidebar{background:#fff;border:1px solid #bbb}
        .hld__excel-body .hld__docker-btns>div{background:#fff;border:1px solid #bbb}
        `
    }
    /**
     * 域名重定向
     * @name domainRedirect
     * @description 此模块提供了将不同域名重定向到一个指定的目标域名
     */
    const domainRedirect = {
        name: 'domainRedirect',
        setting: {
            type: 'advanced',
            key: 'domainRedirectTarget',
            default: '',
            options: [{
                label: '未配置',
                value: ''
            }, {
                label: 'bbs.nga.cn',
                value: 'bbs.nga.cn'
            }, {
                label: 'ngabbs.com',
                value: 'ngabbs.com'
            }, {
                label: 'nga.178.com',
                value: 'nga.178.com'
            }],
            title: '域名重定向目标',
            desc: '此配置设置将域名重定向到的目标域名\n警告:不同域名的配置文件中的此配置应该保持一致，如不一致将会反复重定向陷入死循环!',
            menu: 'left'
        },
        initFunc: function () {
            const domainRedirectTarget = script.setting.advanced.domainRedirectTarget
            if (domainRedirectTarget && window.location.host != domainRedirectTarget) {
                const newRedirectUrl = window.location.href.replace(window.location.host, domainRedirectTarget)
                window.location.replace(newRedirectUrl)
            }
        }
    }
    /**
     * 用户增强
     * @name userEnhance
     * @description 此模块提供了用户功能类的增强，如显示注册天数，IP所属地等
     */
    const userEnhance = {
        name: 'userEnhance',
        settings: [{
            type: 'normal',
            key: 'userEnhance',
            default: true,
            title: '用户增强',
            menu: 'right'
        }, {
            type: 'advanced',
            key: 'locationFlagMode',
            default: 'FLAG_AND_TEXT',
            options: [{
                label: '全部国旗',
                value: 'FLAG'
            }, {
                label: '全部文字',
                value: 'TEXT'
            }, {
                label: '国旗加文字',
                value: 'FLAG_AND_TEXT'
            }],
            title: '属地显示模式',
            desc: '调整属地显示模式：\n全部国旗：显示国旗不显示文字\n全部文字：显示文字不显示国旗\n国旗加文字：前面显示国旗后面显示文字',
            menu: 'right'
        }],
        initFunc: async function() {
            // 初始化的时候清理超过一定时间的数据，避免无限增长数据
            // 出于性能考虑，每日只执行一次
            const currentDate = new Date()
            const lastClear = await localforage.getItem('USERENHANCE_CLEAR_DAY')
            if (lastClear != currentDate.getDate()) {
                const exprieSeconds = 7 * 24 * 3600  // 7天
                const currentTime = Math.ceil(currentDate.getTime() / 1000)
                let removedCount = 0
                localforage.iterate(function(value, key, iterationNumber) {
                    if (key.startsWith('USERINFO_')) {
                        if (!value._queryTime || currentTime - value._queryTime >= exprieSeconds) {
                            localforage.removeItem(key)
                            removedCount += 1
                        }
                    }
                }).then(function() {
                    localforage.setItem('USERENHANCE_CLEAR_DAY', currentDate.getDate())
                    script.printLog(`用户增强: 已清除${removedCount}条用户超期数据`)
                }).catch(function(err) {
                    console.error('用户增强清除超期数据失败，错误原因:', err);
                })
            }
        },
        renderFormsFunc: function($el) {
            if (!script.setting.normal.userEnhance) return
            const _this = this
            const uid = $el.find('a[name="uid"]').text()
            const userInfo = unsafeWindow.commonui.userInfo.users[uid]
            if (!userInfo) return
            const regSeconds = Math.ceil(new Date().getTime() / 1000) - userInfo.regdate
            const regDays = Math.round(regSeconds / 3600 / 24)
            const regYear = (regSeconds / 3600 / 24 / 365).toFixed(1)
            // 插入UI
            const $userEnhanceContainer = $(`<div class="hld__user-enhance"></div>`)
            const $node = $el.find('.posterinfo div.stat .clickextend').siblings('div:first-child')
            $node.after($userEnhanceContainer)
            $userEnhanceContainer.append(`<div><span title="注册天数: ${regDays}天\n注册年数: ${regYear}年">吧龄: <span class="numeric userval" name="regday">${regDays}天</span></span></div>`)
            $userEnhanceContainer.append(`<div><span title="发帖数量: ${userInfo.postnum}">发帖: <span class="numeric userval" name="regday">${userInfo.postnum}</span></span></div>`)
            $userEnhanceContainer.append(`<div><span style="display: inline-flex;align-items: center;" class="hld__user-location">属地: <span class="userval numeric loading" style="margin-left:5px;"></span></span></div>`)
            $userEnhanceContainer.append(`<div class="hld__qbc"><button>查看用户最近活动记录</button></div>`)
            $el.find('.hld__qbc > button').click(() => _this.queryUserActivityRecords(userInfo))
            // 调用数据接口获取属地
            this.getRemoteUserInfo(uid)
            .then(remoteUserInfo => {
                // 异步设置属地
                $userEnhanceContainer.find('.hld__user-location').attr('title', `IP属地: ${remoteUserInfo.ipLoc}`)
                $userEnhanceContainer.find('.hld__user-location > span').replaceWith(this.getCountryFlag(remoteUserInfo.ipLoc))
            })
        },
        /**
         * 调用接口获取用户信息
         * @param {String} uid 用户UID
         * @returns Promise 用户信息对象
         */
        getRemoteUserInfo(uid) {
            const storageKey = `USERINFO_${uid}`
            return new Promise((resolve, reject) => {
                localforage.getItem(storageKey)
                .then(value => {
                    if (value) {
                        resolve(value)
                    } else {
                        $.ajax({url: `https://${window.location.host}/nuke.php?__output=11&__act=get&__lib=ucp&uid=${uid}`})
                        .then(res => {
                            if (res.data && Array.isArray(res.data) && res.data.length > 0) {
                                const remoteUserInfo = res.data[0]
                                remoteUserInfo['_queryTime'] = res.time
                                localforage.setItem(storageKey, remoteUserInfo)
                                resolve(res.data[0])
                            }
                        })
                        .catch(err => reject(err))
                    }
                })
            })
        },
        /**
         * 获取属地标识代码
         * @param {String} chsName 中文国家名称
         * @returns HTML代码
         */
        getCountryFlag(chsName) {
            let textElement = `<span class="numeric userval" name="location">${chsName}</span>`
            let flagElement = ''
            if (script.setting.advanced.locationFlagMode != 'TEXT_ALWAYS') {
                const flagUrl = `https://www.huuua.com/zi/scss/icons/flag-icon-css/flags`
                if (CHINESE_CONVERT_ISO3166_1[chsName]) {
                    flagElement = `<img class="hld__country-flag" onerror="this.style.width='auto'" alt="${chsName}" src="${flagUrl}/${CHINESE_CONVERT_ISO3166_1[chsName].toLowerCase()}.svg"/>`
                } else if (CHINA_PROVINCE.includes(chsName)) {
                    flagElement = `<img class="hld__country-flag" onerror="this.style.width='auto'" alt="中国" src="${flagUrl}/cn.svg"/> `
                    const specialArea = ['香港', '澳门', '台湾'].find(name => chsName.endsWith(name))
                    if (specialArea) {
                        flagElement += `<img class="hld__country-flag" onerror="this.style.width='auto'" alt="中国${chsName}" src="${flagUrl}/${CHINESE_CONVERT_ISO3166_1['中国'+chsName].toLowerCase()}.svg"/> `
                    }
                }
            }
            switch (script.setting.advanced.locationFlagMode) {
                case 'FLAG_ALWAYS':
                    return flagElement
                case 'TEXT_ALWAYS':
                    return textElement
                case 'FLAG_AND_TEXT':
                    return flagElement + textElement
                default:
                    return textElement
            }
        },
        /**
         * 查询用户活动记录
         * @param {Object} userInfo 用户信息对象
         */
        queryUserActivityRecords(userInfo) {
            $('#hld__chart_cover').remove()
            if (typeof echarts === 'undefined') {
                script.popMsg('该功能所需资源库正在加载，请稍后再试', 'warn')
                return
            }
            $('body').append(`<div id="hld__chart_cover" class="animated zoomIn"><a href="javascript:void(0)" class="hld__setting-close">×</a><div id="hld__chart_container"><div class="loading"></div></div></div>`)
            $('#hld__chart_cover .hld__setting-close').click(() => $('#hld__chart_cover').remove())
            const activeCount = []
            const requestTasks = []
            const statisticsCount = (validList, incrField) => {
                validList.forEach(item => {
                    const pName = item.parent && item.parent['2'] ? item.parent['2'] : ''
                    let existRecord = activeCount.find(p => p.fid == item.fid)
                    if (!existRecord) {
                        existRecord = {fid: item.fid, name: pName, value: 0, post: 0, reply: 0}
                        activeCount.push(existRecord)
                    }
                    existRecord['fid'] = item.fid
                    existRecord['name'] ||= pName
                    existRecord['value'] += 1
                    existRecord[incrField] += 1
                })
            }
            // 查询发帖记录
            for (let i=0;i<3;i++) {
                requestTasks.push(new Promise((resolve, reject) => {
                    $.ajax({url: `https://${window.location.host}/thread.php?__output=11&authorid=${userInfo.uid}&page=${i+1}`})
                    .then(postRes => {
                        const err = postRes.error
                        if (postRes.data && postRes.data.__T) {
                            statisticsCount(postRes.data.__T, 'post')
                        }
                        if (err) {
                            const errMsg = (err && Array.isArray(err)) ? err.join(' ') : err
                            if (!errMsg.includes('没有符合条件的结果')) {
                                reject(errMsg)
                                return
                            }
                        }
                        resolve()
                    })
                }))
                // 查询回复记录
                requestTasks.push(new Promise((resolve, reject) => {
                    $.ajax({url: `https://${window.location.host}/thread.php?__output=11&searchpost=1&authorid=${userInfo.uid}&page=${i+1}`})
                    .then(replyRes => {
                        const err = replyRes.error
                        if (replyRes.data && replyRes.data.__T) {
                            statisticsCount(replyRes.data.__T, 'reply')
                        }
                        if (err) {
                            const errMsg = (err && Array.isArray(err)) ? err.join(' ') : err
                            if (!errMsg.includes('没有符合条件的结果')) {
                                reject(errMsg)
                                return
                            }
                        }
                        resolve()
                    })
                }))
            }
            Promise.all(requestTasks)
            .then(() => {
                // 处理未命名板块
                activeCount.forEach(item => item.name ||= `板块FID: ${item.fid}`)
                // 渲染chart
                const chartContainer = document.getElementById('hld__chart_container')
                if (!chartContainer) return
                const chart = echarts.init(chartContainer)
                chart.setOption({
                    title: {
                        text: '用户最近活跃板块记录',
                        subtext: userInfo.username ||`UID: ${userInfo.username}`,
                        top: 10,
                        left: 'center'
                    },
                    tooltip: {
                        formatter: function(row) {
                            return `${row.data.name}<br />总计: ${row.data.value}<br>发布: ${row.data.post}<br>回复: ${row.data.reply}`
                        }
                    },
                    toolbox: {
                        show: true,
                        bottom: 10,
                        left: 10,
                        itemSize: 16,
                        feature: {
                            saveAsImage: {show: true},
                        },
                    },
                    legend: {
                        type: 'scroll',
                        orient: 'vertical',
                        left: 10,
                        top: 'middle'
                    },
                    series: [{
                        name: '板块',
                        type: 'pie',
                        radius: '50%',
                        label: {
                            formatter: function(row) {
                                return `{name|${row.data.name}}\n{detail|发布: ${row.data.post}} {detail|回复: ${row.data.reply}}`
                            },
                            minMargin: 5,
                            edgeDistance: 10,
                            lineHeight: 15,
                            rich: {detail: {
                                fontSize: 10,
                                color: '#999'
                            }}
                        },
                        labelLine: {
                            length: 15,
                            length2: 0,
                            maxSurfaceAngle: 80
                        },
                        labelLayout: function (params) {
                            const isLeft = params.labelRect.x < chart.getWidth() / 2
                            const points = params.labelLinePoints
                            if (points) {
                                points[2][0] = isLeft ? params.labelRect.x : params.labelRect.x + params.labelRect.width
                            }
                            return {labelLinePoints: points}
                        },
                        data: activeCount,
                        emphasis: {
                            itemStyle: {shadowBlur: 10, shadowOffsetX: 0, shadowColor: 'rgba(0, 0, 0, 0.5)'}
                        }
                    }],
                    graphic: [{
                        type: 'group',
                        right: 15,
                        top: 'middle',
                        children: [{
                            type: 'text',
                            left: 0,
                            top: 0,
                            style: {
                                text: '发布主题: ' + activeCount.reduce((p, c) => p + c.post, 0),
                                fill: '#333',
                            }
                        }, {
                            type: 'text',
                            left: 80,
                            top: 0,
                            style: {
                                text: '查看',
                                fill: '#00a0ff',
                            },
                            onclick: function() {
                                window.open(`${window.location.origin}/thread.php?authorid=${userInfo.uid}`)
                            }
                        }, {
                            type: 'text',
                            left: 0,
                            top: 20,
                            style: {
                                text: '回复主题: ' + activeCount.reduce((p, c) => p + c.reply, 0),
                                fill: '#333',
                            }
                        }, {
                            type: 'text',
                            left: 80,
                            top: 20,
                            style: {
                                text: '查看',
                                fill: '#00a0ff',
                            },
                            onclick: function() {
                                window.open(`${window.location.origin}/thread.php?searchpost=1&authorid=${userInfo.uid}`)
                            }
                        }, {
                            type: 'text',
                            left: 25,
                            top: 40,
                            style: {
                                text: '总计: ' + activeCount.reduce((p, c) => p + c.value, 0),
                                fill: '#333',
                            }
                        }]
                    }, {
                        type: 'text',
                        right: 10,
                        bottom: 33,
                        style: {
                            text: '*仅统计最近有效的公开数据',
                            fill: '#666'
                        }
                    }, {
                        type: 'image',
                        right: 10,
                        bottom: 30,
                        style: {
                            image: POWER_BY_NGASCRIPT,
                            width: 150
                        }
                    }]
                })
            })
            .catch(errMsg => {
                $('#hld__chart_cover').remove()
                script.popMsg(`查询数据接口失败! 原因: ${errMsg}`, 'err')
            })
        },
        style: `
        .hld__user-enhance {display:flex;flex-wrap:wrap;}
        .hld__user-enhance > div {box-sizing:border-box;width:50%;padding-right:3px;}
        .hld__user-enhance span[name=location] {margin-left:5px;}
        .hld__country-flag {width:20px;height:auto;margin-left:5px;}
        .hld__user-location .loading {width:8px;height:8px;border:1px solid #9c958b;border-top-color:transparent;border-radius:100%;animation:loading-circle infinite 0.75s linear;}
        .hld__qbc {width:100% !important;padding:5px 0;}
        .hld__qbc > button {margin:0;}
        #hld__chart_cover {position:fixed;top:50%;left:50%;transform:translate(-50%, -50%);border-radius:10px;background:#FFF;border:1px solid #AAA;box-shadow:0 0 10px rgba(0,0,0,.3);z-index:9993;}
        #hld__chart_cover > .hld__setting-close {background:#FFF;border:1px solid #AAA;color:#AAA;}
        #hld__chart_cover > .hld__setting-close:hover {background:#AAA;border:1px solid #FFF;color:#FFF;}
        #hld__chart_container {width:840px;height:500px;}
        #hld__chart_container .loading {position:absolute;top: 50%;left:50%;margin-top:-20px;margin-left:-25px;width:40px;height:40px;border:2px solid #AAA;border-top-color:transparent;border-radius:100%;animation:loading-circle infinite 0.75s linear;}
        @keyframes loading-circle {0% {transform:rotate(0);}100% {transform:rotate(360deg);}}
        `
    }

    /**
     * 初始化脚本
     */
    const script = new NGABBSScript()
    /**
     * 添加模块
     */
    script.addModule(defaultStyle)
    script.addModule(settingPanel)
    script.addModule(shortCutKeys)
    script.addModule(backupModule)
    script.addModule(rewardPanel)
    script.addModule(dynamicEnable)
    script.addModule(hideAvatar)
    script.addModule(hideSmile)
    script.addModule(hideImage)
    script.addModule(imgResize)
    script.addModule(hideSign)
    script.addModule(hideHeader)
    script.addModule(excelMode)
    script.addModule(excelTitle)
    script.addModule(foldQuote)
    script.addModule(userEnhance)
    script.addModule(linkTargetBlank)
    script.addModule(directLinkJump)
    script.addModule(imgEnhance)
    script.addModule(authorMark)
    script.addModule(authorMarkColor)
    script.addModule(autoPage)
    script.addModule(keywordsBlock)
    script.addModule(markAndBan)
    script.addModule(eyeCareMode)
    script.addModule(darkMode)
    script.addModule(fontResize)
    script.addModule(extraDocker)
    script.addModule(domainRedirect)
    /**
     * 运行脚本
     */
    script.run()
})();