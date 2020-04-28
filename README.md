## NGA论坛的增强型体验
[![Github](https://img.shields.io/github/stars/kisshang1993/NGA-BBS-Script?label=Star&style=social)](https://github.com/kisshang1993/NGA-BBS-Script) [![Greasy Fork](https://img.shields.io/badge/Greasy%20Fork-NGA优化摸鱼体验-brightgreen)](https://greasyfork.org/zh-CN/scripts/393991-nga%E4%BC%98%E5%8C%96%E6%91%B8%E9%B1%BC%E4%BD%93%E9%AA%8C/) ![GitHub code size in bytes](https://img.shields.io/github/languages/code-size/kisshang1993/NGA-BBS-Script) ![GitHub](https://img.shields.io/github/license/kisshang1993/NGA-BBS-Script)

NGA论坛显示优化，功能增强，提升浏览体验
可以有效防止突然蹦出一对??而导致的突然性的社会死亡![扇子脸](https://pic.downk.cc/item/5ea7eb7ec2a9a83be5c6b56a.png)

如果大家觉得此插件好用，独乐乐不如众乐乐，就请推荐给更多的人使用吧！![Yeah!](https://pic.downk.cc/item/5ea7eb7ec2a9a83be5c6b565.png)


-------



### 最近更新 *
- 将 **贴内图片功能增强** 中的图片缩放单独分离出 **贴内图片缩放** 作为一个可配置项(默认为缩放)
- 优化显示效果

### 安装指引

 1. 安装在浏览器脚本管理器：[[安装指引]](https://greasyfork.org/zh-CN/help/installing-user-scripts)
 2. 安装在广告过滤器：找到广告过滤器中的用户脚本管理页面，添加用户脚本，输入[[脚本地址]](https://greasyfork.org/scripts/393991-nga%E4%BC%98%E5%8C%96%E6%91%B8%E9%B1%BC%E4%BD%93%E9%AA%8C/code/NGA%E4%BC%98%E5%8C%96%E6%91%B8%E9%B1%BC%E4%BD%93%E9%AA%8C.user.js)安装

*开发及调试环境：谷歌浏览器(Chrome) + TamperMonkey浏览器油猴插件


## 功能列表
+ 隐藏头像（默认快捷键切换显示[Q]）
+ 隐藏表情，使用中文替代（默认快捷键切换显示[W]）
+ 隐藏楼内图片（默认快捷键切换显示[E]）
+ 贴内图片缩放（最大缩放至宽度200px）
+ 隐藏签名
+ 隐藏版头/版规/子版（使用一个按钮进行切换）
+ 帖子列表打开时使用新标签栏
+ 楼内图像尺寸优化，每张图最大宽200px
+ 独立预览图片时可以切换楼内图片（默认快捷键为左右箭头按键）
+ 独立预览图片时可以缩放图片，拖拽图片
+ 独立预览图片时可以旋转图片
+ 高亮楼主
+ 拉黑/备注
+ 关键字屏蔽
+ 导出/导入配置


## 部分效果预览
#### 隐藏表情，切换快捷键 [**`W`**]
隐藏前  

![](https://pic.superbed.cn/item/5e15a38876085c32896b70fb.jpg)

隐藏后  

![](https://pic.superbed.cn/item/5e15a38876085c32896b70f5.jpg)

#### 可配置的主动隐藏图片，使用一个按钮切换，默认快捷切换键[**`E`**]

![](https://pic.superbed.cn/item/5e15a38876085c32896b70fe.jpg)

#### 可以手动配置快捷键，避免与其他插件冲突
![](https://pic.downk.cc/item/5e71f828e83c3a1e3aec9e9e.png)

#### 图片缩放功能，贴内图片宽度调整到200px，更易于浏览

![](https://pic.superbed.cn/item/5e15a60d76085c32896bfc76.jpg)

#### 图片增强功能，用一个独立的遮罩来预览大图，可以通过滚轮缩放图片，鼠标左键拖拽图片，也可以旋转图片

![](https://pic.superbed.cn/item/5e15a60d76085c32896bfc78.jpg)

#### 标记楼主，贴内楼主会被标记出来，更容易区分

![](https://pic.superbed.cn/item/5e15a38876085c32896b70f2.jpg)

*注意：必须进入主楼一次才能标记楼主*

#### 拉黑名单与备注功能
操作面板  
![](https://pic.superbed.cn/item/5e15a37176085c32896b6e68.jpg)

备注（微博风格）  
![](https://pic.downk.cc/item/5e181f5b7f9a96fec152409b.jpg)

名单管理  
![](https://pic.superbed.cn/item/5e15a37176085c32896b6e64.jpg)


#### 关键字屏蔽
含有屏蔽内容的标题，回复，贴条等全部都会被删除
*可以在控制台中看到删除的内容*


#### 大部分功能均可以启用或关闭，管理面板位置在右上角的[个人中心] -> [NGA优化摸鱼插件设置]

![](https://pic.superbed.cn/item/5e15a38876085c32896b7100.jpg)

![](https://pic.downk.cc/item/5e71f828e83c3a1e3aec9e93.png)




## FAQ
**Q：部分表情没有隐藏**

A：那其实不是用编辑器添加的表情，是张图片

**Q：安装了后刷新没有反应**

A：可能是脚本没有运行，也可能是URL没有匹配，因为NGA URL很多，出现这种情况把出现问题的URL贴给我，后续我再添加匹配
目前匹配的URL有
+ \*://bbs.nga.cn/\*
+ \*://ngabbs.com/\*
+ \*://nga.178.com/\*

**Q：脚本也安装了URL也匹配了运行还是没有反应**

A：可能是兼容性问题，请升级浏览器以及安装最新的油猴插件


--------

#### 有问题或建议可以在脚本更新地址提交【反馈】，或者在Github上提交一个【Issues】，或者论坛私信
##### *反馈BUG时请带上浏览器名称版本+油猴插件名称版本，最好配上图文信息，方便定位与调试BUG
- Github [[Github Issue](https://github.com/kisshang1993/NGA-BBS-Script/issues)]
- Greasy Fork [[新话题](https://greasyfork.org/zh-CN/forum/post/discussion?script=393991&locale=zh-CN)]
- NGA玩家中心  [[@kisshang1993 私信](https://ngabbs.com/nuke.php?func=ucp&uid=9034572)]