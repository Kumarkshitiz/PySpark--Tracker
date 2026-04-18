// ✅ REMOVED: const MOCK_USER_ID — declared in dashboard.js globally
// If question.js is ever loaded standalone, declare it here instead:
if (typeof MOCK_USER_ID === 'undefined') {
  var MOCK_USER_ID = '00000000-0000-0000-0000-000000000001'
}

const diffColor = { easy: '#22c55e', medium: '#f59e0b', hard: '#ef4444' }

async function loadQuestion() {
  const params = new URLSearchParams(window.location.search)
  const id = params.get('id')

  // ✅ Guard: only run if #content exists on this page
  const contentEl = document.getElementById('content')
  if (!contentEl) return

  if (!id) {
    contentEl.innerHTML = '<p style="color:#6b7280;padding:40px 20px">Question not found.</p>'
    return
  }

  const qid = parseInt(id)

  const [qRes, progressRes] = await Promise.all([
    db.from('questions').select('*').eq('id', qid).single(),
    db.from('user_progress')
      .select('*')
      .eq('user_id', MOCK_USER_ID)
      .eq('question_id', qid)
      .maybeSingle()
  ])

  const q = qRes.data
  if (!q) {
    contentEl.innerHTML = '<p style="color:#6b7280;padding:40px 20px">Question not found.</p>'
    return
  }

  const isDone = !!progressRes.data
  document.title = q.title + ' — PySpark Tracker'

  contentEl.innerHTML = `
    <div class="q-page">
      <a href="javascript:history.back()" class="back-link">← Back</a>
      <div class="q-header">
        <div class="q-top">
          <span class="q-level-badge">Level ${q.level}</span>
          <span class="q-diff" style="color:${diffColor[q.difficulty]}">${q.difficulty}</span>
        </div>
        <h1 class="q-title">${q.title}</h1>
        <p class="q-concept-tag">${q.concept || ''}</p>
      </div>
      <div class="q-done-row">
        <label class="done-label">
          <input type="checkbox" id="done-cb" ${isDone ? 'checked' : ''} />
          <span>${isDone ? 'Completed' : 'Mark as done'}</span>
        </label>
      </div>
      <div class="q-section">
        <h2>Problem</h2>
        <p>${q.problem}</p>
      </div>
      ${q.expected_output ? `
      <div class="q-section">
        <h2>Expected output</h2>
        <pre class="q-code">${q.expected_output}</pre>
      </div>` : ''}
      ${q.dataset_url ? `
      <div class="q-section">
        <h2>Dataset</h2>
        <a href="${q.dataset_url}" target="_blank" class="q-link-btn">Download CSV</a>
      </div>` : ''}
      ${q.colab_url ? `
      <div class="q-section">
        <h2>Notebook</h2>
        <a href="${q.colab_url}" target="_blank" class="q-link-btn">Open in Colab</a>
      </div>` : ''}
    </div>
  `

  document.getElementById('done-cb').addEventListener('change', async (e) => {
    const checked = e.target.checked
    const label = e.target.nextElementSibling

    if (checked) {
      await db.from('user_progress').upsert({
        user_id: MOCK_USER_ID,
        question_id: qid,
        completed_at: new Date().toISOString()
      })
      await db.from('streaks').upsert({
        user_id: MOCK_USER_ID,
        streak_date: new Date().toISOString().split('T')[0]
      })
      label.textContent = 'Completed'
    } else {
      await db.from('user_progress')
        .delete()
        .eq('user_id', MOCK_USER_ID)
        .eq('question_id', qid)
      label.textContent = 'Mark as done'
    }
  })
}

// ✅ Only call loadQuestion on question.html (where #content exists)
if (document.getElementById('content')) {
  loadQuestion()
}