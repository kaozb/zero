/* ---------------------------------------------------------------
 * icons.js — 图标选择器的候选数据
 *
 *   FA_ICONS  Font Awesome 4.7 图标名（不带 fa- 前缀），已去重
 *   KEYWORDS  中英文关键词 -> 图标名，用于搜索
 *   EMOJIS    常用 emoji
 *
 * FA_ICONS 与 KEYWORDS 里出现的每个名字都必须是 css/font-awesome.min.css
 * 中真实存在的图标，否则选择器会渲染出空白方块。
 * --------------------------------------------------------------- */
window.NavIconCatalog = (function () {
    "use strict"

    var FA_ICONS = [
        /* 通用 */
        "globe", "link", "chain", "external-link", "external-link-square", "home", "star", "star-o",
        "bookmark", "bookmark-o", "tag", "tags", "compass", "map-marker", "map-o", "map-pin",
        "paper-plane", "paper-plane-o", "share-alt", "share-square-o", "plus", "plus-circle",
        "search", "heart", "heart-o", "eye", "eye-slash", "bell", "bell-o", "flag", "flag-o",
        "circle", "circle-o", "dot-circle-o", "square", "square-o", "check", "check-circle",
        "times", "times-circle", "question", "question-circle", "info", "info-circle", "warning",
        "exclamation-triangle", "arrow-right", "chevron-right", "caret-right", "long-arrow-right",
        "arrows", "arrows-alt", "sort", "random", "refresh", "undo", "trash", "trash-o",
        "pencil", "pencil-square-o", "edit", "copy", "clipboard", "floppy-o", "save", "print",
        "download", "upload", "cloud", "cloud-download", "cloud-upload", "database", "server", "hdd-o",
        "wifi", "plug", "power-off", "lock", "unlock", "key", "shield", "ban", "sitemap",
        "cog", "cogs", "sliders", "wrench", "filter", "magic", "flask", "puzzle-piece",
        "cube", "cubes", "rocket", "bolt", "fire", "fire-extinguisher", "bomb", "binoculars",
        "trophy", "gift", "birthday-cake", "coffee", "beer", "glass", "cutlery", "spoon",
        "shopping-basket", "check-square", "check-square-o", "plus-square-o", "minus-square-o",
        "minus-circle", "minus", "life-ring", "anchor", "child", "female", "male", "venus", "mars",

        /* 开发 */
        "code", "code-fork", "terminal", "bug", "git", "git-square", "github", "github-alt",
        "github-square", "gitlab", "bitbucket", "codepen", "jsfiddle", "html5", "css3",
        "microchip", "linux", "windows", "apple", "android", "chrome", "firefox",
        "safari", "edge", "internet-explorer", "opera", "stack-overflow", "stack-exchange",
        "hacker-news", "reddit", "reddit-alien", "product-hunt", "trello", "slack", "skype",
        "comments", "comments-o", "comment", "comment-o", "commenting", "commenting-o",
        "quote-left", "quote-right", "file-code-o", "file-text-o", "file-text", "file", "file-o",
        "files-o", "folder", "folder-o", "folder-open", "folder-open-o", "archive", "inbox",
        "list", "list-ul", "list-ol", "list-alt", "tasks", "th", "th-large", "th-list", "table",
        "columns", "dashboard", "tachometer", "bar-chart", "line-chart", "pie-chart", "area-chart",
        "calculator", "sitemap", "chain-broken", "unlink", "exchange", "recycle", "share-alt-square",

        /* 学习 */
        "graduation-cap", "university", "book", "bookmark", "laptop", "desktop",
        "tablet", "mobile", "keyboard-o", "mouse-pointer", "microphone", "headphones", "video-camera",
        "camera", "camera-retro", "image", "picture-o", "photo", "film", "music", "play", "pause",
        "stop", "play-circle", "play-circle-o", "youtube-play", "youtube", "soundcloud", "podcast",
        "sticky-note", "sticky-note-o", "file-pdf-o", "file-image-o", "file-word-o", "file-excel-o",
        "file-powerpoint-o", "file-archive-o", "file-audio-o", "file-video-o", "newspaper-o", "rss",
        "font", "language", "wikipedia-w", "lightbulb-o", "flask", "eye",

        /* 生活 / 出行 */
        "shopping-cart", "cart-plus", "cart-arrow-down", "shopping-bag", "credit-card",
        "money", "dollar", "euro", "gbp", "yen", "cny", "rmb", "btc", "paypal",
        "google-wallet", "cc-visa", "cc-mastercard", "cc-amex", "cc-paypal", "cc-stripe",
        "plane", "train", "subway", "bus", "taxi", "car", "automobile", "bicycle", "motorcycle",
        "truck", "ship", "rocket", "space-shuttle", "fighter-jet", "road", "tree", "leaf",
        "bed", "hotel", "building", "building-o", "industry", "hospital-o", "ambulance",
        "medkit", "heartbeat", "stethoscope", "user-md", "wheelchair", "plus-square",
        "cutlery", "glass", "beer", "coffee", "birthday-cake", "lemon-o",
        "gamepad", "steam", "futbol-o", "soccer-ball-o", "trophy", "paint-brush",
        "map", "map-o", "map-marker", "map-pin", "map-signs", "location-arrow", "street-view",
        "umbrella", "snowflake-o", "sun-o", "moon-o", "cloud", "bolt", "tint",

        /* 人 / 社交 */
        "user", "user-o", "user-plus", "user-times", "users", "user-circle", "user-circle-o",
        "user-secret", "address-book", "address-book-o", "address-card", "address-card-o",
        "id-badge", "id-card", "id-card-o", "group", "vcard-o",
        "weibo", "wechat", "qq", "twitter", "facebook", "facebook-official", "facebook-square",
        "google", "google-plus", "google-plus-square", "instagram", "linkedin", "linkedin-square",
        "pinterest", "pinterest-p", "pinterest-square", "tumblr", "tumblr-square",
        "vimeo", "vimeo-square", "vine", "flickr", "dribbble", "behance", "behance-square",
        "deviantart", "foursquare", "lastfm", "lastfm-square", "mixcloud", "snapchat",
        "snapchat-ghost", "snapchat-square", "spotify", "telegram", "whatsapp", "xing",
        "xing-square", "yelp", "youtube-square", "odnoklassniki", "odnoklassniki-square",
        "envelope", "envelope-o", "envelope-open", "envelope-open-o", "envelope-square",
        "share", "share-square", "paper-plane", "paper-plane-o", "comments", "users",

        /* 杂项 */
        "clock-o", "hourglass", "hourglass-start", "hourglass-half", "hourglass-end",
        "calendar", "calendar-o", "calendar-check-o", "calendar-minus-o", "calendar-plus-o",
        "calendar-times-o", "history", "bullhorn", "bullseye", "crosshairs", "binoculars",
        "hand-o-right", "hand-o-left", "hand-o-up", "hand-o-down", "thumbs-o-up", "thumbs-o-down",
        "thumbs-up", "thumbs-down", "handshake-o", "heart", "heart-o", "heartbeat",
        "pencil-square", "clipboard", "paperclip", "scissors", "eraser", "object-group",
        "object-ungroup", "sliders", "magic", "stethoscope", "subway", "thermometer",
        "thermometer-0", "thermometer-1", "thermometer-2", "thermometer-3", "thermometer-4",
        "asterisk", "certificate", "circle-o-notch", "cog", "copyright", "creative-commons",
        "empire", "fort-awesome", "free-code-camp", "gamepad", "grav", "linode",
        "meanpath", "medium", "meetup", "opencart", "paw", "rebel", "scribd", "simplybuilt",
        "skyatlas", "slideshare", "superpowers", "themeisle", "viacoin", "wpbeginner",
        "wpforms", "yoast", "battery-empty", "battery-full", "battery-half", "battery-quarter",
        "battery-three-quarters", "signal", "server", "microchip", "percent", "at",
        "barcode", "qrcode", "eject", "backward", "forward", "fast-backward", "fast-forward",
        "step-backward", "step-forward", "headphones", "volume-up", "volume-down", "volume-off"
    ]

    /* 去重（按首次出现顺序保留） */
    var seen = {}
    FA_ICONS = FA_ICONS.filter(function (name) {
        if (seen[name]) return false
        seen[name] = true
        return true
    })

    /* 中文 / 英文关键词映射，命中即把对应图标排到前面 */
    var KEYWORDS = {
        "购物": ["shopping-cart", "shopping-bag", "cart-plus", "shopping-basket"],
        "买": ["shopping-cart", "shopping-bag", "credit-card"],
        "视频": ["video-camera", "film", "play-circle", "television", "youtube-play"],
        "电影": ["film", "video-camera", "play-circle"],
        "音乐": ["music", "headphones", "volume-up"],
        "搜索": ["search", "binoculars"],
        "地图": ["map-o", "map-marker", "compass", "location-arrow"],
        "代码": ["code", "code-fork", "terminal"],
        "开发": ["code", "terminal", "cogs", "bug"],
        "云": ["cloud", "cloud-upload", "cloud-download"],
        "服务器": ["server", "database", "hdd-o"],
        "数据库": ["database", "server"],
        "安全": ["shield", "lock", "key", "ban"],
        "工具": ["wrench", "cog", "sliders"],
        "设置": ["cog", "cogs", "sliders"],
        "文档": ["file-text-o", "book", "clipboard"],
        "文件": ["file", "file-o", "folder", "files-o"],
        "学习": ["graduation-cap", "book", "university"],
        "教育": ["graduation-cap", "university", "book"],
        "新闻": ["newspaper-o", "rss", "bullhorn"],
        "博客": ["rss", "pencil", "book"],
        "论坛": ["comments", "comments-o", "comment"],
        "聊天": ["comments", "commenting", "comments-o"],
        "社交": ["users", "share-alt", "comments"],
        "邮件": ["envelope", "envelope-o", "paper-plane"],
        "时间": ["clock-o", "calendar", "history"],
        "日历": ["calendar", "calendar-o", "clock-o"],
        "统计": ["bar-chart", "line-chart", "pie-chart"],
        "图表": ["bar-chart", "line-chart", "pie-chart", "area-chart"],
        "图片": ["image", "picture-o", "camera"],
        "照片": ["camera", "image", "photo"],
        "旅游": ["plane", "train", "map-marker"],
        "出行": ["plane", "train", "subway", "taxi"],
        "火车": ["train", "subway"],
        "公交": ["bus", "subway", "train"],
        "打车": ["taxi", "car", "map-marker"],
        "酒店": ["hotel", "bed"],
        "健康": ["medkit", "heartbeat", "heart", "stethoscope"],
        "医疗": ["medkit", "stethoscope", "user-md"],
        "游戏": ["gamepad", "steam", "futbol-o"],
        "运动": ["futbol-o", "soccer-ball-o", "bicycle"],
        "招聘": ["briefcase", "user-plus", "users"],
        "工作": ["briefcase", "cogs", "tasks"],
        "公司": ["building", "industry", "briefcase"],
        "银行": ["credit-card", "money", "dollar"],
        "支付": ["credit-card", "money", "paypal"],
        "钱包": ["google-wallet", "credit-card", "money"],
        "百科": ["wikipedia-w", "book", "globe"],
        "翻译": ["language", "globe", "font"],
        "AI": ["magic", "flask", "microchip", "commenting-o"],
        "人工智能": ["magic", "microchip", "flask"],
        "写作": ["pencil", "edit", "file-text-o"],
        "笔记": ["sticky-note", "pencil", "book"],
        "下载": ["download", "cloud-download", "hdd-o"],
        "上传": ["upload", "cloud-upload"],
        "网盘": ["hdd-o", "cloud", "folder"],
        "导航": ["compass", "map-o", "location-arrow"],
        "首页": ["home", "globe"],
        "收藏": ["star", "bookmark", "heart"],
        "标签": ["tag", "tags", "bookmark"],
        "链接": ["link", "chain", "external-link"],
        "外链": ["external-link", "external-link-square", "link"],
        "随机": ["random", "sort", "refresh"],
        "更新": ["refresh", "undo", "history"],
        "删除": ["trash", "times", "minus-circle"],
        "编辑": ["pencil", "edit", "pencil-square-o"],
        "打印": ["print", "file-pdf-o"],
        "代码仓库": ["github", "gitlab", "git", "bitbucket", "code-fork"],
        "社区": ["comments", "users", "comment"],
        "问答": ["question-circle", "comments", "stack-overflow"],
        "学校": ["university", "graduation-cap"],
        "课程": ["graduation-cap", "laptop", "book"],
        "考试": ["check-square-o", "pencil-square-o", "calculator"],
        "新闻资讯": ["newspaper-o", "rss", "bullhorn"],
        "科技": ["microchip", "flask", "rocket"],
        "装修": ["home", "paint-brush", "wrench"],
        "汽车": ["car", "automobile", "taxi"],
        "菜谱": ["cutlery", "spoon", "glass"],
        "美食": ["cutlery", "spoon", "coffee"],
        "外卖": ["cutlery", "motorcycle", "shopping-bag"],
        "天气": ["sun-o", "cloud", "snowflake-o"],
        "邮箱": ["envelope", "envelope-o", "at"],
        "密码": ["key", "lock", "shield"],
        "代理": ["shield", "exchange", "globe"],
        "监控": ["tachometer", "dashboard", "eye"],
        "广告": ["bullhorn", "line-chart", "eye"],
        "论坛社区": ["comments", "comment", "users"],
        "音乐视频": ["music", "video-camera", "headphones"],
        "论坛讨论": ["comments-o", "comment-o", "users"]
    }

    var EMOJIS = [
        "🔍", "📌", "⭐", "🌐", "🔗", "📁", "📂", "🗂️", "📄", "📝", "📚", "📖", "📰", "📮", "✉️",
        "💻", "🖥️", "⌨️", "🖱️", "💾", "💿", "🖨️", "📱", "📷", "🎥", "🎬", "🎵", "🎧", "🎮", "🕹️",
        "🛠️", "🔧", "🔨", "⚙️", "🧰", "🧪", "🔬", "🔭", "🧲", "🔋", "🔌", "💡", "🚀", "✈️", "🛰️",
        "📊", "📈", "📉", "🧮", "💰", "💳", "🛒", "🛍️", "🎁", "🏷️", "📦", "🚚", "🏪", "🏬", "🏦",
        "🗺️", "🧭", "🚗", "🚕", "🚌", "🚇", "🚄", "🚲", "🛵", "⛽", "🅿️", "🏨", "🏠", "🏢", "🏥",
        "☕", "🍵", "🍔", "🍜", "🍕", "🍰", "🍺", "🥗", "🍎", "🌳", "🌿", "🌸", "🐳", "🐧", "🦊",
        "❤️", "💬", "💭", "👍", "👥", "🧑", "🕐", "⏰", "📅", "✅", "❌", "⚡", "🔥", "🌟", "🏆",
        "🎯", "🧩", "🎨", "✏️", "🖌️", "🔒", "🔑", "🛡️", "🧨", "☁️", "🌈", "🌤️", "🌙", "🧊", "🏝️"
    ]

    return { FA_ICONS: FA_ICONS, KEYWORDS: KEYWORDS, EMOJIS: EMOJIS }
})()
