const { appendFile } = require('fs')
const fs = require('fs/promises')
const prompt = require("prompt-sync")()
const crypto = require('crypto')

const mongodb = require('mongodb')

let client = undefined
let db = undefined
let users = undefined
let session = undefined

async function connectDatabase() {
    if (!client) {
        client = new mongodb.MongoClient('mongodb+srv://60095996:12class34@cluster0.yibkwqb.mongodb.net/')
        await client.connect()
        db = client.db('project')
        users = db.collection('UserAccounts')
        session = db.collection('sessions')
        locations = db.collection('locations')
        reviewPost = db.collection('reviewPost')
        memberReports = db.collection('memberReports')
        siteDetails = db.collection('siteDetails')
    }
}

async function computeHash(password){
    let hash = crypto.createHash('sha512')
    hash.update(password)
    let res = hash.digest('hex')
    return res
}



async function getUser(username) {
    await connectDatabase();
    let result = users.findOne({ username: username });
    return result;
}
async function updateUser(username,date){
    await connectDatabase();
    await users.updateOne({username:username},{$set:{last_login:date}})
}
async function registerUser(user){ 
    await connectDatabase();
    let verifyUsername = await users.findOne({ username: user.username }); 
    let verifyEmail = await users.findOne({ email: user.email }); 

    if (verifyUsername || verifyEmail){
        return undefined
    }
    else{
        return await users.insertOne(user); 
    }
}
async function getPost(){
    await connectDatabase();
    let result= await reviewPost.find().toArray()
    return result;
}
async function getOneLocation(location){
    await connectDatabase()
    let result = await locations.findOne({location:location})
    return result
}
async function getOneStation(location,station){
    await connectDatabase()
    location = await getOneLocation(location)
    for (i of location.station){
        if(i == station){
            return station
        }
    }
}
async function findTotal(location){
    await connectDatabase()
    result = await siteDetails.find({locations:location}).toArray()
    return result
}
async function addPost(data){
    await connectDatabase();
    await reviewPost.insertOne(data);
}

async function getLocations(){
    await connectDatabase()
    
    return await locations.find().toArray()
}
async function readSiteDetails(){
    await connectDatabase()
    return await siteDetails.find().toArray()
}
async function addIssue(data){
    await connectDatabase();
    await memberReports.insertOne(data)
}
async function recordDetails(data){
    await connectDatabase()
    await siteDetails.insertOne(data)
}
async function readReports(){
    await connectDatabase()
    return await memberReports.find().toArray()
}

//sessions
async function startSession(data) {
    await connectDatabase();
    project = client.db("project");
    session = project.collection("sessions");
    await session.insertOne(data);
}
  
async function saveSession(uuid, data) {
    await connectDatabase();
    await session.insertOne({
      sessionKey: uuid,
      Data: data,
    });
}

async function getSession(key) {
    await connectDatabase();
    return await session.findOne({ sessionKey: key });
}
  
async function updateSession(key, data) {
    await connectDatabase();
    await session.replaceOne({ sessionKey: key }, data);
}
  
async function terminateSession(key) {
    await connectDatabase();
    await session.deleteOne({ sessionKey: key });
}
async function validateSession(key) {
  await connectDatabase();
  let result = await session.findOne({ sessionKey: key });
  return result;
}
async function deleteSession(key) {
    await connectDatabase()
    await session.deleteOne({sessionKey:key})
}

//pass reset
async function findEmail(email){
    await connectDatabase()
    let result = await users.findOne({email:email})
    return result
}

async function updatepassword(username,password){
    await connectDatabase()
    await users.updateOne({username:username},{$set:{password:password}})
}
module.exports = {
    getUser,getLocations,getOneLocation,getOneStation,registerUser,

    computeHash,
    getSession,updateSession,terminateSession,saveSession,startSession,validateSession,deleteSession,

    getPost,addPost,
   
    addIssue,recordDetails,updateUser,findEmail,updatepassword,findTotal,readSiteDetails,readReports

}