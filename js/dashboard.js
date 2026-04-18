const MOCK_USER_ID = '00000000-0000-0000-0000-000000000001'

const LEVEL_META = {
  1: { name: 'Core Foundations' },
  2: { name: 'PySpark Basics' },
  3: { name: 'Spark SQL & DataFrames' },
  4: { name: 'Performance Tuning' },
  5: { name: 'Streaming & MLlib' },
}

const diffColor = { easy: '#22c55e', medium: '#f59e0b', hard: '#ef4444' }

function showDashboard() {
  document.getElementById('login-screen').classList.remove('active')
  document.getElementById('dashboard-screen').classList.add('active')
  loadDashboard()
}

function showLogin() {
  document.getElementById('dashboard-screen').classList.remove('active')
  document.getElementById('login-screen').classList.add('active')
}

document.getElementById('skip-btn').addEventListener('click', showDashboard)
document.getElementById('back-btn').addEventListener('click', showLogin)

async function loadDashboard() {
  const [questionsRes, progressRes] = await Promise.all([
    db.from('questions').select('*').order('level').order('order_index'),
    db.from('user_progress').select('*').eq('user_id', MOCK_USER_ID)
  ])

  const questions = questionsRes.data || []
  const progress = progressRes.data || []
  const doneIds = new Set(progress.map(p => p.question_id))

  const grouped = {}
  questions.forEach(q => {
    if (!grouped[q.level]) grouped[q.level] = []
    grouped[q.level].push(q)
  })

  // ✅ All levels unlocked — no more 'locked' status
  const LEVELS = [1, 2, 3, 4, 5].map(lvl => {
    const qs = grouped[lvl] || []
    const done = qs.filter(q => doneIds.has(q.id)).length
    const total = qs.length || 30
    const status = (done === total && total > 0) ? 'completed' : 'active'
    return { id: lvl, name: LEVEL_META[lvl].name, status, done, total, questions: qs }
  })

  const totalDone = LEVELS.reduce((sum, l) => sum + l.done, 0)
  updateCircularProgress(totalDone, 150)
  renderLevels(LEVELS, doneIds)
  setTimeout(animateBars, 80)
}

function updateCircularProgress(done, total) {
  const circumference = 2 * Math.PI * 40
  const offset = circumference * (1 - done / total)
  document.getElementById('progress-circle-fill').style.strokeDashoffset = offset
  document.getElementById('progress-done').textContent = done
  document.getElementById('progress-total').textContent = total
}

function renderLevels(LEVELS, doneIds) {
  const container = document.getElementById('levels-list')

  const openLevels = new Set()
  document.querySelectorAll('.level-card.open').forEach(c => {
    openLevels.add(parseInt(c.dataset.id))
  })

  container.innerHTML = ''

  LEVELS.forEach((level) => {
    const pct = (level.done / level.total) * 100
    const card = document.createElement('div')
    const isOpen = openLevels.has(level.id)
    card.className = `level-card ${level.status} ${isOpen ? 'open' : ''}`
    card.dataset.id = level.id

    // ✅ Completed levels show checkmark but still show chevron so they're expandable
    let badgeContent = `<span style="font-size:11px;font-weight:800">${level.id}</span>`
    if (level.status === 'completed') {
      badgeContent = `<svg viewBox="0 0 16 16" fill="none" style="width:15px;height:15px">
        <path d="M3 8.5l3.5 3.5 6.5-7" stroke="#6366f1" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>`
    }

    // ✅ Chevron shown for both active AND completed
    const chevron = `
      <svg class="card-chevron" viewBox="0 0 16 16" fill="none">
        <path d="M4 6l4 4 4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>`

    // ✅ Fixed: added opening <a tag
    const questionsHtml = level.questions.map((q) => `
      <div class="question-item ${doneIds.has(q.id) ? 'done' : ''}">
        <input
          type="checkbox"
          class="q-checkbox"
          data-qid="${q.id}"
          ${doneIds.has(q.id) ? 'checked' : ''}
        />
        <div class="q-content">
          
            class="q-title-link"
            href="question.html?id=${q.id}"
            target="_blank"
            onclick="event.stopPropagation()"
          >${q.title}</a>
          <div class="q-meta">
            <span style="color:${diffColor[q.difficulty] || '#888'};font-size:10px;font-weight:600;text-transform:uppercase">${q.difficulty || ''}</span>
            <span class="q-concept">${q.concept || ''}</span>
          </div>
        </div>
      </div>
    `).join('')

    card.innerHTML = `
      <div class="card-header">
        <div class="level-badge">${badgeContent}</div>
        <div class="card-meta">
          <div class="card-title-row">
            <span class="card-title">Level ${level.id} — ${level.name}</span>
          </div>
          <div class="progress-wrap">
            <div class="progress-bar-track">
              <div class="progress-bar-fill" data-pct="${pct}" style="width:${pct}%"></div>
            </div>
            <span class="progress-label">${level.done} / ${level.total}</span>
          </div>
        </div>
        ${chevron}
      </div>
      <div class="card-body">
        <div class="card-body-inner">
          <div class="questions-list">${questionsHtml}</div>
        </div>
      </div>
    `

    // ✅ Click handler for both active AND completed cards
    card.querySelector('.card-header').addEventListener('click', (e) => {
      if (e.target.closest('.q-checkbox') || e.target.closest('.q-title-link')) return
      card.classList.toggle('open')
    })

    card.querySelectorAll('.q-checkbox').forEach((cb) => {
      cb.addEventListener('change', async (e) => {
        e.stopPropagation()
        const qid = parseInt(cb.dataset.qid)
        const questionItem = cb.closest('.question-item')

        if (cb.checked) {
          questionItem.classList.add('done')
          doneIds.add(qid)
          await db.from('user_progress').upsert({
            user_id: MOCK_USER_ID,
            question_id: qid,
            completed_at: new Date().toISOString()
          })
          await db.from('streaks').upsert({
            user_id: MOCK_USER_ID,
            streak_date: new Date().toISOString().split('T')[0]
          })
        } else {
          questionItem.classList.remove('done')
          doneIds.delete(qid)
          await db.from('user_progress')
            .delete()
            .eq('user_id', MOCK_USER_ID)
            .eq('question_id', qid)
        }

        const levelDone = level.questions.filter(q => doneIds.has(q.id)).length
        const newPct = (levelDone / level.total) * 100
        card.querySelector('.progress-bar-fill').style.width = newPct + '%'
        card.querySelector('.progress-label').textContent = `${levelDone} / ${level.total}`
        updateCircularProgress([...doneIds].length, 150)
      })
    })

    container.appendChild(card)
  })
}

function animateBars() {
  document.querySelectorAll('.progress-bar-fill').forEach((bar) => {
    requestAnimationFrame(() => {
      bar.style.width = (parseFloat(bar.dataset.pct) || 0) + '%'
    })
  })
}