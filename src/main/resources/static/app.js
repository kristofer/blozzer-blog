/*
  Blozzer UI study script.

  Why this file is heavily commented:
  - You asked for a study guide style frontend.
  - Every section shows one small idea for talking to REST APIs using fetch().
*/

// Keep API base in one place. If your backend path changes, edit only this line.
const API_BASE = "/api";

// Track which post is selected so comments can be attached to the right post.
let selectedPostId = null;

// ---------- DOM REFERENCES ----------
const statusBox = document.getElementById("statusBox");
const dataTableBody = document.getElementById("dataTableBody");
const postDetails = document.getElementById("postDetails");

const userForm = document.getElementById("userForm");
const categoryForm = document.getElementById("categoryForm");
const postForm = document.getElementById("postForm");
const commentForm = document.getElementById("commentForm");

const refreshUsersBtn = document.getElementById("refreshUsersBtn");
const refreshCategoriesBtn = document.getElementById("refreshCategoriesBtn");
const refreshPostsBtn = document.getElementById("refreshPostsBtn");

// ---------- UI HELPERS ----------
function setStatus(message, variant = "secondary") {
    statusBox.className = `alert alert-${variant} mb-0`;
    statusBox.textContent = message;
}

function clearTable() {
    dataTableBody.innerHTML = "";
}

function appendTableRow(type, id, summary, onClick, actions = []) {
    const tr = document.createElement("tr");

    // Make rows feel clickable when we pass a handler.
    if (onClick) {
        tr.classList.add("clickable-row");
        tr.addEventListener("click", onClick);
    }

    tr.innerHTML = `
    <td>${type}</td>
    <td>${id}</td>
    <td>${summary}</td>
    <td></td>
  `;

    const actionsCell = tr.lastElementChild;

    actions.forEach((action) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = action.className;
        button.textContent = action.label;
        button.addEventListener("click", (event) => {
            // Keep row-level click behavior separate from button click behavior.
            event.stopPropagation();
            action.onClick();
        });
        actionsCell.appendChild(button);
    });

    dataTableBody.appendChild(tr);
}

// ---------- FETCH CORE ----------
/*
  Reusable request helper.

  Patterns demonstrated here:
  1) Set JSON headers for most create/update requests.
  2) Send body only when needed.
  3) Parse JSON conditionally (some endpoints can return empty bodies).
  4) Throw rich errors so calling code can display meaningful messages.
*/
async function apiRequest(path, options = {}) {
    const requestOptions = {
        method: options.method || "GET",
        headers: {
            "Content-Type": "application/json",
            ...(options.headers || {}),
        },
    };

    if (options.body !== undefined) {
        requestOptions.body = JSON.stringify(options.body);
    }

    const response = await fetch(`${API_BASE}${path}`, requestOptions);

    // Safely attempt JSON parsing without crashing on empty responses.
    const rawText = await response.text();
    const payload = rawText ? tryParseJson(rawText) : null;

    if (!response.ok) {
        const reason = payload?.message || payload?.error || response.statusText || "Request failed";
        throw new Error(`HTTP ${response.status}: ${reason}`);
    }

    return payload;
}

function tryParseJson(rawText) {
    try {
        return JSON.parse(rawText);
    } catch {
        return { rawText };
    }
}

// ---------- READ OPERATIONS ----------
/*
  Each reader function maps to one backend endpoint.
  Keeping them small helps beginners inspect each endpoint in isolation.
*/
async function loadUsers() {
    setStatus("Loading users...", "info");
    clearTable();

    const users = await apiRequest("/users/");
    users.forEach((user) => {
        appendTableRow("User", user.id, `${user.name} (${user.email})`, null, [
            {
                label: "Delete",
                className: "btn btn-outline-danger btn-sm",
                onClick: () => runSafe(() => deleteUser(user.id)),
            },
        ]);
    });

    setStatus(`Loaded ${users.length} users.`, "success");
}

async function loadCategories() {
    setStatus("Loading categories...", "info");
    clearTable();

    const categories = await apiRequest("/categories/");
    categories.forEach((category) => {
        appendTableRow("Category", category.categoryId, category.categoryTitle, null, [
            {
                label: "Delete",
                className: "btn btn-outline-danger btn-sm",
                onClick: () => runSafe(() => deleteCategory(category.categoryId)),
            },
        ]);
    });

    setStatus(`Loaded ${categories.length} categories.`, "success");
}

async function loadPosts() {
    setStatus("Loading posts...", "info");
    clearTable();

    const posts = await apiRequest("/posts");
    posts.forEach((post) => {
        appendTableRow(
            "Post",
            post.postId,
            post.title,
            () => selectPost(post.postId),
            [
                {
                    label: "Delete",
                    className: "btn btn-outline-danger btn-sm",
                    onClick: () => runSafe(() => deletePost(post.postId)),
                },
            ]
        );
    });

    setStatus(`Loaded ${posts.length} posts. Click a row for details.`, "success");
}

async function selectPost(postId) {
    selectedPostId = postId;
    setStatus(`Loading post ${postId} details...`, "info");

    const post = await apiRequest(`/posts/${postId}`);

    const comments = Array.isArray(post.comments) ? post.comments : [];

    // Render detail panel from API response.
    postDetails.innerHTML = `
    <h3 class="h5 mb-2">${post.title}</h3>
    <p class="mb-2">${post.content}</p>
    <p class="small text-muted mb-2">
      Author: ${post.user?.name || "Unknown"} | Category: ${post.category?.categoryTitle || "Unknown"}
    </p>
    <h4 class="h6">Comments (${comments.length})</h4>
    <ul class="list-group list-group-flush mb-2">
      ${comments.length === 0
            ? '<li class="list-group-item text-muted">No comments yet.</li>'
            : comments
                .map(
                    (comment) => `
                <li class="list-group-item d-flex justify-content-between align-items-start gap-2">
                  <span>${comment.content}</span>
                  <button class="btn btn-outline-danger btn-sm" data-delete-comment-id="${comment.id}">
                    Delete
                  </button>
                </li>
              `
                )
                .join("")}
    </ul>
  `;

    // Hook up delete buttons after they exist in DOM.
    postDetails.querySelectorAll("[data-delete-comment-id]").forEach((button) => {
        button.addEventListener("click", () => deleteComment(Number(button.dataset.deleteCommentId)));
    });

    setStatus(`Post ${postId} selected.`, "primary");
}

// ---------- CREATE OPERATIONS ----------
async function createUser(formValues) {
    await apiRequest("/users/", {
        method: "POST",
        body: formValues,
    });
}

async function createCategory(formValues) {
    await apiRequest("/categories/", {
        method: "POST",
        body: formValues,
    });
}

async function createPost(formValues) {
    const { userId, categoryId, title, content } = formValues;

    // API expects IDs in URL path and post fields in JSON body.
    await apiRequest(`/user/${userId}/category/${categoryId}/posts`, {
        method: "POST",
        body: { title, content },
    });
}

async function createComment(content) {
    if (!selectedPostId) {
        throw new Error("Select a post before creating a comment.");
    }

    await apiRequest(`/post/${selectedPostId}/comments`, {
        method: "POST",
        body: { content },
    });
}

// ---------- DELETE EXAMPLE ----------
async function deleteComment(commentId) {
    try {
        await apiRequest(`/comments/${commentId}`, { method: "DELETE" });
        setStatus(`Deleted comment ${commentId}.`, "warning");

        // Refresh selected post so UI reflects server truth.
        if (selectedPostId) {
            await selectPost(selectedPostId);
        }
    } catch (error) {
        setStatus(error.message, "danger");
    }
}

async function deleteUser(userId) {
    await apiRequest(`/users/${userId}`, { method: "DELETE" });
    setStatus(`Deleted user ${userId}.`, "warning");
    await loadUsers();
}

async function deleteCategory(categoryId) {
    await apiRequest(`/categories/${categoryId}`, { method: "DELETE" });
    setStatus(`Deleted category ${categoryId}.`, "warning");
    await loadCategories();
}

async function deletePost(postId) {
    await apiRequest(`/posts/${postId}`, { method: "DELETE" });
    setStatus(`Deleted post ${postId}.`, "warning");

    if (selectedPostId === postId) {
        selectedPostId = null;
        postDetails.innerHTML = '<p class="text-muted mb-0">Select a post to see details.</p>';
    }

    await loadPosts();
}

// ---------- FORM UTILITIES ----------
function formToObject(formElement) {
    // FormData reads current values from form controls.
    const data = new FormData(formElement);

    // Object.fromEntries converts name/value pairs into a plain object.
    return Object.fromEntries(data.entries());
}

// ---------- EVENT WIRING ----------
refreshUsersBtn.addEventListener("click", () => runSafe(loadUsers));
refreshCategoriesBtn.addEventListener("click", () => runSafe(loadCategories));
refreshPostsBtn.addEventListener("click", () => runSafe(loadPosts));

userForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const payload = formToObject(userForm);
    await runSafe(async () => {
        await createUser(payload);
        userForm.reset();
        setStatus("User created.", "success");
        await loadUsers();
    });
});

categoryForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const payload = formToObject(categoryForm);
    await runSafe(async () => {
        await createCategory(payload);
        categoryForm.reset();
        setStatus("Category created.", "success");
        await loadCategories();
    });
});

postForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const payload = formToObject(postForm);
    await runSafe(async () => {
        await createPost(payload);
        postForm.reset();
        setStatus("Post created.", "success");
        await loadPosts();
    });
});

commentForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const payload = formToObject(commentForm);
    await runSafe(async () => {
        await createComment(payload.content);
        commentForm.reset();
        setStatus("Comment created.", "success");

        if (selectedPostId) {
            await selectPost(selectedPostId);
        }
    });
});

// Generic guard so all async actions show clean status on failure.
async function runSafe(action) {
    try {
        await action();
    } catch (error) {
        console.error(error);
        setStatus(error.message || "Unknown error", "danger");
    }
}

// Load posts by default so the page is useful immediately.
runSafe(loadPosts);
