const { get } = require("http");
const persistence = require("./persistence");
const crypto = require("crypto");
const nodemailer = require('nodemailer')


// SESSION DATA
function computeHash(password){
    return persistence.computeHash(password)
}
async function getUser(uid) {
  return await persistence.getUser(uid);
}
async function getPost(){
  return await persistence.getPost()
}
async function addPost(data){
  return await persistence.addPost(data)
}
async function startSession(data) {
  const sessionKey = crypto.randomUUID();   // Generate a random UUID 
  const created = new Date();   // Get the current date and time
  const expiry = new Date(created.getTime() + 1000 * 60 * 30);  // expiry is 30 minutes
  let sessionData = {
    data: data,
    sessionKey: sessionKey,
    expiry: expiry,
  };
  await persistence.startSession(sessionData)
  return sessionData;
}

async function getSession(key) {
  return await persistence.getSession(key);
}

async function updateSession(key, data) {
  return await persistence.updateSession(key, data);
}

async function terminateSession(key) {
  if (!key) {
    return;
  }
  await persistence.deleteSession(key);
}

//USER
async function registerUser(user) {
  return await persistence.registerUser(user);
}
async function updateUser(username,date){
  return await persistence.updateUser(username,date)
}

async function checkLogin(username, password) {
  let details = await persistence.getUser(username)
  let hashPass =  await persistence.computeHash(password)
  if (!details){
      return undefined
  }
  if (details.username == username && details.password == hashPass) {
      return true
  }
  return undefined
}


async function validateSession(key) {
  if (!key) {
    return;
  }
  return await persistence.validateSession(key);
}
async function getLocations(){
  return await persistence.getLocations()
}


async function checkFeed(locations,stations){
  let location = await persistence.getOneLocation(locations)
  if (!location ||!location.station){
    return undefined
  }
  for (let i of location.station){
    if(i == stations){
      return stations
    }
  }
  return undefined
}

async function addIssue(data){
  return persistence.addIssue(data)

}
async function recordDetails(data){
  return persistence.recordDetails(data)
}

async function getAllLocations(){
  let result = await persistence.getLocations()
  let count = 0
  for (i of result){
    count = count+1
  }
  return count
}
async function getAllStations(){
  let result = await persistence.getLocations()
  let count = 0
  for (i of result){
    for(j in i.station){
      count=count+1
    }
  }
  return count
}

async function getLatestDataByStation() {
  let data = await persistence.readSiteDetails()
  console.log(data)
  const latestData = {};

  data.forEach(entry => {
    const key = entry.locations + '|' + entry.stations;
    if (!latestData[key] || entry.uploadDate > latestData[key].uploadDate) {
      latestData[key] = entry;
    }
  });
  return Object.values(latestData);
}

async function readReports(){
  return await persistence.readReports()
}

//RESET PASSWORD
async function findEmail(email){
  return await persistence.findEmail(email)
}
async function updatepassword(username,password){
  return await persistence.updatepassword(username,password)
}



module.exports = {
    
    computeHash,
    getSession,updateSession,terminateSession,validateSession,startSession,

    getUser,registerUser,getLocations,checkLogin,

    addPost,getPost,
    checkFeed,
    addIssue,recordDetails,updateUser,

    findEmail,updatepassword,

    getAllLocations,
    getAllStations,
    getLatestDataByStation,
    readReports,

    

}