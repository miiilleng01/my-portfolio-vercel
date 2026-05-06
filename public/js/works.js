const API_BASE = "https://api.msddmii-portfolio.com";
const IMAGE_BASE = "https://pub-cbb402eaf06044f6859542a764559458.r2.dev";

/**
 * YouTubeのURLからIDを抽出（厳しめ判定版）
 */
function getYouTubeID(url) {
    if (!url) return null;
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([0-9A-Za-z_-]{11})/);
    return match ? match[1] : null;
}

/**
 * カードのふわっと動く3Dエフェクト
 */
function applyTiltEffect(card) {
    card.addEventListener("mousemove", e => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        const rotateX = -(y - centerY) / 48;
        const rotateY = (x - centerX) / 48;
        card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.03)`;
    });

    card.addEventListener("mouseleave", () => {
        card.style.transform = "perspective(1000px) rotateX(0deg) rotateY(0deg) scale(1)";
    });
}

/**
 * DBにフルURLベタうち前提なのでそのまま返す
 */
const fixPath = (path) => {
    if (!path) return "";
    if (path.startsWith("http")) return path;
    return `${IMAGE_BASE}/${path.replace(/^\/+/, "")}`;
};

/**
 * メイン：作品データを取得してHTMLを生成
 */
export async function loadWorks() {
    let works = [];

    try {
        const res = await fetch(`${API_BASE}/api/works`);
        works = await res.json();
    } catch (e) {
        console.error("Works fetch failed", e);
        return;
    }

    const tagSet = new Set();

    let likedWorks = [];
    try {
        likedWorks = JSON.parse(localStorage.getItem("likedWorks") || "[]");
    } catch {
        likedWorks = [];
    }

    const targetPage = "/detail/detail.html";

    for (const work of works) {
        let targetType = work.type;
        if (targetType === "movie" || targetType === "video") {
            targetType = "video";
        }

        const container = document.querySelector(`.section[data-type="${targetType}"] .works`);
        if (!container) continue;

        const card = document.createElement("div");
        card.className = "card fadein";

        const safeSrc = fixPath(work.image || work.link);
        const thumbnail = fixPath(work.thumbnail);
        const workId = String(work.id);

        // NEW判定
        let isNew = false;
        if (work.time) {
            const now = new Date();
            const workTime = new Date(work.time);
            isNew = (now - workTime) < 7 * 24 * 60 * 60 * 1000;
        }
        const newLabel = isNew ? `<span class="new">NEW</span>` : "";

        // tags処理
        const rawTags = Array.isArray(work.tags)
            ? work.tags
            : (typeof work.tags === "string"
                ? work.tags.replace(/[{}]/g, "").split(",")
                : []);

        const tags = rawTags.filter(t => t && t.trim());

        card.dataset.tags = tags.join(",");
        card.dataset.id = workId;

        const serverLikes = work.like_count || 0;

        const ytID = getYouTubeID(work.link);

        let contentHTML = "";

        // YouTube
        if (ytID) {
            const ytThumb = `https://img.youtube.com/vi/${ytID}/maxresdefault.jpg`;

            contentHTML += `
                <div class="image image-watermark">
                    ${newLabel}
                    <a href="${targetPage}#${workId}" class="card-media-link">
                        <img src="${ytThumb}" onerror="this.src='https://img.youtube.com/vi/${ytID}/mqdefault.jpg'">
                        <div class="watermark"></div>
                        <div class="play-icon-overlay">▶</div>
                    </a>
                </div>`;
        } else {
            const ext = safeSrc.split(".").pop().toLowerCase();

            if (ext === "mp4" || work.type === "movie") {
                contentHTML += `
                    <div class="image">
                        ${newLabel}
                        <a href="${targetPage}#${workId}" class="card-media-link">
                            <video src="${safeSrc}" poster="${thumbnail}" muted loop></video>
                            <div class="play-icon-overlay">▶</div>
                        </a>
                    </div>`;
            } else {
                contentHTML += `
                    <div class="image image-watermark">
                        ${newLabel}
                        <a href="${targetPage}#${workId}" class="card-media-link">
                            <img src="${safeSrc}">
                            <div class="watermark"></div>
                        </a>
                    </div>`;
            }
        }

        const isLiked = likedWorks.includes(workId);

        contentHTML += `
            <div class="title">${work.title || ""}</div>
            <p>${work.description || ""}</p>
            <div class="actions">
                <button class="like ${isLiked ? "isliked" : ""}" type="button">
                    ♡ <span class="like-count">${serverLikes}</span>
                </button>
                <button class="share">↗</button>
            </div>`;

        card.innerHTML = contentHTML;
        container.appendChild(card);

        applyTiltEffect(card);
        initLikeEvent(card, work, workId);

        tags.forEach(t => tagSet.add(t));
    }

    initMoreButtons();
    initScrollButtons();

    if (typeof createTags === "function") {
        createTags([...tagSet]);
    }
}
