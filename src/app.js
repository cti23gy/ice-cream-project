import { initializeApp } from "firebase/app";
import { getAuth, onAuthStateChanged, signInAnonymously, signOut, createUserWithEmailAndPassword, signInWithEmailAndPassword,  GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { getFirestore, collection, getDocs, getDoc, addDoc, doc, updateDoc, deleteDo, onSnapshot, query, where } from "firebase/firestore";

const firebaseConfig = initializeApp({
    apiKey: "AIzaSyAI-k-Nxx1G_ZpDJMMK50qwTO6Ox3QliS0",
    authDomain: "ice-cream-project-8bcea.firebaseapp.com",
    projectId: "ice-cream-project-8bcea",
    storageBucket: "ice-cream-project-8bcea.appspot.com",
    messagingSenderId: "339499897754",
    appId: "1:339499897754:web:8f80b0799cf156b3d4a023",
    measurementId: "G-MDJT012DMZ"
});

var loggedIn = false; //logged in firebase specifically not anon
var currentEditUser = "D7YyBwwNQEPyGmbXehkd";

var currentOrder = 
    {
        flavor: "Vanilla",
        chips: false,
        sprinkles: false,
        whip: false,
        oreos: false
    };

var CART = [];
var currentCartIndex = 0;
var REQUEST = [];

const auth = getAuth(firebaseConfig);
const db = getFirestore(firebaseConfig);

onAuthStateChanged(auth, user => {
    if (user != null) {
        console.log("logged in");
    } else {
        console.log("no user");
    }
});



///////////Page Navigation Code Start!

function route() {
    let hashTag = window.location.hash;
    let pageID = hashTag.replace("#/", "");

    addNav();
    addFooter();
    
    if(!pageID) {
        navToPage("home");
    } else if (pageID == "profile") {
        getSingleUser();
        navToPage("profile");
    } else if (pageID == "request") {
        if (loggedIn == true) {
            navToPage("request");
        } else {
            navToPage("login");
        }
    } else if (pageID == "vote") {
        if (loggedIn == true) {
            navToPage("vote");
        } else {
            navToPage("login");
        }
    } else {
        navToPage(pageID);
    }
}

function navToPage(pageName) {
    $.get(`pages/${pageName}/${pageName}.html`, function(data) {
        $("#app").html(data);
        if(loggedIn) {
            //style changes between versions
            $(".navlogin").css("display", "none");
            $(".navsignout").css("display", "block");
        } else {
            $(".navlogin").css("display", "block");
            $(".navsignout").css("display", "none");
        }
        
        //load content here
        addNav();
        addFooter();

        animateOrder();
        loadCart();
        loadVotes();
    });
}

///////////Page Navigation Code End!


///////////Firebase Login Code Start!

function login() {
    signInAnonymously(auth).then(() => {
        console.log("signed in anon");
        loggedIn = false;
    }).catch((error) => {
        console.log(error);
    });
}

async function loginfire() {
    let password = $("#l_password").val();
    let email = $("#l_email").val();

    signInWithEmailAndPassword(auth, email, password)
    .then((userCredential) => {
        // Signed in 
        const user = userCredential.user;
        console.log("signed in");
    })
    .catch((error) => {
        const errorCode = error.code;
        const errorMessage = error.message;
    });

    $("#l_password").empty();
    $("#l_email").empty();
    
    const query = await getDocs(collection(db, "users"));
    query.forEach((doc) => {
        if (doc.data().email == email) {
            currentEditUser = doc.id;   
        }
    });
    console.log("current User: ", currentEditUser);

    //Lastly
    loggedIn = true;
    navToPage("home");
}

function logout() {
    signOut(auth).then(() => {
    console.log("signed out !!");
    loggedIn = false;
    }).catch((error) => {
        console.log(error);
    });
    login(); //automatically sign in anon

    navToPage("home");
}


function addUserToDB() { //adds new user to storage db AND firebase users list
    let fn = document.getElementById("fName").value;
    let ln = document.getElementById("lName").value;
    let em = document.getElementById("email").value;
    let pw = document.getElementById("pw").value;

    let person = {
        firstName: fn, 
        lastName: ln,
        email: em,
        password: pw
    }

    createUserWithEmailAndPassword(auth, em, pw)
    .then((userCredential) => {
        // Signed in 
        const user = userCredential.user;
        console.log(user);
        // ...
    })
    .catch((error) => {
        const errorCode = error.code;
        const errorMessage = error.message;
        // ..
    });

    addData(person, "users");

    console.log("add User", fn, ln);
}

async function addData(data, jsonFile) {
    try {
        const docRef = await addDoc(collection(db, jsonFile), data);

        if (jsonFile = "users") {
            currentEditUser = docRef.id;
        }
        console.log("Doc id: ", docRef.id);
    } catch (e) {
        console.log("error: ", e);
    }
}

///////////Firebase Login Code End!


///////////Firebase Profile Code Start!

async function deleteUser() {
    await deleteDoc(doc(db, "users", currentEditUser));
    logout();
}

async function updateUser() {
    const userRef = doc(db, "users", currentEditUser);
    let fn = document.getElementById("userFN").value;
    let ln = document.getElementById("userLN").value;
    let em = document.getElementById("userEM").value;
    let card = document.getElementById("userCard").value;
    let exp = document.getElementById("userExp").value;
    let cvv = document.getElementById("userCVV").value;
    await updateDoc(userRef, {
        firstName: fn,
        lastName: ln,
        email: em,
        cardNumber: card,
        expDate: exp,
        CVV: cvv
    });

    getUser();
}


async function getUser() {
    const docRef = doc(db, "users", currentEditUser);
    const docSnap = await getDoc(docRef);

    if(docSnap.exists()) {
        console.log("doc", docSnap);

        let user = docSnap.data();
        
        $("#userData").empty();
        $("#userData").append(`

        <div class="userinfo">
            <input type="text" id="userFN" value="${user.firstName}" disabled />  
            
            <input type="text" id="userLN" value="${user.lastName}" disabled />  
            
            <input type="text" id="userEM" value="${user.email}" disabled />    
        </div>
        
        <div class="cardinfo">
            <p>Card Number:</p>
            <input type="text" id="userCard" value="${user.cardNumber}" disabled />    
            
            <p>Expiration Date:</p>
            <input type="text" id="userExp" value="${user.expDate}" disabled />    
            
            <p>CVV:</p>
            <input type="text" id="userCVV" value="${user.CVV}" disabled />
            <br/>
            <br/>
            <button id="edit">Edit</button>
            <button id="save">Save</button>
            <button id="delete">Delete</button>
            
            <p>(Please do not input actual card information...)</p>
            <p>(This is just a project)</p>

            
        </div>
        `);

        addEditSaveListener();
    } else {
        console.log("no document");
    }
}

async function getSingleUser() {
        onSnapshot(doc(db, "users", currentEditUser), (doc) => {
        $("#allData").empty();
        $("#allData").append(`
        <div>
        <p>${doc.data().firstName}</p>
        <p>${doc.data().lastName}</p>
        <p>${doc.data().email}</p>
        <button id="edituser">Edit User</button>
        </div>
        

        `);
        console.log(doc.id + " " + doc.data());
    });

    
}

function addEditSaveListener() {
    $("#edit").on("click", (e) => {
        console.log("edit");
        $("#userData input").prop("disabled", false);
    });
    $("#save").on("click", (e) => {
        console.log("save");
        updateUser();
    });
    $("#delete").on("click", (e) => {
        console.log("delete");
        deleteUser();
    });
}

///////////Firebase Profile Code End!



///////////Navigation Code Start!

function addNav() {
    $("nav").empty();
    $.getJSON("data/nav.json", (data) => {
        $.each(data.Navigation, (index, item) => {
            if (item.loginRequired == true && loggedIn == false) {
                
            } else {
                $("nav").append(`
                <a href="${item.hrefLink}">${item.linkName}</a>        
                `);
            }
        });
        $("nav").append(`
            <button id="logout">Log out</button>
        `);
    }).fail(function(jqxhr, textStatus, error) {
        console.log(jqxhr);
        console.log(textStatus);
        console.log(error);
    });
}

function addFooter() {
    $("footer").empty();
    $.getJSON("data/nav.json", (data) => {
        $.each(data.Navigation, (index, item) => {
            if (item.loginRequired == true && loggedIn == false) {
                
            } else {
                $("footer").append(`
                <a href="${item.hrefLink}">${item.linkName}</a>        
                `);
            }
        });
    }).fail(function(jqxhr, textStatus, error) {
        console.log(jqxhr);
        console.log(textStatus);
        console.log(error);
    });
}

///////////////Navigation Code End!


////////////////Order Code Start!

function animateOrder() {
    $(".currentOrder").empty();
    $(".currentOrder").append(`
        <h3>${currentOrder.flavor}</h3>
    `);

    $("#dynamicImage").empty();
    $("#dynamicImage").append(`
        <div class="i_bowl"></div>
    `);

    if (currentOrder.flavor == "Vanilla") {
        $("#dynamicImage").append(`
            <div class="f_vanilla"></div>
        `);
    }
    if (currentOrder.flavor == "Chocolate") {
        $("#dynamicImage").append(`
            <div class="f_chocolate"></div>
        `);
    }
    if (currentOrder.flavor == "Strawberry") {
        $("#dynamicImage").append(`
            <div class="f_strawberry"></div>
        `);
    }
    if (currentOrder.flavor == "Mint") {
        $("#dynamicImage").append(`
            <div class="f_mint"></div>
        `);
    }

    if (currentOrder.chips == true) {
        $("#dynamicImage").append(`
            <div class="t_chips" style=\"animation: fadeIn 1s"></div>
        `);
        $(".currentOrder").append(`
            <h4>Chocolate Chips</h4>
        `);
    }
    if (currentOrder.sprinkles == true) {
        $("#dynamicImage").append(`
            <div class="t_sprinkles" style=\"animation: fadeIn 1s"></div>
        `);
        $(".currentOrder").append(`
            <h4>Sprinkles</h4>
        `);
    }
    if (currentOrder.whip == true) {
        $("#dynamicImage").append(`
            <div class="t_whip" style=\"animation: fadeIn 1s"></div>
        `);
        $(".currentOrder").append(`
            <h4>Whipped Cream</h4>
        `);
    }
    if (currentOrder.oreos == true) {
        $("#dynamicImage").append(`
            <div class="t_oreos" style=\"animation: fadeIn 1s"></div>
        `);
        $(".currentOrder").append(`
            <h4>Oreos</h4>
        `);
    }
}

function placeOrder() {
    CART.push(currentOrder); 
    
    currentOrder = {
        flavor: "Vanilla",
        chips: false,
        sprinkles: false,
        whip: false,
        oreos: false
    };
    

    animateOrder();
}

function orderListeners() {
    //order listeners
    $(document).on('click','#f_vanilla', function() {
        currentOrder.flavor = "Vanilla";
        animateOrder();
    });
    $(document).on('click','#f_chocolate', function() {
        currentOrder.flavor = "Chocolate";
        animateOrder();
    });
    $(document).on('click','#f_strawberry', function() {
        currentOrder.flavor = "Strawberry";
        animateOrder();
    });
    $(document).on('click','#f_mint', function() {
        currentOrder.flavor = "Mint";
        animateOrder();
    });
    $(document).on('click','#t_chips', function() {
        if (currentOrder.chips == false) {
            currentOrder.chips = true;
        } else {
            currentOrder.chips = false;
        }
        animateOrder();
    });
    $(document).on('click','#t_sprinkles', function() {
        if (currentOrder.sprinkles == false) {
            currentOrder.sprinkles = true;
        } else {
            currentOrder.sprinkles = false;
        }
        animateOrder();
    });
    $(document).on('click','#t_whip', function() {
        if (currentOrder.whip == false) {
            currentOrder.whip = true;
        } else {
            currentOrder.whip = false;
        }
        animateOrder();
    });
    $(document).on('click','#t_oreos', function() {
        if (currentOrder.oreos == false) {
            currentOrder.oreos = true;
        } else {
            currentOrder.oreos = false;
        }
        animateOrder();
    });

    $(document).on('click','#placeOrder', function() {
        console.log("orderred");
        placeOrder();
    });
}

function homeOrderListeners() {
    //////////ADD GETJSON TO replace currentOrder with

    $(document).on('click','#v_s', function() {
        currentOrder = 
        {
            flavor: "Vanilla",
            chips: false,
            sprinkles: true,
            whip: false,
            oreos: false
        };
        navToPage("order");
    });
    $(document).on('click','#m_c', function() {
        currentOrder = 
        {
            flavor: "Mint",
            chips: true,
            sprinkles: false,
            whip: false,
            oreos: false
        };
        navToPage("order");
    });
    $(document).on('click','#s_w', function() {
        currentOrder = 
        {
            flavor: "Strawberry",
            chips: false,
            sprinkles: false,
            whip: true,
            oreos: false
        };
        navToPage("order");
    });
}


//////////////////Order Code End!

//////////////////Cart code Start!

function loadCart() {
    //Cart Item Details
    $("#cartitems").empty();
    let t_list = ``;
    $.each(CART, (index, item) => {
        t_list = ``;
        if (item.chips == true) {
            t_list += `<p>Chocolate Chips</p>`;
        }
        if (item.sprinkles == true) {
            t_list += `<p>Sprinkles</p>`;
        }
        if (item.whip == true) {
            t_list += `<p>Whipped Cream</p>`;
        }
        if (item.oreos == true) {
            t_list += `<p>Oreos</p>`;
        }
        
        $("#cartitems").append(`
            <div class="cartitem">
                <div class="details">
                
                <h2>${item.flavor}</h2>
                ${t_list}
                </div>
                <div>
                    <h3>$4.99</h3>
                    <button id="remove${index}">Remove from Cart</button>
                </div>
                
            </div>
        `);
    });

    //Cart Checkout Details
    let subtotal = 0;
    let total = 0;
    $("#cartcheckout").empty();
    $.each(CART, (index, item) => {
        subtotal += 4.99;
    });
    let tax = subtotal * 0.065;
    total = subtotal + tax;

    subtotal = subtotal.toFixed(2);
    tax = tax.toFixed(2);
    total = total.toFixed(2);

    $("#cartcheckout").append(`
        <h2>Checkout</h2>
        <p>Subtotal: $${subtotal}</p>   
        <p>Tax: $${tax}</p>
        <p>Total: $${total}</p>     

        <input id="cardNum" placeholder="Card Number"/>
        <input id="expDate" placeholder="Expiration Date"/>
        <input id="cvv" placeholder="CVV"/>

        <button id="checkout">Checkout</button>
    `);

    if (loggedIn) {
        $("#cartcheckout").append(`   
        <button id="checkout">Checkout With Card on Profile</button>
    `);
    }
}

function removeCart(i) {
    CART.splice(i, 1);
    loadCart();
} 

function checkoutOrder() { //send order to firebase
    if (CART != []) {
        addData({CART}, "cart");
        CART = [];
        $("#cartitems").empty();
        $("#cartitems").append(`
            <h2>Order Sent to Firebase</h2>
        `);
    } else {
        $("#cartitems").empty();
        $("#cartitems").append(`
            <h2>No Items in Cart</h2>
        `);
    }
}

function cartListeners() {
    for (let i = 0; i < 33; i++) {
        $(document).on('click',`#remove${i}`, function() {
            console.log(i);
            removeCart(i);
        });
    }

    $(document).on('click','#checkout', function() {
        checkoutOrder();
        $("#cardNum").val("");
        $("#expDate").val("");
        $("#cvv").val("");
    });
}

//////////////////Cart code End!


/////////////////Request and Vote code Start!

function sendRequest() {
    let request = $("#requestText").val();
    console.log(request);
    $("#requestText").empty();
    $("#requestCheck").empty();
    $("#requestCheck").append(`
        <p>Request Sent!</p>`
    );

    addData({requestName: request, numVotes: 0}, "requests");
}

async function loadVotes() {
    const query = await getDocs(collection(db, "requests"));
    $("#vote_list").empty();
    query.forEach((doc) => {
        
        $("#vote_list").append(`
            <div class="vote_item">
                <h2>${doc.data().requestName}</h2>
                <button id="vote">Vote for this!</button>
            </div>
        `);
        
    });
}

function voteListeners() {
    $(document).on('click',`#vote`, function() {
        console.log("vote submitted");
        $("#votecheck").empty();
        $("#votecheck").append(`
            <br/>
            <h2>Vote Submitted</h2>
        `);
    });
}

/////////////////Request and Vote code Start!

function BtnListeners() {
    //sign in and out listeners
    $(document).on('click','#login', function() {
        login();
    });
    $(document).on('click','#logout', function() {
        logout();
    });
    $(document).on('click','#loginfire', function() {
        loginfire();
    });
    $(document).on('click','#addUser', function() {
        addUserToDB();
    });
    $(document).on('click','#edituser', function() {
        getUser(currentEditUser); 
    });
    $(document).on('click','#sendRequestBtn', function() {
        sendRequest();
    });
    
    homeOrderListeners();
    orderListeners();
    cartListeners();
    voteListeners()
}

function initListeners() {
    $(window).on("hashchange", route);
    route();

    BtnListeners();
    
}

$(document).ready(function() {
    initListeners();
    login(); //on start sign in anon

    $.ajaxSetup({
        async: false
    });
});