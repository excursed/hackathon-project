/* =========================================================
   STUDYSNAP - FIREBASE VERSION
   ========================================================= */


/* =========================================================
   FIREBASE IMPORTS
   ========================================================= */

import {
    initializeApp
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js";

import {
    getAuth,
    onAuthStateChanged,
    signInAnonymously,
    signOut
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";

import {
    getFirestore,
    collection,
    addDoc,
    getDocs,
    doc,
    getDoc,
    setDoc,
    deleteDoc,
    query,
    orderBy,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";

import {
    getStorage,
    ref,
    uploadBytes,
    getDownloadURL
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-storage.js";


/* =========================================================
   FIREBASE CONFIG
   ========================================================= */

const firebaseConfig = {

    apiKey: "AIzaSyAn8rAaXLgeJErCcu6oH2nwMeMqdz4fE60",

    authDomain: "studysnap-83caa.firebaseapp.com",

    projectId: "studysnap-83caa",

    storageBucket: "studysnap-83caa.firebasestorage.app",

    messagingSenderId: "1019889181177",

    appId: "1:1019889181177:web:b379ebc2a54f8ec81b9d28"

};


/* =========================================================
   INITIALIZE FIREBASE
   ========================================================= */

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);

const db = getFirestore(app);

const storage = getStorage(app);


let currentUser = null;


/* =========================================================
   APPLICATION STATE
   ========================================================= */

let materials = [];

let currentSubject = "all";

let currentType = "all";

let currentMaterialId = null;

let currentReviewPage = 1;

let bookmarks = [];

let favourites = [];

let tasks = [];

let profile = {

    name: "Nihal",

    email: "",

    className: "",

    registerNumber: ""

};


/* =========================================================
   SAMPLE MATERIALS
   ========================================================= */

const sampleMaterials = [

    {
        id: "demo-1",
        title: "Integration Notes",
        subject: "Mathematics",
        topic: "Integration",
        type: "PDF",
        source: "WhatsApp",
        date: "Today",
        fileName: "Integration Notes.pdf",
        content: ""
    },

    {
        id: "demo-2",
        title: "Integration Important Questions",
        subject: "Mathematics",
        topic: "Integration",
        type: "PDF",
        source: "Class Group",
        date: "Yesterday",
        fileName: "Integration Questions.pdf",
        content: ""
    },

    {
        id: "demo-3",
        title: "Trees & Graphs",
        subject: "Programming",
        topic: "Data Structures",
        type: "PDF",
        source: "Class Group",
        date: "Yesterday",
        fileName: "Trees and Graphs.pdf",
        content: ""
    },

    {
        id: "demo-4",
        title: "JavaScript Basics",
        subject: "Programming",
        topic: "JavaScript",
        type: "LINK",
        source: "WhatsApp",
        date: "Sep 29",
        url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript",
        content: ""
    },

    {
        id: "demo-5",
        title: "Optics Lecture",
        subject: "Physics",
        topic: "Optics",
        type: "LINK",
        source: "WhatsApp",
        date: "Sep 28",
        url: "https://www.youtube.com/",
        content: ""
    },

    {
        id: "demo-6",
        title: "Ray Optics Notes",
        subject: "Physics",
        topic: "Ray Optics",
        type: "PDF",
        source: "Class Group",
        date: "Sep 27",
        fileName: "Ray Optics Notes.pdf",
        content: ""
    },

    {
        id: "demo-7",
        title: "Organic Chemistry Revision",
        subject: "Chemistry",
        topic: "Organic Chemistry",
        type: "NOTE",
        source: "Personal",
        date: "Sep 27",
        content:
            "Organic chemistry revision notes.\n\n" +
            "Important topics:\n" +
            "- Hydrocarbons\n" +
            "- Functional groups\n" +
            "- Reaction mechanisms\n" +
            "- Isomerism"
    },

    {
        id: "demo-8",
        title: "Chemical Bonding",
        subject: "Chemistry",
        topic: "Chemical Bonding",
        type: "PDF",
        source: "WhatsApp",
        date: "Sep 26",
        fileName: "Chemical Bonding.pdf",
        content: ""
    }

];


/* =========================================================
   AUTHENTICATION
   ========================================================= */

// =========================================================
// DEMO MODE - Firebase bypass for hackathon presentation
// =========================================================

currentUser = {
    uid: "demo-user"
};

console.log("StudySnap running in DEMO MODE");

// Start the application immediately
materials = [...sampleMaterials];

renderMaterials();
renderRecentMaterials();
renderFavourites();
renderBookmarks();
renderTasks();
updateProfileUI();

console.log("StudySnap ready!");


/* =========================================================
   LOAD FIREBASE DATA
   ========================================================= */

async function loadFirebaseData() {

    materials = [...sampleMaterials];

    await loadMaterials();

    await loadFavourites();

    await loadBookmarks();

    await loadTasks();

    await loadProfile();

    renderMaterials();

    renderRecentMaterials();

    renderFavourites();

    renderBookmarks();

    renderTasks();

    updateProfileUI();

}


/* =========================================================
   MATERIALS
   ========================================================= */

async function loadMaterials() {

    if (!currentUser) return;

    try {

        const materialsRef = collection(
            db,
            "users",
            currentUser.uid,
            "materials"
        );

        const snapshot = await getDocs(materialsRef);

        snapshot.forEach((document) => {

            const data = document.data();

            materials.push({

                id: document.id,

                ...data

            });

        });

    } catch (error) {

        console.error(
            "Could not load materials:",
            error
        );

    }

}


/* =========================================================
   SAVE MATERIAL
   ========================================================= */

async function saveMaterialToFirebase(material) {

    if (!currentUser) {

        alert("Please wait for Firebase to connect.");

        return null;

    }


    try {

        const materialsRef = collection(
            db,
            "users",
            currentUser.uid,
            "materials"
        );


        const documentReference = await addDoc(
            materialsRef,
            material
        );


        return documentReference.id;

    } catch (error) {

        console.error(
            "Could not save material:",
            error
        );

        alert("Could not save material to Firebase.");

        return null;

    }

}


/* =========================================================
   UPLOAD PDF
   ========================================================= */

async function uploadPDF(file) {

    if (!currentUser) {

        throw new Error(
            "User is not authenticated."
        );

    }


    const filePath =
        `users/${currentUser.uid}/materials/${Date.now()}_${file.name}`;


    const storageReference =
        ref(storage, filePath);


    await uploadBytes(
        storageReference,
        file
    );


    const downloadURL =
        await getDownloadURL(storageReference);


    return downloadURL;

}


/* =========================================================
   NAVIGATION
   ========================================================= */

const navItems =
    document.querySelectorAll(".nav-item");


const pages =
    document.querySelectorAll(".page");


function showPage(pageName) {

    pages.forEach((page) => {

        page.classList.add("hidden");
        page.classList.remove("active");

    });


    const page =
        document.getElementById(
            `${pageName}Page`
        );


    if (page) {

        page.classList.remove("hidden");

        page.classList.add("active");

    }


    navItems.forEach((item) => {

        item.classList.remove("active");

        if (
            item.dataset.page === pageName
        ) {

            item.classList.add("active");

        }

    });


    if (pageName === "library") {

        renderMaterials();

    }


    if (pageName === "bookmarks") {

        renderBookmarks();

    }


    if (pageName === "favourites") {

        renderFavourites();

    }


    if (pageName === "tasks") {

        renderTasks();

    }

}


navItems.forEach((item) => {

    item.addEventListener("click", () => {

        showPage(item.dataset.page);

    });

});


/* =========================================================
   LIBRARY
   ========================================================= */

function openLibrary() {

    showPage("library");

}


document
    .getElementById("viewLibraryBtn")
    .addEventListener(
        "click",
        openLibrary
    );


document
    .getElementById("recentLibraryBtn")
    .addEventListener(
        "click",
        openLibrary
    );


document
    .getElementById("searchBtn")
    .addEventListener(
        "click",
        openLibrary
    );


/* =========================================================
   RENDER MATERIALS
   ========================================================= */

function renderMaterials() {

    const container =
        document.getElementById(
            "libraryMaterials"
        );

    const noResults =
        document.getElementById(
            "noResults"
        );

    const search =
        (
            document.getElementById(
                "librarySearch"
            )?.value || ""
        )
        .toLowerCase();


    let filtered =
        materials.filter((material) => {

            const matchesSearch =

                material.title
                    .toLowerCase()
                    .includes(search)

                ||

                material.topic
                    .toLowerCase()
                    .includes(search);


            const matchesSubject =

                currentSubject === "all"

                ||

                material.subject ===
                currentSubject;


            const matchesType =

                currentType === "all"

                ||

                material.type ===
                currentType;


            return (
                matchesSearch &&
                matchesSubject &&
                matchesType
            );

        });


    if (filtered.length === 0) {

        container.innerHTML = "";

        noResults.classList.remove(
            "hidden"
        );

        return;

    }


    noResults.classList.add(
        "hidden"
    );


    container.innerHTML =
        filtered.map(
            createMaterialCard
        ).join("");

}


/* =========================================================
   MATERIAL CARD
   ========================================================= */

function createMaterialCard(material) {

    const isFavourite =
        favourites.includes(
            material.id
        );


    let icon = "📄";


    if (material.type === "LINK") {

        icon = "🔗";

    }


    if (material.type === "NOTE") {

        icon = "📝";

    }


    return `

        <article
            class="material-card"
            onclick="openMaterial('${material.id}')"
        >

            <div class="material-top">

                <div class="material-icon">
                    ${icon}
                </div>

                <button
                    class="favourite-btn ${
                        isFavourite
                            ? "active"
                            : ""
                    }"
                    onclick="
                        event.stopPropagation();
                        toggleFavourite('${material.id}')
                    "
                    title="Favourite"
                >
                    ${
                        isFavourite
                            ? "★"
                            : "☆"
                    }
                </button>

            </div>


            <h3>
                ${escapeHTML(material.title)}
            </h3>


            <p>
                ${escapeHTML(material.topic)}
            </p>


            <div class="material-meta">

                <span class="badge">
                    ${escapeHTML(material.subject)}
                </span>

                <span class="badge">
                    ${material.type}
                </span>

                <span class="badge">
                    ${escapeHTML(material.source || "")}
                </span>

            </div>


            <button
                class="open-btn"
                onclick="
                    event.stopPropagation();
                    openMaterial('${material.id}')
                "
            >
                Open Material →
            </button>

        </article>

    `;

}


/* =========================================================
   RECENT MATERIALS
   ========================================================= */

function renderRecentMaterials() {

    const container =
        document.getElementById(
            "recentMaterials"
        );


    const recent =
        materials.slice(0, 4);


    container.innerHTML =
        recent.map(
            createMaterialCard
        ).join("");

}


/* =========================================================
   SEARCH
   ========================================================= */

document
    .getElementById("librarySearch")
    .addEventListener(
        "input",
        renderMaterials
    );


/* =========================================================
   FILTERS
   ========================================================= */

document
    .querySelectorAll(".filter-btn")
    .forEach((button) => {

        button.addEventListener(
            "click",
            () => {

                document
                    .querySelectorAll(
                        ".filter-btn"
                    )
                    .forEach(
                        (btn) =>
                            btn.classList.remove(
                                "active"
                            )
                    );


                button.classList.add(
                    "active"
                );


                if (
                    button.dataset.type
                ) {

                    currentType =
                        button.dataset.type;

                    currentSubject =
                        "all";

                } else {

                    currentSubject =
                        button.dataset.filter;

                    currentType =
                        "all";

                }


                renderMaterials();

            }
        );

    });


/* =========================================================
   SUBJECT CARDS
   ========================================================= */

document
    .querySelectorAll(".subject-card")
    .forEach((card) => {

        card.addEventListener(
            "click",
            () => {

                currentSubject =
                    card.dataset.subject;

                currentType =
                    "all";

                openLibrary();


                document
                    .querySelectorAll(
                        ".filter-btn"
                    )
                    .forEach(
                        (btn) => {

                            btn.classList.toggle(
                                "active",
                                btn.dataset.filter ===
                                currentSubject
                            );

                        }
                    );

                renderMaterials();

            }
        );

    });


/* =========================================================
   MATERIAL REVIEW
   ========================================================= */

window.openMaterial =
    async function (
        materialId,
        pageNumber = null
    ) {

        const material =
            materials.find(
                (item) =>
                    item.id === materialId
            );


        if (!material) {

            alert(
                "Material could not be found."
            );

            return;

        }


        currentMaterialId =
            materialId;


        const savedPage =
            localStorage.getItem(
                `studysnap_progress_${materialId}`
            );


        if (pageNumber !== null) {

            currentReviewPage =
                Number(pageNumber);

        } else if (savedPage) {

            currentReviewPage =
                Number(savedPage);

        } else if (
            material.title ===
            "Integration Notes"
        ) {

            currentReviewPage = 14;

        } else {

            currentReviewPage = 1;

        }


        renderMaterialReview();

        showPage("material");

    };


/* =========================================================
   MATERIAL REVIEW UI
   ========================================================= */

function renderMaterialReview() {

    const material =
        materials.find(
            (item) =>
                item.id === currentMaterialId
        );


    if (!material) return;


    const isFavourite =
        favourites.includes(
            material.id
        );


    const isBookmarked =
        bookmarks.some(
            (bookmark) =>
                bookmark.materialId ===
                    material.id
                &&
                Number(bookmark.page) ===
                    Number(currentReviewPage)
        );


    let preview = "";


    if (material.type === "PDF") {

        if (material.downloadURL) {

            preview = `

                <div class="pdf-preview">

                    <div class="pdf-icon">
                        📄
                    </div>

                    <h2>
                        ${escapeHTML(
                            material.fileName ||
                            material.title
                        )}
                    </h2>

                    <p>
                        Your PDF has been uploaded
                        to Firebase Storage.
                    </p>

                    <br>

                    <a
                        class="primary-btn"
                        href="${material.downloadURL}"
                        target="_blank"
                    >
                        Open PDF
                    </a>

                </div>

            `;

        } else {

            preview = `

                <div class="pdf-preview">

                    <div class="pdf-icon">
                        📄
                    </div>

                    <h2>
                        ${escapeHTML(
                            material.fileName ||
                            material.title
                        )}
                    </h2>

                    <p>
                        Demo PDF preview.
                    </p>

                    <p>
                        The original demo material
                        does not have a Firebase file.
                    </p>

                </div>

            `;

        }

    }


    if (material.type === "NOTE") {

        preview = `

            <div class="note-content">

                ${escapeHTML(
                    material.content ||
                    "No note content available."
                )}

            </div>

        `;

    }


    if (material.type === "LINK") {

        preview = `

            <div class="link-preview">

                <div class="pdf-icon">
                    🔗
                </div>

                <h2>
                    ${escapeHTML(material.title)}
                </h2>

                <p>
                    ${escapeHTML(
                        material.url ||
                        "No link available."
                    )}
                </p>

                <br>

                ${
                    material.url
                        ? `
                            <a
                                href="${material.url}"
                                target="_blank"
                                class="primary-btn"
                            >
                                Open Link
                            </a>
                        `
                        : ""
                }

            </div>

        `;

    }


    const container =
        document.getElementById(
            "materialReview"
        );


    container.innerHTML = `

        <div class="review-container">

            <div class="review-header">

                <div>

                    <p class="eyebrow">
                        ${material.type}
                    </p>

                    <h1>
                        ${escapeHTML(material.title)}
                    </h1>

                    <p class="review-info">

                        ${escapeHTML(material.subject)}
                        •
                        ${escapeHTML(material.topic)}
                        •
                        ${escapeHTML(material.source || "")}

                    </p>

                </div>


                <div class="review-actions">

                    <button
                        class="secondary-btn"
                        onclick="
                            toggleFavourite(
                                '${material.id}'
                            )
                        "
                    >
                        ${
                            isFavourite
                                ? "★ Remove Favourite"
                                : "☆ Add to Favourites"
                        }
                    </button>

                    <button
                        class="primary-btn"
                        onclick="addBookmark()"
                    >
                        ${
                            isBookmarked
                                ? "🔖 Bookmarked"
                                : "🔖 Bookmark This Page"
                        }
                    </button>

                </div>

            </div>


            <div class="page-controls">

                <strong>
                    Current page:
                </strong>

                <input
                    type="number"
                    id="reviewPageNumber"
                    min="1"
                    value="${currentReviewPage}"
                >

                <button
                    class="secondary-btn"
                    onclick="updateReviewPage()"
                >
                    Go
                </button>

            </div>


            <div class="review-preview">

                ${preview}

            </div>


            <div class="ai-demo">

                <h3>
                    ✨ AI Note Summary
                </h3>

                <span class="demo-badge">
                    DEMO AI
                </span>

                <p style="margin-top:10px;">
                    Generate a quick summary of this
                    material.
                </p>

                <br>

                <button
                    class="primary-btn"
                    onclick="generateAISummary()"
                >
                    Generate AI Summary
                </button>

                <div
                    id="aiSummaryOutput"
                    style="margin-top:15px;"
                ></div>

            </div>

        </div>

    `;

}


/* =========================================================
   REVIEW PAGE
   ========================================================= */

window.updateReviewPage =
    function () {

        const input =
            document.getElementById(
                "reviewPageNumber"
            );


        if (!input) return;


        const page =
            Math.max(
                1,
                Number(input.value) || 1
            );


        currentReviewPage = page;


        if (currentMaterialId) {

            localStorage.setItem(
                `studysnap_progress_${currentMaterialId}`,
                page
            );

        }


        renderMaterialReview();

    };


/* =========================================================
   BOOKMARKS
   ========================================================= */

async function loadBookmarks() {

    if (!currentUser) return;


    bookmarks = [];


    try {

        const bookmarksRef =
            collection(
                db,
                "users",
                currentUser.uid,
                "bookmarks"
            );


        const snapshot =
            await getDocs(bookmarksRef);


        snapshot.forEach((document) => {

            bookmarks.push({

                id: document.id,

                ...document.data()

            });

        });


    } catch (error) {

        console.error(
            "Bookmark loading error:",
            error
        );

    }

}


window.addBookmark =
    async function () {

        if (!currentUser) {

            alert(
                "Firebase is still connecting."
            );

            return;

        }


        const material =
            materials.find(
                (item) =>
                    item.id ===
                    currentMaterialId
            );


        if (!material) return;


        const alreadyExists =
            bookmarks.find(
                (bookmark) =>

                    bookmark.materialId ===
                        material.id

                    &&

                    Number(bookmark.page) ===
                        Number(currentReviewPage)
            );


        if (alreadyExists) {

            alert(
                "This page is already bookmarked."
            );

            return;

        }


        const bookmarkData = {

            materialId:
                material.id,

            materialTitle:
                material.title,

            page:
                currentReviewPage,

            topic:
                material.topic,

            createdAt:
                serverTimestamp()

        };


        try {

            const bookmarksRef =
                collection(
                    db,
                    "users",
                    currentUser.uid,
                    "bookmarks"
                );


            const documentReference =
                await addDoc(
                    bookmarksRef,
                    bookmarkData
                );


            bookmarks.push({

                id:
                    documentReference.id,

                ...bookmarkData,

                createdAt:
                    new Date()

            });


            renderBookmarks();

            renderMaterialReview();


            alert(
                `Page ${currentReviewPage} bookmarked!`
            );


        } catch (error) {

            console.error(
                "Bookmark error:",
                error
            );

            alert(
                "Could not save bookmark."
            );

        }

    };


/* =========================================================
   RENDER BOOKMARKS
   ========================================================= */

function renderBookmarks() {

    const container =
        document.getElementById(
            "bookmarksList"
        );


    if (!container) return;


    if (bookmarks.length === 0) {

        container.innerHTML = `

            <div class="empty-state">

                <div class="empty-icon">
                    🔖
                </div>

                <h2>
                    No bookmarks yet
                </h2>

                <p>
                    Open a material and bookmark
                    a page while studying.
                </p>

            </div>

        `;

        return;

    }


    container.innerHTML =
        bookmarks.map(
            (bookmark) => `

                <div class="bookmark-item">

                    <div>

                        <h3>
                            ${escapeHTML(
                                bookmark.materialTitle
                            )}
                        </h3>

                        <p>
                            Page ${bookmark.page}
                            •
                            ${escapeHTML(
                                bookmark.topic || ""
                            )}
                        </p>

                    </div>


                    <div class="bookmark-actions">

                        <button
                            class="secondary-btn"
                            onclick="
                                openMaterial(
                                    '${bookmark.materialId}',
                                    ${bookmark.page}
                                )
                            "
                        >
                            Open
                        </button>

                        <button
                            class="danger-btn"
                            onclick="
                                removeBookmark(
                                    '${bookmark.id}'
                                )
                            "
                        >
                            Remove
                        </button>

                    </div>

                </div>

            `
        )
        .join("");

}


/* =========================================================
   REMOVE BOOKMARK
   ========================================================= */

window.removeBookmark =
    async function (bookmarkId) {

        if (!currentUser) return;


        try {

            await deleteDoc(
                doc(
                    db,
                    "users",
                    currentUser.uid,
                    "bookmarks",
                    bookmarkId
                )
            );


            bookmarks =
                bookmarks.filter(
                    (bookmark) =>
                        bookmark.id !==
                        bookmarkId
                );


            renderBookmarks();

            if (currentMaterialId) {

                renderMaterialReview();

            }


        } catch (error) {

            console.error(
                error
            );

        }

    };


/* =========================================================
   FAVOURITES
   ========================================================= */

async function loadFavourites() {

    if (!currentUser) return;


    favourites = [];


    try {

        const favouriteRef =
            doc(
                db,
                "users",
                currentUser.uid,
                "settings",
                "favourites"
            );


        const snapshot =
            await getDoc(
                favouriteRef
            );


        if (snapshot.exists()) {

            favourites =
                snapshot.data().items || [];

        }

    } catch (error) {

        console.error(
            "Favourite loading error:",
            error
        );

    }

}


async function saveFavourites() {

    if (!currentUser) return;


    try {

        await setDoc(

            doc(
                db,
                "users",
                currentUser.uid,
                "settings",
                "favourites"
            ),

            {
                items: favourites
            }

        );

    } catch (error) {

        console.error(
            error
        );

    }

}


window.toggleFavourite =
    async function (materialId) {

        if (
            favourites.includes(
                materialId
            )
        ) {

            favourites =
                favourites.filter(
                    (id) =>
                        id !== materialId
                );

        } else {

            favourites.push(
                materialId
            );

        }


        await saveFavourites();


        renderMaterials();

        renderRecentMaterials();

        renderFavourites();


        if (currentMaterialId === materialId) {

            renderMaterialReview();

        }

    };


/* =========================================================
   FAVOURITES PAGE
   ========================================================= */

function renderFavourites() {

    const container =
        document.getElementById(
            "favouritesList"
        );


    if (!container) return;


    const favouriteMaterials =
        materials.filter(
            (material) =>
                favourites.includes(
                    material.id
                )
        );


    if (favouriteMaterials.length === 0) {

        container.innerHTML = `

            <div class="empty-state">

                <div class="empty-icon">
                    ★
                </div>

                <h2>
                    No favourites yet
                </h2>

                <p>
                    Favourite important study
                    materials to find them quickly.
                </p>

            </div>

        `;

        return;

    }


    container.innerHTML =
        favouriteMaterials
            .map(
                createMaterialCard
            )
            .join("");

}


/* =========================================================
   ADD MATERIAL MODAL
   ========================================================= */

const modal =
    document.getElementById(
        "addMaterialModal"
    );


function openAddMaterialModal() {

    modal.classList.remove(
        "hidden"
    );

}


function closeAddMaterialModal() {

    modal.classList.add(
        "hidden"
    );

}


document
    .getElementById(
        "addMaterialBtn"
    )
    .addEventListener(
        "click",
        openAddMaterialModal
    );


document
    .getElementById(
        "libraryAddBtn"
    )
    .addEventListener(
        "click",
        openAddMaterialModal
    );


document
    .getElementById(
        "closeModalBtn"
    )
    .addEventListener(
        "click",
        closeAddMaterialModal
    );


document
    .getElementById(
        "cancelModalBtn"
    )
    .addEventListener(
        "click",
        closeAddMaterialModal
    );


/* =========================================================
   MATERIAL TYPE
   ========================================================= */

let selectedMaterialType =
    "PDF";


document
    .querySelectorAll(
        ".type-option"
    )
    .forEach((button) => {

        button.addEventListener(
            "click",
            () => {

                document
                    .querySelectorAll(
                        ".type-option"
                    )
                    .forEach(
                        (btn) =>
                            btn.classList.remove(
                                "active"
                            )
                    );


                button.classList.add(
                    "active"
                );


                selectedMaterialType =
                    button.dataset.materialType;


                updateMaterialInput();

            }
        );

    });


function updateMaterialInput() {

    document
        .getElementById(
            "pdfInputSection"
        )
        .classList.toggle(
            "hidden",
            selectedMaterialType !==
                "PDF"
        );


    document
        .getElementById(
            "linkInputSection"
        )
        .classList.toggle(
            "hidden",
            selectedMaterialType !==
                "LINK"
        );


    document
        .getElementById(
            "noteInputSection"
        )
        .classList.toggle(
            "hidden",
            selectedMaterialType !==
                "NOTE"
        );

}


/* =========================================================
   SAVE NEW MATERIAL
   ========================================================= */

document
    .getElementById(
        "materialForm"
    )
    .addEventListener(
        "submit",
        async (event) => {

            event.preventDefault();


            const title =
                document
                    .getElementById(
                        "materialTitle"
                    )
                    .value
                    .trim();


            const subject =
                document
                    .getElementById(
                        "materialSubject"
                    )
                    .value;


            const topic =
                document
                    .getElementById(
                        "materialTopic"
                    )
                    .value
                    .trim();


            const source =
                document
                    .getElementById(
                        "materialSource"
                    )
                    .value;


            const error =
                document
                    .getElementById(
                        "formError"
                    );


            error.textContent = "";


            if (!title || !topic) {

                error.textContent =
                    "Please enter title and topic.";

                return;

            }


            let downloadURL = "";

            let fileName = "";

            let url = "";

            let content = "";


            /* PDF */

            if (
                selectedMaterialType ===
                "PDF"
            ) {

                const file =
                    document
                        .getElementById(
                            "materialFile"
                        )
                        .files[0];


                if (!file) {

                    error.textContent =
                        "Please select a PDF.";

                    return;

                }


                if (
                    file.type !==
                    "application/pdf"
                ) {

                    error.textContent =
                        "Please select a valid PDF.";

                    return;

                }


                try {

                    error.textContent =
                        "Uploading PDF...";


                    downloadURL =
                        await uploadPDF(
                            file
                        );


                    fileName =
                        file.name;


                } catch (uploadError) {

                    console.error(
                        uploadError
                    );

                    error.textContent =
                        "PDF upload failed.";

                    return;

                }

            }


            /* LINK */

            if (
                selectedMaterialType ===
                "LINK"
            ) {

                url =
                    document
                        .getElementById(
                            "materialLink"
                        )
                        .value
                        .trim();


                if (!url) {

                    error.textContent =
                        "Please enter a link.";

                    return;

                }

            }


            /* NOTE */

            if (
                selectedMaterialType ===
                "NOTE"
            ) {

                content =
                    document
                        .getElementById(
                            "materialNote"
                        )
                        .value
                        .trim();


                if (!content) {

                    error.textContent =
                        "Please write some notes.";

                    return;

                }

            }


            const material = {

                title,

                subject,

                topic,

                type:
                    selectedMaterialType,

                source,

                fileName,

                downloadURL,

                url,

                content,

                date: "Just now",

                createdAt:
                    serverTimestamp()

            };


            error.textContent =
                "Saving material...";


            const firebaseId =
                await saveMaterialToFirebase(
                    material
                );


            if (!firebaseId) {

                return;

            }


            material.id =
                firebaseId;


            materials.unshift(
                material
            );


            renderMaterials();

            renderRecentMaterials();


            document
                .getElementById(
                    "materialForm"
                )
                .reset();


            selectedMaterialType =
                "PDF";


            document
                .querySelectorAll(
                    ".type-option"
                )
                .forEach(
                    (button, index) => {

                        button.classList.toggle(
                            "active",
                            index === 0
                        );

                    }
                );


            updateMaterialInput();

            closeAddMaterialModal();

            openLibrary();


            alert(
                "Material saved successfully!"
            );

        }
    );


/* =========================================================
   CONTINUE BUTTON
   ========================================================= */

document
    .getElementById(
        "continueBtn"
    )
    .addEventListener(
        "click",
        () => {

            const integration =
                materials.find(
                    (material) =>
                        material.title ===
                        "Integration Notes"
                );


            if (integration) {

                openMaterial(
                    integration.id,
                    14
                );

            }

        }
    );


/* =========================================================
   TASKS
   ========================================================= */

async function loadTasks() {

    if (!currentUser) return;


    tasks = [];


    try {

        const tasksRef =
            collection(
                db,
                "users",
                currentUser.uid,
                "tasks"
            );


        const snapshot =
            await getDocs(tasksRef);


        snapshot.forEach(
            (document) => {

                tasks.push({

                    id:
                        document.id,

                    ...document.data()

                });

            }
        );


    } catch (error) {

        console.error(
            "Task loading error:",
            error
        );

    }

}


document
    .getElementById(
        "addTaskBtn"
    )
    .addEventListener(
        "click",
        addTask
    );


document
    .getElementById(
        "taskInput"
    )
    .addEventListener(
        "keydown",
        (event) => {

            if (
                event.key ===
                "Enter"
            ) {

                addTask();

            }

        }
    );


async function addTask() {

    const input =
        document.getElementById(
            "taskInput"
        );


    const text =
        input.value.trim();


    if (!text) return;


    if (!currentUser) {

        alert(
            "Firebase is still connecting."
        );

        return;

    }


    const task = {

        text,

        completed: false,

        createdAt:
            serverTimestamp()

    };


    try {

        const taskRef =
            await addDoc(
                collection(
                    db,
                    "users",
                    currentUser.uid,
                    "tasks"
                ),
                task
            );


        tasks.unshift({

            id:
                taskRef.id,

            text,

            completed: false

        });


        input.value = "";

        renderTasks();

    } catch (error) {

        console.error(
            error
        );

        alert(
            "Could not add task."
        );

    }

}


/* =========================================================
   RENDER TASKS
   ========================================================= */

function renderTasks() {

    const container =
        document.getElementById(
            "taskList"
        );


    const total =
        tasks.length;


    const completed =
        tasks.filter(
            (task) =>
                task.completed
        ).length;


    const pending =
        total - completed;


    document.getElementById(
        "totalTasks"
    ).textContent = total;


    document.getElementById(
        "completedTasks"
    ).textContent = completed;


    document.getElementById(
        "pendingTasks"
    ).textContent = pending;


    if (tasks.length === 0) {

        container.innerHTML = `

            <div class="empty-state">

                <div class="empty-icon">
                    ✓
                </div>

                <h2>
                    No tasks yet
                </h2>

                <p>
                    Add your first study task above.
                </p>

            </div>

        `;

        return;

    }


    container.innerHTML =
        tasks.map(
            (task) => `

                <div
                    class="task-item ${
                        task.completed
                            ? "completed"
                            : ""
                    }"
                >

                    <input
                        type="checkbox"
                        ${
                            task.completed
                                ? "checked"
                                : ""
                        }
                        onchange="
                            toggleTask(
                                '${task.id}'
                            )
                        "
                    >

                    <span class="task-text">
                        ${escapeHTML(task.text)}
                    </span>

                    <button
                        class="delete-task"
                        onclick="
                            deleteTask(
                                '${task.id}'
                            )
                        "
                    >
                        ×
                    </button>

                </div>

            `
        )
        .join("");

}


/* =========================================================
   TOGGLE TASK
   ========================================================= */

window.toggleTask =
    async function (taskId) {

        const task =
            tasks.find(
                (item) =>
                    item.id === taskId
            );


        if (!task || !currentUser)
            return;


        task.completed =
            !task.completed;


        try {

            await setDoc(

                doc(
                    db,
                    "users",
                    currentUser.uid,
                    "tasks",
                    taskId
                ),

                {
                    text:
                        task.text,

                    completed:
                        task.completed

                },

                {
                    merge: true
                }

            );


            renderTasks();

        } catch (error) {

            console.error(
                error
            );

        }

    };


/* =========================================================
   DELETE TASK
   ========================================================= */

window.deleteTask =
    async function (taskId) {

        if (!currentUser)
            return;


        try {

            await deleteDoc(

                doc(
                    db,
                    "users",
                    currentUser.uid,
                    "tasks",
                    taskId
                )

            );


            tasks =
                tasks.filter(
                    (task) =>
                        task.id !==
                        taskId
                );


            renderTasks();

        } catch (error) {

            console.error(
                error
            );

        }

    };


/* =========================================================
   PROFILE
   ========================================================= */

async function loadProfile() {

    if (!currentUser) return;


    try {

        const profileRef =
            doc(
                db,
                "users",
                currentUser.uid,
                "profile",
                "info"
            );


        const snapshot =
            await getDoc(
                profileRef
            );


        if (snapshot.exists()) {

            const data =
                snapshot.data();


            profile = {

                name:
                    data.name ||
                    "Nihal",

                email:
                    data.email ||
                    "",

                className:
                    data.className ||
                    "",

                registerNumber:
                    data.registerNumber ||
                    ""

            };

        }


        document
            .getElementById(
                "profileName"
            )
            .value =
                profile.name;


        document
            .getElementById(
                "profileEmail"
            )
            .value =
                profile.email;


        document
            .getElementById(
                "profileClass"
            )
            .value =
                profile.className;


        document
            .getElementById(
                "profileRegister"
            )
            .value =
                profile.registerNumber;


    } catch (error) {

        console.error(
            "Profile loading error:",
            error
        );

    }

}


/* =========================================================
   SAVE PROFILE
   ========================================================= */

document
    .getElementById(
        "saveProfileBtn"
    )
    .addEventListener(
        "click",
        saveProfile
    );


async function saveProfile() {

    if (!currentUser) {

        alert(
            "Firebase is still connecting."
        );

        return;

    }


    profile = {

        name:
            document
                .getElementById(
                    "profileName"
                )
                .value
                .trim() ||
            "Nihal",

        email:
            document
                .getElementById(
                    "profileEmail"
                )
                .value
                .trim(),

        className:
            document
                .getElementById(
                    "profileClass"
                )
                .value
                .trim(),

        registerNumber:
            document
                .getElementById(
                    "profileRegister"
                )
                .value
                .trim()

    };


    try {

        await setDoc(

            doc(
                db,
                "users",
                currentUser.uid,
                "profile",
                "info"
            ),

            profile

        );


        updateProfileUI();


        const message =
            document.getElementById(
                "profileMessage"
            );


        message.textContent =
            "Profile saved successfully!";


        setTimeout(
            () => {

                message.textContent =
                    "";

            },
            3000
        );


    } catch (error) {

        console.error(
            error
        );

        alert(
            "Could not save profile."
        );

    }

}


/* =========================================================
   PROFILE UI
   ========================================================= */

function updateProfileUI() {

    const name =
        profile.name ||
        "Nihal";


    document.getElementById(
        "topbarName"
    ).textContent = name;


    document.getElementById(
        "topbarAvatar"
    ).textContent =
        name
            .charAt(0)
            .toUpperCase();


    document.getElementById(
        "dashboardGreeting"
    ).textContent =
        `Good evening, ${name} 👋`;


    const avatar =
        document.querySelector(
            ".profile-avatar"
        );


    if (avatar) {

        avatar.textContent =
            name
                .charAt(0)
                .toUpperCase();

    }

}


/* =========================================================
   DARK MODE
   ========================================================= */

const darkModeToggle =
    document.getElementById(
        "darkModeToggle"
    );


function applyDarkMode() {

    const enabled =
        localStorage.getItem(
            "studysnap_dark_mode"
        ) === "true";


    document.body.classList.toggle(
        "dark-mode",
        enabled
    );


    darkModeToggle.checked =
        enabled;

}


darkModeToggle.addEventListener(
    "change",
    () => {

        const enabled =
            darkModeToggle.checked;


        document.body.classList.toggle(
            "dark-mode",
            enabled
        );


        localStorage.setItem(
            "studysnap_dark_mode",
            enabled
        );

    }
);


applyDarkMode();


/* =========================================================
   LOGOUT
   ========================================================= */

document
    .getElementById(
        "logoutBtn"
    )
    .addEventListener(
        "click",
        async () => {

            if (
                !confirm(
                    "Are you sure you want to log out?"
                )
            ) {

                return;

            }


            try {

                await signOut(auth);

                alert(
                    "You have been logged out."
                );


            } catch (error) {

                console.error(
                    error
                );

            }

        }
    );


/* =========================================================
   FOCUS TIMER
   ========================================================= */

let timerSeconds = 25 * 60;

let timerInterval = null;

let sessionCount = 0;


function updateTimerDisplay() {

    const minutes =
        Math.floor(
            timerSeconds / 60
        );


    const seconds =
        timerSeconds % 60;


    document.getElementById(
        "timerDisplay"
    ).textContent =

        `${String(minutes).padStart(2, "0")}:` +

        `${String(seconds).padStart(2, "0")}`;

}


document
    .getElementById(
        "startTimerBtn"
    )
    .addEventListener(
        "click",
        () => {

            if (timerInterval) {

                clearInterval(
                    timerInterval
                );

                timerInterval =
                    null;


                document.getElementById(
                    "startTimerBtn"
                ).textContent =
                    "Start";

                return;

            }


            document.getElementById(
                "startTimerBtn"
            ).textContent =
                "Pause";


            timerInterval =
                setInterval(
                    () => {

                        if (
                            timerSeconds >
                            0
                        ) {

                            timerSeconds--;

                            updateTimerDisplay();

                        } else {

                            clearInterval(
                                timerInterval
                            );

                            timerInterval =
                                null;

                            sessionCount++;

                            document.getElementById(
                                "sessionCount"
                            ).textContent =
                                sessionCount;

                            document.getElementById(
                                "startTimerBtn"
                            ).textContent =
                                "Start";

                            alert(
                                "Focus session complete! 🎉"
                            );

                        }

                    },
                    1000
                );

        }
    );


document
    .getElementById(
        "resetTimerBtn"
    )
    .addEventListener(
        "click",
        () => {

            clearInterval(
                timerInterval
            );

            timerInterval =
                null;

            timerSeconds =
                25 * 60;

            updateTimerDisplay();

            document.getElementById(
                "startTimerBtn"
            ).textContent =
                "Start";

        }
    );


document
    .getElementById(
        "addFiveBtn"
    )
    .addEventListener(
        "click",
        () => {

            timerSeconds +=
                5 * 60;

            updateTimerDisplay();

        }
    );


document
    .getElementById(
        "focusBtn"
    )
    .addEventListener(
        "click",
        () => {

            showPage("focus");

        }
    );


updateTimerDisplay();


/* =========================================================
   MOCK AI SUMMARY
   ========================================================= */

window.generateAISummary =
    function () {

        const material =
            materials.find(
                (item) =>
                    item.id ===
                    currentMaterialId
            );


        if (!material) return;


        let summary = [];


        const topic =
            (
                material.topic ||
                ""
            ).toLowerCase();


        if (
            topic.includes(
                "integration"
            )
        ) {

            summary = [

                "Definite integration is used to calculate accumulated quantities and area under curves.",

                "Substitution can simplify complicated integrals by replacing part of an expression.",

                "Integration by parts follows the formula ∫u dv = uv − ∫v du.",

                "Always check limits carefully when solving definite integrals."

            ];

        }

        else if (
            topic.includes("tree") ||
            topic.includes("graph")
        ) {

            summary = [

                "Trees are hierarchical data structures with nodes and edges.",

                "Graphs consist of vertices and edges and can represent networks.",

                "Breadth-first search and depth-first search are common graph traversal techniques.",

                "Trees and graphs are widely used in computer science."

            ];

        }

        else if (
            topic.includes("javascript")
        ) {

            summary = [

                "JavaScript is a programming language commonly used for web development.",

                "Variables can be declared using let, const, and var.",

                "Functions allow reusable blocks of logic.",

                "JavaScript can manipulate HTML and respond to user interactions."

            ];

        }

        else if (
            topic.includes("chemistry")
            ||
            topic.includes("organic")
        ) {

            summary = [

                "Organic chemistry focuses on compounds containing carbon.",

                "Functional groups determine many chemical properties and reactions.",

                "Reaction mechanisms describe how chemical transformations occur.",

                "Isomerism occurs when compounds share a molecular formula but differ in structure."

            ];

        }

        else {

            summary = [

                `${material.title} focuses on ${material.topic}.`,

                `The material belongs to ${material.subject}.`,

                "Review the main definitions, concepts and examples.",

                "Create practice questions after reviewing the material."

            ];

        }


        const output =
            document.getElementById(
                "aiSummaryOutput"
            );


        output.innerHTML = `

            <ul>

                ${summary
                    .map(
                        (point) =>
                            `<li>
                                ${escapeHTML(point)}
                            </li>`
                    )
                    .join("")}

            </ul>

            <p
                style="
                    color:var(--muted);
                    font-size:12px;
                    margin-top:12px;
                "
            >
                Demo summary only — real AI
                integration can be connected later.
            </p>

        `;

    };


/* =========================================================
   ESCAPE HTML
   ========================================================= */

function escapeHTML(value) {

    if (value === undefined ||
        value === null) {

        return "";

    }


    return String(value)

        .replace(
            /&/g,
            "&amp;"
        )

        .replace(
            /</g,
            "&lt;"
        )

        .replace(
            />/g,
            "&gt;"
        )

        .replace(
            /"/g,
            "&quot;"
        )

        .replace(
            /'/g,
            "&#039;"
        );

}


/* =========================================================
   STARTUP
   ========================================================= */

console.log(
    "StudySnap Firebase version loaded 🚀"
);