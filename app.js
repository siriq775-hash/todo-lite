const STORAGE_KEY = "todo-lite.todos";

const todoForm = document.getElementById("todo-form");
const todoInput = document.getElementById("todo-input");
const todoList = document.getElementById("todo-list");
const todoStats = document.getElementById("todo-stats");
const filters = document.getElementById("filters");

let todos = loadTodos();
let currentFilter = "all";

render();

todoForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const text = todoInput.value.trim();
  if (!text) return;

  todos.unshift({
    id: Date.now(),
    text,
    completed: false
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
      li.className = "todo-item";
      li.dataset.id = String(todo.id);

      li.innerHTML = `
        <div class="todo-left">
          <input class="toggle-checkbox" type="checkbox" ${todo.completed ? "checked" : ""} />
          <span class="todo-text ${todo.completed ? "completed" : ""}">${escapeHtml(todo.text)}</span>
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
  todoStats.textContent = `共 ${todos.length} 项，已完成 ${completedCount} 项`;
}

function getFilteredTodos() {
  if (currentFilter === "active") {
    return todos.filter((todo) => !todo.completed);
  }

  if (currentFilter === "completed") {
    return todos.filter((todo) => todo.completed);
  }

  return todos;
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

  todos = todos.map((todo) =>
    todo.id === id ? { ...todo, text: trimmedText } : todo
  );

  saveTodos();
  render();
}

function deleteTodo(id) {
  todos = todos.filter((todo) => todo.id !== id);
  saveTodos();
  render();
}

function saveTodos() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
}

function loadTodos() {
  const savedTodos = localStorage.getItem(STORAGE_KEY);
  return savedTodos ? JSON.parse(savedTodos) : [];
}

function escapeHtml(text) {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
