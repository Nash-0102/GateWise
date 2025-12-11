const express = require("express");
const app = express();
const mongoose = require("mongoose");
const complaint = require("./models/Complaint");
const path = require("path");
const methodOverride = require("method-override");
const MONGO_URL = "mongodb://127.0.0.1:27017/SocietyTest";
const ejsMate = require("ejs-mate");//use for boilerPLate
const Notice = require("./models/Notice");
const alert = require("./models/Alert.js");
const Maintainance = require("./models/Maintainance.js");
const wrapAsync = require("./utils/wrapAsync.js");
const ExpressErrors = require("./utils/ExpressErrors.js");
// const {AlertSchema} = require("/Schema.js");
const session = require("express-session");
const flash = require("connect-flash");
//login (authentication)
const passport = require("passport");
const localStrategy = require("passport-local");
const User = require("./models/user.js");
const { isLoggedIn } = require("./middleware.js");
const Event = require("./models/Event.js");
const {isSecretary} = require("./middleware.js");
const MainSetting = require("./models/MainSetting.js");




app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
app.engine("ejs", ejsMate)



const sessionOption = {
    secret: "Mycode",
    resave: false,
    saveUninitialized: true,
    cookie: {
        expires: Date.now() + 7 * 24 * 60 * 60 * 1000,
        maxAge: 7 * 24 * 60 * 60 * 1000,
        httpOnly: true,
    }
};

app.use(session(sessionOption));
app.use(flash());

main().then(() => {
    console.log("conncted to db");
}).catch((err) => {
    console.log(err);
});


app.use(passport.initialize());
app.use(passport.session());
passport.use(new localStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req, res, next) => {
    res.locals.success = req.flash('success');
    res.locals.error = req.flash('error');
    res.locals.currUser = req.user; 
    next();
});
//Checking For db connection    


// app.get("/test" ,async(req , res)=>{
//     let sampletest = new complaint({
//         title : "test Compalint",
//         description:"to late water supply",
//         status:"Pending",

//     });
//     await sampletest.save();
//     console.log(sampletest);
//     res.send("Complaint Registered");
// })



async function main() {
    await mongoose.connect(MONGO_URL);
}


// Dashboard Route
app.get('/', async (req, res) => {
    
    // 1. Auth Check
    if (!req.isAuthenticated()) {
        return res.redirect("/landing");
    }

    try {
        // --- DEBUGGING START ---
        // Aaj ki start aur end date banate hain
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        const todayEnd = new Date();
        todayEnd.setHours(23, 59, 59, 999);

        console.log("Searching Events between:");
        console.log("Start:", todayStart);
        console.log("End:", todayEnd);

        // Database query
        // NOTE: Agar aapke Event model mein field ka naam 'start' hai toh 'date' ki jagah 'start' likhein.
        // Filhal error ke hisaab se aapka field 'date' lag raha hai.
        const todaysEvents = await Event.find({
            date: { 
                $gte: todayStart, 
                $lte: todayEnd 
            }
        });

        console.log("Events Found:", todaysEvents); 
        // --- DEBUGGING END ---

        // Fetch other data
        const recentAlerts = await alert.find({}).sort({_id: -1}).limit(3);
        const recentNotices = await Notice.find({}).sort({_id: -1}).limit(3);
        const recentComplaints = await complaint.find({}).sort({_id: -1}).limit(3);
        
        let recentMaintenance = [];
        try { recentMaintenance = await Maintainance.find({}).sort({_id: -1}).limit(3); } catch(e) {}

        // Render Page
        res.render('dashboard', { 
            recentAlerts, 
            recentNotices, 
            recentComplaints, 
            recentMaintenance,
            todaysEvents // <--- Yeh pass karna zaroori hai
        });

    } catch (err) {
        console.log("Error:", err);
        res.render('dashboard', { 
            recentAlerts: [], recentNotices: [], recentComplaints: [], recentMaintenance: [], 
            todaysEvents: [] 
        });
    }
});


app.get("/landing", (req, res) => {
    res.render("./Landing/landing.ejs");  // or "landing"
});


// app.get("/" , (req , res)=>{
//     res.send("Root Connected");
// })




//demo signup

// app.get("/demouser" , async(req , res)=>{
//     let fakeUser = new user({
//         email:"Nashit@gmail.com" ,
//         username:"Nashit" ,

//     });

//     let registeredUSer = await user.register(fakeUser , "Helloworld");
//     res.send(registeredUSer);
// });


//Signup section:
app.get("/signup" , (req , res)=>{
    res.render("./User/signup.ejs");
})

app.post("/signup", wrapAsync(async (req, res) => {
  try {
    const { username, email, password ,role, profile } = req.body;
    const NewUser = new User({ email, username , role, profile });
    const RegisteredUser = await User.register(NewUser, password);
    // Log the user in immediately after successful registration
    req.login(RegisteredUser, function(err) {
      if (err) {
        req.flash("error", "Login after signup failed. Please login manually.");
        return res.redirect("/login");
      }
      req.flash("success", "Welcome to Society");
      return res.redirect("/"); // now req.isAuthenticated() will be true
    });
  } catch (e) {
    req.flash("error", e.message);
    return res.redirect("/signup");
  }
}));



//Login section:
app.get("/login" ,(req , res)=>{
    res.render("./User/login.ejs");
});

app.post("/login" , passport.authenticate("local" , {failureRedirect:"/login" ,failureFlash:true,}), async(req ,res)=>{
    req.flash("success" , "Welcome to society");
    res.redirect("/");
})


//Logout section:
app.get("/logout" , (req , res  , next )=>{
    req.logout((err)=>{
        if(err){
            return next(err);
        }
        req.flash("success" , "Successfully Logout");
        res.redirect("/landing");
    })
})

app.get("/About", (req, res) => {
    res.render('./partials/About');
});

app.get("/Contact", (req, res) => {
    res.render('./partials/Contact');
});
//index route 
app.get("/complaints", async (req, res) => {
    const allComplaints = await complaint.find({});
    res.render("./complaintPage.ejs", { allComplaints });
});

//New Route
app.get("/complaints/new", isLoggedIn ,(req, res) => {
    res.render("NewComplaint.ejs");
});

app.post("/complaints", wrapAsync(async (req, res) => {
    if (!req.body.complaints) {
        throw new ExpressErrors(404, "send Valid data");
    }
    let newComp = new complaint(req.body.complaints);
    if (!newComp.title) {
        throw new ExpressErrors(4004, "Title is missing");
    };
    if (!newComp.description) {
        throw new ExpressErrors(4004, "Description is missing");
    };
    if (!newComp.status) {
        throw new ExpressErrors(4004, "status is missing");
    };

    await newComp.save();
    res.redirect("/complaints")
}));

//show route
app.get("/complaints/:id", async (req, res) => {
    let { id } = req.params;
    const comp = await complaint.findById(id)
    res.render("ShowComplaint", { comp });
})



//Edit Route
app.get("/complaints/:id/edit", async (req, res) => {
    let { id } = req.params;
    const comp = await complaint.findById(id);
    res.render("EditComplaint.ejs", { comp });

});
//update route
app.put("/complaints/:id", async (req, res) => {
    let { id } = req.params;
    await complaint.findByIdAndUpdate(id, req.body.complaints);
    console.log(req.body);
    res.redirect("/complaints");
})



//Delete Route
app.delete("/complaints/:id", async (req, res) => {
    let { id } = req.params;
    await complaint.findByIdAndDelete(id);
    res.redirect("/complaints");
});








//Notice Section:
app.get("/notices",isLoggedIn, async (req, res) => {
    const allNotices = await Notice.find({});
    res.render("./Notice/NoticePage.ejs", { allNotices })
});

//new route 
app.get("/notice/new",isLoggedIn,isSecretary, (req, res) => {
    res.render("./Notice/newNotice.ejs");
});
//create 
app.post("/notice", async (req, res) => {
    let newNotice = new Notice(req.body.notice);
    await newNotice.save();
    req.flash("success", "New Notice Created!");
    res.redirect("/notices");
});


//show route
app.get("/notice/:id", async (req, res) => {
    try {
        let { id } = req.params;
        const notice = await Notice.findById(id)
        res.render("./Notice/showNotice.ejs", { notice });
    } catch (e) {
        // Error message set karo
        req.flash('error', 'Something went wrong, please try again.');
        res.redirect('/notices');
    }

});



//Edit Route
app.get("/notice/:id/edit", async (req, res) => {
    let { id } = req.params;
    const notice = await Notice.findById(id);
    res.render("./Notice/EditNotice.ejs", { notice });

});
//Update Route
app.put("/notice/:id", async (req, res) => {
    let { id } = req.params;
    await Notice.findByIdAndUpdate(id, { ...req.body.notice });
    res.redirect("/notices")
});


//Delete Route
app.delete("/notice/:id", async (req, res) => {
    let { id } = req.params;
    await Notice.findByIdAndDelete(id);
    res.redirect("/notices");
});





//Alert Section:

app.get("/alerts", async (req, res) => {
    const allalerts = await alert.find({});
    res.render("./Alert/AlertPage.ejs", { allalerts });
})

//New Route
app.get("/alerts/new", (req, res) => {
    res.render("./Alert/NewAlert.ejs")
});

app.post("/alerts", async (req, res) => {
    let NewAlert = new alert(req.body.Alert);
    await NewAlert.save();
    res.redirect("/alerts");
})

//Show Route 
app.get("/alerts/:id", async (req, res) => {
    let { id } = req.params;
    const alertdata = await alert.findById(id);
    res.render("./Alert/ShowAlert.ejs", { alertdata })
})

//Edit Route 
app.get("/alerts/:id/edit", async (req, res) => {
    let { id } = req.params;
    const alertdata = await alert.findById(id);
    res.render("./Alert/EditAlert.ejs", { alertdata });
});

//Update Route 
app.put("/alerts/:id", async (req, res) => {
    let { id } = req.params;
    await alert.findByIdAndUpdate(id, { ...req.body.alertdata });
    res.redirect("/alerts");
});

//Delete Route 
app.delete("/alerts/:id", async (req, res) => {
    let { id } = req.params;
    await alert.findByIdAndDelete(id);
    res.redirect("/alerts");
})






//Maintainance Section:
//Route
app.get('/maintains', isLoggedIn, async (req, res) => {
  try {
    let maintains;
    if (req.user.role === 'Secretary') {
      maintains = await Maintainance.find({}).populate('user', 'username profile').sort({ dueDate: 1 });
    } else {
      maintains = await Maintainance.find({ user: req.user._id }).sort({ dueDate: 1 });
    }
    res.render('maintains/index', { maintains, currUser: req.user });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
}); 
//New Route
app.get("/maintains/new",async (req, res) => {
    const users = await User.find({}).select('profile username');
    res.render("./Maintains/New.ejs" , {users , currUser: req.user});
});


app.post('/maintains', isLoggedIn, async (req, res) => {
  try {
    // Allow Secretary to create bills for any user, residents can create for themselves (if desired)
    let payload = req.body.maintainData || req.body; // support either shape
    // If resident creating and user field is absent, set to req.user._id
    if (!req.user) return res.redirect('/login');
    if (req.user.role !== 'Secretary') {
      // force user to be the current user
      payload.user = req.user._id;
      // use user's houseNo if not provided
      payload.houseNo = (req.user.profile && req.user.profile.houseNo) ? req.user.profile.houseNo : payload.houseNo;
      payload.createdBy = req.user._id;
    } else {
      // Secretary creating: ensure payload.user exists and houseNo is correct snapshot
      if (payload.user) {
        const u = await User.findById(payload.user);
        if (u && u.profile && u.profile.houseNo) payload.houseNo = u.profile.houseNo;
      }
      payload.createdBy = req.user._id;
    }

    // Ensure required fields: user, houseNo, amount, dueDate, title
    if (!payload.user || !payload.houseNo || !payload.amount || !payload.dueDate || !payload.title) {
      return res.status(400).send('Missing required fields');
    }

    await Maintainance.create(payload);
    res.redirect('/maintains');
  } catch (err) {
    console.error(err);
    res.status(500).send('Create error');
  }
});


//Show Maintains
app.get('/maintains/:id', isLoggedIn, async (req, res) => {
  try {
    const maintain = await Maintainance.findById(req.params.id).populate('user', 'username profile');
    if (!maintain) return res.status(404).send('Not found');

    // Authorization: resident can see only own records
    if (req.user.role !== 'Secretary' && String(maintain.user?._id) !== String(req.user._id)) {
      return res.status(403).send('Forbidden');
    }

    res.render('maintains/show', { maintain, currUser: req.user });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

//Edit Route 
app.get('/maintains/:id/edit', isLoggedIn, isSecretary, async (req, res) => {
  try {
    const maintain = await Maintainance.findById(req.params.id);
    if (!maintain) return res.redirect('/maintains');
    // load users list for potential reassignment
    const users = await User.find({}).select('profile username');
    res.render('maintains/edit', { maintain, users, currUser: req.user });
  } catch (err) {
    console.error(err);
    res.redirect('/maintains');
  }
});

//Update Route 
app.put('/maintains/:id', isLoggedIn, isSecretary, async (req, res) => {
  try {
    const payload = req.body.maintainData || req.body;
    // If user changed, update houseNo snapshot too
    if (payload.user) {
      const u = await User.findById(payload.user);
      if (u && u.profile && u.profile.houseNo) payload.houseNo = u.profile.houseNo;
    }
    await Maintainance.findByIdAndUpdate(req.params.id, { ...payload }, { runValidators: true });
    res.redirect('/maintains');
  } catch (err) {
    console.error(err);
    res.redirect('/maintains');
  }
});
app.post('/maintains/:id/pay', isLoggedIn, async (req, res) => {
  try {
    const maintain = await Maintainance.findById(req.params.id);
    if (!maintain) return res.redirect('/maintains');
    // allow owner or secretary
    if (req.user.role !== 'Secretary' && String(maintain.user) !== String(req.user._id)) {
      return res.status(403).send('Forbidden');
    }
    maintain.status = 'paid';
    maintain.paidAt = new Date();
    if (req.body.paymentRef) maintain.paymentRef = req.body.paymentRef;
    await maintain.save();
    res.redirect('/maintains/' + req.params.id);
  } catch (err) {
    console.error(err);
    res.redirect('/maintains');
  }
});

//Delete Route 
app.delete("/maintains/:id", async (req, res) => {
    let { id } = req.params;
    await Maintainance.findByIdAndDelete(id);
    res.redirect("/maintains");
})







//Event calendar
//Index Route
app.get("/events" , async(req , res)=>{
    const allEvent  = await Event.find({});
    res.render("./Events/Event.ejs" , {allEvent} );
});

//New Route
app.get("/events/NewEvent" , (req , res)=>{
    res.render("./Events/NewEvent.ejs");
})

app.post("/events" , async(req , res)=>{
    const newData = new Event(req.body.eventData);
    await newData.save();
    res.redirect("/event");
})
//Edit Route 
app.get("/events/:id/edit" , async(req , res)=>{
    let {id} = req.params;
    const eventData = await Event.findById(id);
    res.render("./Events/Edit.ejs" ,{eventData});
});

app.put("/events/:id" , async(req , res)=>{
    let{id} = req.params;
    await Event.findByIdAndUpdate(id , {...req.body.eventData});
    res.redirect("/events")
})


//Show Route 
app.get("/events/:id" , async(req , res)=>{
    let {id } = req.params;
    const eventData  = await Event.findById(id);
    res.render("./Events/ShowEvent.ejs",  {eventData});
});
//Delete Route 
app.delete("/events/:id" , async(req , res)=>{
    let {id}= req.params;
    await Event.findByIdAndDelete(id);
    res.redirect("/event")
});




//Calendar

app.get("/event/data", async (req, res) => {
    try {
        const events = await Event.find({});
        
        const feed = events.map(e => ({
            id: e._id.toString(),
            title: e.title,
            
            // IMPORTANT FIX: FullCalendar needs 'start', not 'date'
            start: e.date, 
            
            allDay: true, // Ensures it shows as a block event, not at 12:00 AM
            
            extendedProps: {
                description: e.description,
                category: e.category,
            },
            
            // UI Polish: Different colors for different categories
            backgroundColor: e.category === 'Maintenance' ? '#ef4444' : '#3b82f6',
            borderColor: e.category === 'Maintenance' ? '#ef4444' : '#3b82f6'
        }));

        res.json(feed);
    } catch(err) {
        console.log(err);
        res.status(500).json([]);
    }
});

app.get("/event",  (req, res) => {
    res.render("./Calendar/calendar.ejs"); 
});




//Profile System:
app.get("/profile", isLoggedIn, async (req, res) => {
    const info = await User.findById(req.user._id);
    res.render("./Profile/profile.ejs", { info });
});


app.get("/profile/:id/edit" , async(req , res)=>{
    const info = await User.findById(req.user._id);
    res.render("./Profile/Edit.ejs" , {info});
    
})
app.put("/profile/:id" , async(req , res)=>{
    const{fullName , phone , houseNo} = req.body;
    await User.findByIdAndUpdate(req.user._id , {profile:{fullName , houseNo , phone}});
    res.redirect("/profile");
});



//Management System:
app.get("/manage" ,isLoggedIn, async(req , res)=>{
    if (req.user.role !=="Secretary"){
        res.send("error" , "Access Denied");
    }
    const ManageData = await User.find({}).sort({ "profile.houseNo": 1 }); ;
    res.render("./Management/Show.ejs" , {ManageData});
});


app.get("/manage/:id", async (req, res) => {
    const { id } = req.params;
    const member = await User.findById(id);

    if (!member) {
        return res.status(404).send("Member not found");
    }

    res.render("./Management/ShowOne.ejs", { member });
});


// SHOW EDIT FORM
app.get("/manage/:id/edit", async (req, res) => {
    const member = await User.findById(req.params.id);
    res.render("./Management/Edit.ejs", { member });
});

// UPDATE MEMBER
app.put("/manage/:id", async (req, res) => {
    const { fullName, phone, houseNo } = req.body;

    await User.findByIdAndUpdate(req.params.id, {
        $set: {
            "profile.fullName": fullName,
            "profile.phone": phone,
            "profile.houseNo": houseNo
        }
    });

    res.redirect("/manage");
});


app.delete("/manage/:id" , async(req , res)=>{
    let {id}= req.params;
    await User.findByIdAndDelete(id);
    res.redirect("/manage")
});








//Setting system:
app.get("/setting" , isLoggedIn , isSecretary , async(req , res)=>{
    // use a name that won't conflict with Express render options
    const settingList = await MainSetting.find({}).sort({houseNo: 1});
    res.render("Setting/index.ejs" ,{ settingList, currUser:req.user });
});
// NEW form
app.get('/setting/new', isLoggedIn, isSecretary, (req, res) => {
  res.render('Setting/new', { currUser: req.user });
});
// CREATE
app.post('/setting', isLoggedIn, isSecretary, async (req, res) => {
  try {
    // normalize houseNo
    const houseNo = (req.body.houseNo || '').trim().toUpperCase();
    const { title, description, amount, frequency } = req.body;
    await MainSetting.create({
      houseNo,
      title,
      description,
      amount: Number(amount),
      frequency,
      createdBy: req.user._id
    });
    res.redirect('/setting');
  } catch (err) {
    console.error(err);
    res.render('Setting/new', { errorMessage: 'Create failed', currUser: req.user });
  }
});

// EDIT form
app.get('/setting/:id/edit', isLoggedIn, isSecretary, async (req, res) => {
  const setting = await MainSetting.findById(req.params.id);
  if (!setting) return res.redirect('/setting');
  res.render('Setting/edit.ejs', { setting, currUser: req.user });
});

// UPDATE
app.put('/setting/:id', isLoggedIn, isSecretary, async (req, res) => {
  try {
    const houseNo = (req.body.houseNo || '').trim().toUpperCase();
    const { title, description, amount, frequency, active } = req.body;
    await MainSetting.findByIdAndUpdate(req.params.id, {
      houseNo, title, description, amount: Number(amount), frequency, active: active === 'on'
    }, { runValidators: true });
    res.redirect('/setting');
  } catch (err) {
    console.error(err);
    res.redirect('/setting');
  }
});

// DELETE
app.delete('/setting/:id', isLoggedIn, isSecretary, async (req, res) => {
  await MainSetting.findByIdAndDelete(req.params.id);
  res.redirect('/setting');
});


// POST /settings/:id/preview
app.post('/setting/:id/preview', isLoggedIn, isSecretary, async (req, res) => {
  try {
    const { id } = req.params;
    const { dueDate } = req.body; // expected 'YYYY-MM-DD' from a date input
    if (!dueDate) return res.status(400).json({ error: 'dueDate required' });

    const setting = await MainSetting.findById(id);
    if (!setting) return res.status(404).json({ error: 'Setting not found' });

    // Normalize houseNo
    const houseNo = (setting.houseNo || '').trim().toUpperCase();

    // Find users with this houseNo
    const users = await User.find({ 'profile.houseNo': houseNo }).select('profile username email');

    // Calculate month window
    const due = new Date(dueDate);
    const monthStart = new Date(due.getFullYear(), due.getMonth(), 1);
    const monthEnd = new Date(due.getFullYear(), due.getMonth() + 1, 0, 23, 59, 59, 999);

    // Find existing bills for these users in that month with same title to avoid duplicates
    const userIds = users.map(u => u._id);
    const existing = await Maintainance.find({
      user: { $in: userIds },
      title: setting.title,
      dueDate: { $gte: monthStart, $lte: monthEnd }
    }).select('user');

    const existingUserSet = new Set(existing.map(e => String(e.user)));

    // Prepare preview payload
    const preview = users.map(u => ({
      userId: u._id,
      name: u.profile?.fullName || u.username || u.email || 'Unknown',
      houseNo: houseNo,
      willCreate: !existingUserSet.has(String(u._id)) // true -> a new bill would be created
    }));

    res.json({ countMatched: users.length, preview, existingCount: existing.length });
  } catch (err) {
    console.error('Preview error', err);
    res.status(500).json({ error: 'Server error' });
  }
});


// POST /settings/:id/generate
app.post('/setting/:id/generate', isLoggedIn, isSecretary, async (req, res) => {
  try {
    const { id } = req.params;
    const { dueDate } = req.body;
    if (!dueDate) return res.status(400).send('dueDate required');

    const setting = await MainSetting.findById(id);
    if (!setting) return res.status(404).send('Setting not found');

    const houseNo = (setting.houseNo || '').trim().toUpperCase();

    // Find users for this houseNo
    const users = await User.find({ 'profile.houseNo': houseNo }).select('_id profile');

    if (!users.length) {
      return res.status(200).send('No users matched this setting.');
    }

    const due = new Date(dueDate);
    const monthStart = new Date(due.getFullYear(), due.getMonth(), 1);
    const monthEnd = new Date(due.getFullYear(), due.getMonth() + 1, 0, 23, 59, 59, 999);

    const userIds = users.map(u => u._id);

    // Find existing bills in the same month/title (to skip)
    const existing = await Maintainance.find({
      user: { $in: userIds },
      title: setting.title,
      dueDate: { $gte: monthStart, $lte: monthEnd }
    }).select('user');

    const existingSet = new Set(existing.map(e => String(e.user)));

    // Prepare docs to insert
    const docs = [];
    for (const u of users) {
      if (existingSet.has(String(u._id))) continue; // skip duplicates
      docs.push({
        user: u._id,
        houseNo: (u.profile && u.profile.houseNo) ? u.profile.houseNo.trim().toUpperCase() : houseNo,
        title: setting.title,
        description: setting.description || '',
        amount: setting.amount,
        dueDate: due,
        frequency: setting.frequency || 'Monthly',
        status: 'pending',
        createdBy: req.user._id,
        notes: ''
      });
    }

    if (docs.length > 0) {
      await Maintainance.insertMany(docs);
    }

    res.json({ inserted: docs.length, skipped: users.length - docs.length, totalMatched: users.length });
  } catch (err) {
    console.error('Generate error', err);
    res.status(500).send('Server error generating bills');
  }
});





//Agar koi isse rout ajaye jo exist hi nahi karti to iske liye ye error handler
// 404 HANDLER (Sabhi routes ke baad)
app.use((req, res, next) => {
    next(new ExpressErrors(404, "Page Not Found!"));
});

// ERROR HANDLING MIDDLEWARE (Sabse aakhir mein)
app.use((err, req, res, next) => {
    let { statusCode = 500, message = "Something went wrong!" } = err;
    console.error(err); // Error ko terminal mein dekhne ke liye
    res.status(statusCode).send(message);
});







app.listen(3000, () => {
    console.log("Connected to port 3000!")
})