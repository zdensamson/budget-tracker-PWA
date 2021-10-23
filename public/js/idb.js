// create variable to hold db connection
let db;
// establish a connection to IndexedDB database called 'budget_track' and set it to version 1
const request = indexedDB.open('budget_tracker', 1);

// this event will emit if the database version changes
request.onupgradeneeded = function(event) {
    // save a reference to the database
    const db = event.target.result;
    // create an object store (table) called 'new_transaction', set it to have an auto incrementing primary key of sorts 
    db.createObjectStore('new_budgetLine', { autoIncrement: true });
}

// upon a successful connection to IndexedDB
request.onsuccess = function(event) {
    // when db is successfully created with its object store (from onupgradedneeded event above) or simply established a connection, save reference to db in global variable
    db = event.target.result;
    // check if app is online, if yes run uploadTransaction() function to send all local db data to api
    if (navigator.onLine) {
        uploadBudgetLine()
    }
}

request.onerror = function(event) {
    // log error here
    console.log(event.target.errorCode);
};

// This function will be executed if we attempt to submit a new budgetLine and there's no internet connection
function saveRecord(record) {
    // open a new transaction with the database with read/write permissions
    const transaction = db.transaction(['new_budgetLine'], 'readwrite');

    // access the store for 'new_budgetLine'
    const budgetObjectStore = transaction.objectStore('new_budgetLine');

    // add record to store with add method
    budgetObjectStore.add(record);
};

function uploadBudgetLine() {
    // open a transaction on your db
    const transaction = db.transaction(['new_budgetLine'], 'readwrite');

    // access object store
    const budgetObjectStore = transaction.objectStore('new_budgetLine');

    // get all records from store and set to a variable
    const getAll = budgetObjectStore.getAll();

    
    getAll.onsuccess = function() {
        // if there was data in indexedDb's store, let's send it to the api server
        if (getAll.result.length > 0) {
          fetch('/api/transaction', {
            method: 'POST',
            body: JSON.stringify(getAll.result),
            headers: {
              Accept: 'application/json, text/plain, */*',
              'Content-Type': 'application/json'
            }
          })
            .then(response => response.json())
            .then(serverResponse => {
              if (serverResponse.message) {
                throw new Error(serverResponse);
              }
    
              const transaction = db.transaction(['new_budgetLine'], 'readwrite');
              const budgetObjectStore = transaction.objectStore('new_budgetLine');
              // clear all items in your store
              budgetObjectStore.clear();
            })
            .catch(err => {
              // set reference to redirect back here
              console.log(err);
            });
        }
      };
}

// listen for app coming back online
window.addEventListener('online', uploadBudgetLine);