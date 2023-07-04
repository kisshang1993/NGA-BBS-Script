<center>
    <div align="center">
        <h2>
            <br>
            <a href="https://frappeframework.com">
                <img style="border-radius:20px;" src="https://i.loli.net/2021/04/02/iyUhwTpYXm8SKN6.png" height="100">
            </a>
        </h2>
        <h3>
            NGA论坛的增强型体验
        </h3>
        <h5>
            <em>NGA BBS Script 🖐︎🐟︎</em>
        </h5>
    </div>
</center>
<center>
    <div align="center">
        <a target="_blank" href="https://github.com/kisshang1993/NGA-BBS-Script" title="NGA-BBS-Script">
            <img src="https://img.shields.io/github/stars/kisshang1993/NGA-BBS-Script?label=Star&style=social">
        </a>
        <a target="_blank" href="https://greasyfork.org/zh-CN/scripts/393991-nga%E4%BC%98%E5%8C%96%E6%91%B8%E9%B1%BC%E4%BD%93%E9%AA%8C/" title="NGA-BBS-Script">
            <img alt="Greasy Fork" src="https://img.shields.io/greasyfork/v/393991">
        </a>
        <a target="_blank"  href="https://greasyfork.org/scripts/393991-nga%E4%BC%98%E5%8C%96%E6%91%B8%E9%B1%BC%E4%BD%93%E9%AA%8C/code/NGA%E4%BC%98%E5%8C%96%E6%91%B8%E9%B1%BC%E4%BD%93%E9%AA%8C.user.js">
            <img alt="Greasy Fork Total Installed" src="https://img.shields.io/greasyfork/dt/393991">
        </a>
        <a target="_blank" href="#LICENSE" title="License: MIT">
            <img src="https://img.shields.io/badge/License-MIT-success.svg">
        </a>
        <a target="_blank" href="https://github.com/kisshang1993/NGA-BBS-Script" title="License: NGA-BBS-Script">
            <img src="https://img.shields.io/github/languages/code-size/kisshang1993/NGA-BBS-Script">
        </a>
    </div>
</center>


---

NGA论坛显示优化，功能增强，具体功能见下面【[功能列表](#功能列表)】

功能列表中的功能是选择开启的，由于功能较多，为了可以完整的体验脚本赋予的所有功能

## 📖第一次使用请先阅读本篇文档

请按照个人喜好选择配置功能，选择开启使用功能

大家觉得此脚本好用，独乐乐不如众乐乐，就请推荐给更多的人使用吧！![Yeah](https://i.loli.net/2020/05/27/aYbjDRcz2qKsZwT.png)

(**干活**那叫以劳动换取报酬，**摸鱼**才~~TM的~~叫做挣钱![JoJo立](https://img1.imgtp.com/2023/06/15/6j77Gunw.png))

---

## v4.2更新 *

- 新增功能[用户增强](#用户增强)

  回复的用户信息处添加展示**吧龄**、**IP属地**

  ![用户增强案例1](https://img1.imgtp.com/2023/07/03/0QLB2Tpw.png) ![用户增强案例2](https://img1.imgtp.com/2023/07/03/jC1GybZ1.png)

  在**⚙️高级设置**中可以设置属地展示模式
  - 全部国旗：展示国旗
  - 全部文字：展示文字
  - 国旗加文字：国旗后面加文字

- 修复部分问题

## 安装指引

- 安装在浏览器脚本管理器：[[Tampermonkey]](https://www.tampermonkey.net/?ext=dhdg)
- 安装在广告过滤器：找到广告过滤器中的用户脚本管理页面，添加用户脚本，输入[[脚本地址]](https://greasyfork.org/scripts/393991-nga%E4%BC%98%E5%8C%96%E6%91%B8%E9%B1%BC%E4%BD%93%E9%AA%8C/code/NGA%E4%BC%98%E5%8C%96%E6%91%B8%E9%B1%BC%E4%BD%93%E9%AA%8C.user.js)安装

  *注意：此种安装方式部分脚本管理器特有的功能将不可用*

*开发及调试环境：谷歌浏览器(Chrome) 或新微软Edge + TamperMonkey浏览器油猴扩展 （也是建议环境），其他运行环境作者只经过少量测试不排除有些不一致的地方

## 功能列表

- ✅ [隐藏头像](#隐藏头像)
- ✅ [隐藏表情](#隐藏表情)
- ✅ [隐藏楼内图片](#隐藏楼内图片)
- ✅ [Excel模式](#excel模式)
- ✅ [护眼模式](#护眼模式)
- ✅ [暗黑模式](#暗黑模式)
- ✅ [高亮楼主](#高亮楼主)
- ✅ [拉黑名单与备注功能](#拉黑名单与备注功能)
- ✅ [关键字屏蔽](#关键字屏蔽)
- ✅ [用户增强](#用户增强)
- ✅ [图片增强（增强原版图片展示能力）](#图片增强)
- ✅ [楼内图像尺寸优化，每张图最大宽200px](#图片增强)
- ✅ [独立预览图片时可以切换楼内图片（默认快捷键为左右箭头按键）](#图片增强)
- ✅ [独立预览图片时可以缩放图片，拖拽图片](#图片增强)
- ✅ [独立预览图片时可以旋转图片](#图片增强)
- ✅ [隐藏签名](#隐藏签名)
- ✅ [隐藏版头/版规/子版](#隐藏版头版规子版)
- ✅ [调整字体大小](#调整字体大小)
- ✅ [帖子列表打开时使用新标签栏](#帖子列表打开时使用新标签栏)
- ✅ [域名重定向](#域名重定向)
- ✅ [连接直接跳转](#连接直接跳转)
- ✅ [自动翻页](#自动翻页)
- ✅ [折叠引用](#折叠引用)
- ✅ [导出/导入配置](#导出导入配置)

**注意：以上功能不是默认全部开启的，初次使用请先在【插件设置面板】根据个人喜好选择开关功能，关于【插件设置面板】请继续阅读*

## 功能说明

### 隐藏头像

默认切换快捷键[**`Q`**]

> 功能开启就会隐藏掉个人信息背景图片

### 隐藏表情

默认切换快捷键 [**`W`**]

隐藏前

![隐藏前预览](https://s1.ax1x.com/2020/05/27/tAIpB4.jpg)

隐藏后

![隐藏后预览](https://s1.ax1x.com/2020/05/27/tAISuF.jpg)

### 隐藏楼内图片

默认快捷切换键[**`E`**]

![隐藏图片预览](https://s1.ax1x.com/2020/05/27/tAI05n.jpg)

### Excel模式

默认快捷切换键[**`R`**]

**使用Excel为了提升体验，最好关闭【<font color="red">⚙️高级设置：帖子列表打开时使用新标签栏</font>】功能*

在**⚙️高级设置**中，可选以下皮肤：

- **腾讯文档** (*矢量图绘制，支持更高分辨率，推荐使用*)
- **WPS风格** (*1080P图片拼接，高分屏下会有颗粒感*)
- **Office** (*1080P图片拼接，高分屏下会有颗粒感*)

\*默认使用[*腾讯文档*]风格

腾讯文档风格：

![Excel皮肤-腾讯文档预览](https://img1.imgtp.com/2023/06/20/RLzmruAY.png)

WPS风格：

![Excel皮肤-WPS模式预览](https://s1.ax1x.com/2020/05/27/tAIDCq.png)

> WPS或Office风格可能会出现图片加载失败，比如用于伪装的excel页头及页尾，如遇此问题请及时反馈
  Excel并不适用于所有页面，可能会有潜在的问题，当有此问题是请使用快捷键切换到原始界面来进行相关的操作

### 护眼模式

![护眼模式预览](https://i.loli.net/2021/04/22/FeJYLNCpwI3gvXP.png)

**可以与Excel混用*

### 暗黑模式

参考Github Dark Theme，~~8000万🧑‍💻绝赞推荐~~

![暗黑模式预览](https://img1.imgtp.com/2023/06/16/I8lX8osI.png)

**暗黑模式下表情包可能难以看清*

**不可与Excel混用*

### 高亮楼主

将贴内楼主会被标记出来，更容易区分

![标记楼主预览](https://s1.ax1x.com/2020/05/27/tAIo26.jpg)

**注意：必须进入主楼一次才能标记楼主。*

### 拉黑名单与备注功能

#### 面板说明

操作面板

![操作面板预览](https://s1.ax1x.com/2020/05/27/tAIh5R.jpg)

标签功能（备注/标记）

![标签预览](https://i.loli.net/2020/07/28/GWpSbyJdCuNDZn7.jpg)

名单管理（配置入口在插件设置面板，详情请继续阅读）

![名单管理预览](https://i.loli.net/2020/07/28/D7R5Z1NFikSrcbn.jpg)

#### 拉黑模式

在**⚙️高级设置**中可以修改拉黑模式，此配置表示拉黑某人后对帖子的屏蔽策略，有以下三种：

- 屏蔽：保留楼层, 仅会屏蔽用户的回复，可以手动添加查看（*默认*）
- 删除：将会删除楼层
- 全部删除: 回复被拉黑用户的回复也会被删除

> 删除模式将会在**控制台**输出删除的内容

### 关键字屏蔽

含有屏蔽内容的标题，回复，贴条等全部都会被删除
*可以在控制台中看到删除的内容*

### 用户增强

回复的用户信息处添加展示**吧龄**、**IP属地**

![用户增强案例1](https://img1.imgtp.com/2023/07/03/0QLB2Tpw.png) ![用户增强案例2](https://img1.imgtp.com/2023/07/03/jC1GybZ1.png)

在**⚙️高级设置**中可以设置属地展示模式

- 全部国旗：展示国旗（如果有的话）
- 全部文字：展示文字
- 国旗加文字：国旗后面加文字

### 图片增强

#### 图片缩放功能，默认将贴内图片宽度调整到200px，更易于浏览

此值可以在**⚙️高级设置**中修改

![图片缩放预览](https://s1.ax1x.com/2020/05/27/tAIcKU.jpg)

#### 用一个独立的遮罩来预览大图，可以通过滚轮缩放图片，鼠标左键拖拽图片，也可以旋转图片

![图片增强预览](https://s1.ax1x.com/2020/05/27/tAIyvT.jpg)

### 隐藏签名

开启则隐藏掉用户的签名

### 隐藏版头版规子版

![隐藏版头预览](https://img1.imgtp.com/2023/06/25/7TXhCgvW.png)

在**⚙️高级设置**中，可选配置*隐藏版头同时隐藏背景图片*

### 调整字体大小

提供一个**⚙️高级设置**可供精细化的修改页面默认字体大小，默认为12px

> 此修改对于某些样式可能无效；值设置过大可能会造成意外的情况，建议修改区间为[12~18]px

### 帖子列表打开时使用新标签栏

提供一个**⚙️高级设置**可使帖子打开方式为新窗口打开

### 域名重定向

此功能将会将nga不同的域名均重定向到选择的域名，避免重复登录以及插件的配置不通用的问题

在**⚙️高级设置**中设置要重定向到的指定域名

正确的使用方式: 如果期望将所有域名均重定向到bbs.nga.cn，需要在其他域名中的脚本配置中设置重定向地址

> ⚠︎警告：由于不同域名下的配置个不通用，如果开启其他域名下的配置的重定向功能并且设置了不一样的重定向地址，将会陷入反复重定向的死循环！

### 连接直接跳转

开启此功能点击帖子内的超链接将直接跳转，不需要二次点击确认

### 自动翻页

开启此功能将会自动翻页

> 自动翻页过程中，可能会点不到页面底部的回复，请使用右上角的回复功能

### 折叠引用

开启此功能将会自动折叠超过一定高度的引用，使界面更加清爽

折叠的高度阈值为300px，可在**⚙️高级设置**中修改此值

---

## 设置

插件的全局设置，针对每一个功能的开关及对应的配置，初次使用应该先根据个人需求配置一下插件功能

### 普通模式下

[个人中心] -> [NGA优化摸鱼插件设置]

![普通模式下设置面板入口](https://s1.ax1x.com/2020/05/27/tAokZQ.jpg)

### Excel模式下

可通过扩展坞查看

![扩展坞预览](https://img1.imgtp.com/2023/06/20/wk3qQqkp.png)

#### WPS或Office风格
右上角 -> 点击摸鱼

![Excel模式下设置面板入口](https://s1.ax1x.com/2020/05/27/tAoJiR.png)

在开启了【自动翻页】功能后，到最后一页之前基本是点不到 [收藏]，[发表回复]，为了快捷回复，此入口会被顶置到这里

*普通模式下请使用页头的[收藏&回复]

![Excel下的收藏&回复](https://s1.ax1x.com/2020/05/27/tAoiqg.png)

### 设置面板

![设置面板预览](https://i.loli.net/2020/12/11/NWLnh1yXKoxajgV.jpg)

### ⚙️高级设置

⚙️高级设置可以对部分基础设置的功能进一步微调

![⚙️高级设置面板预览](https://i.loli.net/2020/12/11/SP28gXYHEQqcvJZ.jpg)

#### 可以手动配置快捷键，避免与其他插件冲突

![配置快捷键预览](https://i.loli.net/2020/10/29/f54OGDgeBqnLrbu.jpg
)

#### 导出导入配置

可以选择导出配置，迁移数据到新浏览器，或者分享配置

![导出配置](https://i.loli.net/2020/07/28/bEIrcRF1f3AnhJK.jpg)

## FAQ

### Q：部分表情没有隐藏

A：那其实不是用编辑器添加的表情，是张图片

### Q：安装了后刷新没有反应

A：可能是脚本没有运行，也可能是URL没有匹配，因为NGA URL很多，出现这种情况把出现问题的URL贴给我，后续我再添加匹配

目前匹配的URL有

- \*://bbs.nga.cn/\*
- \*://ngabbs.com/\*
- \*://nga.178.com/\*

### Q：脚本也安装了URL也匹配了运行还是没有反应

A：可能是兼容性问题，请升级浏览器以及安装最新的油猴插件

### Q：部分图片没有显示出来

A：存放于图床的图片失效了，请及时联系我重新上传图片

---

## 兼容性检查

### 浏览器

| 浏览器 | Chrome | Firefox | Edge | IE   | Opera | Safari |
| ---------- | ------ | ------- | ---- | ---- | ----- | ------ |
| 最低版本号 | 51     | 53      | 25   | ×    | 32    | 10      |

### 脚本管理器

| 管理器 | Tampermonkey | Violentmonkey | Greasymonkey | 本地管理器 |
| ---- | ------------ | ---- | ---- | ---- |
| 支持度 | 完全支持 | 完全支持 | 注册菜单不支持 | 注册菜单不支持 |
| 检查版本 | 4.12 | 2.13.0 | 4.11 | - |

---

### 有问题或建议可以在Github上提交一个【Issues】，其次可以在脚本更新地址提交【反馈】

> Github上的Issues会被优先处理

#### *反馈BUG时请带上浏览器名称版本+油猴插件名称版本，最好配上图文信息，方便定位与调试BUG，正确的反馈问题可以事半功倍，参考 [提问的智慧](https://github.com/kisshang1993/How-To-Ask-Questions-The-Smart-Way/blob/main/README-zh_CN.md)

##### 发现问题请先查看社区内是否已经有人提出，或者是否自己使用不当/错误导致，作者是否已经修复，如作者已经修复，重新安装一下脚本即可

- Github [[Github Issue](https://github.com/kisshang1993/NGA-BBS-Script/issues)]
- Greasy Fork [[反馈](https://greasyfork.org/zh-CN/scripts/393991-nga%E4%BC%98%E5%8C%96%E6%91%B8%E9%B1%BC%E4%BD%93%E9%AA%8C/feedback)]
- NGA玩家中心  [[@kisshang1993 私信](https://ngabbs.com/nuke.php?func=ucp&uid=9034572)]
