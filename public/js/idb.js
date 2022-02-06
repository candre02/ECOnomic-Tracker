// create a hold on db connection
let db;
// establish connection to IndexedDB
const request = indexedDB.open("BudgetTracker", 1);

// event that will emit if the db version changes
request.onupgradeneeded = function (event) {
    // save a reference to the db
    const db = event.target.result;
    // ceate object store
    db.createObjectStore("pending", { autoIncrement: true });
};

// on successful
request.onsuccess = function (event) {
    // when db is created with its object store
    db = event.target.result;

  // check if app is online before reading from db
    if (navigator.onLine) {
    checkDatabase();
    }
};

request.onerror = function (event) {
    // log error
    console.log("Unlucky " + event.target.errorCode);
};

// The function will execute if we attempt to cumbit budget without internet connection
function saveRecord(record) {
    // open a transaction with the db with read and write permission
    const transaction = db.transaction(["pending"], "readwrite");
    // access the object store for 'pending'
    const store = transaction.objectStore("pending");
    // add to my store with the add()
    store.add(record);
}


function checkDatabase() {
    // open a transaction on your db
    const transaction = db.transaction(["pending"], "readwrite");
    // access pending object store
    const store = transaction.objectStore("pending");
    // get all records from store and set to a variable
    const getAll = store.getAll();

    getAll.onsuccess = function () {
        // if theres data in indexedDb store then send it to the api server
    if (getAll.result.length > 0) {
        fetch("/api/transaction/bulk", {
        method: "POST",
        body: JSON.stringify(getAll.result),
        headers: {
          Accept: "application/json, text/plain, */*",
            "Content-Type": "application/json"
        }
        })
        .then(response => response.json())
        .then(serverResponse => {
            if (serverResponse.message){
                throw new Error (serverResponse);
            }

            const transaction = db.transaction(["pending"], 'readwrite');
            const store = transaction.objectStore("pending");
            // clear all items in store
            store.clear();
        })
        .catch(err => {
            // set reference to redirect back here
            console.log(err);
        });
    }
    };
}


// listen for app coming back online
window.addEventListener("online", checkDatabase);