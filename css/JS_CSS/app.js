/* ---------------------------------------------------------------
 * app.js — 页面交互层
 *
 *   1. 搜索引擎切换（记住上次选择）
 *   2. 链接列表渲染
 *   3. 编辑模式：网址 / 分类的增删改
 *   4. 图标选择器（Font Awesome / Emoji / 图片 URL）
 *   5. 拖拽排序（含跨分类）
 *   6. 导入导出、恢复默认
 *
 * 依赖：store.js（NavStore）、icons.js（NavIconCatalog）
 * 已用原生 DOM API 重写，不再依赖 jQuery。
 * --------------------------------------------------------------- */
(function () {
    "use strict"

    var Store = window.NavStore
    var Catalog = window.NavIconCatalog
    if (!Store || !Catalog) return

    /* 每行放多少个链接；超出后新起一行且不再重复分类名 */
    var PER_ROW = 8
    var SRCH_KEY = "nav_srch_v1"
    var TOAST_MS = 2200

    /* ------------------------------------------------------------ 小工具 */

    function $(sel, root) {
        return (root || document).querySelector(sel)
    }

    function $all(sel, root) {
        return Array.prototype.slice.call((root || document).querySelectorAll(sel))
    }

    function esc(str) {
        return String(str == null ? "" : str)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#39;")
    }

    /* 读写在 localStorage 的偏好，失败时静默降级为默认值 */
    function getPref(key) {
        try {
            return window.localStorage.getItem(key)
        } catch (e) {
            return null
        }
    }

    function setPref(key, value) {
        try {
            window.localStorage.setItem(key, value)
        } catch (e) {
        }
    }

    /* --------------------------------------------------- 1. 搜索引擎切换 */

    /* 每个引擎对应的表单提交地址、查询参数名、占位文字 */
    var ENGINES = {
        bing: { action: "https://cn.bing.com/search", name: "q", placeholder: "必应 搜索" },
        baidu: { action: "https://www.baidu.com/s", name: "word", placeholder: "百度一下，你就知道" },
        google: { action: "https://www.google.com/search", name: "q", placeholder: "Google 搜索" },
        lookao: { action: "https://zh.wikipedia.org/w/index.php", name: "search", placeholder: "维基百科" },
        scholar: { action: "https://scholar.google.com/scholar", name: "q", placeholder: "中英文文献检索", hl: "zh-CN" },
        image: { action: "https://www.google.com/search", name: "q", placeholder: "海量图片搜索", tbm: "isch" },
        torrent: { action: "https://www.shodan.io/search", name: "query", placeholder: "shodan搜索" }
    }

    var searchForm = $(".search-form")
    var searchInput = $(".search-keyword")
    var searchTabs = $(".search-tab")

    function applyEngine(key) {
        var cfg = ENGINES[key]
        if (!cfg || !searchForm || !searchInput) return

        searchForm.setAttribute("action", cfg.action)
        searchInput.setAttribute("name", cfg.name)
        searchInput.setAttribute("placeholder", cfg.placeholder)

        /* 学术/图片需要在提交时附带隐藏参数（hl / tbm） */
        $all(".search-hidden", searchForm).forEach(function (el) {
            el.parentNode.removeChild(el)
        })
        ;["hl", "tbm"].forEach(function (extra) {
            if (!cfg[extra]) return
            var hidden = document.createElement("input")
            hidden.type = "hidden"
            hidden.className = "search-hidden"
            hidden.name = extra
            hidden.value = cfg[extra]
            searchForm.insertBefore(hidden, searchInput)
        })

        if (searchTabs) {
            $all("span", searchTabs).forEach(function (tab) {
                tab.classList.toggle("active", tab.classList.contains(key))
            })
        }
    }

    if (searchTabs) {
        searchTabs.addEventListener("click", function (e) {
            var tab = e.target.closest("span")
            if (!tab || !searchTabs.contains(tab)) return
            /* 取 className 里的第一个 token 作为引擎标识 */
            var key = (tab.className || "").split(/\s+/)[0]
            if (!ENGINES[key]) return
            applyEngine(key)
            setPref(SRCH_KEY, key)
            if (searchInput) searchInput.focus()
        })
    }

    /* 启动时恢复上次选择，非法值回退到必应 */
    ;(function initEngine() {
        var saved = getPref(SRCH_KEY)
        if (!saved || !ENGINES[saved]) saved = "bing"
        applyEngine(saved)
    })()

    /* --------------------------------------------------- 2. 链接列表渲染 */

    var info = $(".work-link .info")
    var workLink = $(".work-link")

    function catToolsHtml(g) {
        return '<span class="nv-cat-tools">' +
            '<a href="javascript:;" class="nv-cat-edit" data-act="rename-cat" data-g="' + g +
            '" title="重命名分类"><i class="fa fa-pencil"></i></a>' +
            '<a href="javascript:;" class="nv-cat-del" data-act="del-cat" data-g="' + g +
            '" title="删除分类"><i class="fa fa-trash-o"></i></a>' +
            "</span>"
    }

    function linkItemHtml(item, g, i) {
        return '<li class="nv-item" draggable="true" data-g="' + g + '" data-i="' + i + '">' +
            '<a href="' + esc(item.url) + '" target="_blank" rel="noopener" title="' +
            esc(item.name + " — " + item.url) + '">' +
            Store.iconHtml(item.icon, item.name) +
            '<span class="nv-name">' + esc(item.name) + "</span></a>" +
            '<span class="nv-tools">' +
            '<a href="javascript:;" class="nv-tool" data-act="edit" data-g="' + g + '" data-i="' + i +
            '" title="编辑"><i class="fa fa-pencil"></i></a>' +
            '<a href="javascript:;" class="nv-tool nv-tool-del" data-act="del" data-g="' + g +
            '" data-i="' + i + '" title="删除"><i class="fa fa-times"></i></a>' +
            "</span></li>"
    }

    function render() {
        if (!info) return
        var list = Store.all()
        var html = ""

        list.forEach(function (group, g) {
            /* 空分类单独一行，作为拖拽落点 */
            if (!group.link.length) {
                html += '<ul class="nv-empty-row" data-g="' + g + '">' +
                    '<li class="nv-cat" data-g="' + g + '">' + esc(group.tag) + catToolsHtml(g) + "</li>" +
                    '<li class="nv-empty" data-g="' + g + '">' +
                    '<span class="nv-empty-hint">空分类，拖一个链接进来或点击右上角齿轮后「新增网址」</span>' +
                    "</li></ul>"
                return
            }
            /* 每 PER_ROW 个一组；分类名只出现在每组首行 */
            for (var c = 0; c < group.link.length; c += PER_ROW) {
                html += "<ul>"
                html += '<li class="nv-cat" data-g="' + g + '" draggable="false">' +
                    (c === 0 ? esc(group.tag) + catToolsHtml(g) : "") + "</li>"
                group.link.slice(c, c + PER_ROW).forEach(function (item, k) {
                    html += linkItemHtml(item, g, c + k)
                })
                html += "</ul>"
            }
        })

        if (!list.length) {
            html = '<div class="nv-blank">还没有任何分类，点击右上角齿轮后「新增分类」开始。</div>'
        }

        info.innerHTML = html
        if (workLink) workLink.style.opacity = "1"
    }

    /* Store 在数据变化后回调这里刷新视图 */
    window.navAppRefresh = render

    /* --------------------------------------------------------- 拖拽排序 */

    var drag = null

    function clearDropMarks() {
        $all(".nv-drop-before, .nv-drop-after, .nv-dragging", info).forEach(function (el) {
            el.classList.remove("nv-drop-before", "nv-drop-after", "nv-dragging")
        })
    }

    /* 从元素自身或所属行读取分类下标 */
    function rowGroup(el) {
        var g = parseInt(el.getAttribute("data-g"), 10)
        if (isNaN(g)) {
            var owner = el.closest("[data-g]")
            if (owner) g = parseInt(owner.getAttribute("data-g"), 10)
        }
        if (isNaN(g)) {
            var ul = el.closest("ul")
            var cat = ul && $(".nv-cat", ul)
            if (cat) g = parseInt(cat.getAttribute("data-g"), 10)
        }
        return g
    }

    if (info) {
        info.addEventListener("dragstart", function (e) {
            var item = e.target.closest(".nv-item")
            if (!item || !info.contains(item)) return
            drag = {
                g: parseInt(item.getAttribute("data-g"), 10),
                i: parseInt(item.getAttribute("data-i"), 10)
            }
            item.classList.add("nv-dragging")
            if (e.dataTransfer) {
                e.dataTransfer.effectAllowed = "move"
                var a = $("a", item)
                e.dataTransfer.setData("text/plain", (a && a.getAttribute("href")) || "")
            }
        })

        info.addEventListener("dragend", function (e) {
            var item = e.target.closest(".nv-item")
            if (!item) return
            clearDropMarks()
            drag = null
        })

        /* 悬停在某个链接上：按鼠标在元素左/右半边决定插到前面还是后面 */
        info.addEventListener("dragover", function (e) {
            if (!drag) return
            var target = e.target.closest(".nv-item")
            var empty = e.target.closest(".nv-empty")
            var ul = e.target.closest("ul")
            if (!ul || !info.contains(ul)) return

            e.preventDefault()
            if (e.dataTransfer) e.dataTransfer.dropEffect = "move"

            clearDropMarks()
            if (empty && !target) {
                empty.classList.add("nv-drop-before")
                return
            }
            if (!target || target.classList.contains("nv-dragging")) return
            var rect = target.getBoundingClientRect()
            var before = e.clientX < rect.left + rect.width / 2
            target.classList.add(before ? "nv-drop-before" : "nv-drop-after")
        })

        info.addEventListener("drop", function (e) {
            if (!drag) return
            var ul = e.target.closest("ul")
            if (!ul || !info.contains(ul)) return
            e.preventDefault()
            e.stopPropagation()

            var from = { g: drag.g, i: drag.i }
            var target = e.target.closest(".nv-item")
            var empty = e.target.closest(".nv-empty")

            if (empty && !target) {
                /* 空分类：放到第一个位置 */
                Store.moveLink(from.g, from.i, rowGroup(empty), 0)
            } else if (target && !target.classList.contains("nv-dragging")) {
                var toG = parseInt(target.getAttribute("data-g"), 10)
                var toI = parseInt(target.getAttribute("data-i"), 10)
                if (target.classList.contains("nv-drop-after")) toI += 1
                Store.moveLink(from.g, from.i, toG, toI)
            } else {
                /* 拖到行尾空白处：追加到该分类末尾 */
                var g = rowGroup(ul)
                if (isNaN(g)) return
                Store.moveLink(from.g, from.i, g, 9999)
            }

            clearDropMarks()
            drag = null
        })
    }

    /* 页面空白处接受拖入的 JSON 文件（拖链接时不生效） */
    document.addEventListener("dragover", function (e) {
        if (drag) return
        e.preventDefault()
    })

    document.addEventListener("drop", function (e) {
        if (drag) return
        var dt = e.dataTransfer
        var file = dt && dt.files && dt.files[0]
        if (!file) return
        e.preventDefault()
        readJsonFile(file)
    })

    function readJsonFile(file) {
        var reader = new FileReader()
        reader.onload = function () {
            var res = Store.importJSON(reader.result)
            toast(res.ok ? "已导入 " + res.count + " 个分类" : res.msg)
        }
        reader.readAsText(file)
    }

    /* --------------------------------------------- 3. 编辑 / 删除（委托） */

    if (info) {
        info.addEventListener("click", function (e) {
            var trigger = e.target.closest(".nv-tool, .nv-cat-edit, .nv-cat-del")
            if (!trigger || !info.contains(trigger)) return
            e.preventDefault()
            e.stopPropagation()

            var act = trigger.getAttribute("data-act")
            var g = parseInt(trigger.getAttribute("data-g"), 10)

            if (act === "del-cat") {
                var group = Store.all()[g]
                var catName = group ? group.tag : ""
                if (window.confirm('删除分类「' + catName + '」及其中的全部链接？')) {
                    Store.removeCategory(g)
                    toast("已删除分类「" + catName + "」")
                }
                return
            }

            if (act === "rename-cat") {
                openCatModal({ g: g })
                return
            }

            /* 余下为链接上的编辑/删除 */
            var i = parseInt(trigger.getAttribute("data-i"), 10)
            var item = Store.linkAt(g, i)
            if (!item) return

            if (act === "edit") {
                openLinkModal({ g: g, i: i, item: item })
            } else if (act === "del") {
                if (window.confirm('删除「' + item.name + '」？')) {
                    Store.removeLink(g, i)
                    toast("已删除「" + item.name + "」")
                }
            }
        })
    }

    /* ------------------------------------------------- 4. 图标选择器 */

    var pickedIcon = null
    var usedIcons = {}

    /* 已被其他链接占用的 FA 图标置灰，避免重复 */
    function rebuildUsedIcons() {
        usedIcons = {}
        Store.all().forEach(function (group) {
            group.link.forEach(function (item) {
                if (item.icon && item.icon.type === "fa") usedIcons[item.icon.value] = true
            })
        })
    }

    var iconGrid = $("#nv-icon-grid")
    var emojiGrid = $("#nv-emoji-grid")

    /* 中文关键词命中优先，其次图标名子串匹配 */
    function searchIcons(keyword) {
        var all = Catalog.FA_ICONS
        var kw = String(keyword || "").trim().toLowerCase()
        if (!kw) return all

        var hits = {}
        var order = []
        function add(name) {
            if (hits[name]) return
            hits[name] = true
            order.push(name)
        }

        if (Catalog.KEYWORDS[kw]) Catalog.KEYWORDS[kw].forEach(add)
        Object.keys(Catalog.KEYWORDS).forEach(function (key) {
            if (key.indexOf(kw) > -1 || kw.indexOf(key) > -1) {
                Catalog.KEYWORDS[key].forEach(add)
            }
        })
        all.forEach(function (name) {
            if (name.indexOf(kw) > -1) add(name)
        })

        /* 保持与 FA_ICONS 的原有顺序，避免搜索结果跳动 */
        return all.filter(function (name) {
            return hits[name]
        })
    }

    function renderIconGrid(keyword) {
        if (!iconGrid) return
        var result = searchIcons(keyword)
        if (!result.length) {
            iconGrid.innerHTML = '<div class="nv-icon-none">没有匹配的图标，试试 Emoji 或图片 URL</div>'
            return
        }
        iconGrid.innerHTML = result.map(function (name) {
            var cls = "nv-icon-cell" + (usedIcons[name] ? " used" : "")
            return '<button type="button" class="' + cls + '" data-icon="fa:' + esc(name) +
                '" title="fa-' + esc(name) + '"><i class="fa fa-' + esc(name) + '"></i></button>'
        }).join("")
    }

    function renderEmojiGrid() {
        if (!emojiGrid) return
        emojiGrid.innerHTML = Catalog.EMOJIS.map(function (ch) {
            return '<button type="button" class="nv-icon-cell nv-emoji-cell" data-icon="emoji:' +
                esc(ch) + '">' + ch + "</button>"
        }).join("")
    }

    function describeIcon(icon) {
        if (!icon) return ""
        if (icon.type === "fa") return "Font Awesome · fa-" + icon.value
        if (icon.type === "emoji") return "Emoji · " + icon.value
        if (icon.type === "img") return "图片 · " + icon.value
        return icon.value
    }

    function renderPreview() {
        var box = $("#nv-icon-preview")
        if (!box) return
        if (!pickedIcon) {
            box.innerHTML = '<span class="nv-preview-none">未选择（保存时自动匹配 favicon，匹配不到则随机）</span>'
            return
        }
        var name = ($("#nv-name") || {}).value || "?"
        box.innerHTML = '<span class="nv-preview-icon">' + Store.iconHtml(pickedIcon, name) + "</span>" +
            '<span class="nv-preview-text">' + esc(describeIcon(pickedIcon)) + "</span>"
    }

    function setIconTab(tab) {
        $all(".nv-icon-actions .nv-mini[data-nv-tab]").forEach(function (btn) {
            btn.classList.toggle("active", btn.getAttribute("data-nv-tab") === tab)
        })
        $all(".nv-icon-pane").forEach(function (pane) {
            var on = pane.getAttribute("data-nv-pane") === tab
            if (on) pane.removeAttribute("hidden")
            else pane.setAttribute("hidden", "hidden")
        })
        if (tab === "img") {
            var urlInput = $("#nv-icon-url")
            if (urlInput) urlInput.focus()
        }
    }

    function pickIcon(token) {
        pickedIcon = Store.normalizeIcon(token)
        $all(".nv-icon-cell").forEach(function (cell) {
            cell.classList.toggle("selected", cell.getAttribute("data-icon") === token)
        })
        /* 选了预设 emoji 就清掉自定义输入，避免两边状态不一致 */
        if (pickedIcon && pickedIcon.type === "emoji" &&
            Catalog.EMOJIS.indexOf(pickedIcon.value) > -1) {
            var emojiInput = $("#nv-emoji-input")
            if (emojiInput) emojiInput.value = ""
        }
        renderPreview()
    }

    var iconActions = $(".nv-icon-actions")
    if (iconActions) {
        iconActions.addEventListener("click", function (e) {
            var tab = e.target.closest(".nv-mini[data-nv-tab]")
            if (!tab) return
            setIconTab(tab.getAttribute("data-nv-tab"))
        })
    }

    var randomBtn = $("#nv-icon-random")
    if (randomBtn) {
        randomBtn.addEventListener("click", function () {
            pickedIcon = Store.randomIcon()
            $all(".nv-icon-cell").forEach(function (cell) {
                cell.classList.remove("selected")
            })
            renderPreview()
            toast("已随机选择图标：" + describeIcon(pickedIcon))
        })
    }

    if (iconGrid) {
        iconGrid.addEventListener("click", function (e) {
            var cell = e.target.closest(".nv-icon-cell")
            if (cell) pickIcon(cell.getAttribute("data-icon"))
        })
    }

    if (emojiGrid) {
        emojiGrid.addEventListener("click", function (e) {
            var cell = e.target.closest(".nv-emoji-cell")
            if (cell) pickIcon(cell.getAttribute("data-icon"))
        })
    }

    /* 取第一个字素簇：emoji 常由多码点组成（变体选择符 / 肤色 / ZWJ 组合）。
       支持时用 Intl.Segmenter 精确切分，否则退回按码点切分。 */
    function firstGrapheme(text) {
        if (!text) return ""
        try {
            if (typeof Intl !== "undefined" && Intl.Segmenter) {
                var seg = new Intl.Segmenter(undefined, { granularity: "grapheme" })
                var first = seg.segment(text)[Symbol.iterator]().next()
                if (first && !first.done && first.value) return first.value.segment
            }
        } catch (e) {
        }
        return Array.from(text)[0] || ""
    }

    function applyCustomEmoji(raw) {
        var text = String(raw == null ? "" : raw).trim()
        var picked = firstGrapheme(text)
        if (!picked) {
            if (text === "") {
                pickedIcon = null
                renderPreview()
            }
            return
        }
        var input = $("#nv-emoji-input")
        if (input) input.value = picked
        pickedIcon = { type: "emoji", value: picked }
        $all(".nv-icon-cell").forEach(function (cell) {
            cell.classList.remove("selected")
        })
        renderPreview()
    }

    var emojiInput = $("#nv-emoji-input")
    if (emojiInput) {
        emojiInput.addEventListener("input", function () {
            applyCustomEmoji(this.value)
        })
        /* 粘贴时只取第一个字符，避免把多余文本带进来 */
        emojiInput.addEventListener("paste", function (e) {
            var dt = e.clipboardData
            if (!dt) return
            e.preventDefault()
            applyCustomEmoji(dt.getData("text"))
        })
    }

    var iconSearch = $("#nv-icon-search")
    if (iconSearch) {
        iconSearch.addEventListener("input", function () {
            renderIconGrid(this.value)
        })
    }

    var iconUrl = $("#nv-icon-url")
    if (iconUrl) {
        iconUrl.addEventListener("input", function () {
            var v = this.value.trim()
            if (!v) return
            pickedIcon = { type: "img", value: v }
            renderPreview()
        })
    }

    var nameInput = $("#nv-name")
    if (nameInput) nameInput.addEventListener("input", renderPreview)

    /* ------------------------------------------------------- 弹窗逻辑 */

    var modal = $("#nv-modal")
    var formMode = "link"   /* link | cat */
    var editing = null      /* { g, i } 编辑时的坐标，新增为 null */

    function openModal() {
        if (!modal) return
        modal.classList.add("open")
        modal.setAttribute("aria-hidden", "false")
        document.body.classList.add("nv-locked")
    }

    function closeModal() {
        if (!modal) return
        modal.classList.remove("open")
        modal.setAttribute("aria-hidden", "true")
        document.body.classList.remove("nv-locked")
        editing = null
    }

    function openLinkModal(opts) {
        formMode = "link"
        editing = opts && typeof opts.g === "number" ? { g: opts.g, i: opts.i } : null
        var item = opts && opts.item

        $("#nv-modal-title").textContent = editing ? "编辑网址" : "新增网址"
        $("#nv-form-link").removeAttribute("hidden")
        $("#nv-form-cat").setAttribute("hidden", "hidden")

        var cats = Store.categories()
        if (!cats.length) {
            toast("还没有分类，请先新增分类")
            openCatModal()
            return
        }

        /* 分类下拉框：只列出已有分类 */
        var select = $("#nv-category")
        select.innerHTML = cats.map(function (tag) {
            return '<option value="' + esc(tag) + '">' + esc(tag) + "</option>"
        }).join("")

        $("#nv-name").value = item ? item.name : ""
        $("#nv-url").value = item ? item.url : ""
        var current = editing ? Store.all()[editing.g] : null
        select.value = current ? current.tag : cats[cats.length - 1]

        pickedIcon = item && item.icon ? Store.normalizeIcon(item.icon) : null
        var urlField = $("#nv-icon-url")
        urlField.value = pickedIcon && pickedIcon.type === "img" ? pickedIcon.value : ""
        /* 预设 emoji 不需要回填输入框，只有自定义的需要 */
        emojiInput.value = pickedIcon && pickedIcon.type === "emoji" &&
            Catalog.EMOJIS.indexOf(pickedIcon.value) < 0 ? pickedIcon.value : ""

        rebuildUsedIcons()
        iconSearch.value = ""
        renderIconGrid("")
        renderEmojiGrid()
        setIconTab(pickedIcon && pickedIcon.type === "emoji" ? "emoji" :
            pickedIcon && pickedIcon.type === "img" ? "img" : "fa")
        renderPreview()

        openModal()
        setTimeout(function () {
            nameInput.focus()
        }, 50)
    }

    function openCatModal(opts) {
        formMode = "cat"
        /* opts.g 存在即为重命名 */
        editing = opts && typeof opts.g === "number" ? { g: opts.g } : null
        var current = editing ? Store.all()[editing.g] : null

        $("#nv-modal-title").textContent = editing ? "重命名分类" : "新增分类"
        $("#nv-form-cat").removeAttribute("hidden")
        $("#nv-form-link").setAttribute("hidden", "hidden")

        var catInput = $("#nv-cat-name")
        catInput.value = current ? current.tag : ""
        openModal()
        setTimeout(function () {
            catInput.focus()
            catInput.select()
        }, 50)
    }

    function saveForm() {
        if (formMode === "cat") {
            var raw = $("#nv-cat-name").value
            var res = editing
                ? Store.renameCategory(editing.g, raw)
                : Store.addCategory(raw)
            if (!res.ok) {
                toast(res.msg)
                return
            }
            var tag = raw.trim()
            closeModal()
            toast((editing ? "已重命名为「" : "已新增分类「") + tag + "」")
            return
        }

        var out = Store.saveLink({
            name: $("#nv-name").value,
            url: $("#nv-url").value,
            tag: $("#nv-category").value,
            icon: pickedIcon,
            g: editing ? editing.g : undefined,
            i: editing ? editing.i : undefined
        })
        if (!out.ok) {
            toast(out.msg)
            return
        }
        var label = $("#nv-name").value.trim()
        closeModal()
        toast((editing ? "已保存「" : "已新增「") + label + "」")
    }

    /* 把输入框里的地址即时补全后回显，方便用户确认 */
    var urlInput = $("#nv-url")
    if (urlInput) {
        urlInput.addEventListener("blur", function () {
            var v = Store.normalizeUrl(this.value)
            if (v) this.value = v
        })
    }

    var saveBtn = $("#nv-save")
    if (saveBtn) saveBtn.addEventListener("click", saveForm)

    if (modal) {
        modal.addEventListener("click", function (e) {
            if (e.target.closest("[data-nv-close]")) closeModal()
        })
    }

    /* 点击编辑器内部不冒泡到"退出编辑模式"的处理 */
    if (modal) {
        modal.addEventListener("click", function (e) {
            e.stopPropagation()
        })
    }

    document.addEventListener("keydown", function (e) {
        var open = modal && modal.classList.contains("open")
        if (e.key === "Escape") {
            if (open) closeModal()
            else setEditMode(false)
            return
        }
        if (e.key === "Enter" && open && e.target && e.target.tagName !== "TEXTAREA") {
            e.preventDefault()
            saveForm()
        }
    })

    /* ------------------------------------------------------ 夜间模式 */

    /* 主题记在 localStorage，首次访问默认浅色 */
    var THEME_KEY = "nav_theme_v1"
    var themeBtn = $("#nav-theme")

    /* 图标：浅色时显示月亮（点了会变暗），深色时显示太阳 */
    function paintThemeButton(dark) {
        if (!themeBtn) return
        var icon = themeBtn.querySelector(".fa")
        if (icon) {
            icon.classList.toggle("fa-moon-o", !dark)
            icon.classList.toggle("fa-sun-o", dark)
        }
        themeBtn.setAttribute("title", dark ? "浅色模式" : "夜间模式")
    }

    function setTheme(dark, animate) {
        var root = document.documentElement
        root.classList.toggle("dark", !!dark)
        paintThemeButton(!!dark)

        if (animate) {
            /* 只在切换瞬间挂上过渡类，结束后摘掉，
               避免常驻后覆盖其它组件的交互过渡 */
            root.classList.add("theme-anim")
            if (themeBtn) themeBtn.classList.add("switching")
            setTimeout(function () {
                root.classList.remove("theme-anim")
                if (themeBtn) themeBtn.classList.remove("switching")
            }, 320)
        }
    }

    setTheme(getPref(THEME_KEY) === "dark", false)

    if (themeBtn) {
        themeBtn.addEventListener("click", function (e) {
            e.stopPropagation()
            var dark = !document.documentElement.classList.contains("dark")
            setTheme(dark, true)
            setPref(THEME_KEY, dark ? "dark" : "light")
        })
    }

    /* ------------------------------------------------------ 顶部工具栏 */

    /* 齿轮切换编辑模式：控制工具栏与各项编辑/删除按钮的显隐 */
    function setEditMode(on) {
        document.body.classList.toggle("nv-edit-mode", !!on)
    }

    var gear = $("#nav-gear")
    if (gear) {
        gear.addEventListener("click", function (e) {
            e.stopPropagation()
            setEditMode(!document.body.classList.contains("nv-edit-mode"))
        })
    }

    /* 点击页面空白处退出编辑模式（弹窗与工具条上的点击除外） */
    document.addEventListener("click", function (e) {
        if (!document.body.classList.contains("nv-edit-mode")) return
        if (e.target.closest("#nav-gear, #nav-toolbar, .nv-modal, .nv-tools, .nv-cat-tools")) return
        setEditMode(false)
    })

    var addUrlBtn = $("#nv-add-url")
    if (addUrlBtn) addUrlBtn.addEventListener("click", function () { openLinkModal(null) })

    var addCatBtn = $("#nv-add-cat")
    if (addCatBtn) addCatBtn.addEventListener("click", function () { openCatModal() })

    var exportBtn = $("#nv-export")
    if (exportBtn) {
        exportBtn.addEventListener("click", function () {
            var blob = new Blob([Store.exportJSON()], { type: "application/json" })
            var url = URL.createObjectURL(blob)
            var a = document.createElement("a")
            a.href = url
            a.download = "nav-links-" + new Date().toISOString().slice(0, 10) + ".json"
            document.body.appendChild(a)
            a.click()
            document.body.removeChild(a)
            setTimeout(function () { URL.revokeObjectURL(url) }, 1000)
            toast("已导出 JSON 文件")
        })
    }

    var importBtn = $("#nv-import")
    var importFile = $("#nv-import-file")
    if (importBtn && importFile) {
        importBtn.addEventListener("click", function () { importFile.click() })
        importFile.addEventListener("change", function () {
            var file = this.files && this.files[0]
            if (file) readJsonFile(file)
            this.value = ""
        })
    }

    var resetBtn = $("#nv-reset")
    if (resetBtn) {
        resetBtn.addEventListener("click", function () {
            if (!window.confirm("恢复默认设置会清除当前所有分类和网址，确定继续？")) return
            Store.reset()
            toast("已恢复默认设置")
        })
    }

    /* ------------------------------------------------------------ 提示 */

    var toastEl = $("#nv-toast")
    var toastTimer = null

    function toast(msg) {
        if (!toastEl) return
        toastEl.textContent = msg
        toastEl.classList.add("show")
        clearTimeout(toastTimer)
        toastTimer = setTimeout(function () {
            toastEl.classList.remove("show")
        }, TOAST_MS)
    }

    /* ------------------------------------------------------------ 启动 */

    Store.start()
    render()
})()
