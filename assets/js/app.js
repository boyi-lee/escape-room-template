(() => {
  "use strict";

  const books = window.TETRABIBLOS_BOOKS || [];
  const totalChapters = books.reduce((sum, book) => sum + book.chapters.length, 0);
  const storageKey = "tetrabiblosLearningV2";

  const state = {
    currentBook: 0,
    currentChapter: 0,
    passed: new Set(),
    unlocked: new Set(["0-0"])
  };

  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => [...document.querySelectorAll(selector)];
  const chapterKey = (bookIndex, chapterIndex) => `${bookIndex}-${chapterIndex}`;

  function loadProgress() {
    try {
      const parsed = JSON.parse(localStorage.getItem(storageKey) || "{}");
      if (Array.isArray(parsed.passed)) state.passed = new Set(parsed.passed);
      if (Array.isArray(parsed.unlocked)) state.unlocked = new Set(parsed.unlocked);
    } catch (error) {
      console.warn("學習紀錄損壞，已改用安全預設值。", error);
      state.passed = new Set();
      state.unlocked = new Set(["0-0"]);
    }
    state.unlocked.add("0-0");
  }

  function saveProgress() {
    localStorage.setItem(storageKey, JSON.stringify({
      passed: [...state.passed],
      unlocked: [...state.unlocked]
    }));
  }

  function nextChapter(bookIndex, chapterIndex) {
    if (chapterIndex + 1 < books[bookIndex].chapters.length) return [bookIndex, chapterIndex + 1];
    if (bookIndex + 1 < books.length) return [bookIndex + 1, 0];
    return null;
  }

  function updateProgress() {
    $("#progress").textContent = state.passed.size;
    $("#passedCount").textContent = state.passed.size;
    $("#unlockedCount").textContent = state.unlocked.size;
    $("#completionRate").textContent = `${Math.round((state.passed.size / totalChapters) * 100)}%`;
  }

  function renderBooks() {
    const grid = $("#bookGrid");
    grid.innerHTML = "";

    books.forEach((book, bookIndex) => {
      const unlockedCount = book.chapters.filter((_, chapterIndex) => state.unlocked.has(chapterKey(bookIndex, chapterIndex))).length;
      const card = document.createElement("button");
      card.type = "button";
      card.className = `book-card${bookIndex === state.currentBook ? " active" : ""}`;
      card.innerHTML = `
        <span class="book-no">${book.number}</span>
        <h3>${book.title}</h3>
        <p>${book.description}</p>
        <p>${unlockedCount} / ${book.chapters.length} 章已解鎖</p>
        ${book.tags.map((tag) => `<span class="tag">${tag}</span>`).join("")}
      `;
      card.addEventListener("click", () => {
        const firstUnlocked = book.chapters.findIndex((_, chapterIndex) => state.unlocked.has(chapterKey(bookIndex, chapterIndex)));
        if (firstUnlocked < 0) return;
        state.currentBook = bookIndex;
        state.currentChapter = firstUnlocked;
        renderBooks();
        renderReader();
        $("#reader").scrollIntoView({ behavior: "smooth" });
      });
      grid.appendChild(card);
    });
  }

  function renderReader() {
    const book = books[state.currentBook];
    const chapter = book.chapters[state.currentChapter];
    const key = chapterKey(state.currentBook, state.currentChapter);
    const isPassed = state.passed.has(key);

    $("#readerBox").innerHTML = `
      <div class="reader-head">
        <div>
          <div class="book-no">${book.number}</div>
          <h3>${state.currentChapter + 1}. ${chapter.title}</h3>
          <div class="source">原典定位：${chapter.source}</div>
        </div>
        <button class="btn" type="button" disabled>${isPassed ? "✓ 已通過" : "尚未通過"}</button>
      </div>
      <div class="chapter-list">
        ${book.chapters.map((item, chapterIndex) => {
          const itemKey = chapterKey(state.currentBook, chapterIndex);
          const unlocked = state.unlocked.has(itemKey);
          return `<button type="button" data-chapter="${chapterIndex}" class="${chapterIndex === state.currentChapter ? "active " : ""}${unlocked ? "" : "locked"}" ${unlocked ? "" : "disabled"}>${unlocked ? "" : "🔒 "}${chapterIndex + 1}. ${item.title}</button>`;
        }).join("")}
      </div>
      <div class="lesson">
        <article class="panel">
          <h4>原典摘要</h4>
          <p>${chapter.summary}</p>
          <details>
            <summary>查看來源說明</summary>
            <p>本頁為 J. M. Ashmand 英譯本的繁體中文教學摘要。請依上方 Book 與 Chapter 回查原典，不視為逐字翻譯。</p>
          </details>
        </article>
        <article class="panel">
          <h4>白話理解</h4>
          <p>${chapter.plain}</p>
        </article>
        <article class="panel">
          <h4>關鍵規則</h4>
          <ul>${chapter.rules.map((rule) => `<li>${rule}</li>`).join("")}</ul>
        </article>
        <article class="panel">
          <h4>學習提醒</h4>
          <p>把規則放回完整結構、歷史背景與現實條件中。單一象徵不能代替整體判斷。</p>
          <div class="warning">此頁不提供個人命盤、健康診斷、死亡推算或確定性人生預測。</div>
        </article>
      </div>
      <section class="check" aria-labelledby="checkTitle">
        <h4 id="checkTitle">章節檢核</h4>
        <p>${chapter.question}</p>
        <div class="answers">
          ${chapter.options.map((option, optionIndex) => `<button type="button" data-answer="${optionIndex}" ${isPassed ? "disabled" : ""}>${option}</button>`).join("")}
        </div>
        <div class="result" role="status">${isPassed ? `已通過。${chapter.explanation}` : "答對後解鎖下一章。"}</div>
      </section>
    `;

    $$('[data-chapter]').forEach((button) => {
      button.addEventListener("click", () => {
        state.currentChapter = Number(button.dataset.chapter);
        renderReader();
      });
    });

    $$('[data-answer]').forEach((button) => {
      button.addEventListener("click", () => checkAnswer(button, chapter));
    });
  }

  function checkAnswer(button, chapter) {
    const selected = Number(button.dataset.answer);
    const buttons = $$('[data-answer]');
    buttons.forEach((item) => { item.disabled = true; });

    if (selected !== chapter.answer) {
      button.classList.add("wrong");
      buttons[chapter.answer].classList.add("correct");
      $(".result").textContent = `答案已標示。${chapter.explanation} 可重新閱讀後再作答。`;
      window.setTimeout(renderReader, 1800);
      return;
    }

    button.classList.add("correct");
    const currentKey = chapterKey(state.currentBook, state.currentChapter);
    state.passed.add(currentKey);
    const next = nextChapter(state.currentBook, state.currentChapter);
    if (next) state.unlocked.add(chapterKey(next[0], next[1]));
    saveProgress();
    updateProgress();
    renderBooks();
    $(".result").textContent = next ? `答對。${chapter.explanation} 下一章已解鎖。` : `答對。${chapter.explanation} 四書核心章節已完成。`;
    window.setTimeout(renderReader, 900);
  }

  function buildSearchIndex() {
    return books.flatMap((book, bookIndex) => book.chapters.map((chapter, chapterIndex) => ({
      bookIndex,
      chapterIndex,
      book,
      chapter,
      text: `${book.number} ${book.title} ${book.tags.join(" ")} ${chapter.title} ${chapter.source} ${chapter.summary} ${chapter.plain} ${chapter.rules.join(" ")}`.toLowerCase()
    })));
  }

  const searchIndex = buildSearchIndex();

  function renderSearchResults(query) {
    const container = $("#searchResults");
    const keyword = query.trim().toLowerCase();
    if (!keyword) {
      container.innerHTML = "";
      container.classList.add("hidden");
      return;
    }

    const matches = searchIndex.filter((entry) => entry.text.includes(keyword));
    container.classList.remove("hidden");
    container.innerHTML = matches.length
      ? matches.map((entry) => {
          const key = chapterKey(entry.bookIndex, entry.chapterIndex);
          const unlocked = state.unlocked.has(key);
          return `<button type="button" class="search-result" data-search-book="${entry.bookIndex}" data-search-chapter="${entry.chapterIndex}" ${unlocked ? "" : "disabled"}><strong>${unlocked ? "" : "🔒 "}${entry.book.number}｜${entry.chapter.title}</strong><small>${entry.chapter.source}</small></button>`;
        }).join("")
      : '<div class="warning">找不到符合的章節。請改用較短的關鍵字。</div>';

    $$('[data-search-book]').forEach((button) => {
      button.addEventListener("click", () => {
        state.currentBook = Number(button.dataset.searchBook);
        state.currentChapter = Number(button.dataset.searchChapter);
        renderBooks();
        renderReader();
        $("#reader").scrollIntoView({ behavior: "smooth" });
      });
    });
  }

  function resetProgress() {
    localStorage.removeItem(storageKey);
    state.passed = new Set();
    state.unlocked = new Set(["0-0"]);
    state.currentBook = 0;
    state.currentChapter = 0;
    renderBooks();
    renderReader();
    updateProgress();
  }

  function bindEvents() {
    $$('[data-go]').forEach((button) => {
      button.addEventListener("click", () => $(`#${button.dataset.go}`).scrollIntoView({ behavior: "smooth" }));
    });
    $("#search").addEventListener("input", (event) => renderSearchResults(event.target.value));
    $("#reset").addEventListener("click", resetProgress);
  }

  loadProgress();
  bindEvents();
  renderBooks();
  renderReader();
  updateProgress();
})();
