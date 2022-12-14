import { describe, expect, test } from "@jest/globals";
import App from "../src/app";
import IndexRoute from "../src/routes/index.route";
import UserRoute from "../src/routes/users/user.route";
import JobRoute from "../src/routes/Job/job.route";
import supertest from "supertest";
import AuthRoute from "../src/routes/auth/auth.route";
import fs from "fs";
import { connect, disconnect, clear } from "../helpers/db";
import { ICreateBody, EJobLevel, EJobType, EJobWorkPlace } from "../src/interfaces/job.interface";

const routes = [new IndexRoute(), new UserRoute(), new AuthRoute(), new JobRoute()];
const app = new App(routes).app;
const request = supertest(app);

const newUser = {
  username: "testuingbrec",
  password: "secret123",
  email: "testuing@gmail.com",
  fullName: "unit test",
  phoneNumber: "0832132134354",
  birthday: "12/11/1981",
  gender: "female",
};

// test database and root route
describe("Test request with mongoose", () => {
  beforeAll(async () => {
    await connect();
  });

  // afterEach(async () => {
  //   await clear();
  // });

  afterAll(async () => {
    await disconnect();
  });

  test("GET - /", async () => {
    const res = await request.get("/");
    expect(res.statusCode).toBe(200);
  });

  // ============= signup =============
  test("should return success status when created", async () => {
    const filePath = `${__dirname}/../testFiles/default_avatar.jpg`;
    if (fs.existsSync(filePath)) {
      const res = await request
        .post("/user")
        .field("username", `${newUser.username}`)
        .field("fullName", `${newUser.fullName}`)
        .field("email", `${newUser.email}`)
        .field("password", newUser.password)
        .field("phoneNumber", newUser.phoneNumber)
        .field("birthday", newUser.birthday)
        .field("gender", newUser.gender)
        .attach("avatar", filePath);
      expect(res.statusCode).toBe(201);
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

  // ============= login =============
  test("should return success status when login", async () => {
    const res = await request.post("/auth/login").send({
      email: newUser.email,
      password: newUser.password,
    });
    expect(res.statusCode).toBe(200);
  });

  test("should return bad request (400) status when login with empty fields", async () => {
    const res = await request.post("/auth/login").send({});
    expect(res.statusCode).toBe(400);
  });

  test("should return conflic request (409) status when login with wrong email", async () => {
    const res = await request.post("/auth/login").send({
      email: "wrong@gmail.com",
      password: newUser.password,
    });
    expect(res.statusCode).toBe(409);
  });

  test("should return conflic request (409) status when login with wrong password", async () => {
    const res = await request.post("/auth/login").send({
      email: newUser.email,
      password: "wrongpassword",
    });
    expect(res.statusCode).toBe(409);
  });
});
