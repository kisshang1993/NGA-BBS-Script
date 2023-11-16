# NGA优化摸鱼体验插件-WebDAV配置同步

## ⚠本脚本为[NGA优化摸鱼体验](https://greasyfork.org/zh-CN/scripts/393991-nga%E4%BC%98%E5%8C%96%E6%91%B8%E9%B1%BC%E4%BD%93%E9%AA%8C)的插件，使用需先安装👉[本体](https://greasyfork.org/zh-CN/scripts/393991-nga%E4%BC%98%E5%8C%96%E6%91%B8%E9%B1%BC%E4%BD%93%E9%AA%8C)👈

### 概述

使用WebDAV对配置进行同步，提供上传/下载配置功能

![WebDAV配置同步](https://s2.loli.net/2023/11/14/Ul9sgrLjFtXGqSk.png)

### 使用方式

安装即可，在[NGA优化摸鱼体验]**设置面板** -> **插件管理** 更改配置

### 配置项

- **WebDAV地址/账号/密码**：WebDAV服务商提供的URL/账号/密码
- **保留备份数**：在WebDAV中最多保留的配置数，上传时自动删除X条之前的数据，默认为10条，-1为永不删除
- **检查连接**：连接并验证填写的WebDAV登录凭证的是否有效
- **上传配置**：上传当前的所有的配置至WebDAV，同时根据`保留备份数`配置项来滚动删除之前的数据
- **下载最新配置**：下载并导入最新(最后上传)的配置
- **下载指定配置**：手动选择WebDAV中已有的配置进行下载并导入

### 注意事项

- 经过测试`坚果云`与`群晖NAS`的WebDAV可以正常使用，在标准协议下其他提供商理论上也不会有问题，但**未经测试**

- 配置会直接上传至当前输入的WebDAV的**路径**，不会创建文件夹

- 自动上传的配置是`JSON`格式

### 反馈问题

https://github.com/kisshang1993/NGA-BBS-Script/issues
