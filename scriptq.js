const calendarBodyEl = document.getElementById('calendarBody');
const calendarTitleEl = document.getElementById('calendarTitle');
const prevMonthBtn = document.getElementById('prevMonthBtn');
const nextMonthBtn = document.getElementById('nextMonthBtn');

const noteListEl = document.getElementById('noteList');
const addNoteForm = document.getElementById('addNoteForm');
const noteInput = document.getElementById('noteInput');

const STORAGE_KEY = 'revisionAppData';

// 表示中の年月（初期値は今日）
let displayedYear, displayedMonth;

// 今日の日付文字列 yyyy-mm-dd
function getTodayStr() {
  const d = new Date();
  return d.toISOString().slice(0,10);
}

// yyyy-mm-dd形式のDateオブジェクト取得
function parseDate(dateStr) {
  return new Date(dateStr + 'T00:00:00');
}

// ローカルストレージからデータ取得
function loadData() {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : { reviewedDates: [], notes: [] };
}

// ローカルストレージへ保存
function saveData(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

// カレンダー表示（指定年月）
function renderCalendar(year, month, reviewedDates) {
  calendarTitleEl.textContent = `${year}年${month+1}月の復習記録`;

  // 月の初日と最終日
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startWeekday = firstDay.getDay(); // 日曜=0
  const daysCount = lastDay.getDate();

  let html = '<table><thead><tr>';
  const daysOfWeek = ['日','月','火','水','木','金','土'];
  daysOfWeek.forEach(day => html += `<th>${day}</th>`);
  html += '</tr></thead><tbody><tr>';

  // 空白セル
  for(let i=0; i<startWeekday; i++) {
    html += '<td></td>';
  }

  const todayStr = getTodayStr();

  for(let d=1; d<=daysCount; d++) {
    const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    let classes = '';
    if(dateStr === todayStr) classes += ' today';
    if(reviewedDates.includes(dateStr)) classes += ' reviewed';

    html += `<td class="${classes.trim()}" data-date="${dateStr}">${d}</td>`;

    if((startWeekday + d) % 7 === 0 && d !== daysCount) {
      html += '</tr><tr>';
    }
  }

  // 空白セルの埋め
  const tail = (startWeekday + daysCount) % 7;
  if(tail !== 0) {
    for(let i=tail; i<7; i++) {
      html += '<td></td>';
    }
  }
  html += '</tr></tbody></table>';

  calendarBodyEl.innerHTML = html;

  // 日付クリックで復習記録のトグル
  calendarBodyEl.querySelectorAll('td').forEach(td => {
    if(td.dataset.date) {
      td.style.cursor = 'pointer';
      td.onclick = () => {
        toggleReviewedDate(td.dataset.date);
      };
    }
  });
}

// reviewedDatesのトグル
function toggleReviewedDate(dateStr) {
  const data = loadData();
  const idx = data.reviewedDates.indexOf(dateStr);
  if(idx >= 0) {
    data.reviewedDates.splice(idx, 1);
  } else {
    data.reviewedDates.push(dateStr);
  }
  saveData(data);
  renderCalendar(displayedYear, displayedMonth, data.reviewedDates);
}

// 日付をyyyy-mm-dd形式で指定日数後を計算
function addDays(dateStr, days) {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0,10);
}

// メモ帳の復習ノート描画
function renderNotes(notes) {
  noteListEl.innerHTML = '';
  const todayStr = getTodayStr();

  notes.forEach((note, idx) => {
    const container = document.createElement('div');
    container.className = 'review-row';

    // 内容テキスト
    const contentDiv = document.createElement('div');
    contentDiv.className = 'review-content';
    contentDiv.textContent = note.content;
    container.appendChild(contentDiv);

    // 削除ボタン（ゴミ箱アイコン風）
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'delete-btn';
    deleteBtn.title = '削除';
    deleteBtn.innerHTML = '🗑️';
    deleteBtn.onclick = () => {
      currentData.notes.splice(idx, 1);
      saveData(currentData);
      renderNotes(currentData.notes);
    };
    container.appendChild(deleteBtn);

    // 次の復習日表示 or メッセージ + ボタン
    const nextReviewDiv = document.createElement('div');
    nextReviewDiv.className = 'next-review';

    if (!note.nextReview) {
      // 初回は追加日+1日
      note.nextReview = addDays(note.created, 1);
    }

    nextReviewDiv.textContent = (note.nextReview > todayStr)
      ? `次の復習予定日: ${note.nextReview}`
      : '今は復習する時間だ！';
    container.appendChild(nextReviewDiv);

      const buttonDiv = document.createElement('div');
      buttonDiv.className = 'review-buttons';

      ['よく理解した','まあまあ理解した','あまり理解できなかった'].forEach(label => {
        const btn = document.createElement('button');
        btn.textContent = label;
        btn.onclick = () => {
          let daysToAdd = 1;
          if(label === 'よく理解した') daysToAdd = 30;
          else if(label === 'まあまあ理解した') daysToAdd = 7;
          else if(label === 'あまり理解できなかった') daysToAdd = 1;

          note.nextReview = addDays(todayStr, daysToAdd);
          saveData(currentData);
          renderNotes(currentData.notes);
        };
        buttonDiv.appendChild(btn);
      });
      container.appendChild(buttonDiv);

    noteListEl.appendChild(container);
  });
}

// 新しいメモ追加
addNoteForm.onsubmit = e => {
  e.preventDefault();
  const val = noteInput.value.trim();
  if(!val) return;

  currentData.notes.push({
    content: val,
    created: getTodayStr(),
    nextReview: null,
  });
  noteInput.value = '';
  saveData(currentData);
  renderNotes(currentData.notes);
};

// カレンダーの左右ボタン処理
prevMonthBtn.onclick = () => {
  displayedMonth--;
  if(displayedMonth < 0) {
    displayedMonth = 11;
    displayedYear--;
  }
  renderCalendar(displayedYear, displayedMonth, currentData.reviewedDates);
};
nextMonthBtn.onclick = () => {
  displayedMonth++;
  if(displayedMonth > 11) {
    displayedMonth = 0;
    displayedYear++;
  }
  renderCalendar(displayedYear, displayedMonth, currentData.reviewedDates);
};

// 初期ロード
let currentData = loadData();
const today = new Date();
displayedYear = today.getFullYear();
displayedMonth = today.getMonth();

renderCalendar(displayedYear, displayedMonth, currentData.reviewedDates);
renderNotes(currentData.notes);