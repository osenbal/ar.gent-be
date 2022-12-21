import { describe, expect, test } from "@jest/globals";
import App from "../src/app";
import JobRoute from "../src/routes/Job/job.route";
import supertest from "supertest";
import AuthRoute from "../src/routes/auth/auth.route";
import { connect, disconnect, clear } from "../helpers/db";
import { ICreateBody, EJobLevel, EJobType, EJobWorkPlace } from "../src/interfaces/job.interface";

const routes = [new AuthRoute(), new JobRoute()];
const app = new App(routes).app;
const request = supertest(app);
let session = null;

// test database and root route
const newUser = {
  username: "testuingbrec",
  password: "secret123",
  email: "testuing@gmail.com",
  fullName: "unit test",
  phoneNumber: "0832132134354",
  birthday: "12/11/1981",
  gender: "female",
};

const newPost: ICreateBody = {
  title: "test post",
  description: "test post",
  type: EJobType.FULL_TIME,
  level: EJobLevel.JUNIOR,
  workPlace: EJobWorkPlace.REMOTE,
  country: {
    name: "Indonesia",
    isoCode: "ID",
    flag: "🇮🇩",
    phonecode: "62",
    currency: "IDR",
    latitude: "-5.00000000",
    longitude: "120.00000000",
    timezones: [
      {
        zoneName: "Asia/Jakarta",
        gmtOffset: 25200,
        gmtOffsetName: "UTC+07:00",
        abbreviation: "WIB",
        tzName: "Western Indonesian Time",
      },
      {
        zoneName: "Asia/Jayapura",
        gmtOffset: 32400,
        gmtOffsetName: "UTC+09:00",
        abbreviation: "WIT",
        tzName: "Eastern Indonesian Time",
      },
      {
        zoneName: "Asia/Makassar",
        gmtOffset: 28800,
        gmtOffsetName: "UTC+08:00",
        abbreviation: "WITA",
        tzName: "Central Indonesia Time",
      },
      {
        zoneName: "Asia/Pontianak",
        gmtOffset: 25200,
        gmtOffsetName: "UTC+07:00",
        abbreviation: "WIB",
        tzName: "Western Indonesian Time",
      },
    ],
  },
  state: {
    name: "DKI Jakarta",
    isoCode: "JK",
    countryCode: "ID",
    latitude: "-6.20876340",
    longitude: "106.84559900",
  },
  city: {
    name: "Curup",
    countryCode: "ID",
    stateCode: "BE",
    latitude: "-3.47030000",
    longitude: "102.52070000",
  },
  salary: 1000,
};

beforeEach(async () => {
  const res = await request.post("/auth/login").send({ email: newUser.email, password: newUser.password });
  session = res.headers["set-cookie"][0]
    .split(",")
    .map((item) => item.split(";")[0])
    .join(";");
});

afterAll(async () => {
  await clear();
});

describe("Test request post", () => {
  beforeAll(async () => {
    await connect();
  });

  afterAll(async () => {
    await disconnect();
  });

  test("should create a new post", async () => {
    const res = await request.post("/job").set("Cookie", session).send(newPost);
    expect(res.status).toBe(201);
  });

  test("should get all post", async () => {
    const res = await request.get("/job").set("Cookie", session);
    expect(res.status).toBe(200);
  });
});
