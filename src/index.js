const express = require("express");
const { v4: uuidv4 } = require("uuid");
const app = express();

app.use(express.json());

const costumers = [];

// Middlewares & Functions

function verifyIfAccountExists(req, res, next) {
  const { cpf } = req.headers;
  const costumer = costumers.find((costumer) => costumer.cpf === cpf);
  if (!costumer) {
    return res.status(400).json({ Error: "costumer not found" });
  }
  req.costumer = costumer;
  return next();
}

function getBalance(statement) {
  const balance = statement.reduce((acc, operation) => {
    if (operation.type === "credit") {
      return acc + operation.amount;
    } else {
      return acc - operation.amount;
    }
  }, 0);
  return balance;
}

// Inicial message
app.get("/", (req, res) => {
  return res.status(200).json({
    message: "Fin API - uma API Financeira",
    Instructions: "View the documentation at: https://url.com",
  });
});

// Account routes
app.post("/account", (req, res) => {
  const { cpf, name } = req.body;

  const costumerAlredyExists = costumers.some(
    (customer) => customer.cpf === cpf
  );

  if (costumerAlredyExists) {
    return res.status(400).json({ message: "Costumer alredy exists!" });
  }
  costumers.push({
    cpf,
    name,
    uuid: uuidv4(),
    statement: [],
  });
  return res.status(201).json({
    message: `Costumer ${
      costumers[costumers.length - 1].name
    } sucessfully created with UUID ${costumers[costumers.length - 1].uuid}`,
  });
});

app.get("/account", verifyIfAccountExists, (req, res) => {
  const { costumer } = req;
  return res.status(200).json(costumer);
});

app.put("/account", verifyIfAccountExists, (req, res) => {
  const { name } = req.body;
  const { costumer } = req;

  costumer.name = name;

  return res
    .status(201)
    .json({ Ok: `name changed to ${name} for account cpf ${costumer.cpf}` });
});

app.delete("/account", verifyIfAccountExists, (req, res) => {
  const { costumer } = req;

  costumers.splice(costumer, 1);

  return res.status(204);
});

// Statement routes
app.get("/statement/", verifyIfAccountExists, (req, res) => {
  const { costumer } = req;
  return res.status(200).json({
    Message: `Statement for ${costumer.name}`,
    Satement: costumer.statement,
  });
});

app.get("/statement/date", verifyIfAccountExists, (req, res) => {
  const { costumer } = req;
  const { date } = req.query;

  const dateFormat = new Date(date + " 00:00");

  const statement = costumer.statement.filter(
    (statements) =>
      statements.createdAt.toDateString() ===
      new Date(dateFormat).toDateString()
  );

  return res.status(200).json({
    Message: `Statement for ${costumer.name}`,
    Satement: statement,
  });
});

app.get("/statement/balance", verifyIfAccountExists, (req, res) => {
  const { costumer } = req;
  const balance = getBalance(costumer.statement);

  return res.status(200).json(balance);
});

// Operations routes
app.post("/deposit", verifyIfAccountExists, (req, res) => {
  const { description, amount } = req.body;
  const { costumer } = req;
  const statementOperation = {
    description,
    amount,
    createdAt: new Date(),
    type: "credit",
  };

  costumer.statement.push(statementOperation);

  return res.status(201).json({
    Ok: `${statementOperation.type} of ${statementOperation.amount}, succesfuly registred in ${costumer.name} account`,
  });
});

app.post("/withdraw", verifyIfAccountExists, (req, res) => {
  const { amount } = req.body;
  const { costumer } = req;
  const balance = getBalance(costumer.statement);

  if (balance < amount) {
    return res.status(400).json({ Error: "Insufficient funds!" });
  }

  const statementOperation = {
    amount,
    createdAt: new Date(),
    type: "debit",
  };
  costumer.statement.push(statementOperation);
  return res.status(201).json({
    Ok: `${statementOperation.type} of ${statementOperation.amount}, succesfuly registred in ${costumer.name} account`,
  });
});

app.listen(3333);
