const business = require("./business.js");
const express = require("express");
const prompt = require('prompt-sync')()
const app = express();
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({ extended: false }));
app.use("/static",express.static(__dirname+"/static"));



const crypto = require("crypto");

const handlebars = require("express-handlebars");
app.set("views", __dirname + "/templates");
app.set("view engine", "handlebars");
app.engine("handlebars", handlebars.engine());

const cookieParser = require("cookie-parser");
const { computeHash } = require("./persistence.js");
app.use(cookieParser());

const fileUpload = require("express-fileupload");
app.use(fileUpload());


app.get("/",async(req,res)=>{
  let data = await business.getLocations()
  let reviews = await business.getPost();
  res.render('public',{layout:"publiclayout",locations:data,reviews:reviews})
})

// login
app.get("/login",async(req,res)=>{
    let key = req.cookies.session

    res.render('login',{layout:undefined,message:req.query.message})
   
})
count = 0
app.post("/login",async(req,res)=>{
  let username = req.body.username
  let password = req.body.password

  let login = await business.checkLogin(username, password)
  
  if (!login){
      res.redirect("/login?message=Invalid Email/Password")
      return
  } 

  if (login){
      count = count+1
      
      let date = new Date()
      await business.updateUser(username,date)
      user_data = await business.getUser(username)
      let key = await business.startSession({ username: username ,accType:user_data.accType})
      res.cookie('session', key.sessionKey,{expires:key.expiry})
      
      if(user_data.accType ==='admin'){
        res.redirect(`/admin/${username}`)
      }else if(user_data.accType ==='member'){

        res.redirect(`/member/${username}`)
      }
      
      return
  }
  res.redirect('/login?message=Invalid Credentials')
})
app.get("/register",async(req,res)=>{
  res.render('register',{layout:undefined , message:req.query.message})
})

app.post('/register', async (req, res) =>{
  let userName = req.body.username
  let userEMAIL = req.body.email
  let userPassword = req.body.password
  let userConfirm = req.body.confirm

  let emailRegex = /\S+@\S+(\.\S+)+/;

  if (userName == "" || userEMAIL == "" || userPassword == "" || userConfirm == ""){
      res.redirect("/register?message=Missing Information")
      return
  }
  if (!emailRegex.test(userEMAIL)) {
    res.redirect("/register?message=Please enter a valid email address");
    return;
  }

  if (userPassword == userConfirm){
      let hashPass = await business.computeHash(userPassword)
      userName = userName.toLowerCase()
      userEMAIL = userEMAIL.toLowerCase()
      console.log(userName,userEMAIL)
      let newUser = {username: userName, email: userEMAIL, password: hashPass, accType: "member"}
      let register = await business.registerUser(newUser)
      console.log(register)
      if (!register){
          res.redirect("/register?message=This user/email is already registered!")
          return
      }
      else{
        res.redirect("/login?message=Thank you for registering with us!")
      }
  }
  else{
      res.redirect("/register?message=Please ensure that the passwords match")
  }
})
async function isAuthenticated(session) {
 
  if (!session) {
       return false
  }
  let sd = await business.getSession(session)

  if (!sd) {
      return false
  }
  
  return true
}
//admin page
app.get("/admin/:username",async(req,res)=>{
  let key = req.cookies.session

  if (await isAuthenticated(key)==false){
    res.redirect('/login?message=User not logged in')
    return
  }
  let user = req.params.username
  let sess = await business.getSession(key)
  let username  = sess.data.username
  let accType = sess.data.accType
  if(sess.data.accType == "member"){
    res.redirect(`/member/${sess.data.username}`)
    return
  }
  if(username!=user){
    res.redirect(`/admin/${username}`)
  }
  let allLocations = await business.getAllLocations()
  let allStations = await business.getAllStations()
  let getLocations = await business.getLocations()
  let siteDetails = await business.getLatestDataByStation()
  console.log(siteDetails)

  res.render("admin",{layout:"adminlayout",user:username,accType:accType, location:allLocations, station:allStations,site:getLocations,siteDetails:siteDetails})
})

app.get("/admin/:username/member_reports",async(req,res)=>{
  let key = req.cookies.session

  if( await isAuthenticated(key)==false){
    res.redirect("/login?message=User not logged in")
    return
  }

  let user=req.params.username
  let sess = await business.getSession(key)
  let username = sess.data.username
  let accType = sess.data.accType
  if(sess.data.accType == "member"){
    res.redirect(`/member/${sess.data.username}`)
    return
  }
  if(username!=user){
    res.redirect(`/admin/${username}/member_reports`)
  }

  let items = await business.readReports()
  res.render("member_reports",{layout:"adminlayout",user:username,items:items,accType:accType})
})


//member 
app.get("/member/:username",async(req,res)=>{
  let key = req.cookies.session
  let user = req.params.username
  if (await isAuthenticated(key)==false){
    res.redirect('/login?message=User not logged in')
    return
  }
  let sess = await business.getSession(key)
  let username  = sess.data.username
  let accType = sess.data.accType
  if(sess.data.accType == "admin"){
    res.redirect(`/admin/${sess.data.username}`)
    return
  }
  if(username!=user){
    res.redirect(`/member/${username}`)
  }
  res.render("member",{layout:"memberlayout",user:username,accType:accType})

})

app.get("/member/:username/review_post",async(req,res)=>{
  let key = req.cookies.session
  let user = req.params.username
  let getLocations = await business.getLocations()
  if (await isAuthenticated(key)==false){
    res.redirect('/login?message=User not logged in')
    return
  }
  let sess = await business.getSession(key)
  let username  = sess.data.username
  let accType = sess.data.accType
  if(sess.data.accType == "admin"){
    res.redirect(`/admin/${sess.data.username}`)
    return
  }
  if(username!=user){
    res.redirect(`/member/${username}/review_post`)
    return
  }
  res.render("review_post",{layout:"memberlayout",user:username,accType:accType,message:req.query.message,site:getLocations})
})
app.post("/member/:username/review_post", async(req, res) => {
  let key = req.cookies.session
  let name = await business.getSession(key)
  let user = name.data.username
  let location = req.body.location
  let station = req.body.station
  let content = req.body.content
  
  if (location == "" || station == "" || content == "") {
    res.redirect(`/member/${user}/review_post?message=Please ensure all fields are filled.`)
    return
  }
  let validate = await business.checkFeed(location, station)
  if (!validate) {
    res.redirect(`/member/${user}/review_post?message=Invalid Location/Station`)
    return
  }

  let fileName;
 
  if (req.files != null && req.files.submission != null) {
    let theFile = req.files.submission;
    fileName = theFile.name;

    
    const ext = ['.jpg', '.jpeg', '.png'];
    const fExt = fileName.substring(fileName.lastIndexOf('.')).toLowerCase();
    if (!ext.includes(fExt)) {
        res.redirect(`/member/${user}/review_post?message=This image type is not supported.`)
        return;
    }
    fileName = `${Date.now()}_${fileName}`

    const filePath = `${__dirname}/static/uploads/${fileName}`
    
    await theFile.mv(filePath);

    let date = new Date()
    
    let data = {member: user, location: location, station: station, content: content, uploadDate: date, file: fileName}
    await business.addPost(data);
    res.redirect(`/member/${user}/review_post?message=Review Uploaded!`)
    return
  }
 
  let date = new Date()
  let data = {member: user, location: location, station: station, content: content, uploadDate: date}
  await business.addPost(data)
  res.redirect(`/member/${user}/review_post?message=Review Uploaded!`)
});


app.get("/member/:username/report_issue",async(req,res)=>{
  let key = req.cookies.session
  let user = req.params.username
  let getLocations = await business.getLocations()
  if (await isAuthenticated(key)==false){
    res.redirect('/login?message=User not logged in')
    return
  }
  let sess = await business.getSession(key)
  let username  = sess.data.username
  let accType = sess.data.accType
  if(sess.data.accType == "admin"){
    res.redirect(`/admin/${sess.data.username}`)
    return
  }
  if(username!=user){
    res.redirect(`/member/${username}/report_issue`)
    return
  }
  res.render("report_issue",{layout:"memberlayout",user:username,accType:accType,message:req.query.message,site:getLocations})
})
app.post("/member/:username/report_issue",async(req,res)=>{
  let key = req.cookies.session
  let name = await business.getSession(key)
  let user  = name.data.username
  let location = req.body.location
  let station = req.body.station
  let type = req.body.type
  let description= req.body.description
  if (location =="" ||type==""|| station =="" || description ==""){
    res.redirect(`/member/${user}/report_issue?message=Please ensure all fields are filled.`)
    return
  }
  let validate = await business.checkFeed(location,station)
  if(!validate){
    res.redirect(`/member/${user}/report_issue?message=Invalid Location/Station`)
    return
  }
  console.log(type)
 

  let date = new Date()
  
  let data = {member:user,location:location,station:station,type:type,description:description,uploadDate:date}
  await business.addIssue(data)
  res.redirect(`/member/${user}/report_issue?message=Upload Successful!`)
})

app.get("/member/:username/record_details",async(req,res)=>{
  let key = req.cookies.session
  
  if (await isAuthenticated(key)==false){
    res.redirect('/login?message=User not logged in')
    return
  }
  let user = req.params.username
  let getLocations = await business.getLocations()
  let sess = await business.getSession(key)
  let username  = sess.data.username
  let accType = sess.data.accType
  if(sess.data.accType == "admin"){
    res.redirect(`/admin/${sess.data.username}`)
    return
  }
  if(username!=user){
    res.redirect(`/member/${username}/record_details`)
    return
  }
  res.render("record_details",{layout:"memberlayout",user:username,accType:accType,message:req.query.message,site:getLocations})
})
app.post("/member/:username/record_details",async(req,res)=>{
  let key = req.cookies.session
  let name = await business.getSession(key)
  let user  = name.data.username
  let location = req.body.location
  let station = req.body.station
  let water = req.body.water
  let food= req.body.food
  let cats = req.body.cats
  let date = new Date()
  if (location =="" || station =="" ||water ==""|| food==""||cats==""){
    res.redirect(`/member/${user}/record_details?message=Please ensure all fields are filled.`)
    return
  }
  let validate = await business.checkFeed(location,station)
  if(!validate){
    res.redirect(`/member/${user}/record_details?message=Invalid Location/Station`)
    return
  }
  let data = {member:user,locations:location,stations:station,water:water,food:food,cats:cats,uploadDate:date}
  await business.recordDetails(data)
  res.redirect(`/member/${user}/record_details?message=Upload Successful!`)
})






app.get('/logout', async (req, res) => {
  let key = req.cookies.session
  await business.terminateSession(key)
  res.cookie('session', '', { expiry: 0 })
  res.redirect('/?message=Logged out')
})

app.get('/:accType/:username/changePass',async(req,res)=>{
  let key = req.cookies.session
  if (await isAuthenticated(key)==false){
    res.redirect('/login?message=User not logged in')
    return
  }
  let user = req.params.username
  let accType = req.params.accType
  let sess = await business.getSession(key)

  if (sess.data.accType!=accType || sess.data.username!=user){
    res.redirect(`/${sess.data.accType}/${sess.data.username}/changePass`)
    return
  }
  res.render("changePass",{layout:undefined,message:req.query.message,user:user,accType:accType})

})
app.post('/:accType/:username/changePass',async(req,res)=>{
  let user = req.params.username
  let accType = req.params.accType
  let oldpass = req.body.oldpass
  let newpass = req.body.newpass
  let checkpass = req.body.checkpass
  let check = await business.getUser(user)
  oldpass = await computeHash(oldpass)
  if(check.password === oldpass){
    if (newpass === checkpass){
        newpass = await computeHash(newpass)
        await business.updatepassword(user,newpass)
        res.redirect(`/${accType}/${user}/changePass?message=Password Reset successfully`)    
      }else{
          res.redirect(`/${accType}/${user}/changePass?message=Please ensure that the passwords match`)
      }
  }else{
    res.redirect(`/${accType}/${user}/changePass?message=Invalid old password!`)
  }
})

app.post('/uploadfile', async (req, res) => {
  console.log(req.files)
  let theFile=req.files.submission
  let fileName=theFile.name
  
  await theFile.mv(`${__dirname}${Date.now()}_${fileName}`)
  res.send('ok')
})
app.get('/forgot_password',(req,res)=>{
  res.render('forgot_password',{layout:undefined, message:req.query.message})
})

app.post("/forgot_password", async (req,res)=> {
  let email = req.body.email
  let newpass = req.body.newpass
  let checkpass = req.body.checkpass
  let check  = await business.findEmail(email)
  if (check){
    if (newpass === checkpass){
      let perm = prompt("Would you like to change your password?(yes):")
      if(perm=="yes"){
        newpass = await business.computeHash(newpass)
        await business.updatepassword(check.username,newpass)
        res.redirect("/login?message=Password Reset Successfully!")    
      }else{
        res.redirect("/forgot_password?message=Email not found!")
      } 
    }else{
        res.redirect("/forgot_password?message=Please ensure that the passwords match")
    }
    return
    
  }
  res.redirect("/forgot_password?message=Email not found!")
})

app.get('/search', (req, res) => {
  const query = req.query.query.toLowerCase();
  

  const routeMappings = {
      'home': '/',
      'login': '/login',
      'admin': '/login',
      'member':'/login'
  };

  if (query in routeMappings) {
      res.redirect(routeMappings[query]);
  } else {
      console.log('Route not found, redirecting to home page');
      res.redirect('/');
  }
});

//Error page
app.get('*', (req, res) => {
  res.status(404).render('error',{layout:undefined,message:req.query.message});
});

app.listen(8000, () => {
    console.log("Server running on port 8000");
  });