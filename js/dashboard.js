let CURRENT_USER = null

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

document.getElementById('back-btn')?.addEventListener('click', showLogin)
async function loadDashboard() {
  CURRENT_USER = await getUser()

  // If no user, fall back to mock for now
  const userId = CURRENT_USER?.id || '00000000-0000-0000-0000-000000000001'
  CURRENT_USER = await getUser()
  console.log('CURRENT USER:', CURRENT_USER)
  const [questionsRes, progressRes] = await Promise.all([
    db.from('questions').select('*').order('level').order('order_index'),
    db.from('user_progress').select('*').eq('user_id', userId)
  ])

  const questions = questionsRes.data || []
  const progress = progressRes.data || []
  const doneIds = new Set(progress.map(p => p.question_id))

  const grouped = {}
  questions.forEach(q => {
    if (!grouped[q.level]) grouped[q.level] = []
    grouped[q.level].push(q)
  })

  let foundActive = false
  const LEVELS = [1, 2, 3, 4, 5].map(lvl => {
    const qs = grouped[lvl] || []
    const done = qs.filter(q => doneIds.has(q.id)).length
    const total = qs.length || 30

    let status
    if (done === total && total > 0) {
      status = 'completed'
    } else if (!foundActive) {
      status = 'active'
      foundActive = true
    } else {
      status = 'locked'
    }

    return { id: lvl, name: LEVEL_META[lvl].name, status, done, total, questions: qs }
  })

  // Update username in topbar
  if (CURRENT_USER) {
    const name = CURRENT_USER.user_metadata?.full_name ||
                 CURRENT_USER.user_metadata?.user_name ||
                 CURRENT_USER.email?.split('@')[0] ||
                 'You'
    document.querySelector('.topbar-name').textContent = name
    document.querySelector('.avatar').textContent = name[0].toUpperCase()
  }

  const totalDone = LEVELS.reduce((sum, l) => sum + l.done, 0)
  updateCircularProgress(totalDone, 150)
  renderLevels(LEVELS, doneIds, userId)
  setTimeout(animateBars, 80)
}

function updateCircularProgress(done, total) {
  const circumference = 2 * Math.PI * 40
  const offset = circumference * (1 - done / total)
  document.getElementById('progress-circle-fill').style.strokeDashoffset = offset
  document.getElementById('progress-done').textContent = done
  document.getElementById('progress-total').textContent = total
}
// ── AUTH ──
async function signInGoogle() {
  await db.auth.signInWithOAuth({
  provider: 'google',
  options: {
    redirectTo: 'https://py-spark-tracker.vercel.app'
  }
})
}

async function signInGitHub() {
  await db.auth.signInWithOAuth({
  provider: 'google',
  options: {
    redirectTo: 'https://py-spark-tracker.vercel.app'
  }
})
}

async function signOut() {
  await db.auth.signOut()
  showLogin()
}

// ── CHECK SESSION ON LOAD ──
// If user is already logged in, skip login screen
db.auth.getSession().then(({ data: { session } }) => {
  if (session && document.getElementById('login-screen')) {
    showDashboard()
  }
})

// Listen for auth changes (handles redirect back after OAuth)
db.auth.onAuthStateChange((event, session) => {
  if (event === 'SIGNED_IN') {
    showDashboard()
  } else if (event === 'SIGNED_OUT') {
    showLogin()
  }
})

function renderLevels(LEVELS, doneIds, userId)  {
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

    let badgeContent = `<span style="font-size:11px;font-weight:800">${level.id}</span>`
    if (level.status === 'completed') {
      badgeContent = `<svg viewBox="0 0 16 16" fill="none" style="width:15px;height:15px">
        <path d="M3 8.5l3.5 3.5 6.5-7" stroke="#6366f1" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>`
    }

    const chevron = `
      <svg class="card-chevron" viewBox="0 0 16 16" fill="none">
        <path d="M4 6l4 4 4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>`

    // Build question rows using DOM — no template string for the link
    const questionRows = level.questions.map((q) => {
      const item = document.createElement('div')
      item.className = 'question-item' + (doneIds.has(q.id) ? ' done' : '')

      const cb = document.createElement('input')
      cb.type = 'checkbox'
      cb.className = 'q-checkbox'
      cb.dataset.qid = q.id
      cb.checked = doneIds.has(q.id)

      const content = document.createElement('div')
      content.className = 'q-content'

      const link = document.createElement('a')
      link.className = 'q-title-link'
      link.href = 'question.html?id=' + q.id
      link.target = '_blank'
      link.textContent = q.title
      link.addEventListener('click', e => e.stopPropagation())

      const meta = document.createElement('div')
      meta.className = 'q-meta'
      meta.innerHTML = `
        <span style="color:${diffColor[q.difficulty] || '#888'};font-size:10px;font-weight:600;text-transform:uppercase">${q.difficulty || ''}</span>
        <span class="q-concept">${q.concept || ''}</span>
      `

      content.appendChild(link)
      content.appendChild(meta)
      item.appendChild(cb)
      item.appendChild(content)
      return item
    })

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
          <div class="questions-list"></div>
        </div>
      </div>
    `

    // Append question rows into the list (DOM, not innerHTML)
    const list = card.querySelector('.questions-list')
    questionRows.forEach(row => list.appendChild(row))

    // Toggle open/close
    card.querySelector('.card-header').addEventListener('click', (e) => {
      if (e.target.closest('.q-checkbox') || e.target.closest('.q-title-link')) return
      card.classList.toggle('open')
    })

    // Checkbox change handlers
    card.querySelectorAll('.q-checkbox').forEach((checkbox) => {
      checkbox.addEventListener('change', async (e) => {
        e.stopPropagation()
        const qid = parseInt(checkbox.dataset.qid)
        const questionItem = checkbox.closest('.question-item')

        if (checkbox.checked) {
          questionItem.classList.add('done')
          doneIds.add(qid)
          await db.from('user_progress').upsert({
            user_id: userId,
            question_id: qid,
            completed_at: new Date().toISOString()
          })
          await db.from('streaks').upsert({
            user_id: userId,
            streak_date: new Date().toISOString().split('T')[0]
          } ,{ onConflict: 'user_id,streak_date' })
        } else {
          questionItem.classList.remove('done')
          doneIds.delete(qid)
          await db.from('user_progress')
            .delete()
            .eq('user_id', userId)
            .eq('question_id', qid)
        }

        // Update progress bar for this level
          const levelDone = level.questions.filter(q => doneIds.has(q.id)).length
          const levelTotal = level.questions.length
          const newPct = levelTotal > 0 ? (levelDone / levelTotal) * 100 : 0
          card.querySelector('.progress-bar-fill').style.width = newPct + '%'
          card.querySelector('.progress-label').textContent = `${levelDone} / ${levelTotal}`
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

// Reload when user comes back to this tab
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' && document.getElementById('dashboard-screen')?.classList.contains('active')) {
    loadDashboard()
  }
})