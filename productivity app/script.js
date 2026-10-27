
const taskForm = document.getElementById("taskForm");
const taskInput = document.getElementById("taskInput");
const searchInput = document.getElementById("searchInput");
const taskList = document.getElementById("taskList");
const taskCategory = document.getElementById("taskCategory");
const taskDueDate = document.getElementById("taskDueDate");

let tasks = JSON.parse(localStorage.getItem("tasks")) || [];
let currentFilter = "all";

// Save tasks in browser storage
function saveTasks() {
    localStorage.setItem("tasks", JSON.stringify(tasks));
}

// Update dashboard numbers and progress bar
function updateDashboard() {
    const total = tasks.length;
    const completed = tasks.filter(task => task.completed).length;
    const remaining = total - completed;
    const percentage = total === 0
        ? 0
        : Math.round((completed / total) * 100);

    document.getElementById("totalTasks").textContent = total;
    document.getElementById("completedTasks").textContent = completed;
    document.getElementById("remainingTasks").textContent = remaining;
    document.getElementById("progressText").textContent = percentage + "%";
    document.getElementById("progressBar").style.width = percentage + "%";
}

// Apply active/completed filter and search
function applyFilter() {
    const cards = taskList.querySelectorAll(".task-card");
    const searchText = searchInput.value.toLowerCase().trim();

    cards.forEach(function(card) {
        const taskText = card.querySelector(".task-text").textContent.toLowerCase();
        const isCompleted = card.dataset.completed === "true";

        const matchesFilter =
            currentFilter === "all" ||
            (currentFilter === "active" && !isCompleted) ||
            (currentFilter === "completed" && isCompleted);

        const matchesSearch = taskText.includes(searchText);

        card.style.display =
            matchesFilter && matchesSearch ? "" : "none";
    });

    // Show a message when tasks exist but none match
    const emptyMessage = taskList.querySelector(".no-results");

    const visibleCards = Array.from(cards).filter(
        card => card.style.display !== "none"
    );

    if (tasks.length > 0 && visibleCards.length === 0) {
        if (!emptyMessage) {
            const message = document.createElement("p");
            message.className = "no-results";
            message.textContent = "No matching tasks found.";
            taskList.appendChild(message);
        }
    } else if (emptyMessage) {
        emptyMessage.remove();
    }
}

// Enable drag-and-drop ordering
function enableTaskDrop() {
    taskList.addEventListener("dragover", function(event) {
        event.preventDefault();

        const draggedCard = taskList.querySelector(".dragging");
        if (!draggedCard) return;

        const otherCards = [
            ...taskList.querySelectorAll(".task-card:not(.dragging)")
        ].filter(card => card.style.display !== "none");

        let nextCard = null;

        for (const card of otherCards) {
            const rect = card.getBoundingClientRect();

            if (event.clientY < rect.top + rect.height / 2) {
                nextCard = card;
                break;
            }
        }

        if (nextCard) {
            taskList.insertBefore(draggedCard, nextCard);
        } else {
            taskList.appendChild(draggedCard);
        }
    });

    
taskList.addEventListener("drop", function(event) {
    event.preventDefault();

    // Do not reorder tasks while a filter or search is active
    if (currentFilter !== "all" || searchInput.value.trim() !== "") {
        return;
    }

    const orderedIds = [
        ...taskList.querySelectorAll(".task-card")
    ].map(card => Number(card.dataset.taskId));


        const taskMap = new Map(
            tasks.map(task => [Number(task.id), task])
        );

        const reorderedTasks = orderedIds
            .map(id => taskMap.get(id))
            .filter(Boolean);

        const includedIds = new Set(orderedTasks.map(task => Number(task.id)));

        tasks.forEach(function(task) {
            if (!includedIds.has(Number(task.id))) {
                reorderedTasks.push(task);
            }
        });

        tasks = reorderedTasks;
        saveTasks();
    });
}

// Draw tasks on the page
function renderTasks() {
    taskList.innerHTML = "";

    // Empty state when there are no tasks
    if (tasks.length === 0) {
        taskList.innerHTML = `
            <div class="empty-state">
                <h3>📝 No tasks yet!</h3>
                <p>Add your first task to get started.</p>
            </div>
        `;

        updateDashboard();
        return;
    }

    const today = new Date();

const year = today.getFullYear();
const month = String(today.getMonth() + 1).padStart(2, "0");
const day = String(today.getDate()).padStart(2, "0");

const todayString = `${year}-${month}-${day}`;

    tasks.forEach(function(task) {
        const taskItem = document.createElement("div");

        taskItem.className = "task-card";
        taskItem.dataset.taskId = String(task.id);
        taskItem.dataset.completed = String(Boolean(task.completed));
        taskItem.draggable = true;

        // Drag start and end
       
 
taskItem.addEventListener("dragstart", function(event) {
    if (currentFilter !== "all" || searchInput.value.trim() !== "") {
        event.preventDefault();
        return;
    }

    taskItem.classList.add("dragging");
    event.dataTransfer.setData("text/plain", String(task.id));
});

taskItem.addEventListener("dragend", function() {
    taskItem.classList.remove("dragging");
});


        // Task text
        const taskTextElement = document.createElement("span");
        taskTextElement.className = "task-text";
        taskTextElement.textContent = task.text;

        if (task.completed) {
            taskItem.classList.add("completed");
        }

        // Category badge
        const categoryBadge = document.createElement("span");
        categoryBadge.className =
            "category-badge category-" +
            String(task.category || "personal").toLowerCase();

        categoryBadge.textContent = task.category || "Personal";

        // Task details: due date and overdue warning
        const taskDetails = document.createElement("div");
        taskDetails.className = "task-details";

        if (task.dueDate) {
            const dueDateText = document.createElement("span");
            dueDateText.textContent = "Due: " + task.dueDate;
            taskDetails.appendChild(dueDateText);

            if (task.dueDate < todayString && !task.completed) {
                taskItem.classList.add("overdue");

                const overdueLabel = document.createElement("span");
                overdueLabel.className = "overdue-label";
                overdueLabel.textContent = "Overdue";

                taskDetails.appendChild(overdueLabel);
            }
        }

        // Complete / Undo button
        const completeButton = document.createElement("button");
        completeButton.type = "button";
        completeButton.textContent = task.completed ? "Undo" : "Complete";

        completeButton.addEventListener("click", function() {
            task.completed = !task.completed;
            saveTasks();
            renderTasks();
        });

// Edit button
const editButton = document.createElement("button");
editButton.type = "button";
editButton.textContent = "Edit";

editButton.addEventListener("click", function () {
    const updatedText = prompt("Edit your task:", task.text);

    if (updatedText === null) {
        return;
    }

    const cleanText = updatedText.trim();

    if (cleanText === "") {
        alert("Task name cannot be empty.");
        return;
    }

    task.text = cleanText;

    const updatedCategory = prompt(
        "Enter category: Work, Personal, or Study",
        task.category || "Personal"
    );

    if (updatedCategory !== null) {
        const category = updatedCategory.trim().toLowerCase();

        const categories = {
            work: "Work",
            personal: "Personal",
            study: "Study"
        };

        if (categories[category]) {
            task.category = categories[category];
        }
    }

    const updatedDueDate = prompt(
        "Enter due date (YYYY-MM-DD), or leave empty:",
        task.dueDate || ""
    );

    if (updatedDueDate !== null) {
        task.dueDate = updatedDueDate.trim();
    }

    saveTasks();
    renderTasks();
});
        // Delete button
        const deleteButton = document.createElement("button");
        deleteButton.type = "button";
        deleteButton.textContent = "Delete";

        deleteButton.addEventListener("click", function() {
            tasks = tasks.filter(item => item.id !== task.id);
            saveTasks();
            renderTasks();
        });

        // Add all elements to task card
        taskItem.appendChild(taskTextElement);
        taskItem.appendChild(categoryBadge);
        taskItem.appendChild(taskDetails);
       taskItem.appendChild(completeButton);
taskItem.appendChild(editButton);
taskItem.appendChild(deleteButton);

        taskList.appendChild(taskItem);
    });

    applyFilter();
    updateDashboard();
}

// Add a new task
taskForm.addEventListener("submit", function(event) {
    event.preventDefault();

    const text = taskInput.value.trim();

    if (text === "") {
        taskInput.focus();
        return;
    }

    const newTask = {
        id: Date.now(),
        text: text,
        category: taskCategory.value || "Personal",
        dueDate: taskDueDate.value,
        completed: false
    };

    tasks.push(newTask);
    saveTasks();

    taskForm.reset();
    renderTasks();
});

// Filter buttons
document.querySelectorAll(".filter-btn").forEach(function(button) {
    button.addEventListener("click", function() {
        currentFilter = button.dataset.filter.toLowerCase();

        document.querySelectorAll(".filter-btn").forEach(function(btn) {
            btn.classList.remove("active");
        });

        button.classList.add("active");
        applyFilter();
    });
});

// Search tasks as user types
searchInput.addEventListener("input", applyFilter);

// Set up drag-and-drop once
enableTaskDrop();

// Initial display
renderTasks();
