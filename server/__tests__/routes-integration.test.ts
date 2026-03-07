import express from "express";
import { createServer } from "http";
import request from "supertest";
import type { Prospect, InsertProspect } from "@shared/schema";

const prospects: Prospect[] = [
  {
    id: 1,
    companyName: "Acme",
    roleTitle: "Engineer",
    jobUrl: null,
    status: "Bookmarked",
    interestLevel: "Medium",
    notes: null,
    targetSalary: null,
    createdAt: new Date(),
  },
  {
    id: 2,
    companyName: "Beta Corp",
    roleTitle: "Designer",
    jobUrl: "https://example.com",
    status: "Applied",
    interestLevel: "High",
    notes: "Great team",
    targetSalary: 120000,
    createdAt: new Date(),
  },
];

jest.mock("../storage", () => ({
  storage: {
    getAllProspects: jest.fn(async () => [...prospects]),
    getProspect: jest.fn(async (id: number) => prospects.find((p) => p.id === id)),
    createProspect: jest.fn(async (data: InsertProspect) => ({
      id: 99,
      companyName: data.companyName,
      roleTitle: data.roleTitle,
      jobUrl: data.jobUrl ?? null,
      status: data.status ?? "Bookmarked",
      interestLevel: data.interestLevel ?? "Medium",
      notes: data.notes ?? null,
      targetSalary: data.targetSalary ?? null,
      createdAt: new Date(),
    })),
    updateProspect: jest.fn(async (id: number, data: Partial<InsertProspect>) => {
      const existing = prospects.find((p) => p.id === id);
      if (!existing) return undefined;
      return { ...existing, ...data } as Prospect;
    }),
    deleteProspect: jest.fn(async (id: number) => prospects.some((p) => p.id === id)),
  },
}));

let app: express.Express;

beforeAll(async () => {
  app = express();
  app.use(express.json());

  const httpServer = createServer(app);
  const { registerRoutes } = require("../routes");
  await registerRoutes(httpServer, app);
});

describe("GET /api/prospects", () => {
  test("returns all prospects", async () => {
    const res = await request(app).get("/api/prospects");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(2);
  });
});

describe("POST /api/prospects", () => {
  test("creates a prospect with valid data", async () => {
    const res = await request(app)
      .post("/api/prospects")
      .send({ companyName: "NewCo", roleTitle: "Dev" });
    expect(res.status).toBe(201);
    expect(res.body.companyName).toBe("NewCo");
  });

  test("rejects missing companyName", async () => {
    const res = await request(app)
      .post("/api/prospects")
      .send({ roleTitle: "Dev" });
    expect(res.status).toBe(400);
  });

  test("rejects empty roleTitle", async () => {
    const res = await request(app)
      .post("/api/prospects")
      .send({ companyName: "Test", roleTitle: "" });
    expect(res.status).toBe(400);
  });
});

describe("PATCH /api/prospects/:id", () => {
  test("updates status to a valid value", async () => {
    const res = await request(app)
      .patch("/api/prospects/1")
      .send({ status: "Applied" });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("Applied");
  });

  test("updates status to any valid status", async () => {
    const res = await request(app)
      .patch("/api/prospects/1")
      .send({ status: "Offer" });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("Offer");
  });

  test("rejects invalid status value", async () => {
    const res = await request(app)
      .patch("/api/prospects/1")
      .send({ status: "InvalidStatus" });
    expect(res.status).toBe(400);
    expect(res.body.message).toContain("Status must be one of");
  });

  test("returns 404 for non-existent prospect", async () => {
    const res = await request(app)
      .patch("/api/prospects/999")
      .send({ status: "Applied" });
    expect(res.status).toBe(404);
  });

  test("returns 400 for non-numeric id", async () => {
    const res = await request(app)
      .patch("/api/prospects/abc")
      .send({ status: "Applied" });
    expect(res.status).toBe(400);
    expect(res.body.message).toContain("Invalid prospect ID");
  });

  test("updates only the status, leaving other fields unchanged", async () => {
    const res = await request(app)
      .patch("/api/prospects/2")
      .send({ status: "Interviewing" });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("Interviewing");
    expect(res.body.companyName).toBe("Beta Corp");
    expect(res.body.interestLevel).toBe("High");
    expect(res.body.targetSalary).toBe(120000);
  });

  test("updates interestLevel with camelCase key", async () => {
    const res = await request(app)
      .patch("/api/prospects/1")
      .send({ interestLevel: "High" });
    expect(res.status).toBe(200);
    expect(res.body.interestLevel).toBe("High");
  });

  test("updates interestLevel with snake_case key", async () => {
    const res = await request(app)
      .patch("/api/prospects/1")
      .send({ interest_level: "Low" });
    expect(res.status).toBe(200);
    expect(res.body.interestLevel).toBe("Low");
  });

  test("rejects invalid interestLevel", async () => {
    const res = await request(app)
      .patch("/api/prospects/1")
      .send({ interestLevel: "VeryHigh" });
    expect(res.status).toBe(400);
    expect(res.body.message).toContain("Interest level must be one of");
  });

  test("accepts valid positive integer salary", async () => {
    const res = await request(app)
      .patch("/api/prospects/1")
      .send({ targetSalary: 150000 });
    expect(res.status).toBe(200);
    expect(res.body.targetSalary).toBe(150000);
  });

  test("rejects negative salary", async () => {
    const res = await request(app)
      .patch("/api/prospects/1")
      .send({ targetSalary: -5000 });
    expect(res.status).toBe(400);
  });

  test("rejects decimal salary", async () => {
    const res = await request(app)
      .patch("/api/prospects/1")
      .send({ targetSalary: 99999.99 });
    expect(res.status).toBe(400);
  });

  test("accepts null salary to clear it", async () => {
    const res = await request(app)
      .patch("/api/prospects/1")
      .send({ targetSalary: null });
    expect(res.status).toBe(200);
    expect(res.body.targetSalary).toBeNull();
  });

  test("accepts empty string salary to clear it", async () => {
    const res = await request(app)
      .patch("/api/prospects/1")
      .send({ targetSalary: "" });
    expect(res.status).toBe(200);
    expect(res.body.targetSalary).toBeNull();
  });
});

describe("DELETE /api/prospects/:id", () => {
  test("deletes an existing prospect", async () => {
    const res = await request(app).delete("/api/prospects/1");
    expect(res.status).toBe(204);
  });

  test("returns 404 for non-existent prospect", async () => {
    const res = await request(app).delete("/api/prospects/999");
    expect(res.status).toBe(404);
  });

  test("returns 400 for non-numeric id", async () => {
    const res = await request(app).delete("/api/prospects/abc");
    expect(res.status).toBe(400);
  });
});
