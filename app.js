const STORAGE_KEY = "todo-lite.todos";

const todoForm = document.getElementById("todo-form");
const todoInput = document.getElementById("todo-input");
const dueDateInput = document.getElementById("due-date-input");
const priorityInput = document.getElementById("priority-input");
const categoryInput = document.getElementById("category-input");
const todoList = document.getElementById("todo-list");
const todoStats = document.getElementById("todo-stats");
const filters = document.getElementById("filters");
const searchInput = document.getElementById("search-input");
const clearCompletedButton = document.getElementById("clear-completed-btn");

let todos = loadTodos();
let currentFilter = "all";
let searchKeyword = "";

dueDateInput.min = getTodayDateString();

render();

todoForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const text = todoInput.value.trim();
  const dueDate = normalizeDueDate(dueDateInput.value);
  const priority = normalizePriority(priorityInput.value);
  const category = normalizeCategory(categoryInput.value);
  if (!text) return;

  if (dueDate && dueDate < getTodayDateString()) {
    window.alert("截止日期不能早于今天");
    return;
  }

  todos.unshift({
    id: Date.now(),
    text,
    completed: false,
    dueDate,
    priority,
    category
  });

  saveTodos();
  render();
  todoForm.reset();
  todoInput.focus();
});

filters.addEventListener("click", (event) => {
  const button = event.target.closest(".filter-btn");
  if (!button) return;

  currentFilter = button.dataset.filter;

  document.querySelectorAll(".filter-btn").forEach((btn) => {
    btn.classList.toggle("active", btn === button);
  });

  render();
});

searchInput.addEventListener("input", (event) => {
  searchKeyword = event.target.value.trim().toLowerCase();
  render();
});

clearCompletedButton.addEventListener("click", () => {
  clearCompletedTodos();
});

todoList.addEventListener("click", (event) => {
  const item = event.target.closest(".todo-item");
  if (!item) return;

  const id = Number(item.dataset.id);

  if (event.target.matches(".toggle-checkbox")) {
    toggleTodo(id);
    return;
  }

  if (event.target.matches(".edit-btn")) {
    editTodo(id);
    return;
  }

  if (event.target.matches(".delete-btn")) {
    deleteTodo(id);
  }
});

function render() {
  const filteredTodos = getFilteredTodos();
  todoList.innerHTML = "";

  if (filteredTodos.length === 0) {
    todoList.innerHTML = '<li class="empty">当前没有待办事项</li>';
  } else {
    filteredTodos.forEach((todo) => {
      const li = document.createElement("li");
      li.className = `todo-item ${isOverdue(todo) ? "overdue" : ""}`.trim();
      li.dataset.id = String(todo.id);

      li.innerHTML = `
        <div class="todo-left">
          <input class="toggle-checkbox" type="checkbox" ${todo.completed ? "checked" : ""} />
          <div class="todo-content">
            <div class="todo-main-row">
              <span class="todo-text ${todo.completed ? "completed" : ""}">${escapeHtml(todo.text)}</span>
              <div class="todo-meta">
                <span class="category-badge category-${todo.category}">${escapeHtml(getCategoryLabel(todo.category))}</span>
                <span class="priority-badge priority-${todo.priority}">${escapeHtml(getPriorityLabel(todo.priority))}</span>
              </div>
            </div>
            ${todo.dueDate ? `<span class="todo-due-date">截止：${escapeHtml(todo.dueDate)}</span>` : ""}
          </div>
        </div>
        <div class="todo-actions">
          <button class="action-btn edit-btn" type="button">编辑</button>
          <button class="action-btn delete-btn" type="button">删除</button>
        </div>
      `;

      todoList.appendChild(li);
    });
  }

  const completedCount = todos.filter((todo) => todo.completed).length;
  clearCompletedButton.disabled = completedCount === 0;
  todoStats.textContent = `共 ${todos.length} 项，已完成 ${completedCount} 项`;
}

function getFilteredTodos() {
  let filteredTodos = todos;

  if (currentFilter === "active") {
    filteredTodos = filteredTodos.filter((todo) => !todo.completed);
  }

  if (currentFilter === "completed") {
    filteredTodos = filteredTodos.filter((todo) => todo.completed);
  }

  if (searchKeyword) {
    filteredTodos = filteredTodos.filter((todo) =>
      todo.text.toLowerCase().includes(searchKeyword)
    );
  }

  return [...filteredTodos].sort(compareTodosByDueDate);
}

function toggleTodo(id) {
  todos = todos.map((todo) =>
    todo.id === id ? { ...todo, completed: !todo.completed } : todo
  );

  saveTodos();
  render();
}

function editTodo(id) {
  const target = todos.find((todo) => todo.id === id);
  if (!target) return;

  const newText = window.prompt("编辑待办事项", target.text);
  if (newText === null) return;

  const trimmedText = newText.trim();
  if (!trimmedText) return;

  const editedDueDate = window.prompt(
    "编辑截止日期（YYYY-MM-DD，留空表示清除）",
    target.dueDate || ""
  );

  let nextDueDate = target.dueDate || "";
  if (editedDueDate !== null) {
    nextDueDate = normalizeDueDate(editedDueDate);
    if (editedDueDate.trim() && !nextDueDate) {
      window.alert("截止日期格式应为 YYYY-MM-DD");
      return;
    }

    if (nextDueDate && nextDueDate < getTodayDateString()) {
      window.alert("截止日期不能早于今天");
      return;
    }
  }

  const editedPriority = window.prompt(
    "编辑优先级（high / medium / low）",
    target.priority || "medium"
  );
  if (editedPriority === null) return;

  const nextPriority = normalizePriority(editedPriority);
  if (!editedPriority.trim() || editedPriority.trim() !== nextPriority) {
    window.alert("优先级只能是 high、medium 或 low");
    return;
  }

  todos = todos.map((todo) =>
    todo.id === id
      ? { ...todo, text: trimmedText, dueDate: nextDueDate, priority: nextPriority }
      : todo
  );

  saveTodos();
  render();
}

function deleteTodo(id) {
  todos = todos.filter((todo) => todo.id !== id);
  saveTodos();
  render();
}

function clearCompletedTodos() {
  todos = todos.filter((todo) => !todo.completed);
  saveTodos();
  render();
}

function saveTodos() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
}

function loadTodos() {
  const savedTodos = localStorage.getItem(STORAGE_KEY);
  if (!savedTodos) return [];

  return JSON.parse(savedTodos).map((todo) => ({
    id: todo.id,
    text: todo.text,
    completed: todo.completed,
    dueDate: normalizeDueDate(todo.dueDate),
    priority: normalizePriority(todo.priority),
    category: normalizeCategory(todo.category)
  }));
}

function normalizeDueDate(value) {
  const trimmedValue = String(value || "").trim();
  if (!trimmedValue) return "";

  return /^\d{4}-\d{2}-\d{2}$/.test(trimmedValue) ? trimmedValue : "";
}

function normalizePriority(value) {
  const trimmedValue = String(value || "").trim().toLowerCase();
  return ["high", "medium", "low"].includes(trimmedValue) ? trimmedValue : "medium";
}

function normalizeCategory(value) {
  const trimmedValue = String(value || "").trim().toLowerCase();
  return ["work", "daily", "leisure"].includes(trimmedValue) ? trimmedValue : "daily";
}

function getTodayDateString() {
  return new Date().toLocaleDateString("en-CA");
}

function isOverdue(todo) {
  return Boolean(todo.dueDate && !todo.completed && todo.dueDate < getTodayDateString());
}

function compareTodosByDueDate(a, b) {
  if (a.completed !== b.completed) {
    return Number(a.completed) - Number(b.completed);
  }

  if (!a.dueDate && !b.dueDate) {
    const priorityDifference = comparePriority(a.priority, b.priority);
    return priorityDifference || b.id - a.id;
  }

  if (!a.dueDate) return 1;
  if (!b.dueDate) return -1;

  if (a.dueDate !== b.dueDate) {
    return a.dueDate.localeCompare(b.dueDate);
  }

  return comparePriority(a.priority, b.priority) || b.id - a.id;
}

function comparePriority(a, b) {
  const priorityRank = {
    high: 0,
    medium: 1,
    low: 2
  };

  return priorityRank[a] - priorityRank[b];
}

function getPriorityLabel(priority) {
  if (priority === "high") return "高优先级";
  if (priority === "low") return "低优先级";
  return "中优先级";
}

function getCategoryLabel(category) {
  if (category === "work") return "工作";
  if (category === "leisure") return "休闲";
  return "日常";
}

function escapeHtml(text) {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
