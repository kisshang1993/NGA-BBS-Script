# NGA-BBS-Script 插件开发文档

## 简介

### 说明

由于作者当初开发考虑到了可持续发展，也是为了方便自己进行更新，开发这个脚本没多久就推到重来并重新设计出了这么一套架构，可以以模块化的形式开发功能，基于架构能力，现在添加了一个【插件支持模块】来支持插件的模块😂

作者思维跟精力毕竟有限，并不能满足每一个人的需求，有的人想接入个ChatGPT整个自动回复，也有人只是想简单的注入一个表情包进去，这些功能未经验证或者小众的功能均不可能直接添加进主脚本中，有了插件便可以提前使用插件试水，插件也是作为脚本文件，自由灵活，等合适了再整合进主脚本中也不迟

各位有技术能力的大佬也可以根据自己的实际需求来满足定制化的功能，亦或者编写插件发布在脚本托管平台来扩展能力，~~整花活🎉🎉🎉~~

### 基本原理

`class NGABBSScript`作为引擎，驱动整个脚本，提供生命周期，钩子函数等，本身并没有任何功能，而是通过添加【模块】`Module Object`来赋予脚本各种功能。

故此，只需要参照[完整配置示例](#完整配置示例)来修改参数及生命周期钩子函数，即可快速编写出一个插件。

插件可以发布在[GreasyFork](https://greasyfork.org/zh-CN)等平台，独立维护，自由装卸。

## 文档

插件模板（简易设置），完整配置请查看[完整配置示例](#完整配置示例)

以较早的时机使用注册一个插件`Module Object`到window对象上，后执行的主脚本中的【插件支持模块】检测并装载插件

插件核心内容为`registerPlugin`的对象

```js
// ==UserScript==
// @name         NGA优化摸鱼体验插件-【YOUR_PLUGIN_TITLE】
// @namespace    【YOUR_PLUGIN_URL】
// @version      1.0.0
// @author       【YOU】
// @description  【YOUR_PLUGIN_DESC】
// @license      MIT
// @match        *://bbs.nga.cn/*
// @match        *://ngabbs.com/*
// @match        *://nga.178.com/*
// @grant        unsafeWindow
// @run-at       document-start
// @inject-into  content
// ==/UserScript==

(function (registerPlugin) {
    'use strict';
    // ** 核心内容 **
    registerPlugin({
        name: '【YOUR_PLUGIN_UNIQUE_KEY】',  // 插件唯一KEY
        title: '【YOUR_PLUGIN_TITLE】',  // 插件名称
        desc: '【YOUR_PLUGIN_DESC】',  // 插件说明
        settings: [{...}],  // 插件配置
        initFunc() { ... },  // 初始化函数
        renderThreadsFunc() { ... },  // 列表项函数
        renderFormsFunc() { ... },  // 回复项函数
        style: ''  // 自定义样式
    })
    // **************

})(function(plugin) {
    plugin.meta = GM_info.script
    unsafeWindow.ngaScriptPlugins = unsafeWindow.ngaScriptPlugins || []
    unsafeWindow.ngaScriptPlugins.push(plugin)
});
```

---

### 基本配置

#### 🔸 name

type: `String` **必填**

插件的唯一KEY，作为插件的唯一标识

#### 🔸 title

type: `String`

插件名称，用作于在插件面板显示，缺失则使用脚本meta的name字段

#### 🔸 desc

type: `String`

插件简介，用作于插件面板的显示，缺失则使用脚本meta的description字段

#### 🔸 settings

type: `Array[Object]`

插件设置，提供此项则会在插件面板中绘制输入UI，以供提供参数配置能力

`Object`主要由三个字段构成`key`,`title`,`default`，其中`default`为设置的默认值，根据其不同的值类型构建出不同的输入控件

支持的输入类型：

- 文本输入框
- 数字输入框
- 复选框
- 下拉列表
- 颜色选择器 *

##### 文本输入框

当`default`的类型为`String`时，将会构建一个文本输入框

```js
settings: [{
    key: 'displayTitle',
    title: '显示标题',
    default: '暂无'
}]
```

##### 数字输入框

当`default`的类型为`Number`时，将会构建一个数字输入框

```js
settings: [{
    key: 'fontSize',
    title: '字体大小',
    default: 16
}]
```

##### 复选框

当`default`的类型为`Boolean`时，将会构建一个复选框

```js
settings: [{
    key: 'redirctEnable',
    title: '启用跳转',
    default: true
}]
```

##### 下拉列表


当拥有`options`属性，并且`options`内含有有效的选项对象时，将会构建一个下拉框

```js
settings: [{
    key: 'checkMode',
    title: '检查模式',
    default: 'mode1',
    options: [{
        label: '部分检查',
        value: 'mode1'
    }, {
        label: '全部检查',
        value: 'mode2'
    }]
}]
```
*⚠default的值必须是options内任意一个对象的value值*

##### 颜色选择器

颜色选择器比较特殊，本质上是个文本输入框，调用了JQuery的Spectrum插件将其绘制为颜色输入框，这里是使用标准模块`AuthorMark`的封装函数来实现的。

```js
settings: [{
    key: 'markColor',
    title: '标记颜色',
    default: '#000000'
}],
initFunc() {
    // 调用标准模块authorMark初始化颜色选择器
    this.mainScript.getModule('AuthorMark').initSpectrum(`[plugin-id="${this.pluginID}"][plugin-setting-key="markColor"]`)
}
```

`this.mainScript`与`this.pluginID`请参阅[插件常量](#插件常量)

##### setting全部参数

| 参数  | 类型     | 必填 | 说明        |
| ----- | -------- | ---- | ----------- |
| key   | `String` | Y    | 配置唯一KEY，用于编程内获取配置 |
| title | `String`  | Y | 配置的展示名称 |
| desc | `String` |  | 配置的说明，表现形式为鼠标停留在title上以tooltip的形式展现，支持`\n`换行 |
| default | `String` `Number` `Boolean` | Y | 配置的默认值 |
| options | `Array` |  | 下拉框的选项，当`default`的值类型为`String`时，添加此属性则会构建下拉框 |

**options的值对象参数**

| 参数  | 类型     | 必填 | 说明        |
| ----- | -------- | ---- | ----------- |
| label | `String` | Y    | 显示的选项名称 |
| value | `String`  | Y | 选项使用的值 |

#### 🔸 buttons

type: `Array[Object]`

提供此项则会在插件设置面板中绘制按钮

```js
buttons: [{
    title: '清空数据',
    action: 'clearData'
}, {
    title: '重置',
    action: () => { ... }
}]
```

对象参数

| 参数  | 类型     | 必填 | 说明        |
| ----- | -------- | ---- | ----------- |
| title | `String` | Y    | 显示的按钮名称 |
| action | `String` `Function` | Y | 按钮的触发事件<br />类型是`String`时会调用this对象中同名的函数 |

#### 🔸 style

type: `String`

静态css样式

---

### 事件函数

#### 🔸 preProcFunc()

预处理函数，提前与所有标准模块的初始化函数initFunc()，适合用于需要提前于标准模块进行处理的特定动作或以较早的时机重构标准模块功能函数等

*⚠ 注意：由于时机较早，某些变量或者环境可能在此函数上下文内可能缺失*

#### 🔸 initFunc()

初始化函数，适用于执行一些插件内需要初始化或者提前处理的功能

#### 🔸 postProcFunc()

后执行函数，在初始化函数之后调用

#### 🔸 renderThreadsFunc($el)

处于帖子列表页时，帖子列表页的每条帖子将会触发一次本函数，形参为帖子`tr`元素的`JQuery`对象

`tr`的css选择器为`#m_threads .topicrow`

每条记录只触发一次本函数

#### 🔸 renderForms($el)

处于帖子详情页时，详情页的每条回复将会触发一次本函数，形参为详情页的`table`元素的`JQuery`对象

`table`的css选择器为`#m_posts_c .forumbox.postbox`

每条回复只触发一次本函数

#### 🔸 renderAlwaysFunc()

循环函数，每100ms执行一次

#### 🔸 asyncStyle()

动态异步样式，需要返回 css 字符串，适用于需要动态的计算css值时使用

#### 🔸 beforeSaveSettingFunc(setting)

当保存插件配置时，触发此函数，形参为输入的插件配置对象

可用于检查参数是否正确，如需要抛出错误，只需要return出字符串即可

```js
beforeSaveSettingFunc: function(settings) {
    // settings 为还未保存的配置对象
    if (!$.isNumeric(settings['markOpacity'])) {
        return '颜色不透明度必须是个数字'
    }
}
```


### 生命周期

插件是由标准模块【插件支持】所驱动，而【插件支持】模块有一个较早的加载时机

下面为简化的主要流程，插件部分将使用**粗体**表示:

1. 装载标准模块
1. 执行标准模块的预处理函数(preProcFunc)
1. 执行标准模块的初始化函数(initFunc)
   1. **执行【插件支持】模块的初始化函数并装载插件**
   1. **执行插件的预处理函数(preProcFunc)**

1. **执行插件的初始化函数(initFunc)**
1. 执行所有模块的后处理函数(postProcFunc)及添加样式
1. 初始化完成，进入循环

查看[完整生命周期](#完整生命周期)

---

### 插件常量

插件在被装载到模块列表中时，脚本会往插件的上下文`this`中注入数个常量，方便插件调用其能力

*⚠常量为只读*

#### 🔹 pluginID

type: `String`

插件ID，结合插件的`name`与meta的`author`(hash化)组合而成，具有唯一性

可以使用插件ID结合配置名称来选中插件配置的dom元素

```js
initFunc() {
    console.log(this.pluginID)  // 输出 => TestPlugin@72156
    console.log($(`[plugin-id="${this.pluginID}"][plugin-setting-key="markColor"]`))  // 输出 => <input type="..."> Jquery对象
}
```

#### 🔹 pluginSettings

type: `Object`

插件保存的配置，键值对为`settings`值对象的key: value || default

```js
{
    settings: [{
        key: 'markColor',
        title: '标记着色颜色',
        default: '#000000'
    }],
    initFunc() {
        // 插件保存的配置，如未修改过则是default的值
        console.log(this.pluginSettings['markColor'])  // 输出 => #000000
    }
}
```

#### 🔹 mainScript

type: `class`

脚本对象`class NGABBSScript`的引用，可以调用对象成员函数及其变量

```js
initFunc() {
    // 获取脚本的JQuery引用
    const $ = this.mainScript.libs.$
    console.log($.trim(' '))
    // 等价于 this.pluginSettings
    this.mainScript.setting.plugin[this.pluginID]
    // 获取标准模块authorMark的对象引用
    this.mainScript.getModule('AuthorMark')  
    // 调用标准模块authorMark初始化颜色选择器
    this.mainScript.getModule('AuthorMark').initSpectrum(...)
    // 消息弹框
    this.mainScript.popMsg('保存成功')
}
```

**`mainScript`部分其他脚本或模块实用函数**

以下变量或函数均为`mainScript`下的成员

##### 🟢 libs

主脚本使用的库引用，可以方便的使用主脚本已经加载过的库文件，而无需再次使用@require引用

```js
const $ = this.mainScript.libs.$  // JQuery
const echarts = this.mainScript.libs.echarts  // echarts
```

##### 🟢 popNotification(msg, duration=1000)

左上角的轻提示

```js
this.mainScript.popNotification('显示头像', duration=200)
```

| 参数     | 类型     | 必填 | 说明                 |
| -------- | -------- | ---- | -------------------- |
| msg      | `String` | Y    | 提示内容             |
| duration | `Number` |      | 持续时间，默认1000ms |


##### 🟢 popMsg(msg, type='ok')

上居中的弹框

```js
this.mainScript.popMsg('保存成功')
this.mainScript.popMsg('保存失败！', type='err')
```

| 参数 | 类型     | 必填 | 说明                          |
| ---- | -------- | ---- | ----------------------------- |
| msg  | `String` | Y    | 弹框内容                      |
| type | `String` |      | 类型，支持`ok`, `err`, `warn` |

##### 🟢 printLog(msg)

控制台打印带有黑黄前缀的log

```js
this.mainScript.printLog('保存日志xxxx')
```

| 参数 | 类型     | 必填 | 说明                          |
| ---- | -------- | ---- | ----------------------------- |
| msg  | `String` | Y    | log内容                      |

##### 🟢 createStorageInstance(instanceName)

创建并返回一个IndexedDB储存实例对象

```js
const store = this.mainScript.createStorageInstance('NGA_BBS_Script__PostReadingRecord')
```

| 参数 | 类型     | 必填 | 说明                          |
| ---- | -------- | ---- | ----------------------------- |
| instanceName | `String` | Y    | 数据库名称，唯一             |

具体操作文档参阅 http://localforage.docschina.org/

> 此方法创建的储存实例会保存在主脚本的`store`对象中，使用脚本的“清理缓存”功能也会一并将内容清空

##### 🟢 getModule(name)

获取装载的模块对象引用

```js
// 获取标准模块authorMark对象
this.mainScript.getModule('AuthorMark')  
// 获取其spectrum配置对象
console.log(this.mainScript.getModule('AuthorMark').colorPickerConfig)
```

| 参数 | 类型     | 必填 | 说明                          |
| ---- | -------- | ---- | ----------------------------- |
| name | `String` | Y    | 模块name       |

部门模块及其函数

| 模块        | 函数                      | 参数类型                          | 说明                                                         |
| ----------- | ------------------------- | --------------------------------- | ------------------------------------------------------------ |
| AuthorMark  | initSpectrum(selector)    | `JQuery` `String`                 | 渲染文本输入框为颜色选择器，参数为JQuery选择器对象或者string类型的css选择器字符串 |
| AuthorMark  | getQueryString(name, url) | name: `String`<br />url: `String` | 解析url中的参数name，url默认为当前的url                      |
| MarkAndBan  | setBanUser(userObj)       | `Object`                          | 拉黑用户，参数为用户对象<br />`userObj = {uid: 11111, name: '小王'}`<br />uid为必填，name选填 |
| MarkAndBan  | getUserMarks(userObj)     | `Object`                          | 获取用户的标签对象，参数为用户对象<br />`userObj = {uid: 11111, name: '小王'}`<br />uid为必填，name选填 |
| MarkAndBan  | setUserMarks(markObj)     | `Object`                          | 设置用户标签，参数为标签对象，参考getUserMarks的返回值       |
| ExtraDocker | getQuerySet()             |                                   | 获取当前URL的参数键值对对象                                  |
| UserEnhance | getRemoteUserInfo(uid)    | `String`                          | 使用uid调用接口获取用户信息，返回值为`Promise`               |



## 其他

### 完整配置示例

【】内为需要修改的字段

meta的name添加前缀是方便可以被脚本索引到，索引检查：

https://greasyfork.org/zh-CN/scripts?q=NGA%E4%BC%98%E5%8C%96%E6%91%B8%E9%B1%BC%E4%BD%93%E9%AA%8C%E6%8F%92%E4%BB%B6

此配置可以直接创建新插件并运行，提前开启F12观察生命周期及输出日志

```js
// ==UserScript==
// @name         NGA优化摸鱼体验插件-【YOUR_PLUGIN_TITLE】
// @namespace    【YOUR_PLUGIN_URL】
// @version      1.0.0
// @author       【YOU】
// @description  【YOUR_PLUGIN_DESC】
// @license      MIT
// @match        *://bbs.nga.cn/*
// @match        *://ngabbs.com/*
// @match        *://nga.178.com/*
// @grant        unsafeWindow
// @run-at       document-start
// @inject-into  content
// ==/UserScript==

(function (registerPlugin) {
    'use strict';
    registerPlugin({
        name: '【YOUR_PLUGIN_UNIQUE_KEY】',  // 插件唯一KEY
        title: '【YOUR_PLUGIN_TITLE】',  // 插件名称
        desc: '【YOUR_PLUGIN_DESC】',  // 插件说明
        settings: [{
            key: 'textInput',
            title: '文本输入框',
            desc: '描述信息\n描述信息',
            default: ''
        }, {
            key: 'numberInput',
            title: '数字输入框',
            default: 10
        }, {
            key: 'checkBox',
            title: '复选框',
            default: true
        }, {
            key: 'dropBox',
            title: '下拉框',
            default: 'option1',
            options: [{
                label: '选项1',
                value: 'option1'
            }, {
                label: '选项2',
                value: 'option2'
            }]
        }],
        buttons: [{
            title: '清空数据',
            action: 'postProcFunc'
        }, {
            title: '重置',
            action: () => {alert('已重置')}
        }],
        beforeSaveSettingFunc(setting) {
            console.log(setting)
            // return 值则不会保存，并抛出错误
            return '拦截'
        },
        preProcFunc() {
            console.log('已运行: preProcFunc()')
        },
        initFunc() {
            console.log('已运行: initFunc()')
            console.log('插件ID: ', this.pluginID)
            console.log('插件配置: ', this.pluginSettings)
            console.log('主脚本: ', this.mainScript)
            console.log('主脚本引用库: ', this.mainScript.libs)
        },
        postProcFunc() {
            console.log('已运行: postProcFunc()')
        },
        renderThreadsFunc($el) {
            console.log('列表项 (JQuery) => ', $el)
            console.log('列表项 (JS) => ', $el.get(0))
        },
        renderFormsFunc($el) {
            console.log('回复项 (JQuery) => ', $el)
            console.log('回复项 (JS) => ', $el.get(0))
        },
        renderAlwaysFunc() {
            // console.log('循环运行: renderAlwaysFunc()')
        },
        asyncStyle() {
            return `#ngascript_plugin_${this.pluginID} {color: red}`
        },
        style: `
        #ngascript_plugin_test {color: red}
        `
    })

})(function(plugin) {
    plugin.meta = GM_info.script
    unsafeWindow.ngaScriptPlugins = unsafeWindow.ngaScriptPlugins || []
    unsafeWindow.ngaScriptPlugins.push(plugin)
});
```

---

### 完整生命周期

ADD插件部分有所简化，但主要周期顺序不变

不同模块的同一个生命周期，按照加载顺序依次执行，加载插件时，会被推入模块组列表的末尾，所以同等生命周期的执行时机是晚于标准模块的

```bash
+--------------------------------------------------------------------+
|  Init Stage                                                        |
|                +-------------------------------+                   |
|                |  script = new NGABBSScript()  |                   |
|                +-------------------------------+                   |
|                                |                   +------------+  |
|                                |               +---|  Module A  |  |
|                                |               |   +------------+  |
|                                V               |                   |
|                        +---------------+  ADD  |   +------------+  |
|                        |  Add Modules  |<------O---|  Module B  |  |
|                        +---------------+       |   +------------+  |
|                                |               |                   |
|                                V               |   +------------+  |
|                          +-----------+         +---|  Module C  |  |
|                          |    RUN    |             +------------+  |
|                          +-----------+                             |
|                                |                                   |
+--------------------------------|-----------------------------------+
                                 |
+--------------------------------|-----------------------------------+
|  Render Stage                  |                                   |
|                                |                                   |
|  foreach modules       +--------------+                            |
|                        |  preProcFunc |                            |
|                        +--------------+              Module        |
|                                |                 [PluginSupport]   |
|                                V               +-----------------+ |
|                        +--------------+   ADD  |   + Plugin A    | |
|                        |   initFunc   | <------|   + Plugin B    | |
|                        +--------------+  Plugin|   + Plugin C    | |
|                                |               |   ==========    | |
|                                V               |  preProcFunc()  | |
|                        +--------------+        +-----------------+ |
|                        | postProcFunc |                            |
|                        +--------------+                            |
|                                |                                   |
|                                V                                   |
|             +------------------O-----------------+                 |
|             |                  |                 |                 |
|    IF       |                  V                 |    IF           |
|    Threads  |       +--------------------+       |    Forms        |
|    Page     |       |  renderAlwaysFunc  |       |    Page         |
|             |       +--------------------+       |                 |
|             V                  |                 V                 |
|   +---------------------+      |       +-------------------+       |
|   |  renderThreadsFunc  |      |       |  renderFormsFunc  |       |
|   +---------------------+      |       +-------------------+       |
|             |                  |                 |                 |
|             +------------------O-----------------+                 |
|                                |                                   |
|                                V                                   |
|                         +-------------+                            |
|                         |  Add Style  |  Sync/Async                |
|                         +-------------+                            |
|                                |                                   |
|                                V                                   |
|                        +---------------+                           |
|                        |  Render Done  |                           |
|                        +---------------+                           |
|                                                                    |
|--------------------------------------------------------------------|
```
