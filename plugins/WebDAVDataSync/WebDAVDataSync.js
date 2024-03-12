// ==UserScript==
// @name         NGA优化摸鱼体验-WebDAV配置同步
// @namespace    https://github.com/kisshang1993/NGA-BBS-Script/tree/master/plugins/WebDAVDataSync
// @version      1.0.0
// @author       HLD
// @description  使用WebDAV对配置进行同步，提供上传/下载配置功能
// @license      MIT
// @match        *://bbs.nga.cn/*
// @match        *://ngabbs.com/*
// @match        *://nga.178.com/*
// @match        *://g.nga.cn/*
// @grant        GM_xmlhttpRequest
// @grant        unsafeWindow
// @run-at       document-start
// @inject-into  content
// ==/UserScript==

(function (registerPlugin) {
    'use strict';
    const WebDAVDataSync = {
        name: 'WebDAVDataSync',
        title: 'WebDAV配置同步',
        desc: '使用WebDAV对配置进行同步，提供上传/下载配置功能',
        settings: [{
            key: 'url',
            title: 'WebDAV地址',
            default: ''
        }, {
            key: 'username',
            title: 'WebDAV账号',
            default: ''
        }, {
            key: 'password',
            title: 'WebDAV密码',
            default: ''
        }, {
            key: 'backupCount',
            title: '保留备份数',
            default: 10
        }],
        buttons: [{
            title: '检查连接',
            action: 'testConnections'
        }, {
            title: '上传配置',
            action: 'upload'
        }, {
            title: '下载最新配置',
            action: 'downloadLatest'
        }, {
            title: '下载指定配置',
            action: 'downloadSelected'
        }],
        // 请求构造
        request({method, path='', headers, ...config}) {
            // 获取输入框的当前的值
            let url = this.pluginInputs['url'].val().trim()
            url[url.length - 1] !== '/' && (url += '/')
            const username = this.pluginInputs['username'].val().trim()
            const password = this.pluginInputs['password'].val().trim()
            const methodDict = {
                PROPFIND: 207,
                GET: 200,
                PUT: 201,
                DELETE: 204
            }
            this.buttons.forEach(button => button.$el.attr('disabled', true))
            return new Promise((resolve, reject) => {
                GM_xmlhttpRequest({
                    method,
                    url: url + path,
                    headers: {
                        authorization: 'Basic ' + btoa(`${username}:${password}`),
                        ...headers
                    },
                    ...config,
                    onload: response => {
                        this.buttons.forEach(button => button.$el.removeAttr('disabled'))
                        if (response.status === methodDict[method]) {
                            resolve(response)
                        } else {
                            this.mainScript.popMsg(`WebDAV请求失败! 状态码: ${response.status} ${response.statusText}`, 'err')
                        }
                    }
                })
            })
        },
        // 获取文件列表
        getFileList() {
            return new Promise((resolve, reject) => {
                this.request({
                    method: 'PROPFIND',
                    headers: {depth: 1}
                })
                .then(res => {
                    let files = []
                    let path = res.responseText.match(/(?<=<d:href>).*?(?=<\/d:href>)/gi)
                    path.forEach(p => {
                        const filename = p.split('/').pop()
                        if (filename.startsWith('nga_bbs_script_data_') && filename.endsWith('.json')) {
                            files.push(filename)
                        }
                    })
                    resolve(files)
                })
            })
        },
        // 下载配置
        downloadFile(name) {
            this.request({
                method: 'GET',
                path: name
            })
            .then(res => {
                this.mainScript.getModule('BackupModule').import(res.responseText, false)
            })
        },
        // 测试连通性
        async testConnections() {
            await this.getFileList()
            this.mainScript.popMsg('连接成功！同步配置看起来没问题')
        },
        // 上传配置
        async upload() {
            const exportDataStr = this.mainScript.getModule('BackupModule').export('*', false)
            const exportDataSize = this.mainScript.getModule('BackupModule').calculateSize(exportDataStr.length)
            const filename = `nga_bbs_script_data_${this.getCurrentDate()}.json`
            await this.request({
                method: 'PUT',
                path: filename,
                data: exportDataStr
            })

            this.mainScript.popMsg(`配置文件[${filename}(${exportDataSize})]上传成功`)
            // 删除多余的备份
            const backupCount = this.pluginInputs['backupCount'].val() || 10
            if (backupCount > 0) {
                const files = await this.getFileList()
                if (files.length > backupCount) {
                    const deleteFiles = files.sort().slice(0, files.length - backupCount)
                    deleteFiles.forEach(file => {
                        this.request({
                            method: 'DELETE',
                            path: file
                        })
                    })
                    this.mainScript.printLog(`${this.title}: 删除多余的备份文件[${deleteFiles.join(', ')}]`)
                }
            }
        },
        // 导入最新配置
        async downloadLatest() {
            const files = await this.getFileList()
            if (files) {
                this.downloadFile(files.pop())
            } else {
                this.mainScript.popMsg('WebDAV上没有找到配置文件', 'err')
            }
        },
        // 导入指定配置
        async downloadSelected() {
            const files = await this.getFileList()
            if (files) {
                const filesNo = files.map((file, index) => `【${index}】 ${file}`)
                const selectedIndex = window.prompt(`请输入要下载的配置的【序号】\n${filesNo.join('\n')}`, files.length-1)
                if (selectedIndex && selectedIndex >= 0 && selectedIndex < files.length) {
                    this.downloadFile(files[selectedIndex])
                } else {
                    this.mainScript.popMsg('输入的配置序号有误', 'err')
                }
            } else {
                this.mainScript.popMsg('WebDAV上没有找到配置文件', 'err')
            }
        },
        // 获取当前时间
        getCurrentDate() {
            const now = new Date()
            const year = now.getFullYear()
            const month = (now.getMonth() + 1).toString().padStart(2, '0')
            const day = now.getDate().toString().padStart(2, '0')
            const hours = now.getHours().toString().padStart(2, '0')
            const minutes = now.getMinutes().toString().padStart(2, '0')
            const seconds = now.getSeconds().toString().padStart(2, '0')
            return `${year}_${month}_${day}_${hours}_${minutes}_${seconds}`
        }
    }
    registerPlugin(WebDAVDataSync)

})(function(plugin) {
    plugin.meta = GM_info.script
    unsafeWindow.ngaScriptPlugins = unsafeWindow.ngaScriptPlugins || []
    unsafeWindow.ngaScriptPlugins.push(plugin)
});