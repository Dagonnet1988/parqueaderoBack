import express from "express";
import bodyParser from "body-parser";
import path from "path";
import cors from "cors";
import { Sequelize, DataTypes } from "sequelize";

const app = express();

// Middlewares
app.use(bodyParser.json());
app.use(cors());

// Connect to SQLite
const sequelize = new Sequelize({
  dialect: "sqlite",
  storage: "./database.sqlite",
});

// Models
const Vehiculo = sequelize.define("Vehiculo", {
  placa: DataTypes.STRING,
  tipoVehiculo: { type: DataTypes.STRING, defaultValue: "moto" },
  valorHora: { type: DataTypes.INTEGER, defaultValue: 800 },
  cascos: DataTypes.INTEGER,
  puestoCascos: DataTypes.INTEGER,
  tiempoEntrada: {
    type: DataTypes.DATE,
    defaultValue: () => {
      let date = new Date();
      date.setSeconds(0, 0);
      return date;
    },
  },
  tiempoSalida: DataTypes.DATE,
  tiempoTotal: { type: DataTypes.INTEGER, defaultValue: 0 },
  valorTotal: { type: DataTypes.INTEGER, defaultValue: 0 },
  status: { type: DataTypes.BOOLEAN, defaultValue: true },
  codigoBarras: DataTypes.STRING,
});

Vehiculo.sync();

function calcularCosto(tiempoTotal, valorHora) {
  const horas = Math.ceil((tiempoTotal - 5) / 60);
  const costoTotal = horas * valorHora;
  return costoTotal;
}

// Sirve los archivos estáticos de la aplicación Angular
// app.use(
//   express.static(path.join(__dirname, "../dist/nombre-de-tu-app-angular"))
// );

// Routes
app.post("/vehiculos", async (req, res) => {
  const { placa, tipoVehiculo, cascos, puestoCascos } = req.body;
  const codigoBarras = Math.random().toString(36).substring(2, 15);
  const vehiculo = await Vehiculo.create({
    placa,
    tipoVehiculo,
    codigoBarras,
    cascos,
    puestoCascos,
  });
  res.send(vehiculo);
});

app.get("/vehiculos", async (req, res) => {
  const vehiculos = await Vehiculo.findAll();
  res.send(vehiculos);
});

app.get("/vehiculos/:codigoBarras", async (req, res) => {
  const { codigoBarras } = req.params;
  const vehiculo = await Vehiculo.findOne({ where: { codigoBarras } });
  res.send(vehiculo);
});

app.post("/vehiculos/salida", async (req, res) => {
  const { codigoBarras } = req.body;
  let vehiculo = await Vehiculo.findOne({ where: { codigoBarras } });

  if (vehiculo) {
    const tiempoSalida = new Date().setSeconds(0, 0);
    const tiempoTotal = (tiempoSalida - vehiculo.tiempoEntrada) / 60000;

    vehiculo.tiempoSalida = tiempoSalida;
    vehiculo.tiempoTotal = tiempoTotal;
    vehiculo.valorTotal = calcularCosto(tiempoTotal, vehiculo.valorHora);
    vehiculo.status = false;

    await vehiculo.save();
  }

  res.send(vehiculo);
});

app.get("/*", function (req, res) {
  res.sendFile(
    path.join(__dirname, "../dist/nombre-de-tu-app-angular/index.html")
  );
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
