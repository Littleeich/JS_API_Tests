import { Request }  from '../framework/request';
import { expect } from 'chai';
import * as faker from 'faker';
import * as log4js from 'log4js';

const logger = log4js.getLogger("userTests");
logger.level = "debug";

describe("User ", function(){

    let authToken;
    let tempUserID;
    let userCred;
    let standardUsername = "Volodymyr_5000";

    before(async function(){
        const adminLoginResp = await new Request(
            "http://ip-5236.sunline.net.ua:30020/users/login"
        )
            .method("POST")
            .body({
                email: "test@test.com",
                password: "123456"
            })
            .send();
        authToken = adminLoginResp.body.token;
        logger.info(await `Admin was logged in with token ${adminLoginResp.body.token}`);
    })

    it("was created", async function(){
        userCred = faker.internet.email(
            undefined,
            undefined,
            "vova.test.ua"
        );

        const userCreateResp = await new Request(
            "http://ip-5236.sunline.net.ua:30020/api/users"
        )
            .method("POST")
            .auth(authToken)
            .body({
                username: standardUsername,
                email: userCred,
                password: userCred
            })
            .send();
        // logger.info(`Create: ${JSON.stringify(userCreateResp)}`)

        expect(userCreateResp.statusCode, "Wrong status Code").to.equal(200);
        expect(userCreateResp.body, "Response doesn't have _id").to.contain.keys("_id");
        tempUserID = await userCreateResp.body._id;
    })

    it("was found with correct info inside", async function(){
        expect(tempUserID, "Temp user ID is undefined").to.equal(tempUserID);

        const foundUserResp = await new Request(
            "http://ip-5236.sunline.net.ua:30020/api/users/" + tempUserID
        )
        .method("GET")
        .auth(authToken)
        .send();

        // logger.info(JSON.stringify(foundUserResp));

        expect(foundUserResp, "No user found").to.not.be.empty;
        expect(foundUserResp).to.equal(foundUserResp);
        expect(foundUserResp.body._id, "Incorrect user ID").to.equal(tempUserID);
        expect(foundUserResp.body.emails[0].address, "Incorrect user email").to.equal(userCred);
    })

    it("was found in general user list", async function(){
        const foundUserResp = await new Request(
            "http://ip-5236.sunline.net.ua:30020/api/users/"
        )
        .method("GET")
        .auth(authToken)
        .send();

        expect(foundUserResp.body[0], "Not as we expected. Incorrect array of id-username")
        .to.have.all.keys("_id", "username");
        expect(JSON.stringify(foundUserResp.body), "Our user wasn't found in the List").to.include(tempUserID);
    })

    it("can't be deleted without authorization", async function(){
        expect(tempUserID, "Temp user ID is undefined").to.equal(tempUserID);

        const deleteUserResp = await new Request(
            "http://ip-5236.sunline.net.ua:30020/api/users/" + tempUserID
        )
        .method("DELETE")
        .send();

        // logger.info(await `Delete user try ${"http://ip-5236.sunline.net.ua:30020/api/users/" + tempUserID}`)
        // logger.info(await `Delete message ${JSON.stringify(deleteUserResp)}`)

        expect(deleteUserResp.body, JSON.stringify(deleteUserResp.body))
        .to.be.an("object")
        .that.include.keys("error", "errorType", "reason");
        expect(deleteUserResp.body.error, "Need to check response error").to.equal("Unauthorized");
    })

    it("was deleted", async function(){
        expect(tempUserID, "Temp user ID is undefined").to.equal(tempUserID);

        const deleteUserResp = await new Request(
            "http://ip-5236.sunline.net.ua:30020/api/users/" + tempUserID
        )
        .method("DELETE")
        .auth(authToken)
        .send();

        // logger.info(await `Delete user try ${"http://ip-5236.sunline.net.ua:30020/api/users/" + tempUserID}`)
        // logger.info(await `Delete message ${JSON.stringify(deleteUserResp)}`)

        expect(deleteUserResp.body, JSON.stringify(deleteUserResp.body))
        .to.be.an("object")
        .that.has.key("_id");
        expect(deleteUserResp.body._id, "Wrong user was deleted").to.equal(tempUserID);
    })

    it("can't be found after delete operation", async ()=>{
        expect(tempUserID).to.equal(tempUserID);

        const findUserResp = new Request(
            "http://ip-5236.sunline.net.ua:30020/api/users/" + tempUserID
        )
        .method("GET")
        .auth(authToken)
        .send();

        // logger.info(await JSON.stringify(findUserResp));
        expect(findUserResp).to.be.empty;
    })

    it("was not found in general user list after delete operation", async function(){
        const foundUserResp = await new Request(
            "http://ip-5236.sunline.net.ua:30020/api/users/"
        )
        .method("GET")
        .auth(authToken)
        .send();

        expect(foundUserResp.body[0], "Not as we expected. Incorrect array of id-username")
        .to.have.all.keys("_id", "username");
        expect(JSON.stringify(foundUserResp.body)).not.to.include(tempUserID);
    })

})

describe("Check ", function(){
    let authToken;

    before(async function(){
        const adminLoginResp = await new Request(
            "http://ip-5236.sunline.net.ua:30020/users/login"
        )
            .method("POST")
            .body({
                email: "test@test.com",
                password: "123456"
            })
            .send();
        authToken = adminLoginResp.body.token;
        logger.info(await `Admin was logged in with token ${adminLoginResp.body.token}`);
    })

    it("who is logged-in", async function(){
        const loggedResp = await new Request(
            "http://ip-5236.sunline.net.ua:30020/api/user"
        )
        .method("GET")
        .auth(authToken)
        .send();

        expect(loggedResp.body, "Incorrect response body of Logged-in")
        .to.include.keys("_id", "username", "createdAt", "emails", "isAdmin");
    })

    it("auth requirement to check logged-in", async function(){
        const loggedResp = await new Request(
            "http://ip-5236.sunline.net.ua:30020/api/user"
        )
        .method("GET")
        .send();

        expect(loggedResp.body, "Incorrect error body of Logged-in")
        .to.include.keys("error", "errorType", "message", "reason");
        expect(loggedResp.body.error, "Need to check response error").to.equal("Unauthorized");
    })
})