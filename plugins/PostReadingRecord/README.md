# NGA优化摸鱼体验插件-帖子浏览记录

## ⚠本脚本为[NGA优化摸鱼体验](https://greasyfork.org/zh-CN/scripts/393991-nga%E4%BC%98%E5%8C%96%E6%91%B8%E9%B1%BC%E4%BD%93%E9%AA%8C)的插件，使用需先安装👉[本体](https://greasyfork.org/zh-CN/scripts/393991-nga%E4%BC%98%E5%8C%96%E6%91%B8%E9%B1%BC%E4%BD%93%E9%AA%8C)👈

## v1.1更新 *

- ⚡ **实时跟踪阅读记录**

  现已支持实时跟踪阅读记录，在列表页可以点击标签快速跳转到上次阅读位置

  **由于存在抽楼/删帖等情况记录位置可能会偏移*

### 概述

记录帖子的阅读状态，着色以阅读帖子标题，跟踪后续新回复数量

![绿色标签](https://s2.loli.net/2023/10/23/lk4GZ2oatExnCdg.png)

![极简文本](https://s2.loli.net/2023/10/23/LIXuWKxjnc5qkwH.png)

### 使用方式

安装即可，在[NGA优化摸鱼体验]**设置面板** -> **插件管理** 更改配置

### 配置项

- **标记着色颜色**：默认黑色 #000
- **颜色不透明度**：默认50%
- **显示新增回复**：看过的帖子标题右侧显示新增的回复数量
- **新增回复样式**：
  - **绿色标签**：比较明显的一种展示方式，如预览图
  - **极简文本**：觉得标签太过显眼可以使用此项，此项仅会添加文本，例如 “+21”
- **记录过期天数**：浏览记录保存在浏览器的IndexedDB中，默认为只保留90天的浏览记录，值为-1时，则为永不清理
- **清除所有记录**：手动操作，删除IndexedDB中所有浏览记录

### 反馈问题

https://github.com/kisshang1993/NGA-BBS-Script/issues