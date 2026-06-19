// ─── DOM refs ────────────────────────────────────────────────────────────────
const $ = (sel) => document.querySelector(sel);
const taskList = $('#task-list');
const emptyState = $('#empty-state');
const loadingState = $('#loading-state');
const taskCount = $('#task-count');
const filterStatus = $('#filter-status');
const filterPriority = $('#filter-priority');
const modal = $('#modal');
const modalTitle = $('#modal-title');
const modalClose = $('#modal-close');
const modalCancel = $('#modal-cancel');
const backdrop = $('#modal-backdrop');
const taskForm = $('#task-form');
const formId = $('#form-id');
const formTitle = $('#form-title');
const formDesc = $('#form-desc');
const formStatus = $('#form-status');
const formPriority = $('#form-priority');
const formSubmit = $('#form-submit');
const errorTitle = $('#error-title');
const toastContainer = $('#toast-container');

// ─── State ───────────────────────────────────────────────────────────────────
let tasks = [];
let confirmDeleteId = null;

// ─── API ─────────────────────────────────────────────────────────────────────
async function api(path, options = {}) {
  const res = await fetch(path, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.detail || `Request failed (${res.status})`);
  return data;
}

async function fetchTasks() {
  const params = new URLSearchParams();
  if (filterStatus.value) params.set('status', filterStatus.value);
  if (filterPriority.value) params.set('priority', filterPriority.value);
  return api(`/tasks?${params.toString()}`);
}

async function createTask(body) {
  return api('/tasks', { method: 'POST', body: JSON.stringify(body) });
}

async function updateTask(id, body) {
  return api(`/tasks/${id}`, { method: 'PATCH', body: JSON.stringify(body) });
}

async function deleteTask(id) {
  return api(`/tasks/${id}`, { method: 'DELETE' });
}

// ─── Render ──────────────────────────────────────────────────────────────────
function statusBadge(status) {
  const labels = { todo: 'Todo', in_progress: 'In Progress', done: 'Done' };
  return `<span class="badge badge--${status}">${labels[status]}</span>`;
}

function priorityBadge(priority) {
  const labels = { low: 'Low', medium: 'Medium', high: 'High' };
  return `<span class="badge badge--${priority}">${labels[priority]}</span>`;
}

function formatDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function renderTask(task) {
  const isDeleting = confirmDeleteId === task.id;
  const deleteBtn = isDeleting
    ? `<button class="task-card__btn task-card__btn--confirm" data-delete-confirm="${task.id}">Confirm?</button>`
    : `<button class="task-card__btn task-card__btn--edit" data-edit="${task.id}" title="Edit">&#9998;</button>
       <button class="task-card__btn task-card__btn--delete" data-delete="${task.id}" title="Delete">&#128465;</button>`;

  const doneClass = task.status === 'done' ? ' task-card--done' : '';

  return `
    <div class="task-card${doneClass}">
      <label class="task-card__checkbox" title="Toggle status">
        <input type="checkbox" data-toggle="${task.id}" ${task.status === 'done' ? 'checked' : ''}>
      </label>
      <div class="task-card__body">
        <div class="task-card__title">${escapeHtml(task.title)}</div>
        ${task.description ? `<div class="task-card__desc">${escapeHtml(task.description)}</div>` : ''}
        <div class="task-card__meta">
          ${statusBadge(task.status)}
          ${priorityBadge(task.priority)}
          <span class="badge badge--date">${formatDate(task.created_at)}</span>
        </div>
      </div>
      <div class="task-card__actions">${deleteBtn}</div>
    </div>`;
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function render() {
  if (tasks.length === 0) {
    taskList.classList.add('hidden');
    emptyState.classList.remove('hidden');
    taskCount.textContent = '';
  } else {
    taskList.classList.remove('hidden');
    emptyState.classList.add('hidden');
    taskList.innerHTML = tasks.map(renderTask).join('');
    taskCount.textContent = `${tasks.length} task${tasks.length !== 1 ? 's' : ''}`;
  }
}

async function loadTasks() {
  loadingState.classList.remove('hidden');
  taskList.classList.add('hidden');
  emptyState.classList.add('hidden');
  try {
    tasks = await fetchTasks();
  } catch (err) {
    tasks = [];
    showToast(err.message, 'error');
  }
  loadingState.classList.add('hidden');
  render();
}

// ─── Filters ─────────────────────────────────────────────────────────────────
filterStatus.addEventListener('change', loadTasks);
filterPriority.addEventListener('change', loadTasks);
$('#btn-clear-filters').addEventListener('click', () => {
  filterStatus.value = '';
  filterPriority.value = '';
  loadTasks();
});

// ─── Modal ───────────────────────────────────────────────────────────────────
function openModal(title, task = null) {
  modalTitle.textContent = title;
  formSubmit.textContent = task ? 'Save Changes' : 'Create Task';
  clearErrors();
  confirmDeleteId = null;

  if (task) {
    formId.value = task.id;
    formTitle.value = task.title;
    formDesc.value = task.description || '';
    formStatus.value = task.status;
    formPriority.value = task.priority;
  } else {
    formId.value = '';
    formTitle.value = '';
    formDesc.value = '';
    formStatus.value = 'todo';
    formPriority.value = 'medium';
  }
  modal.classList.remove('hidden');
  formTitle.focus();
}

function closeModal() {
  modal.classList.add('hidden');
  confirmDeleteId = null;
}

modalClose.addEventListener('click', closeModal);
modalCancel.addEventListener('click', closeModal);
backdrop.addEventListener('click', closeModal);
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !modal.classList.contains('hidden')) closeModal();
});

// ─── Form ────────────────────────────────────────────────────────────────────
function clearErrors() {
  formTitle.classList.remove('form__input--error');
  errorTitle.classList.add('hidden');
}

function showError(el, msgEl) {
  el.classList.add('form__input--error');
  msgEl.classList.remove('hidden');
}

taskForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  clearErrors();

  const title = formTitle.value.trim();
  if (!title) {
    showError(formTitle, errorTitle);
    formTitle.focus();
    return;
  }

  const payload = {
    title,
    description: formDesc.value.trim(),
    status: formStatus.value,
    priority: formPriority.value,
  };

  formSubmit.disabled = true;
  formSubmit.textContent = 'Saving...';
  try {
    if (formId.value) {
      await updateTask(Number(formId.value), payload);
      showToast('Task updated', 'success');
    } else {
      await createTask(payload);
      showToast('Task created', 'success');
    }
    closeModal();
    loadTasks();
  } catch (err) {
    showToast(err.message, 'error');
  } finally {
    formSubmit.disabled = false;
    formSubmit.textContent = formId.value ? 'Save Changes' : 'Create Task';
  }
});

// ─── Card actions (delegated) ────────────────────────────────────────────────
taskList.addEventListener('click', async (e) => {
  const target = e.target;

  // Edit
  const editBtn = target.closest('[data-edit]');
  if (editBtn) {
    const id = Number(editBtn.dataset.edit);
    const task = tasks.find((t) => t.id === id);
    if (task) openModal('Edit Task', task);
    return;
  }

  // Delete (first click - ask confirm)
  const delBtn = target.closest('[data-delete]');
  if (delBtn) {
    confirmDeleteId = Number(delBtn.dataset.delete);
    render();
    return;
  }

  // Delete confirm (second click)
  const confirmBtn = target.closest('[data-delete-confirm]');
  if (confirmBtn) {
    const id = Number(confirmBtn.dataset.deleteConfirm);
    try {
      await deleteTask(id);
      showToast('Task deleted', 'success');
      confirmDeleteId = null;
      loadTasks();
    } catch (err) {
      showToast(err.message, 'error');
      confirmDeleteId = null;
      render();
    }
    return;
  }

  // Toggle status via checkbox
  const checkbox = target.closest('[data-toggle]');
  if (checkbox) {
    const id = Number(checkbox.dataset.toggle);
    const newStatus = checkbox.checked ? 'done' : 'todo';
    try {
      await updateTask(id, { status: newStatus });
      loadTasks();
    } catch (err) {
      showToast(err.message, 'error');
      checkbox.checked = !checkbox.checked; // revert
    }
    return;
  }

  // Clicked elsewhere in the card → cancel confirm
  if (confirmDeleteId !== null) {
    confirmDeleteId = null;
    render();
  }
});

// ─── Toast ───────────────────────────────────────────────────────────────────
function showToast(message, type = 'success') {
  const toast = document.createElement('div');
  toast.className = `toast toast--${type}`;
  toast.innerHTML = `<span>${message}</span>`;
  toastContainer.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    toast.style.transition = 'opacity 200ms ease, transform 200ms ease';
    setTimeout(() => toast.remove(), 200);
  }, 3000);
}

// ─── New Task buttons ────────────────────────────────────────────────────────
$('#btn-new-task').addEventListener('click', () => openModal('New Task'));
$('#btn-empty-create').addEventListener('click', () => openModal('New Task'));

// ─── Bootstrap ───────────────────────────────────────────────────────────────
loadTasks();
