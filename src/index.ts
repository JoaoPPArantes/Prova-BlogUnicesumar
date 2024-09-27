import express, { Request, Response } from "express";
import mysql from "mysql2/promise";
import { RowDataPacket } from "mysql2";

const app = express();
let loggedInUser: { name: string; email: string; role: string } | null = null;

app.set("view engine", "ejs");
app.set("views", `${__dirname}/views`);

const connection = mysql.createPool({
  host: "localhost",
  port: 3306,
  user: "root",
  password: "mudar123",
  database: "unicesumar",
});

app.use(express.json());

app.use(express.urlencoded({ extended: true }));
///
app.get("/", (req: Request, res: Response) => {
  res.render("home", { user: loggedInUser });
});

app.get("/login", (req: Request, res: Response) => {
  res.render("login", { error: null });
});

app.post("/login", async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.render("login", { error: "Email e senha são obrigatórios!" });
  }

  try {
    const [rows] = await connection.query<RowDataPacket[]>(
      "SELECT * FROM users WHERE email = ?",
      [email]
    );

    if (rows.length === 0) {
      return res.render("login", { error: "Email ou senha incorretos!" });
    }

    const user = rows[0];
    if (user.password !== password) {
      return res.render("login", { error: "Email ou senha incorretos!" });
    }

    loggedInUser = { name: user.name, email: user.email, role: user.role };
  } catch (error) {
    console.error(error);
    res.render("login", { error: "Erro ao processar o login." });
  }
});

app.get("/logout", (req: Request, res: Response) => {
  loggedInUser = null;
  res.redirect("/");
});

///

app.get("/categories", async function (req: Request, res: Response) {
  const [rows] = await connection.query("SELECT * FROM users");
  return res.render("categories/index", {
    categories: rows,
  });
});

app.get("/categories/form", async function (req: Request, res: Response) {
  return res.render("categories/form");
});

app.post("/categories", async function (req: Request, res: Response) {
  const body = req.body;
  const insertQuery = "INSERT INTO users (name) VALUES (?)";
  await connection.query(insertQuery, [body.name]);

  res.redirect("/categories");
});

//
app.post("/users", async function (req: Request, res: Response) {
  const { name, email, password, confirmPassword, role, active } = req.body;

  if (!name || !email || !password || !confirmPassword || !role) {
    return res.render("categories/form", {
      error: "Todos os campos são obrigatórios!",
    });
  }

  if (password !== confirmPassword) {
    return res.render("categories/form", { error: "As senhas não coincidem!" });
  }

  try {
    const [rows] = await connection.query<RowDataPacket[]>(
      "SELECT * FROM users WHERE email = ?",
      [email]
    );

    if (rows.length > 0) {
      return res.render("categories/form", {
        error: "O e-mail já está em uso!",
      });
    }

    await connection.query(
      "INSERT INTO users (name, email, password, role, active, created_at) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)",
      [name, email, password, role, active ? 1 : 0]
    );

    res.redirect("/login");
  } catch (error) {
    console.error(error);
    res.render("categories/form", { error: "Erro ao registrar o usuário." });
  }
});

app.post(
  "/categories/delete/:id",
  async function (req: Request, res: Response) {
    const id = req.params.id;
    const sqlDelete = "DELETE FROM users WHERE id = ?";
    await connection.query(sqlDelete, [id]);

    res.redirect("/categories");
  }
);

app.listen("3000", () => console.log("Server is listening on port 3000"));
