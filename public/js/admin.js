
// ローカルと本番を自動で判定して切り替え ---
const API_BASE =
  import.meta.env.DEV
    ? "http://localhost:3031"
    : "http://148.230.103.202:3031";

const form = document.getElementById("uploadForm");
const typeSelect = document.querySelector('[name="type"]');
const imageInput = document.querySelector('[name="image"]');
const thumbArea = document.getElementById("thumbArea");

function checkThumbnail() {
  const type = typeSelect.value;
  const file = imageInput.files[0];

  if (!file) {
    thumbArea.style.display = "none";
    return;
  }

  const ext = file.name.split(".").pop().toLowerCase();

  if (type === "movie" && ext === "mp4") {
    thumbArea.style.display = "block";
  } else {
    thumbArea.style.display = "none";
  }
}

typeSelect.addEventListener("change", checkThumbnail);
imageInput.addEventListener("change", checkThumbnail);

form.addEventListener("submit", async e => {
  e.preventDefault();

  const formData = new FormData(form);

  try {
  
    const res = await fetch(`${API_BASE}/api/works`, {
      method: "POST",
      body: formData,
      credentials: "include" // ★ これがないと Java 側で「未ログイン」扱いになります
    });

    if (!res.ok) throw new Error("送信エラー");

    alert("追加完了");

    form.reset();
    thumbArea.style.display = "none";

  } catch (err) {
    console.error(err);
    alert("送信に失敗しました。ログインが切れている可能性があります。");
  }
});
