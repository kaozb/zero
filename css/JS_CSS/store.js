/* ---------------------------------------------------------------
 * store.js — 链接数据的读写层
 *
 * 结构：
 *   [ { tag: "开发工具", link: [ { name, url }, ... ] }, ... ]
 *
 * 数据优先读 localStorage；没有则用下面的 SEED 作为初始值。
 * --------------------------------------------------------------- */
window.NavStore = (function () {
    "use strict"

    var KEY = "nav_links_v1"

    /* ------------------------------------------------------- 初始数据 */

    /* 首次访问（localStorage 为空）时使用的默认导航 */
    var SEED = [{
        tag: "开发工具",
        link: [
            { name: "GitHub", url: "https://github.com/" },
            { name: "Gitee", url: "https://gitee.com/aofun/projects" },
            { name: "阿里云效", url: "https://codeup.aliyun.com" },
            { name: "Hellogithub", url: "https://hellogithub.com/periodical" },
            { name: "开源中国", url: "https://www.oschina.net/" }
        ]
    }, {
        tag: "开发者社区",
        link: [
            { name: "V2EX", url: "https://www.v2ex.com/" },
            { name: "掘金", url: "https://juejin.im/" },
            { name: "阮一峰", url: "https://www.ruanyifeng.com/blog" },
            { name: "博客园", url: "https://www.cnblogs.com/" },
            { name: "CSDN", url: "https://www.csdn.net/" },
            { name: "知乎", url: "https://www.zhihu.com/" },
            { name: "恩山论坛", url: "https://www.right.com.cn/" },
            { name: "美团技术团队", url: "https://tech.meituan.com/" }
        ]
    }, {
        tag: "AI 与翻译",
        link: [
            { name: "OpenAi", url: "https://chat.openai.com/" },
            { name: "DeepL翻译", url: "https://www.deepl.com/translator" },
            { name: "豆包", url: "https://www.doubao.com/chat/" },
            { name: "元宝", url: "https://yuanbao.tencent.com/chat/" },
            { name: "千问", url: "https://tongyi.aliyun.com/qianwen/" },
            { name: "DeepSeek", url: "https://chat.deepseek.com/" }
        ]
    }, {
        tag: "学习提升",
        link: [
            { name: "慕课网", url: "https://www.imooc.com/" },
            { name: "中国大学MOOC", url: "https://www.icourse163.org/" },
            { name: "网易云课堂", url: "https://study.163.com/" },
            { name: "LeetCode", url: "https://leetcode-cn.com/" },
            { name: "考试酷", url: "https://www.examcoo.com/index/ku" }
        ]
    }, {
        tag: "科技资讯",
        link: [
            { name: "少数派", url: "https://sspai.com/" },
            { name: "异次元", url: "https://www.iplaysoft.com/" },
            { name: "十年", url: "https://www.foreverblog.cn/feeds.html" },
            { name: "微博", url: "https://weibo.com/" },
            { name: "腾讯新闻", url: "https://news.qq.com/" },
            { name: "游民星空", url: "https://www.gamersky.com/" }
        ]
    }, {
        tag: "长视频",
        link: [
            { name: "B站", url: "https://www.bilibili.com/" },
            { name: "腾讯视频", url: "https://v.qq.com/" },
            { name: "爱奇艺", url: "https://www.iqiyi.com/" },
            { name: "优酷", url: "https://www.youku.com/" },
            { name: "芒果TV", url: "https://www.mgtv.com/" },
            { name: "央视网", url: "http://tv.cctv.com/" },
            { name: "YouTube", url: "https://www.youtube.com/" },
            { name: "乐视视频", url: "http://www.le.com/" }
        ]
    }, {
        tag: "短视频",
        link: [
            { name: "抖音", url: "https://www.douyin.com/" },
            { name: "快手", url: "https://www.kuaishou.com/" },
            { name: "西瓜视频", url: "https://www.ixigua.com/" },
            { name: "好看视频", url: "https://haokan.baidu.com/" },
            { name: "微视", url: "https://weishi.qq.com/" }
        ]
    }, {
        tag: "购物出行",
        link: [
            { name: "淘宝", url: "https://www.taobao.com/" },
            { name: "京东", url: "https://www.jd.com/" },
            { name: "12306", url: "https://kyfw.12306.cn/otn/index/init" },
            { name: "高德地图", url: "https://www.amap.com/" }
        ]
    }, {
        tag: "求职招聘",
        link: [
            { name: "Boss直聘", url: "https://www.zhipin.com/" },
            { name: "58同城", url: "https://www.58.com/" },
            { name: "智联招聘", url: "https://www.zhaopin.com/" }
        ]
    }, {
        tag: "局域服务",
        link: [
            { name: "Clash", url: "http://xl.hoao.fun:9090/ui" },
            { name: "Alist", url: "http://xl.hoao.fun:5244" },
            { name: "AdGuard", url: "http://xl.hoao.fun:3000" },
            { name: "miku工具", url: "https://miku.hoao.fun/" }
        ]
    }]

    /* ------------------------------------------------------- 名称清洗 */

    /* 去掉旧数据 name 里的内嵌 <i> 标签与 emoji，只留纯文本 */
    function stripIcon(name) {
        name = String(name == null ? "" : name)
            .replace(/<i[^>]*><\/i>/gi, "")
            .replace(/<[^>]+>/g, "")
            .replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}]/gu, "")
            .trim()
        return name || "未命名"
    }

    /* --------------------------------------------------------- 工具函数 */

    function esc(str) {
        return String(str == null ? "" : str)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#39;")
    }

    /* 补全协议；返回 null 表示不是合法地址 */
    function normalizeUrl(url) {
        url = String(url == null ? "" : url).trim()
        if (!url) return null
        if (/^(javascript|data|vbscript):/i.test(url)) return null
        if (/^\/\//.test(url)) return "http:" + url

        /* 内网主机（localhost / *.local / IP，可带端口，后面可跟路径）走 http。
           必须在"判协议"之前判断：否则 "localhost:8080" 会把 localhost 当协议名。 */
        if (/^(localhost|[\w-]+\.local|\d{1,3}(\.\d{1,3}){3})(:\d+)?(\/|$)/i.test(url)) {
            return "http://" + url
        }
        /* 真协议：scheme:// 或 mailto:/tel:/magnet: */
        if (/^[a-z][a-z0-9+.-]*:\/\//i.test(url) || /^(mailto|tel|magnet):/i.test(url)) {
            return url
        }
        /* 裸主机名/域名，默认 https */
        return "https://" + url
    }

    /* ----------------------------------------------------------- 持久化 */

    /* 把任意来源的数据洗成合法结构，非法项直接丢弃 */
    function sanitize(data) {
        if (!Array.isArray(data)) return null
        var out = []
        data.forEach(function (group) {
            if (!group || typeof group !== "object") return
            var tag = String(group.tag == null ? "" : group.tag).trim()
            if (!tag) return
            var links = []
            ;(Array.isArray(group.link) ? group.link : []).forEach(function (item) {
                if (!item || typeof item !== "object") return
                var linkUrl = normalizeUrl(item.url)
                if (!linkUrl) return
                links.push({
                    name: stripIcon(item.name),
                    url: linkUrl
                })
            })
            out.push({ tag: tag, link: links })
        })
        return out
    }

    /* SEED 转成正式结构 */
    function seed() {
        return sanitize(SEED) || []
    }

    var data = []
    var started = false

    function load() {
        var raw = null
        try {
            raw = window.localStorage.getItem(KEY)
        } catch (e) {
            raw = null
        }
        if (raw) {
            try {
                var parsed = sanitize(JSON.parse(raw))
                if (parsed && parsed.length) return parsed
            } catch (e) {
            }
        }
        return seed()
    }

    function start() {
        if (!started) {
            data = load()
            started = true
        }
        return data
    }

    function all() {
        return start()
    }

    function save() {
        try {
            window.localStorage.setItem(KEY, JSON.stringify(data))
        } catch (e) {
        }
    }

    /* 落盘 + 通知渲染层刷新 */
    function commit() {
        save()
        if (typeof window.navAppRefresh === "function") window.navAppRefresh()
    }

    /* --------------------------------------------------------- 增删改查 */

    function categories() {
        return start().map(function (group) {
            return group.tag
        })
    }

    function indexOfCategory(tag) {
        var list = start()
        for (var i = 0; i < list.length; i++) {
            if (list[i].tag === tag) return i
        }
        return -1
    }

    function addCategory(tag) {
        tag = String(tag == null ? "" : tag).trim()
        if (!tag) return { ok: false, msg: "分类名称不能为空" }
        if (indexOfCategory(tag) > -1) return { ok: false, msg: "分类「" + tag + "」已存在" }
        start().push({ tag: tag, link: [] })
        commit()
        return { ok: true, tag: tag }
    }

    function renameCategory(index, tag) {
        tag = String(tag == null ? "" : tag).trim()
        var list = start()
        if (index < 0 || index >= list.length) return { ok: false, msg: "分类不存在" }
        if (!tag) return { ok: false, msg: "分类名称不能为空" }
        var dup = indexOfCategory(tag)
        if (dup > -1 && dup !== index) return { ok: false, msg: "分类「" + tag + "」已存在" }
        list[index].tag = tag
        commit()
        return { ok: true }
    }

    function removeCategory(index) {
        var list = start()
        if (index < 0 || index >= list.length) return { ok: false, msg: "分类不存在" }
        list.splice(index, 1)
        commit()
        return { ok: true }
    }

    function findLink(url, name) {
        var list = start()
        for (var g = 0; g < list.length; g++) {
            for (var i = 0; i < list[g].link.length; i++) {
                var item = list[g].link[i]
                if (item.url === url && item.name === name) {
                    return { g: g, i: i, item: item }
                }
            }
        }
        return null
    }

    function linkAt(g, i) {
        var list = start()
        if (!list[g] || !list[g].link[i]) return null
        return list[g].link[i]
    }

    /* opts: { name, url, tag, g, i } —— 带 g/i 视为编辑 */
    function saveLink(opts) {
        var name = stripIcon(opts.name)
        var url = normalizeUrl(opts.url)
        var tag = String(opts.tag == null ? "" : opts.tag).trim()
        if (!name || name === "未命名") return { ok: false, msg: "请填写名称" }
        if (!url) return { ok: false, msg: "请填写合法的网址" }
        if (!tag) return { ok: false, msg: "请选择分类" }

        var list = start()
        var target = indexOfCategory(tag)
        if (target < 0) return { ok: false, msg: "分类不存在" }

        var isEdit = typeof opts.g === "number" && typeof opts.i === "number" &&
            list[opts.g] && list[opts.g].link[opts.i]

        if (isEdit) {
            /* 先摘掉旧位置再插入新位置，这样改分类也能正确处理 */
            list[opts.g].link.splice(opts.i, 1)
            list[target].link.push({ name: name, url: url })
        } else {
            var existing = findLink(url, name)
            if (existing) return { ok: false, msg: "该网址已存在（" + existing.item.name + "）" }
            list[target].link.push({ name: name, url: url })
        }
        commit()
        return { ok: true }
    }

    function removeLink(g, i) {
        var list = start()
        if (!list[g] || !list[g].link[i]) return { ok: false, msg: "链接不存在" }
        list[g].link.splice(i, 1)
        commit()
        return { ok: true }
    }

    /* 拖拽落点：把 (fromG, fromI) 移到 toG 的 toIndex 处 */
    function moveLink(fromG, fromI, toG, toIndex) {
        var list = start()
        if (!list[fromG] || !list[fromG].link[fromI]) return { ok: false }
        if (!list[toG]) return { ok: false }
        if (fromG === toG && (toIndex === fromI || toIndex === fromI + 1)) {
            return { ok: false, unchanged: true }
        }
        var item = list[fromG].link.splice(fromI, 1)[0]
        /* 同分类内往后移时，摘除后目标下标要左移一位 */
        if (fromG === toG && toIndex > fromI) toIndex -= 1
        toIndex = Math.max(0, Math.min(toIndex, list[toG].link.length))
        list[toG].link.splice(toIndex, 0, item)
        commit()
        return { ok: true }
    }

    /* --------------------------------------------------------- 导入导出 */

    function exportJSON() {
        return JSON.stringify({ version: 1, data: start() }, null, 2)
    }

    /* 兼容 { version, data: [...] } 与裸数组两种格式 */
    function importJSON(text) {
        var parsed
        try {
            parsed = JSON.parse(text)
        } catch (e) {
            return { ok: false, msg: "JSON 解析失败" }
        }
        var incoming = parsed && parsed.data ? parsed.data : parsed
        var clean = sanitize(incoming)
        if (!clean || !clean.length) return { ok: false, msg: "文件中没有可用的链接数据" }
        data = clean
        started = true
        commit()
        return { ok: true, count: clean.length }
    }

    function reset() {
        data = seed()
        started = true
        commit()
        return { ok: true }
    }

    return {
        all: all,
        start: start,
        commit: commit,
        save: save,
        categories: categories,
        indexOfCategory: indexOfCategory,
        addCategory: addCategory,
        renameCategory: renameCategory,
        removeCategory: removeCategory,
        saveLink: saveLink,
        removeLink: removeLink,
        linkAt: linkAt,
        moveLink: moveLink,
        normalizeUrl: normalizeUrl,
        stripIcon: stripIcon,
        esc: esc,
        exportJSON: exportJSON,
        importJSON: importJSON,
        reset: reset
    }
})()
