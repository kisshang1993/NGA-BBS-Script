// ==UserScript==
// @name         NGA优化摸鱼体验-拉黑增强
// @namespace    https://github.com/kisshang1993/NGA-BBS-Script/tree/master/plugins/BlockEnhance
// @version      1.0.0
// @author       HLD
// @description  提供高级拉黑设置，可以针对匿名用户、负声望、负威望、回帖数、注册天数进行屏蔽，支持联合校验校验
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
    const BlockEnhance = {
        name: 'BlockEnhance',
        title: '拉黑增强',
        desc: '提供高级拉黑设置，可以针对匿名用户、负声望、负威望、回帖数、注册天数进行屏蔽，支持联合校验',
        requires: [
            'mainScript@4.5.0',
            'PostReadingRecord@1.0.0'
        ],
        settings: [{
            key: 'blockAnonymous',
            title: '屏蔽匿名用户',
            default: false
        }, {
            key: 'blockUnReputation',
            title: '屏蔽负声望用户',
            default: false
        }, {
            key: 'blockUnPrestige',
            title: '屏蔽负威望用户',
            default: false
        }, {
            key: 'blockByReplyCount',
            title: '屏蔽小于指定回帖数',
            desc: '≤0为无限制',
            default: 0
        }, {
            key: 'blockByRegDays',
            title: '屏蔽小于指定注册天数',
            desc: '≤0为无限制',
            default: 0
        }, {
            key: 'blockRule',
            title: '联合校验规则',
            desc: '对以下规则进行联合校验\n屏蔽负声望用户\n屏蔽负威望用户\n屏蔽小于指定回帖数\n屏蔽小于指定注册天数\n\n* 注意: [屏蔽匿名用户]不参与规则判断',
            default: 'OR',
            options: [{
                label: '其中一条满足(OR)',
                value: 'OR'
            }, {
                label: '所有规则同时满足(AND)',
                value: 'AND'
            }]
        }, {
            key: 'blockMode',
            title: '屏蔽方式',
            desc: '',
            default: 'HIDE',
            options: [{
                label: '隐藏并可手动查看',
                value: 'HIDE'
            }, {
                label: '直接删除楼层',
                value: 'DELETE'
            }]
        }],
        blockDict: {},
        renderThreadsFunc($el) {
            // 帖子列表隐藏匿名用户
            if (this.pluginSettings['blockAnonymous']) {
                const title = $el.find('.c2>a').text()
                const uid = ($el.find('.author').attr('href') && $el.find('.author').attr('href').indexOf('uid=') > -1) ? $el.find('.author').attr('href').split('uid=')[1] + '' : ''
                if (uid.startsWith('#anony')) {
                    this.mainScript.printLog(`${this.title}: 隐藏匿名用户：标题：${title}  连接：${$el.find('.c2>a').attr('href')}`)
                    $el.parents('tbody').remove()
                }
            }
        },
        renderFormsFunc($el) {
            const $ = this.mainScript.libs.$
            const currentUid = parseInt($el.find('[name=uid]').text())
            const userInfo = unsafeWindow.commonui.userInfo.users[currentUid]
            const author = $el.find('.c1 a.author.b').clone()
            author.find('.hld__post-author').remove()
            const currentUsername = author.text()
            // 匿名用户
            if (this.pluginSettings['blockAnonymous'] && currentUid <= 0) {
                this.blockDict[currentUsername] = '屏蔽匿名用户'
                this.blockContent($el, this.blockDict[currentUsername])
                return
            }
            // 常规用户
            if (currentUid > 0) {
                // 组合规则
                const rules = [
                    {
                        key: 'blockUnReputation',
                        label: '负声望',
                        active: this.pluginSettings['blockUnReputation'],
                        isHit: () => {
                            let reputation = ''
                            if (unsafeWindow.__CURRENT_FID) {
                                const currentReputations = unsafeWindow.commonui.userInfo.reputations
                                reputation = currentReputations?.[unsafeWindow.__CURRENT_FID]?.[currentUid] ?? ''
                            }
                            return reputation && parseInt(reputation) < 0
                        }
                    }, {
                        key: 'blockUnPrestige',
                        label: '负威望',
                        active: this.pluginSettings['blockUnPrestige'],
                        isHit: () => {
                            const prestige = unsafeWindow.commonui.userInfo.groups?.[userInfo.memberid]?.[0] ?? ''
                            return prestige.startsWith('警告')
                        }
                    }, {
                        key: 'blockByReplyCount',
                        label: `回帖数<${this.pluginSettings['blockByReplyCount']}`,
                        active: this.pluginSettings['blockByReplyCount'] > 0,
                        isHit: () => {
                            return userInfo.postnum < this.pluginSettings['blockByReplyCount']
                        }
                    }, {
                        key: 'blockByRegDays',
                        label: `注册天数<${this.pluginSettings['blockByRegDays']}`,
                        active: this.pluginSettings['blockByRegDays'] > 0,
                        isHit: () => {
                            return this.calcRegisterDays(userInfo.regdate).regDays < this.pluginSettings['blockByRegDays']
                        }
                    }
                ]
                // 规则命中判断
                if (this.pluginSettings['blockRule'] == 'OR') {
                    // OR
                    for (let rule of rules) {
                        if (rule.active && rule.isHit()) {
                            this.blockDict[currentUsername] = rule.label
                            this.blockContent($el, this.blockDict[currentUsername])
                            return
                        }
                    }
                }
                if (this.pluginSettings['blockRule'] == 'AND') {
                    // AND
                    const activeRules = rules.filter(r => r.active)
                    if (activeRules.every(r => r.isHit())) {
                        this.blockDict[currentUsername] = activeRules.map(r => r.label).join(', ')
                        this.blockContent($el, this.blockDict[currentUsername])
                    }
                }
            }
            // 处理引用的回复
            $el.find('.quote .userlink.b').each((_, quoteUser) => {
                const match = $(quoteUser).text().match(/\[([^[\]]*)\]/)
                if (match && match.length > 1) {
                    const quoteName = match[1]
                    if (this.blockDict[quoteName]) {
                        this.blockQuote($(quoteUser).parents('.quote'), this.blockDict[quoteName])
                    }
                }
            })
        },
        /**
         * 屏蔽正文
         */
        blockContent($el, reason) {
            const $ = this.mainScript.libs.$
            if (this.pluginSettings['blockMode'] == 'HIDE') {
                const $blocktips = $(`<div class="hld__banned hld__banned-block">此用户因被命中屏蔽规则而被隐藏言论，点击查看<br>* 命中规则: ${reason}</div>`)
                $el.find('.c2 .postcontent').hide()
                $el.find('.c2 .postcontent').after($blocktips)
            }
            if (this.pluginSettings['blockMode'] == 'DELETE') {
                $el.remove()
            }
        },
        /**
         * 屏蔽引用
         */
        blockQuote($el, reason) {
            if (this.pluginSettings['blockMode'] == 'HIDE') {
                if (!$el.is(':hidden')) {
                    $el.hide()
                    $el.after(`<div class="quote"><div class="hld__banned hld__banned-block">此用户因被命中屏蔽规则而被隐藏言论，点击查看<br>* 命中规则: ${reason}</div></div>`)
                }
            }
            if (this.pluginSettings['blockMode'] == 'DELETE') {
                $el.html(`<div class="hld__banned">此用户因被命中屏蔽规则已被删除言论<br>* 命中规则: ${reason}</div>`)
            }
        },
        /**
         * 计算注册天数
         */
        calcRegisterDays(regTimestamp) {
            const regSeconds = Math.ceil(new Date().getTime() / 1000) - regTimestamp
            return {
                regDays: Math.round(regSeconds / 3600 / 24),
                regYear: parseFloat((regSeconds / 3600 / 24 / 365).toFixed(1))
            }
        }
    }
    registerPlugin(BlockEnhance)

})(function(plugin) {
    plugin.meta = GM_info.script
    unsafeWindow.ngaScriptPlugins = unsafeWindow.ngaScriptPlugins || []
    unsafeWindow.ngaScriptPlugins.push(plugin)
});