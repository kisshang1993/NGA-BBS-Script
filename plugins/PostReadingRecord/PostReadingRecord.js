// ==UserScript==
// @name         NGA优化摸鱼体验-帖子浏览记录
// @namespace    https://github.com/kisshang1993/NGA-BBS-Script/tree/master/plugins/PostReadingRecord
// @version      1.1.0
// @author       HLD
// @description  记录帖子的阅读状态，着色以阅读帖子标题，跟踪后续新回复数量
// @license      MIT
// @match        *://bbs.nga.cn/*
// @match        *://ngabbs.com/*
// @match        *://nga.178.com/*
// @match        *://g.nga.cn/*
// @grant        unsafeWindow
// @run-at       document-start
// @inject-into  content
// ==/UserScript==

(function (registerPlugin) {
    'use strict';
    const PostReadingRecord = {
        name: 'PostReadingRecord',
        title: '帖子浏览记录',
        desc: '记录帖子的阅读状态，着色以阅读帖子标题，跟踪后续新回复数量',
        settings: [{
            key: 'markColor',
            title: '标记着色颜色',
            default: '#000000'
        }, {
            key: 'markOpacity',
            title: '颜色不透明度',
            desc: '0~100之间的数字，0为完全透明，100为完全不透明',
            default: 50
        }, {
            key: 'replyCountEnable',
            title: '显示新增回复',
            default: true
        }, {
            key: 'replyCountStyle',
            title: '新增回复样式',
            default: 'tag',
            options: [{
                label: '绿色标签',
                value: 'tag'
            }, {
                label: '极简文本',
                value: 'text'
            }]
        }, {
            key: 'expireDays',
            title: '记录过期天数',
            desc: '记录帖子状态的数据过期天数，数据过期后将会自动删除状态数据，用于释放储存空间，-1为永不过期',
            default: 90
        }],
        buttons: [{
            title: '清理所有记录数据',
            action: 'cleanLocalData'
        }],
        store: null,
        beforeSaveSettingFunc(settings) {
            const $ = this.mainScript.libs.$
            if (!$.isNumeric(settings['markOpacity'])) {
                return '颜色不透明度必须是个数字'
            }
            if (!$.isNumeric(settings['expireDays'])) {
                return '记录过期天数必须是个数字'
            }
        },
        initFunc() {
            const $ = this.mainScript.libs.$
            // 创建储存实例
            this.store = this.mainScript.createStorageInstance('NGA_BBS_Script__PostReadingRecord')
            // 调用标准模块authorMark初始化颜色选择器
            this.mainScript.getModule('AuthorMark').initSpectrum(`[plugin-id="${this.pluginID}"][plugin-setting-key="markColor"]`)
            // 初始化的时候根据设置清理超过一定时间的数据，避免无限增长数据
            const currentTime = Math.ceil(new Date().getTime() / 1000)
            const expireTime = this.pluginSettings['expireDays'] == -1 ? -1 : this.pluginSettings['expireDays'] * 24 * 60 * 60
            if (expireTime > -1) {
                let removedCount = 0
                this.store.iterate((value, key) => {
                    if (currentTime - value.lastReadTime >= expireTime) {
                        this.store.removeItem(key)
                        removedCount += 1
                    }
                })
                .then(() => {
                    this.mainScript.printLog(`${this.title}: 已清除${removedCount}条超期(>${this.pluginSettings['expireDays']}d)数据`)
                })
                .catch(err => {
                    console.error(`${this.title}清除超期数据失败，错误原因:`, err)
                })
            }
            // 自动记录阅读位置
            $(window).on('scroll resize', () => {
                if (!this.mainScript.isForms()) return
                this.calcReadCount()
            })
            // 绑定继续阅览事件
            $(document).on('click', '.hld__unread-label', function() {
                unsafeWindow.__LOADERREAD.go(1, {
                    fromUrl: window.location.href,
                    url: $(this).attr('data-continueurl')
                })
            })
        },
        async renderThreadsFunc($el) {
            const markStyle = `color: ${this.pluginSettings['markColor']}; opacity: ${parseInt(this.pluginSettings['markOpacity']) / 100};`
            // 提取数据
            const $a = $el.find('.c1 > a')
            const tid = this.mainScript.getModule('AuthorMark').getQueryString('tid', $a.attr('href'))
            const currentCount = parseInt($a.text())
            if (!tid || isNaN(currentCount)) return
            // 检查并标记已读帖子
            const record = await this.store.getItem(tid)
            const recordCount = record?.lastReadCount || -1
            if (record) {
                $el.find('.c2 > a').attr('style', markStyle)
            }
            if (this.pluginSettings['replyCountEnable'] && recordCount > -1 && currentCount > recordCount) {
                const url = `https://${window.location.host}${$a.attr('href')}&page=${record.lastReadPage}#anchorid=${record.lastReadCount}`
                $el.find('.c2 > span[id^=t_pc]').append(`
                    <span data-continueurl="${url}" class="hld__help hld__unread-label" help="上次阅读位置">
                        <span  class="hld__new-reply-count-${this.pluginSettings['replyCountStyle']}">
                            ${currentCount - recordCount}
                        </span>
                    </span>
                `)
            }
        },
        renderFormsFunc($el) {
            if ($el.index() == 0) {
                this.calcReadCount()
            }
        },
        renderAlwaysFunc() {
            if (!this.mainScript.isForms()) return
            const $ = this.mainScript.libs.$
            const [originalURL, anchorid] = window.location.href.split('#anchorid=')
            if (anchorid && !isNaN(parseInt(anchorid))) {
                // 滚动至锚点处
                for (let i=parseInt(anchorid)-1;i>0;i--) {
                    const $posterinfo = $(`#post1strow${anchorid}`)
                    if ($posterinfo.length > 0) {
                        $posterinfo.parents('table.forumbox.postbox')
                        const $parentrow = $posterinfo.parents('table.forumbox.postbox')
                        if (!$parentrow.next().hasClass('hld__readnow')) {
                            $parentrow.after(`<div class="hld__readnow">📌 上次阅读位置 📌</div>`)
                        }
                        history.replaceState(null, null, originalURL)
                        setTimeout(() => {
                            $(window).scrollTop($posterinfo.offset().top + $posterinfo.height() - $(window).height() + 100)
                        }, 500)
                        break
                    }
                }
            }
        },
        // 计算阅读位置
        calcReadCount() {
            const $ = this.mainScript.libs.$
            $('.forumbox.postbox').each(async (index, dom) => {
                const $el = $(dom)
                const currentPostboxID = $el.find('tr[id^=post1strow]').attr('id')
                if (!currentPostboxID || !unsafeWindow.__CURRENT_TID) return
                const lastReadCount = await this.store.getItem(unsafeWindow.__CURRENT_TID)?.lastReadCount ?? 0
                const currentReadCount = parseInt(currentPostboxID.substring(10)) + 1
                const currentElTop = $el.offset().top
                const currentElBottom = currentElTop + $el.outerHeight()
                const viewportTop = $(window).scrollTop()
                const viewportBottom = viewportTop + $(window).height()
                if (currentElTop < viewportBottom && currentElBottom > viewportTop) {
                    if (currentReadCount > lastReadCount) {
                        const currentPage = this.mainScript.getModule('AuthorMark').getQueryString('page') ?? 1
                        this.store.setItem(unsafeWindow.__CURRENT_TID, {
                            lastReadCount: currentReadCount,
                            lastReadPage: parseInt(currentPage),
                            lastReadTime: Math.ceil(new Date().getTime() / 1000)
                        })
                    }
                }
            })
        },
        cleanLocalData() {
            if (window.confirm('确定要清理所有记录数据吗？')) {
                this.store.clear()
                alert('操作成功，请刷新页面重试')
            }
        },
        style: `
        .hld__unread-label {cursor: pointer;}
        .hld__unread-label:hover:after {content: '🚀';}
        .hld__new-reply-count-tag {margin-left: 10px;display: inline-block;background-color: #8BC34A;border-radius: 10px;padding: 0 10px;color: #FFF;transform: scale(.9);}
        .hld__new-reply-count-tag:before {content: '未阅读:'}
        .hld__new-reply-count-tag:after {content: '条'}
        .hld__new-reply-count-text {margin-left: 10px;display: inline-block;}
        .hld__new-reply-count-text:before {content: '+'}
        .hld__readnow {text-align: center;height:20px;line-height:20px;background:#607d8b;color:#FFF;}
        `
    }
    registerPlugin(PostReadingRecord)

})(function(plugin) {
    plugin.meta = GM_info.script
    unsafeWindow.ngaScriptPlugins = unsafeWindow.ngaScriptPlugins || []
    unsafeWindow.ngaScriptPlugins.push(plugin)
});