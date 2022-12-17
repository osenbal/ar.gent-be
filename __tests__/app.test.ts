import { describe, expect, test } from "@jest/globals";
import App from "../src/app";
import IndexRoute from "../src/routes/index.route";
import UserRoute from "../src/routes/users/user.route";
import supertest from "supertest";
import UserModel from "../src/models/User/User.model";
import fs from "fs";
import { connect, disconnect, clear } from "../helpers/db";

const routes = [new IndexRoute(), new UserRoute()];
const app = new App(routes).app;
const request = supertest(app);

// test database and root route
describe("Test request with mongoose", () => {
  beforeAll(async () => {
    await connect();
  });

  afterEach(async () => {
    await clear();
  });

  afterAll(async () => {
    await disconnect();
  });

  const newUser = {
    username: "unitTest",
    password: "unitTest",
    email: "unit",
    fullName: "unit test",
    phoneNumber: "0832132134354",
    birthday: "12/11/1981",
    gender: "female",
  };

  test("GET - /", async () => {
    const res = await request.get("/");
    expect(res.statusCode).toBe(200);
  });

  test("should return success status when created", async () => {
    const filePath = `${__dirname}/../testFiles/default_avatar.jpg`;
    if (fs.existsSync(filePath)) {
      const res = await request
        .post("/user")
        .field("username", `${newUser.username}`)
        .field("fullName", `${newUser.fullName}`)
        .field("email", `${newUser.email}@gmail.com`)
        .field("password", newUser.password)
        .field("phoneNumber", newUser.phoneNumber)
        .field("birthday", newUser.birthday)
        .field("gender", newUser.gender)
        .attach("avatar", filePath);
      expect(res.statusCode).toBe(201);
      // for (let i = 84; i < 10000; i++) {
      //   const res = await request
      //     .post("/user")
      //     .field("username", `${newUser.username}${i}`)
      //     .field("fullName", `${newUser.fullName}${i}`)
      //     .field("email", `${newUser.email}-${i}@gmail.com`)
      //     .field("password", newUser.password)
      //     .field("phoneNumber", newUser.phoneNumber)
      //     .field("birthday", newUser.birthday)
      //     .field("gender", newUser.gender)
      //     .attach("avatar", filePath);
      //   expect(res.statusCode).toBe(201);
      // }
    }
  });

  test("should return bad request (400) status when empty fields", async () => {
    const filePath = `${__dirname}/../testFiles/default_avatar.jpg`;
    if (fs.existsSync(filePath)) {
      const res = await request.post("/user").attach("avatar", filePath);
      expect(res.statusCode).toBe(400);
    }
  });

  test("should return bad request (400) status when empty avatar", async () => {
    const filePath = `${__dirname}/../testFiles/default_avatar.jpg`;
    if (fs.existsSync(filePath)) {
      const res = await request
        .post("/user")
        .field("username", newUser.username)
        .field("fullName", newUser.fullName)
        .field("email", newUser.email)
        .field("password", newUser.password)
        .field("phoneNumber", newUser.phoneNumber)
        .field("birthday", newUser.birthday)
        .field("gender", newUser.gender);
      expect(res.statusCode).toBe(400);
    }
  });
});
